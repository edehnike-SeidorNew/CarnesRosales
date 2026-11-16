"use client";

import { useState } from "react";
import Link from "next/link";
import { FiltroPeriodo, Tarjeta } from "@/components/clientes/comunes";
import { CardLateral, ColumnaLateral } from "@/components/layout/CardLateral";
import { ScaleIcon } from "@/components/layout/icons";
import { fechaAR, inicioDePeriodo, kilos, pesos, type Periodo } from "@/lib/formato";
import { MEDIOS_PAGO, redondear, saldoDe, subtotalItem, type Cliente, type MedioPago, type Movimiento, type StockDeProducto } from "@/lib/tipos";

const NOMBRE_PERIODO: Record<Periodo, string> = {
  todo: "Todo el historial",
  semana: "Esta semana",
  mes: "Este mes",
  trimestre: "Este trimestre",
  semestre: "Este semestre",
  anio: "Este año",
};

/** Para los títulos de las cards: "Total vendido este mes". */
const EN_PERIODO: Record<Periodo, string> = {
  todo: "en total",
  semana: "esta semana",
  mes: "este mes",
  trimestre: "este trimestre",
  semestre: "este semestre",
  anio: "este año",
};

/** Tablero: ventas, kilos por corte y cobros del período elegido, más lo que queda por cobrar. */
export function Inicio({
  clientes,
  movimientos,
  stock,
}: {
  clientes: Cliente[];
  movimientos: Movimiento[];
  /** Stock actual de cada corte del catálogo: cada uno tiene su card aunque no se haya vendido en el período. */
  stock: StockDeProducto[];
}) {
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
  const vendidos = porCorte.size;
  for (const { nombre } of stock) {
    if (!porCorte.has(nombre.toLowerCase())) porCorte.set(nombre.toLowerCase(), { nombre, kilos: 0, importe: 0 });
  }
  const cortes = [...porCorte.values()].sort((a, b) => b.kilos - a.kilos || a.nombre.localeCompare(b.nombre, "es"));

  // Agrupados por rubro, en el orden de la lista de precios; lo que no tiene rubro va al final.
  const rubroDe = new Map(stock.map((p) => [p.nombre.toLowerCase(), p.categoria]));
  const ORDEN = ["Vacuno", "Cerdo", "Pollo", "Embutidos y chacinados"];
  const porRubro = new Map<string, typeof cortes>();
  for (const c of cortes) {
    const rubro = rubroDe.get(c.nombre.toLowerCase()) || "Otros";
    porRubro.set(rubro, [...(porRubro.get(rubro) ?? []), c]);
  }
  const posicion = (rubro: string) => (ORDEN.includes(rubro) ? ORDEN.indexOf(rubro) : rubro === "Otros" ? 99 : 50);
  const rubros = [...porRubro.entries()]
    .sort((a, b) => posicion(a[0]) - posicion(b[0]) || a[0].localeCompare(b[0], "es"))
    .map(([rubro, lista]) => ({ rubro, lista, kilosRubro: lista.reduce((t, c) => t + c.kilos, 0) }));
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
      <ColumnaLateral fija={false} desplazamiento="xl:mt-20">
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
          <Tarjeta
            titulo={`Total vendido ${EN_PERIODO[periodo]}`}
            valor={pesos(vendido)}
            nota={`Suma de ${remitos} ${remitos === 1 ? "remito" : "remitos"}`}
          />
          <Tarjeta
            titulo={`Kilos vendidos ${EN_PERIODO[periodo]}`}
            valor={`${kilos(kilosVendidos)} kg`}
            nota={`Entre ${vendidos} ${vendidos === 1 ? "producto" : "productos"}`}
          />
          <Tarjeta
            titulo={`Cobrado ${EN_PERIODO[periodo]}`}
            valor={pesos(cobrado)}
            nota={`${cantidadPagos} ${cantidadPagos === 1 ? "pago recibido" : "pagos recibidos"}`}
          />
          <Tarjeta
            titulo="Total a cobrar"
            valor={pesos(totalACobrar)}
            nota={`${saldos.length} ${saldos.length === 1 ? "cliente con saldo" : "clientes con saldo"} · a hoy`}
            destacada
          />
        </div>

        <h2 className="mb-3 text-lg font-bold text-brand">Kilos vendidos por producto {EN_PERIODO[periodo]}</h2>
        {cortes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-brand-border bg-white p-10 text-sm text-slate-500">
            <ScaleIcon className="h-6 w-6" />
            Todavía no hay productos cargados.
          </div>
        ) : (
          <div className="space-y-5">
            {rubros.map(({ rubro, lista, kilosRubro }) => (
              <section key={rubro}>
                <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-brand-border pb-1.5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{rubro}</h3>
                  <span className="text-xs tabular-nums text-slate-500">
                    {kilos(kilosRubro)} kg · {lista.length} {lista.length === 1 ? "producto" : "productos"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {lista.map((c) => (
                    <div key={c.nombre} className={`rounded-2xl border border-brand-border bg-white p-4 ${c.kilos === 0 ? "opacity-60" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <ScaleIcon className="h-4 w-4" />
                        </span>
                        <p className="min-w-0 text-sm font-semibold leading-tight text-slate-900">{c.nombre}</p>
                      </div>
                      <p className="mt-3 text-xl font-bold tabular-nums text-slate-900">{kilos(c.kilos)} kg</p>
                      {c.kilos > 0 ? (
                        <>
                          <p className="mt-0.5 text-sm tabular-nums text-slate-700">{pesos(c.importe)}</p>
                          <p className="mt-0.5 text-xs tabular-nums text-slate-500">Promedio {pesos(c.importe / c.kilos)} por kilo</p>
                        </>
                      ) : (
                        <p className="mt-0.5 text-xs text-slate-500">Sin ventas en el período</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
