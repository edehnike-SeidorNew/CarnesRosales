"use server";

import { revalidatePath } from "next/cache";
import { esRol, puede, type Permiso } from "@/lib/auth/roles";
import { getServerSession, tieneAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";
import { esMedioPago, redondear, type ItemVenta, type MedioPago, type NuevoCliente } from "@/lib/tipos";

export type Resultado<T = null> = { ok: true; dato: T } | { ok: false; error: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texto = (valor: unknown, max = 300) => (typeof valor === "string" ? valor.trim().slice(0, max) : "");
const positivo = (valor: unknown): valor is number => typeof valor === "number" && Number.isFinite(valor) && valor > 0;
const error = (mensaje: string): { ok: false; error: string } => ({ ok: false, error: mensaje });

/** Corre la operación sólo si el rol lo permite, y devuelve el error como texto en vez de romper la página. */
async function ejecutar<T>(permiso: Permiso, operacion: () => Promise<T>): Promise<Resultado<T>> {
  const session = await getServerSession();
  if (!session) return error("Tu sesión venció. Volvé a iniciar sesión.");
  if (!tieneAcceso(session)) return error("Tu cuenta todavía no tiene acceso.");
  if (!puede(session.rol, permiso)) return error("Tu rol no permite esta acción.");
  try {
    const dato = await operacion();
    revalidatePath("/", "layout");
    return { ok: true, dato };
  } catch (e) {
    if (e instanceof Aviso) return error(e.message);
    console.error("[acciones]", e);
    return error("No se pudo guardar. Probá de nuevo.");
  }
}

/** Error con un mensaje pensado para mostrarle al usuario tal cual. */
class Aviso extends Error {}

const hoyAR = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });

function limpiarCliente(datos: NuevoCliente): NuevoCliente {
  return {
    nombreFantasia: texto(datos?.nombreFantasia, 120),
    titular: texto(datos?.titular, 120),
    direccion: texto(datos?.direccion, 200),
    localidad: texto(datos?.localidad, 120),
    cuit: texto(datos?.cuit, 20),
    contacto: texto(datos?.contacto, 200),
    observaciones: texto(datos?.observaciones, 1000),
  };
}

function limpiarItems(items: ItemVenta[] | undefined): ItemVenta[] | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  const limpios = items.map((i) => ({ detalle: texto(i?.detalle, 80).replace(/\s+/g, " "), kilos: i?.kilos, precio: i?.precio }));
  return limpios.every((i) => i.detalle && positivo(i.kilos) && positivo(i.precio)) ? limpios : null;
}

// --- Clientes ---------------------------------------------------------------

export async function crearCliente(datos: NuevoCliente, saldoAnterior = 0): Promise<Resultado<{ id: string }>> {
  const cliente = limpiarCliente(datos);
  if (!cliente.nombreFantasia) return error("Ingresá el nombre de fantasía.");
  if (typeof saldoAnterior !== "number" || !Number.isFinite(saldoAnterior) || saldoAnterior < 0) return error("Revisá el saldo anterior.");
  return ejecutar("cargar", async () => {
    const creado = await repo().crearCliente(cliente);
    if (saldoAnterior > 0) {
      await repo().crearMovimiento({ clienteId: creado.id, fecha: hoyAR(), tipo: "saldo_inicial", comprobante: "", importe: redondear(saldoAnterior) });
    }
    return { id: creado.id };
  });
}

/** Corrige los datos del cliente y, si se pasa, su saldo anterior (lo que debía antes de empezar a registrar). */
export async function actualizarCliente(id: string, datos: NuevoCliente, saldoAnterior?: number): Promise<Resultado> {
  const cliente = limpiarCliente(datos);
  if (!texto(id)) return error("Falta el cliente.");
  if (!cliente.nombreFantasia) return error("Ingresá el nombre de fantasía.");
  if (saldoAnterior !== undefined && (typeof saldoAnterior !== "number" || !Number.isFinite(saldoAnterior) || saldoAnterior < 0)) {
    return error("Revisá el saldo anterior.");
  }
  return ejecutar("cargar", async () => {
    await repo().actualizarCliente(id, cliente);
    if (saldoAnterior === undefined) return null;

    const importe = redondear(saldoAnterior);
    const propios = (await repo().obtenerDatos()).movimientos.filter((m) => m.clienteId === id);
    const inicial = propios.find((m) => m.tipo === "saldo_inicial");
    if (inicial) {
      if (inicial.tipo === "saldo_inicial" && inicial.importe !== importe) {
        await repo().actualizarMovimiento(inicial.id, { tipo: "saldo_inicial", importe });
      }
    } else if (importe > 0) {
      // Con la fecha del primer movimiento, para que quede al principio de la cuenta.
      const fecha = propios.reduce((min, m) => (m.fecha < min ? m.fecha : min), hoyAR());
      await repo().crearMovimiento({ clienteId: id, fecha, tipo: "saldo_inicial", comprobante: "", importe });
    }
    return null;
  });
}

export async function eliminarCliente(id: string): Promise<Resultado> {
  if (!texto(id)) return error("Falta el cliente.");
  return ejecutar("borrar", async () => {
    const { movimientos } = await repo().obtenerDatos();
    if (movimientos.some((m) => m.clienteId === id && m.tipo !== "saldo_inicial")) {
      throw new Aviso("Este cliente tiene ventas o pagos cargados. Eliminá primero esos movimientos.");
    }
    await repo().eliminarCliente(id);
    return null;
  });
}

// --- Ventas y pagos ---------------------------------------------------------

type DatosVenta = { fecha: string; comprobante: string; items: ItemVenta[] };
type DatosPago = { fecha: string; comprobante: string; importe: number; medioPago: string };

export async function registrarVenta(clienteId: string, datos: DatosVenta): Promise<Resultado> {
  if (!texto(clienteId)) return error("Falta el cliente.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  const items = limpiarItems(datos.items);
  if (!items) return error("Cada producto necesita detalle, kilos y precio.");
  return ejecutar("cargar", async () => {
    await repo().crearMovimiento({ clienteId, fecha: datos.fecha, tipo: "venta", comprobante: texto(datos.comprobante, 40), items });
    return null;
  });
}

export async function actualizarVenta(id: string, datos: DatosVenta): Promise<Resultado> {
  if (!texto(id)) return error("Falta el movimiento.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  const items = limpiarItems(datos.items);
  if (!items) return error("Cada producto necesita detalle, kilos y precio.");
  return ejecutar("cargar", async () => {
    await repo().actualizarMovimiento(id, { tipo: "venta", fecha: datos.fecha, comprobante: texto(datos.comprobante, 40), items });
    return null;
  });
}

export async function registrarPago(clienteId: string, datos: DatosPago): Promise<Resultado> {
  if (!texto(clienteId)) return error("Falta el cliente.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  if (!positivo(datos.importe)) return error("Ingresá el importe del pago.");
  const medioPago = datos.medioPago;
  if (!esMedioPago(medioPago)) return error("Elegí el medio de pago.");
  return ejecutar("cargar", async () => {
    await repo().crearMovimiento({
      clienteId,
      fecha: datos.fecha,
      tipo: "pago",
      comprobante: texto(datos.comprobante, 40),
      importe: redondear(datos.importe),
      medioPago,
    });
    return null;
  });
}

/**
 * Un cobro dividido en varios medios de pago (por ejemplo, parte en efectivo, parte en cheque y parte por billetera virtual).
 * Se guarda un pago por cada medio, todos con la misma fecha y el mismo N° de recibo, y se guardan juntos o ninguno.
 */
export async function registrarPagos(
  clienteId: string,
  datos: { fecha: string; comprobante: string; partes: { importe: number; medioPago: string }[] },
): Promise<Resultado> {
  if (!texto(clienteId)) return error("Falta el cliente.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  const partes = Array.isArray(datos.partes) ? datos.partes : [];
  if (partes.length === 0 || partes.length > 10) return error("Cargá entre 1 y 10 medios de pago.");
  for (const parte of partes) {
    if (!positivo(parte?.importe)) return error("Ingresá el importe de cada medio de pago.");
    if (!esMedioPago(parte.medioPago)) return error("Elegí el medio de pago de cada renglón.");
  }
  const comprobante = texto(datos.comprobante, 40);
  return ejecutar("cargar", async () => {
    await repo().crearPagos(
      partes.map((parte) => ({
        clienteId,
        fecha: datos.fecha,
        tipo: "pago" as const,
        comprobante,
        importe: redondear(parte.importe),
        medioPago: parte.medioPago as MedioPago,
      })),
    );
    return null;
  });
}

export async function actualizarPago(id: string, datos: DatosPago): Promise<Resultado> {
  if (!texto(id)) return error("Falta el movimiento.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  if (!positivo(datos.importe)) return error("Ingresá el importe del pago.");
  const medioPago = datos.medioPago;
  if (!esMedioPago(medioPago)) return error("Elegí el medio de pago.");
  return ejecutar("cargar", async () => {
    await repo().actualizarMovimiento(id, {
      tipo: "pago",
      fecha: datos.fecha,
      comprobante: texto(datos.comprobante, 40),
      importe: redondear(datos.importe),
      medioPago,
    });
    return null;
  });
}

type DatosDescuento = { fecha: string; comprobante: string; importe: number; nota: string };

/** Descuento, retiro de mercadería o consumo: resta del saldo pero no cuenta como plata cobrada. */
export async function registrarDescuento(clienteId: string, datos: DatosDescuento): Promise<Resultado> {
  if (!texto(clienteId)) return error("Falta el cliente.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  if (!positivo(datos.importe)) return error("Ingresá el importe del descuento.");
  if (!texto(datos.nota)) return error("Contá de qué es el descuento (por ejemplo: retiro de asado).");
  return ejecutar("cargar", async () => {
    await repo().crearMovimiento({
      clienteId,
      fecha: datos.fecha,
      tipo: "descuento",
      comprobante: texto(datos.comprobante, 40),
      importe: redondear(datos.importe),
      nota: texto(datos.nota, 200),
    });
    return null;
  });
}

export async function actualizarDescuento(id: string, datos: DatosDescuento): Promise<Resultado> {
  if (!texto(id)) return error("Falta el movimiento.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  if (!positivo(datos.importe)) return error("Ingresá el importe del descuento.");
  if (!texto(datos.nota)) return error("Contá de qué es el descuento (por ejemplo: retiro de asado).");
  return ejecutar("cargar", async () => {
    await repo().actualizarMovimiento(id, {
      tipo: "descuento",
      fecha: datos.fecha,
      comprobante: texto(datos.comprobante, 40),
      importe: redondear(datos.importe),
      nota: texto(datos.nota, 200),
    });
    return null;
  });
}

/** Cargo que no es una venta de productos (préstamo, ajuste a favor...): suma al saldo del cliente. */
export async function registrarCargo(clienteId: string, datos: DatosDescuento): Promise<Resultado> {
  if (!texto(clienteId)) return error("Falta el cliente.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  if (!positivo(datos.importe)) return error("Ingresá el importe del cargo.");
  if (!texto(datos.nota)) return error("Contá de qué es el cargo (por ejemplo: préstamo).");
  return ejecutar("cargar", async () => {
    await repo().crearMovimiento({
      clienteId,
      fecha: datos.fecha,
      tipo: "cargo",
      comprobante: texto(datos.comprobante, 40),
      importe: redondear(datos.importe),
      nota: texto(datos.nota, 200),
    });
    return null;
  });
}

export async function actualizarCargo(id: string, datos: DatosDescuento): Promise<Resultado> {
  if (!texto(id)) return error("Falta el movimiento.");
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  if (!positivo(datos.importe)) return error("Ingresá el importe del cargo.");
  if (!texto(datos.nota)) return error("Contá de qué es el cargo (por ejemplo: préstamo).");
  return ejecutar("cargar", async () => {
    await repo().actualizarMovimiento(id, {
      tipo: "cargo",
      fecha: datos.fecha,
      comprobante: texto(datos.comprobante, 40),
      importe: redondear(datos.importe),
      nota: texto(datos.nota, 200),
    });
    return null;
  });
}

export async function eliminarMovimiento(id: string): Promise<Resultado> {
  if (!texto(id)) return error("Falta el movimiento.");
  return ejecutar("borrar", async () => {
    await repo().eliminarMovimiento(id);
    return null;
  });
}

// --- Stock, precios y proveedores ------------------------------------------

export async function registrarCompra(datos: {
  fecha: string;
  proveedor: string;
  comprobante: string;
  items: { producto: string; kilos: number; costo: number | null }[];
}): Promise<Resultado> {
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  if (!Array.isArray(datos.items) || datos.items.length === 0) return error("Cargá al menos un producto.");
  const items = datos.items.map((i) => ({
    producto: texto(i?.producto, 80).replace(/\s+/g, " "),
    kilos: i?.kilos,
    costo: i?.costo === null || i?.costo === undefined ? null : i.costo,
  }));
  if (items.some((i) => !i.producto || !positivo(i.kilos) || (i.costo !== null && !(typeof i.costo === "number" && i.costo >= 0)))) {
    return error("Cada producto necesita nombre y kilos; el costo es opcional.");
  }
  return ejecutar("cargar", async () => {
    await repo().registrarCompra({ fecha: datos.fecha, proveedor: texto(datos.proveedor, 120), comprobante: texto(datos.comprobante, 40), items });
    return null;
  });
}

export async function registrarAjuste(datos: { fecha: string; producto: string; kilos: number; nota: string }): Promise<Resultado> {
  if (!FECHA.test(datos?.fecha ?? "")) return error("Elegí la fecha.");
  const producto = texto(datos.producto, 80);
  if (!producto) return error("Elegí el producto.");
  if (typeof datos.kilos !== "number" || !Number.isFinite(datos.kilos) || datos.kilos === 0) return error("No hay diferencia para ajustar.");
  return ejecutar("cargar", async () => {
    await repo().registrarAjuste({ fecha: datos.fecha, producto, kilos: Math.round(datos.kilos * 1000) / 1000, nota: texto(datos.nota, 200) });
    return null;
  });
}

export async function eliminarStockMovimiento(id: string): Promise<Resultado> {
  if (!texto(id)) return error("Falta el movimiento.");
  return ejecutar("borrar", async () => {
    await repo().eliminarStockMovimiento(id);
    return null;
  });
}

export async function fijarPrecio(producto: string, precio: number | null): Promise<Resultado> {
  const nombre = texto(producto, 80);
  if (!nombre) return error("Falta el producto.");
  if (precio !== null && !positivo(precio)) return error("El precio tiene que ser mayor a cero.");
  return ejecutar("cargar", async () => {
    await repo().fijarPrecio(nombre, precio === null ? null : redondear(precio));
    return null;
  });
}

/** Cambia el rubro y el precio de lista de un producto. Sólo el administrador. */
export async function guardarProducto(producto: string, datos: { categoria: string; precio: number | null }): Promise<Resultado> {
  const nombre = texto(producto, 80);
  if (!nombre) return error("Falta el producto.");
  if (datos.precio !== null && !positivo(datos.precio)) return error("El precio tiene que ser mayor a cero.");
  return ejecutar("usuarios", async () => {
    await repo().fijarCategoria(nombre, texto(datos.categoria, 60).replace(/\s+/g, " "));
    await repo().fijarPrecio(nombre, datos.precio === null ? null : redondear(datos.precio));
    return null;
  });
}

/** Crea un producto con su rubro y su precio de lista. Sólo el administrador. */
export async function crearProducto(datos: { nombre: string; categoria: string; precio: number | null }): Promise<Resultado> {
  const nombre = texto(datos?.nombre, 80).replace(/\s+/g, " ");
  if (!nombre) return error("Escribí el nombre del producto.");
  if (datos.precio !== null && !positivo(datos.precio)) return error("El precio tiene que ser mayor a cero.");
  return ejecutar("usuarios", async () => {
    await repo().crearCorte(nombre);
    const categoria = texto(datos.categoria, 60).replace(/\s+/g, " ");
    if (categoria) await repo().fijarCategoria(nombre, categoria);
    if (datos.precio !== null) await repo().fijarPrecio(nombre, redondear(datos.precio));
    return null;
  });
}

/** Elimina un producto del catálogo. Sólo el administrador, y sólo si todavía no se usó en ventas ni en stock. */
export async function eliminarProducto(producto: string): Promise<Resultado> {
  const nombre = texto(producto, 80);
  if (!nombre) return error("Falta el producto.");
  return ejecutar("borrar", async () => {
    try {
      await repo().eliminarProducto(nombre);
    } catch (e) {
      // El motivo ("ya tiene ventas...") se le muestra al usuario tal cual.
      if (e instanceof Error && e.message.startsWith("No se puede eliminar")) throw new Aviso(e.message);
      throw e;
    }
    return null;
  });
}

/** Agrega uno o varios cortes al catálogo (separados por coma o por renglón). */
export async function crearCorte(nombres: string): Promise<Resultado> {
  const cortes = [
    ...new Set(
      texto(nombres, 2000)
        .split(/[,;\n]+/)
        .map((c) => c.trim().replace(/\s+/g, " ").slice(0, 80))
        .filter(Boolean)
        .map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    ),
  ];
  if (cortes.length === 0) return error("Escribí el nombre del corte.");
  return ejecutar("cargar", async () => {
    for (const corte of cortes) await repo().crearCorte(corte);
    return null;
  });
}

export async function registrarPagoProveedor(datos: {
  proveedorId: string;
  fecha: string;
  importe: number;
  medioPago: string;
  comprobante: string;
}): Promise<Resultado> {
  if (!texto(datos?.proveedorId)) return error("Elegí el proveedor.");
  if (!FECHA.test(datos.fecha ?? "")) return error("Elegí la fecha.");
  if (!positivo(datos.importe)) return error("Ingresá el importe del pago.");
  const medioPago = datos.medioPago;
  if (!esMedioPago(medioPago)) return error("Elegí el medio de pago.");
  return ejecutar("cargar", async () => {
    await repo().registrarPagoProveedor({
      proveedorId: datos.proveedorId,
      fecha: datos.fecha,
      importe: redondear(datos.importe),
      medioPago,
      comprobante: texto(datos.comprobante, 40),
    });
    return null;
  });
}

export async function eliminarPagoProveedor(id: string): Promise<Resultado> {
  if (!texto(id)) return error("Falta el pago.");
  return ejecutar("borrar", async () => {
    await repo().eliminarPagoProveedor(id);
    return null;
  });
}

// --- Usuarios ---------------------------------------------------------------

export async function invitarUsuario(email: string, rol: string): Promise<Resultado> {
  const correo = texto(email, 254).toLowerCase();
  if (!EMAIL.test(correo)) return error("Revisá el email.");
  if (!esRol(rol)) return error("Elegí un rol.");
  return ejecutar("usuarios", async () => {
    await repo().invitar(correo, rol);
    return null;
  });
}

export async function cancelarInvitacion(id: string): Promise<Resultado> {
  if (!texto(id)) return error("Falta la invitación.");
  return ejecutar("usuarios", async () => {
    await repo().cancelarInvitacion(id);
    return null;
  });
}

export async function cambiarRolUsuario(id: string, rol: string): Promise<Resultado> {
  if (!texto(id) || !esRol(rol)) return error("Pedido no válido.");
  const session = await getServerSession();
  if (session?.userId === id) return error("No podés cambiar tu propio rol.");
  return ejecutar("usuarios", async () => {
    await repo().cambiarRol(id, rol);
    return null;
  });
}

export async function cambiarActivoUsuario(id: string, activo: boolean): Promise<Resultado> {
  if (!texto(id) || typeof activo !== "boolean") return error("Pedido no válido.");
  const session = await getServerSession();
  if (session?.userId === id) return error("No podés desactivar tu propia cuenta.");
  return ejecutar("usuarios", async () => {
    await repo().cambiarActivo(id, activo);
    return null;
  });
}
