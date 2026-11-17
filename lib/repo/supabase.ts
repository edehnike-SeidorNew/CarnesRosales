import { esRol } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type {
  Cliente,
  Datos,
  ItemVenta,
  MedioPago,
  Movimiento,
  NuevoCliente,
  PagoProveedor,
  Producto,
  Proveedor,
  StockMovimiento,
  Usuarios,
} from "@/lib/tipos";
import type { Repo } from "./index";

// Acceso a la base con la sesión del usuario: lo que puede leer y escribir lo decide RLS.

type Num = number | string;
type Anidado<T> = T | T[] | null;
const uno = <T>(valor: Anidado<T>): T | null => (Array.isArray(valor) ? (valor[0] ?? null) : valor);

type FilaCliente = {
  id: string;
  numero: number;
  nombre_fantasia: string;
  titular: string;
  direccion: string;
  localidad: string;
  cuit: string;
  contacto: string;
  observaciones: string;
};

type FilaMovimiento = {
  id: string;
  cliente_id: string;
  fecha: string;
  tipo: Movimiento["tipo"];
  comprobante: string;
  importe: Num | null;
  medio_pago: MedioPago | null;
  nota: string | null;
  creado_por: string;
  movimiento_items: { orden: number; kilos: Num; precio: Num; productos: Anidado<{ nombre: string }> }[] | null;
};

type FilaStock = {
  id: string;
  fecha: string;
  tipo: StockMovimiento["tipo"];
  kilos: Num;
  costo: Num | null;
  proveedor_id: string | null;
  comprobante: string;
  nota: string;
  creado_por: string;
  productos: Anidado<{ nombre: string }>;
};

type FilaPagoProveedor = {
  id: string;
  proveedor_id: string;
  fecha: string;
  importe: Num;
  medio_pago: MedioPago | null;
  comprobante: string;
  creado_por: string;
};

const COLUMNAS_CLIENTE = "id, numero, nombre_fantasia, titular, direccion, localidad, cuit, contacto, observaciones";
const PAGINA = 1000; // tope de filas por consulta de Supabase

type Respuesta<T> = { data: T[] | null; error: { message: string } | null };

/** Trae todas las filas de a páginas: sin esto, Supabase corta en 1000 sin avisar. */
async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<Respuesta<unknown>>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await consulta(desde, desde + PAGINA - 1);
    if (error) throw new Error(error.message);
    filas.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGINA) return filas;
  }
}

function comprobar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function aCliente(f: FilaCliente): Cliente {
  return {
    id: f.id,
    numero: f.numero,
    nombreFantasia: f.nombre_fantasia,
    titular: f.titular,
    direccion: f.direccion,
    localidad: f.localidad,
    cuit: f.cuit,
    contacto: f.contacto,
    observaciones: f.observaciones,
  };
}

function columnasDeCliente(datos: NuevoCliente) {
  return {
    nombre_fantasia: datos.nombreFantasia,
    titular: datos.titular,
    direccion: datos.direccion,
    localidad: datos.localidad,
    cuit: datos.cuit,
    contacto: datos.contacto,
    observaciones: datos.observaciones,
  };
}

function aMovimiento(f: FilaMovimiento): Movimiento {
  const base = { id: f.id, clienteId: f.cliente_id, fecha: f.fecha, comprobante: f.comprobante, creadoPor: f.creado_por ?? "" };
  if (f.tipo === "venta") {
    const items: ItemVenta[] = [...(f.movimiento_items ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((i) => ({ detalle: uno(i.productos)?.nombre ?? "(sin producto)", kilos: Number(i.kilos), precio: Number(i.precio) }));
    return { ...base, tipo: "venta", items };
  }
  if (f.tipo === "pago") return { ...base, tipo: "pago", importe: Number(f.importe), medioPago: f.medio_pago };
  if (f.tipo === "descuento") return { ...base, tipo: "descuento", importe: Number(f.importe), nota: f.nota ?? "" };
  if (f.tipo === "cargo") return { ...base, tipo: "cargo", importe: Number(f.importe), nota: f.nota ?? "" };
  return { ...base, tipo: "saldo_inicial", importe: Number(f.importe) };
}

export const repoSupabase: Repo = {
  async obtenerDatos(): Promise<Datos> {
    const db = await createClient();
    const [clientes, movimientos, productos, stock, proveedores, pagosProveedores] = await Promise.all([
      todas<FilaCliente>((d, h) => db.from("clientes").select(COLUMNAS_CLIENTE).order("numero").range(d, h)),
      todas<FilaMovimiento>((d, h) =>
        db
          .from("movimientos")
          .select(
            "id, cliente_id, fecha, tipo, comprobante, importe, medio_pago, nota, creado_por, movimiento_items(orden, kilos, precio, productos(nombre))",
          )
          .order("fecha")
          .order("orden")
          .range(d, h),
      ),
      todas<{ nombre: string; precio: Num | null; categoria: string }>((d, h) =>
        db.from("productos").select("nombre, precio, categoria").order("nombre").range(d, h),
      ),
      todas<FilaStock>((d, h) =>
        db
          .from("stock_movimientos")
          .select("id, fecha, tipo, kilos, costo, proveedor_id, comprobante, nota, creado_por, productos(nombre)")
          .order("fecha")
          .order("orden")
          .range(d, h),
      ),
      todas<Proveedor>((d, h) => db.from("proveedores").select("id, nombre, contacto").order("nombre").range(d, h)),
      todas<FilaPagoProveedor>((d, h) =>
        db
          .from("pagos_proveedores")
          .select("id, proveedor_id, fecha, importe, medio_pago, comprobante, creado_por")
          .order("fecha")
          .order("orden")
          .range(d, h),
      ),
    ]);
    return {
      clientes: clientes.map(aCliente),
      movimientos: movimientos.map(aMovimiento),
      productos: productos.map((p): Producto => ({ nombre: p.nombre, precio: p.precio === null ? null : Number(p.precio), categoria: p.categoria ?? "" })),
      stock: stock.map(
        (s): StockMovimiento => ({
          id: s.id,
          fecha: s.fecha,
          tipo: s.tipo,
          producto: uno(s.productos)?.nombre ?? "(sin producto)",
          kilos: Number(s.kilos),
          costo: s.costo === null ? null : Number(s.costo),
          proveedorId: s.proveedor_id,
          comprobante: s.comprobante,
          nota: s.nota,
          creadoPor: s.creado_por ?? "",
        }),
      ),
      proveedores,
      pagosProveedores: pagosProveedores.map(
        (p): PagoProveedor => ({
          id: p.id,
          proveedorId: p.proveedor_id,
          fecha: p.fecha,
          importe: Number(p.importe),
          medioPago: p.medio_pago,
          comprobante: p.comprobante,
          creadoPor: p.creado_por ?? "",
        }),
      ),
    };
  },

  async crearCliente(datos) {
    const db = await createClient();
    const { data, error } = await db.from("clientes").insert(columnasDeCliente(datos)).select(COLUMNAS_CLIENTE).single();
    comprobar(error);
    return aCliente(data as FilaCliente);
  },

  async actualizarCliente(id, datos) {
    const db = await createClient();
    const { data, error } = await db.from("clientes").update(columnasDeCliente(datos)).eq("id", id).select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo modificar el cliente (sin permiso o no existe)");
  },

  async eliminarCliente(id) {
    const db = await createClient();
    // El saldo anterior se va con el cliente; si tiene ventas o pagos, la base no deja borrarlo.
    await db.from("movimientos").delete().eq("cliente_id", id).eq("tipo", "saldo_inicial");
    const { data, error } = await db.from("clientes").delete().eq("id", id).select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo eliminar el cliente (sin permiso o no existe)");
  },

  async crearMovimiento(m) {
    const db = await createClient();
    if (m.tipo === "venta") {
      // Remito + ítems en una sola transacción (función de la base).
      const { error } = await db.rpc("registrar_venta", {
        p_cliente_id: m.clienteId,
        p_fecha: m.fecha,
        p_comprobante: m.comprobante,
        p_items: m.items,
      });
      return comprobar(error);
    }
    const { error } = await db.from("movimientos").insert({
      cliente_id: m.clienteId,
      fecha: m.fecha,
      tipo: m.tipo,
      comprobante: m.comprobante,
      importe: m.importe,
      medio_pago: m.tipo === "pago" ? m.medioPago : null,
      nota: m.tipo === "descuento" || m.tipo === "cargo" ? m.nota : "",
    });
    comprobar(error);
  },

  async actualizarMovimiento(id, cambios) {
    const db = await createClient();
    if (cambios.tipo === "venta") {
      const { error } = await db.rpc("actualizar_venta", {
        p_movimiento_id: id,
        p_fecha: cambios.fecha,
        p_comprobante: cambios.comprobante,
        p_items: cambios.items,
      });
      return comprobar(error);
    }
    if (cambios.tipo === "saldo_inicial") {
      const { data, error } = await db.from("movimientos").update({ importe: cambios.importe }).eq("id", id).eq("tipo", "saldo_inicial").select("id");
      comprobar(error);
      if (!data?.length) throw new Error("No se pudo modificar el saldo anterior (sin permiso o no existe)");
      return;
    }
    if (cambios.tipo === "descuento" || cambios.tipo === "cargo") {
      const { data, error } = await db
        .from("movimientos")
        .update({ fecha: cambios.fecha, comprobante: cambios.comprobante, importe: cambios.importe, nota: cambios.nota })
        .eq("id", id)
        .eq("tipo", cambios.tipo)
        .select("id");
      comprobar(error);
      if (!data?.length) throw new Error(`No se pudo modificar el ${cambios.tipo} (sin permiso o no existe)`);
      return;
    }
    const { data, error } = await db
      .from("movimientos")
      .update({ fecha: cambios.fecha, comprobante: cambios.comprobante, importe: cambios.importe, medio_pago: cambios.medioPago })
      .eq("id", id)
      .eq("tipo", "pago")
      .select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo modificar el pago (sin permiso o no existe)");
  },

  async eliminarMovimiento(id) {
    const db = await createClient();
    const { data, error } = await db.from("movimientos").delete().eq("id", id).select("id");
    comprobar(error);
    // RLS no da error cuando el rol no puede borrar: simplemente no borra nada.
    if (!data?.length) throw new Error("No se pudo eliminar el movimiento (sin permiso o no existe)");
  },

  async registrarCompra(compra) {
    const db = await createClient();
    const { error } = await db.rpc("registrar_compra", {
      p_fecha: compra.fecha,
      p_proveedor: compra.proveedor,
      p_comprobante: compra.comprobante,
      p_items: compra.items.map((i) => ({ producto: i.producto, kilos: i.kilos, costo: i.costo ?? "" })),
    });
    comprobar(error);
  },

  async registrarAjuste(ajuste) {
    const db = await createClient();
    const { data: productoId, error: errorProducto } = await db.rpc("producto_por_nombre", { p_nombre: ajuste.producto });
    comprobar(errorProducto);
    const { error } = await db
      .from("stock_movimientos")
      .insert({ fecha: ajuste.fecha, tipo: "ajuste", producto_id: productoId, kilos: ajuste.kilos, nota: ajuste.nota });
    comprobar(error);
  },

  async eliminarStockMovimiento(id) {
    const db = await createClient();
    const { data, error } = await db.from("stock_movimientos").delete().eq("id", id).select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo eliminar (sin permiso o no existe)");
  },

  async fijarPrecio(producto, precio) {
    const db = await createClient();
    const { data: productoId, error: errorProducto } = await db.rpc("producto_por_nombre", { p_nombre: producto });
    comprobar(errorProducto);
    const { data, error } = await db.from("productos").update({ precio }).eq("id", productoId).select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo guardar el precio (sin permiso)");
  },

  async fijarCategoria(producto, categoria) {
    const db = await createClient();
    const { data: productoId, error: errorProducto } = await db.rpc("producto_por_nombre", { p_nombre: producto });
    comprobar(errorProducto);
    const { data, error } = await db.from("productos").update({ categoria }).eq("id", productoId).select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo guardar el rubro (sin permiso)");
  },

  async crearCorte(nombre) {
    const db = await createClient();
    const { error } = await db.rpc("producto_por_nombre", { p_nombre: nombre });
    comprobar(error);
  },

  async registrarPagoProveedor(pago) {
    const db = await createClient();
    const { error } = await db.from("pagos_proveedores").insert({
      proveedor_id: pago.proveedorId,
      fecha: pago.fecha,
      importe: pago.importe,
      medio_pago: pago.medioPago,
      comprobante: pago.comprobante,
    });
    comprobar(error);
  },

  async eliminarPagoProveedor(id) {
    const db = await createClient();
    const { data, error } = await db.from("pagos_proveedores").delete().eq("id", id).select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo eliminar (sin permiso o no existe)");
  },

  async obtenerUsuarios(): Promise<Usuarios> {
    const db = await createClient();
    const [perfiles, invitaciones] = await Promise.all([
      db.from("perfiles").select("id, email, nombre, rol, activo").order("created_at"),
      db.from("invitaciones").select("id, email, rol").order("created_at"),
    ]);
    comprobar(perfiles.error);
    comprobar(invitaciones.error);
    return {
      miembros: (perfiles.data ?? []).filter((p) => esRol(p.rol)).map((p) => ({ id: p.id, email: p.email, nombre: p.nombre, rol: p.rol, activo: p.activo })),
      invitaciones: (invitaciones.data ?? []).filter((i) => esRol(i.rol)).map((i) => ({ id: i.id, email: i.email, rol: i.rol })),
    };
  },

  async invitar(email, rol) {
    const db = await createClient();
    // Si ya había una invitación para ese email, se reemplaza el rol.
    await db.from("invitaciones").delete().ilike("email", email);
    const { error } = await db.from("invitaciones").insert({ email, rol });
    comprobar(error);
  },

  async cancelarInvitacion(id) {
    const db = await createClient();
    const { error } = await db.from("invitaciones").delete().eq("id", id);
    comprobar(error);
  },

  async cambiarRol(id, rol) {
    const db = await createClient();
    const { data, error } = await db.from("perfiles").update({ rol }).eq("id", id).select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo cambiar el rol (no podés cambiar el tuyo)");
  },

  async cambiarActivo(id, activo) {
    const db = await createClient();
    const { data, error } = await db.from("perfiles").update({ activo }).eq("id", id).select("id");
    comprobar(error);
    if (!data?.length) throw new Error("No se pudo cambiar el estado (no podés cambiar el tuyo)");
  },
};
