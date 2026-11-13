// Misma forma que las tablas de Supabase (ver supabase/migrations/0001_esquema.sql).

export type Cliente = {
  id: string;
  numero: number;
  nombreFantasia: string;
  titular: string;
  direccion: string;
  localidad: string;
  cuit: string;
  contacto: string;
  observaciones: string;
};

export const MEDIOS_PAGO = [
  { id: "efectivo", label: "Efectivo" },
  { id: "mercado_pago", label: "Mercado Pago" },
  { id: "transferencia", label: "Transferencia" },
] as const;

export type MedioPago = (typeof MEDIOS_PAGO)[number]["id"];

export const esMedioPago = (valor: unknown): valor is MedioPago => MEDIOS_PAGO.some((m) => m.id === valor);
/** null = pagos anteriores a registrar este dato. */
export const etiquetaMedio = (medio: MedioPago | null) => MEDIOS_PAGO.find((m) => m.id === medio)?.label ?? "Sin especificar";

/** `detalle` es el nombre del producto (corte). */
export type ItemVenta = { detalle: string; kilos: number; precio: number };

type Base = { id: string; clienteId: string; /** AAAA-MM-DD */ fecha: string; /** N° de remito o recibo */ comprobante: string };

export type Movimiento =
  | (Base & { tipo: "saldo_inicial"; importe: number })
  | (Base & { tipo: "venta"; items: ItemVenta[] })
  | (Base & { tipo: "pago"; importe: number; medioPago: MedioPago | null });

type SinId<T> = T extends unknown ? Omit<T, "id"> : never;
export type NuevoMovimiento = SinId<Movimiento>;
export type NuevoCliente = Omit<Cliente, "id" | "numero">;

export type Datos = { clientes: Cliente[]; movimientos: Movimiento[]; /** Nombres del catálogo de productos. */ productos: string[] };

export const redondear = (n: number) => Math.round(n * 100) / 100;

export const subtotalItem = (item: ItemVenta) => redondear(item.kilos * item.precio);

/** Lo que el movimiento suma (compra) o resta (pago) al saldo del cliente. */
export function efectoEnSaldo(m: Movimiento): number {
  if (m.tipo === "pago") return -m.importe;
  if (m.tipo === "saldo_inicial") return m.importe;
  return redondear(m.items.reduce((total, item) => total + subtotalItem(item), 0));
}

/** El saldo nunca se guarda: siempre sale de sumar los movimientos. */
export function saldoDe(clienteId: string, movimientos: Movimiento[]): number {
  return redondear(movimientos.reduce((total, m) => (m.clienteId === clienteId ? total + efectoEnSaldo(m) : total), 0));
}
