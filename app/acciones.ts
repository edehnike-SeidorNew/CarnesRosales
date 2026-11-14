"use server";

import { revalidatePath } from "next/cache";
import { esRol, puede, type Permiso } from "@/lib/auth/roles";
import { getServerSession, tieneAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";
import { esMedioPago, redondear, type ItemVenta, type NuevoCliente } from "@/lib/tipos";

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
    console.error("[acciones]", e);
    return error("No se pudo guardar. Probá de nuevo.");
  }
}

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
      const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
      await repo().crearMovimiento({ clienteId: creado.id, fecha: hoy, tipo: "saldo_inicial", comprobante: "", importe: redondear(saldoAnterior) });
    }
    return { id: creado.id };
  });
}

export async function actualizarCliente(id: string, datos: NuevoCliente): Promise<Resultado> {
  const cliente = limpiarCliente(datos);
  if (!texto(id)) return error("Falta el cliente.");
  if (!cliente.nombreFantasia) return error("Ingresá el nombre de fantasía.");
  return ejecutar("cargar", async () => {
    await repo().actualizarCliente(id, cliente);
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
