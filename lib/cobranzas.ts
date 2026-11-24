import { diasEntre, fechaAR, pesos } from "@/lib/formato";
import { efectoEnSaldo, redondear, type Cliente, type Movimiento } from "@/lib/tipos";

/** Un cliente con deuda: cuánto debe y desde cuándo (la compra más vieja que sigue sin cubrirse). */
export type Deuda = {
  cliente: Cliente;
  /** Saldo adeudado a la fecha. */
  saldo: number;
  /** Fecha (AAAA-MM-DD) de la compra más vieja que todavía no está paga. */
  desde: string;
  /** Días transcurridos desde esa compra. */
  dias: number;
  /** Lo que falta pagar de esa compra más vieja. */
  pendienteDesde: number;
};

const enOrden = (movimientos: Movimiento[]) =>
  movimientos
    .map((m, orden) => ({ m, orden }))
    .sort(
      (a, b) =>
        // El saldo anterior va siempre primero, aunque se haya cargado después.
        Number(b.m.tipo === "saldo_inicial") - Number(a.m.tipo === "saldo_inicial") || a.m.fecha.localeCompare(b.m.fecha) || a.orden - b.orden,
    )
    .map(({ m }) => m);

/**
 * Deuda de un cliente. Los pagos y descuentos se aplican a lo más viejo primero: lo que queda sin cubrir
 * marca desde cuándo se debe. Sin saldo a favor de la casa (saldo <= 0) devuelve null.
 */
export function deudaDeCliente(cliente: Cliente, movimientosDelCliente: Movimiento[], hoy: string): Deuda | null {
  const propios = enOrden(movimientosDelCliente);
  const saldo = redondear(propios.reduce((t, m) => t + efectoEnSaldo(m), 0));
  if (saldo <= 0) return null;

  let credito = redondear(propios.reduce((t, m) => (efectoEnSaldo(m) < 0 ? t - efectoEnSaldo(m) : t), 0));
  for (const m of propios) {
    const cargo = efectoEnSaldo(m);
    if (cargo <= 0) continue;
    if (credito >= cargo) {
      credito = redondear(credito - cargo);
      continue;
    }
    return { cliente, saldo, desde: m.fecha, dias: Math.max(0, diasEntre(m.fecha, hoy)), pendienteDesde: redondear(cargo - credito) };
  }
  return null;
}

/** Clientes con deuda de entre `minDias` y `maxDias` días (sin tope si no hay `maxDias`), del más atrasado al menos atrasado. */
export function deudasVencidas(clientes: Cliente[], movimientos: Movimiento[], hoy: string, minDias: number, maxDias?: number): Deuda[] {
  const porCliente = new Map<string, Movimiento[]>();
  for (const m of movimientos) porCliente.set(m.clienteId, [...(porCliente.get(m.clienteId) ?? []), m]);
  return clientes
    .map((c) => deudaDeCliente(c, porCliente.get(c.id) ?? [], hoy))
    .filter((d): d is Deuda => d !== null && d.dias >= minDias && (maxDias === undefined || d.dias <= maxDias))
    .sort((a, b) => b.dias - a.dias || b.saldo - a.saldo);
}

/** Mensaje de WhatsApp para recordar el pago: lleva el monto adeudado y la fecha de la compra. */
export function mensajeCobro({ nombre, dias, monto, fecha }: { nombre: string; dias: number; monto: number; fecha: string }): string {
  const hace = dias === 1 ? "hace 1 día" : `hace ${dias} días`;
  return `Hola ${nombre || ""}! Te escribimos de Carnes Rosales. Te recordamos que tenés un saldo pendiente de ${pesos(monto)}, de la compra del ${fechaAR(fecha)} (${hace}). Cuando puedas, pasá a abonarlo o avisanos. ¡Gracias!`.replace("Hola !", "Hola!");
}
