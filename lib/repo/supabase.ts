import { createClient } from "@/lib/supabase/server";
import type { Cliente, Datos, ItemVenta, MedioPago, Movimiento } from "@/lib/tipos";
import type { Repo } from "./index";

// Acceso a la base con la sesión del usuario: lo que puede leer y escribir lo decide RLS.

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

type FilaItem = {
  orden: number;
  kilos: number | string;
  precio: number | string;
  productos: { nombre: string } | { nombre: string }[] | null;
};

type FilaMovimiento = {
  id: string;
  cliente_id: string;
  fecha: string;
  tipo: Movimiento["tipo"];
  comprobante: string;
  importe: number | string | null;
  medio_pago: MedioPago | null;
  movimiento_items: FilaItem[] | null;
};

const COLUMNAS_CLIENTE = "id, numero, nombre_fantasia, titular, direccion, localidad, cuit, contacto, observaciones";
const PAGINA = 1000; // tope de filas por consulta de Supabase

type Respuesta<T> = { data: T[] | null; error: { message: string } | null };

/** Trae todas las filas de a páginas: sin esto, Supabase corta en 1000 sin avisar. */
async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<Respuesta<T>>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await consulta(desde, desde + PAGINA - 1);
    if (error) throw new Error(error.message);
    filas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return filas;
  }
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

function aMovimiento(f: FilaMovimiento): Movimiento {
  const base = { id: f.id, clienteId: f.cliente_id, fecha: f.fecha, comprobante: f.comprobante };
  if (f.tipo === "venta") {
    const items: ItemVenta[] = [...(f.movimiento_items ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((i) => {
        const producto = Array.isArray(i.productos) ? i.productos[0] : i.productos;
        return { detalle: producto?.nombre ?? "(sin producto)", kilos: Number(i.kilos), precio: Number(i.precio) };
      });
    return { ...base, tipo: "venta", items };
  }
  if (f.tipo === "pago") return { ...base, tipo: "pago", importe: Number(f.importe), medioPago: f.medio_pago };
  return { ...base, tipo: "saldo_inicial", importe: Number(f.importe) };
}

export const repoSupabase: Repo = {
  async obtenerDatos(): Promise<Datos> {
    const db = await createClient();
    const [clientes, movimientos, productos] = await Promise.all([
      todas<FilaCliente>((desde, hasta) => db.from("clientes").select(COLUMNAS_CLIENTE).order("numero").range(desde, hasta)),
      todas<FilaMovimiento>((desde, hasta) =>
        db
          .from("movimientos")
          .select("id, cliente_id, fecha, tipo, comprobante, importe, medio_pago, movimiento_items(orden, kilos, precio, productos(nombre))")
          .order("fecha")
          .order("orden")
          .range(desde, hasta),
      ),
      todas<{ nombre: string }>((desde, hasta) => db.from("productos").select("nombre").order("nombre").range(desde, hasta)),
    ]);
    return {
      clientes: clientes.map(aCliente),
      movimientos: movimientos.map(aMovimiento),
      productos: productos.map((p) => p.nombre),
    };
  },

  async crearCliente(datos) {
    const db = await createClient();
    const { data, error } = await db
      .from("clientes")
      .insert({
        nombre_fantasia: datos.nombreFantasia,
        titular: datos.titular,
        direccion: datos.direccion,
        localidad: datos.localidad,
        cuit: datos.cuit,
        contacto: datos.contacto,
        observaciones: datos.observaciones,
      })
      .select(COLUMNAS_CLIENTE)
      .single();
    if (error) throw new Error(error.message);
    return aCliente(data as FilaCliente);
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
      if (error) throw new Error(error.message);
      return;
    }
    const { error } = await db.from("movimientos").insert({
      cliente_id: m.clienteId,
      fecha: m.fecha,
      tipo: m.tipo,
      comprobante: m.comprobante,
      importe: m.importe,
      medio_pago: m.tipo === "pago" ? m.medioPago : null,
    });
    if (error) throw new Error(error.message);
  },

  async eliminarMovimiento(id) {
    const db = await createClient();
    const { error } = await db.from("movimientos").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
