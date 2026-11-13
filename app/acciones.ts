"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth/session";
import { repo } from "@/lib/repo";
import { esMedioPago, type ItemVenta, type NuevoCliente } from "@/lib/tipos";

export type Resultado<T = null> = { ok: true; dato: T } | { ok: false; error: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const texto = (valor: unknown, max = 300) => (typeof valor === "string" ? valor.trim().slice(0, max) : "");
const positivo = (valor: unknown): valor is number => typeof valor === "number" && Number.isFinite(valor) && valor > 0;

/** Corre la operación sólo con sesión iniciada y devuelve el error como texto en vez de romper la página. */
async function ejecutar<T>(operacion: () => Promise<T>): Promise<Resultado<T>> {
  if (!(await getServerSession())) return { ok: false, error: "Tu sesión venció. Volvé a iniciar sesión." };
  try {
    const dato = await operacion();
    revalidatePath("/", "layout");
    return { ok: true, dato };
  } catch (e) {
    console.error("[acciones]", e);
    return { ok: false, error: "No se pudo guardar. Probá de nuevo." };
  }
}

export async function crearCliente(datos: NuevoCliente): Promise<Resultado<{ id: string }>> {
  const nombreFantasia = texto(datos?.nombreFantasia, 120);
  if (!nombreFantasia) return { ok: false, error: "Ingresá el nombre de fantasía." };
  return ejecutar(async () => {
    const cliente = await repo().crearCliente({
      nombreFantasia,
      titular: texto(datos.titular, 120),
      direccion: texto(datos.direccion, 200),
      localidad: texto(datos.localidad, 120),
      cuit: texto(datos.cuit, 20),
      contacto: texto(datos.contacto, 200),
      observaciones: texto(datos.observaciones, 1000),
    });
    return { id: cliente.id };
  });
}

export async function registrarVenta(datos: {
  clienteId: string;
  fecha: string;
  comprobante: string;
  items: ItemVenta[];
}): Promise<Resultado> {
  if (!texto(datos?.clienteId)) return { ok: false, error: "Falta el cliente." };
  if (!FECHA.test(datos.fecha ?? "")) return { ok: false, error: "Elegí la fecha." };
  if (!Array.isArray(datos.items) || datos.items.length === 0) return { ok: false, error: "Cargá al menos un producto." };
  const items = datos.items.map((i) => ({ detalle: texto(i?.detalle, 80).replace(/\s+/g, " "), kilos: i?.kilos, precio: i?.precio }));
  if (items.some((i) => !i.detalle || !positivo(i.kilos) || !positivo(i.precio))) {
    return { ok: false, error: "Cada producto necesita detalle, kilos y precio." };
  }
  return ejecutar(async () => {
    await repo().crearMovimiento({
      clienteId: datos.clienteId,
      fecha: datos.fecha,
      tipo: "venta",
      comprobante: texto(datos.comprobante, 40),
      items,
    });
    return null;
  });
}

export async function registrarPago(datos: {
  clienteId: string;
  fecha: string;
  comprobante: string;
  importe: number;
  medioPago: string;
}): Promise<Resultado> {
  if (!texto(datos?.clienteId)) return { ok: false, error: "Falta el cliente." };
  if (!FECHA.test(datos.fecha ?? "")) return { ok: false, error: "Elegí la fecha." };
  if (!positivo(datos.importe)) return { ok: false, error: "Ingresá el importe del pago." };
  const medioPago = datos.medioPago;
  if (!esMedioPago(medioPago)) return { ok: false, error: "Elegí el medio de pago." };
  return ejecutar(async () => {
    await repo().crearMovimiento({
      clienteId: datos.clienteId,
      fecha: datos.fecha,
      tipo: "pago",
      comprobante: texto(datos.comprobante, 40),
      importe: Math.round(datos.importe * 100) / 100,
      medioPago,
    });
    return null;
  });
}

export async function eliminarMovimiento(id: string): Promise<Resultado> {
  if (!texto(id)) return { ok: false, error: "Falta el movimiento." };
  return ejecutar(async () => {
    await repo().eliminarMovimiento(id);
    return null;
  });
}
