import { kilos } from "@/lib/formato";
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
