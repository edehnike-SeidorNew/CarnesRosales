import { fechaAR, kilos, pesos } from "@/lib/formato";
import { redondear, subtotalItem, type Cliente, type Movimiento } from "@/lib/tipos";

export type Remito = Extract<Movimiento, { tipo: "venta" }>;

export type RenglonRemito = { cantidad: string; descripcion: string; precio: number; importe: number };

const POR_UNIDAD = / \(POR UNIDAD\)$/i;

/** Renglones del remito tal como se imprimen: "11,80 kg" o "3 u." (si se vendió por unidad o caja). */
export function renglonesDeRemito(remito: Remito): RenglonRemito[] {
  return remito.items.map((item) => {
    const porUnidad = POR_UNIDAD.test(item.detalle);
    return {
      cantidad: porUnidad ? `${kilos(item.kilos)} u.` : `${kilos(item.kilos)} kg`,
      descripcion: item.detalle.replace(POR_UNIDAD, "").toUpperCase(),
      precio: item.precio,
      importe: subtotalItem(item),
    };
  });
}

export const totalDeRemito = (remito: Remito) => redondear(remito.items.reduce((t, i) => t + subtotalItem(i), 0));

export const kilosDeRemito = (remito: Remito) =>
  redondear(remito.items.reduce((t, i) => (POR_UNIDAD.test(i.detalle) ? t : t + i.kilos), 0));

/** "2026-10-09" -> ["09", "10", "26"] (día, mes, año) para los casilleros de fecha. */
export function partesDeFecha(iso: string): [string, string, string] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? [m[3], m[2], m[1].slice(2)] : ["", "", ""];
}

/** Resumen corto de los productos para la lista: "PICADA, VACIO y 2 más". */
export function resumenDeProductos(remito: Remito): string {
  const nombres = [...new Set(remito.items.map((i) => i.detalle.replace(POR_UNIDAD, "")))];
  if (nombres.length <= 2) return nombres.join(" y ");
  return `${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más`;
}

export function titularDe(cliente: Cliente): string {
  return [cliente.nombreFantasia, cliente.titular && cliente.titular.toUpperCase() !== cliente.nombreFantasia.toUpperCase() ? `(${cliente.titular})` : ""]
    .filter(Boolean)
    .join(" ");
}

/** Nombre de archivo sin acentos ni símbolos, para que descargue bien en cualquier sistema. */
export function nombreDeArchivo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Número para WhatsApp (wa.me): sólo dígitos, con 54 9 + código de área + número, sin el 0 ni el 15.
 * Devuelve null si no alcanza (por ejemplo, falta el código de área).
 */
export function numeroWhatsApp(texto: string): string | null {
  let d = texto.replace(/\D/g, "").replace(/^00/, "");
  if (d.startsWith("54")) d = d.slice(2);
  d = d.replace(/^0/, "");
  if (d.startsWith("9") && d.length === 11) d = d.slice(1);
  // Con el 15 de los celulares: código de área (2 a 4 dígitos) + 15 + número.
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === "15") {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }
  return d.length === 10 ? `549${d}` : null;
}

/** Primer número de teléfono que aparezca en el campo de contacto del cliente ("Juan 11 5555-1234" -> "11 5555-1234"). */
export function telefonoDeContacto(contacto: string): string {
  return /\+?\d[\d\s().-]{6,}\d/.exec(contacto)?.[0].trim() ?? "";
}

/** Mensaje de WhatsApp con el detalle del remito (por el link no se puede adjuntar el PDF). */
export function mensajeWhatsApp(remito: Remito, cliente: Cliente): string {
  const numero = remito.comprobante ? ` N° ${remito.comprobante}` : "";
  const lineas = renglonesDeRemito(remito).map((r) => `• ${r.cantidad} ${r.descripcion} — ${pesos(r.importe)}`);
  return [
    `Hola ${cliente.nombreFantasia}! Te paso el remito${numero} del ${fechaAR(remito.fecha)} de Carnes Rosales:`,
    "",
    ...lineas,
    "",
    `Total: ${pesos(totalDeRemito(remito))}`,
    "",
    "Gracias por confiar en Carnes Rosales.",
  ].join("\n");
}
