// Misma forma que tendrían las tablas el día que haya base de datos.

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

export type ItemVenta = { detalle: string; kilos: number; precio: number };

type Base = { id: string; clienteId: string; /** AAAA-MM-DD */ fecha: string; /** N° de remito o recibo */ comprobante: string };

export type Movimiento =
  | (Base & { tipo: "saldo_inicial"; importe: number })
  | (Base & { tipo: "venta"; items: ItemVenta[] })
  | (Base & { tipo: "pago"; importe: number });

type SinId<T> = T extends unknown ? Omit<T, "id"> : never;
export type NuevoMovimiento = SinId<Movimiento>;
export type NuevoCliente = Omit<Cliente, "id" | "numero">;

const redondear = (n: number) => Math.round(n * 100) / 100;

export const subtotalItem = (item: ItemVenta) => redondear(item.kilos * item.precio);

/** Lo que el movimiento suma (debe) o resta (haber) al saldo del cliente. */
export function efectoEnSaldo(m: Movimiento): number {
  if (m.tipo === "pago") return -m.importe;
  if (m.tipo === "saldo_inicial") return m.importe;
  return redondear(m.items.reduce((total, item) => total + subtotalItem(item), 0));
}

/** El saldo nunca se guarda: siempre sale de sumar los movimientos. */
export function saldoDe(clienteId: string, movimientos: Movimiento[]): number {
  return redondear(movimientos.reduce((total, m) => (m.clienteId === clienteId ? total + efectoEnSaldo(m) : total), 0));
}
