"use client";

import { useState } from "react";
import Link from "next/link";
import { FiltroPeriodo, Tarjeta } from "@/components/clientes/comunes";
import { CardLateral, ColumnaLateral } from "@/components/layout/CardLateral";
import { ScaleIcon } from "@/components/layout/icons";
import { fechaAR, inicioDePeriodo, kilos, pesos, type Periodo } from "@/lib/formato";
import { MEDIOS_PAGO, redondear, saldoDe, subtotalItem, type Cliente, type MedioPago, type Movimiento } from "@/lib/tipos";

const NOMBRE_PERIODO: Record<Periodo, string> = {
  todo: "Todo el historial",
  semana: "Esta semana",
  mes: "Este mes",
  trimestre: "Este trimestre",
  semestre: "Este semestre",
  anio: "Este año",
};

const TD = "px-4 py-3";

/** Tablero: ventas, kilos por corte y cobros del período elegido, más lo que queda por cobrar. */
export function Inicio({ clientes, movimientos }: { clientes: Cliente[]; movimientos: Movimiento[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const desde = inicioDePeriodo(periodo);
  const delPeriodo = desde ? movimientos.filter((m) => m.fecha >= desde) : movimientos;

  // Ventas: importe, kilos y desglose por corte.
  const porCorte = new Map<string, { nombre: string; kilos: number; importe: number }>();
  let remitos = 0;
  for (const m of delPeriodo) {
    if (m.tipo !== "venta") continue;
    remitos += 1;
    for (const item of m.items) {
      const clave = item.detalle.toLowerCase();
      const corte = porCorte.get(clave) ?? { nombre: item.detalle, kilos: 0, importe: 0 };
      corte.kilos += item.kilos;
      corte.importe += subtotalItem(item);
      porCorte.set(clave, corte);
    }
  }
  const cortes = [...porCorte.values()].sort((a, b) => b.kilos - a.kilos);
  const kilosVendidos = cortes.reduce((t, c) => t + c.kilos, 0);
  const vendido = redondear(cortes.reduce((t, c) => t + c.importe, 0));

  // Cobros: total y desglose por medio de pago.
  const porMedio = new Map<MedioPago | null, number>();
  let cantidadPagos = 0;
  for (const m of delPeriodo) {
    if (m.tipo !== "pago") continue;
    cantidadPagos += 1;
    porMedio.set(m.medioPago, (porMedio.get(m.medioPago) ?? 0) + m.importe);
  }
  const cobrado = redondear([...porMedio.values()].reduce((t, v) => t + v, 0));
  const medios: { label: string; importe: number }[] = MEDIOS_PAGO.map(({ id, label }) => ({ label, importe: porMedio.get(id) ?? 0 }));
  if (porMedio.has(null)) medios.push({ label: "Sin especificar", importe: porMedio.get(null) ?? 0 });

  // Deuda: siempre con todo el historial, no depende del período.
  const saldos = clientes
    .map((c) => ({ cliente: c, saldo: saldoDe(c.id, movimientos) }))
    .filter(({ saldo }) => saldo > 0)
    .sort((a, b) => b.saldo - a.saldo);
  const totalACobrar = redondear(saldos.reduce((t, { saldo }) => t + saldo, 0));

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <ColumnaLateral fija={false} desplazamiento="xl:mt-[5.5rem]">
        <CardLateral titulo="Cobros por medio de pago">
          <dl className="divide-y divide-brand-border">
            {medios.map(({ label, importe }) => (
              <div key={label} className="py-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">{label}</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">{pesos(importe)}</dd>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-brand-soft">
                  <div className="h-full rounded-full bg-brand-mid" style={{ width: `${cobrado ? (importe / cobrado) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </dl>
        </CardLateral>

        <CardLateral titulo="Mayores saldos">
          {saldos.length === 0 ? (
            <p className="text-sm text-slate-500">Ningún cliente tiene saldo pendiente.</p>
          ) : (
            <ul className="divide-y divide-brand-border">
              {saldos.slice(0, 5).map(({ cliente, saldo }) => (
                <li key={cliente.id}>
                  <Link href={`/clientes/${cliente.id}`} className="flex justify-between gap-3 py-2 text-sm hover:text-brand">
                    <span className="min-w-0 truncate font-medium text-slate-800">{cliente.nombreFantasia}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">{pesos(saldo)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardLateral>
      </ColumnaLateral>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-bold text-brand">Inicio</h1>
          <FiltroPeriodo periodo={periodo} onChange={setPeriodo} conTodo={false} />
        </div>
        <p className="mb-6 text-sm text-slate-500">
          {NOMBRE_PERIODO[periodo]}
          {desde ? ` · desde el ${fechaAR(desde)}` : ""}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tarjeta titulo="Vendido" valor={pesos(vendido)} nota={`${remitos} ${remitos === 1 ? "remito" : "remitos"}`} />
          <Tarjeta titulo="Kilos vendidos" valor={`${kilos(kilosVendidos)} kg`} nota={`${cortes.length} ${cortes.length === 1 ? "corte" : "cortes"}`} />
          <Tarjeta titulo="Cobrado" valor={pesos(cobrado)} nota={`${cantidadPagos} ${cantidadPagos === 1 ? "pago" : "pagos"}`} />
          <Tarjeta
            titulo="Total a cobrar"
            valor={pesos(totalACobrar)}
            nota={`${saldos.length} ${saldos.length === 1 ? "cliente con saldo" : "clientes con saldo"} · a hoy`}
            destacada
          />
        </div>

        <h2 className="mb-3 text-lg font-bold text-brand">Kilos vendidos por corte</h2>
        {cortes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-brand-border bg-white p-10 text-sm text-slate-500">
            <ScaleIcon className="h-6 w-6" />
            No hay ventas en este período.
          </div>
        ) : (
          <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
                  <tr>
                    <th className={`${TD} font-semibold`}>Corte</th>
                    <th className={`${TD} text-right font-semibold`}>Kilos</th>
                    <th className={`${TD} w-2/5 font-semibold`}>Parte del total</th>
                    <th className={`${TD} text-right font-semibold`}>Importe</th>
                    <th className={`${TD} text-right font-semibold`}>Precio promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {cortes.map((c) => {
                    const parte = kilosVendidos ? (c.kilos / kilosVendidos) * 100 : 0;
                    return (
                      <tr key={c.nombre}>
                        <td className={`${TD} font-semibold text-slate-900`}>{c.nombre}</td>
                        <td className={`${TD} text-right tabular-nums text-slate-800`}>{kilos(c.kilos)}</td>
                        <td className={TD}>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-brand-soft">
                              <div className="h-full rounded-full bg-brand-mid" style={{ width: `${parte}%` }} />
                            </div>
                            <span className="w-12 text-right text-xs tabular-nums text-slate-600">{parte.toFixed(1).replace(".", ",")}%</span>
                          </div>
                        </td>
                        <td className={`${TD} text-right tabular-nums text-slate-800`}>{pesos(c.importe)}</td>
                        <td className={`${TD} text-right tabular-nums text-slate-800`}>{pesos(c.importe / c.kilos)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-brand-border bg-brand-soft/60 font-semibold text-slate-900">
                  <tr>
                    <td className={TD}>Total</td>
                    <td className={`${TD} text-right tabular-nums`}>{kilos(kilosVendidos)}</td>
                    <td />
                    <td className={`${TD} text-right tabular-nums`}>{pesos(vendido)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
