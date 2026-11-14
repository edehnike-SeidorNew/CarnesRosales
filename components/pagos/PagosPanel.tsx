"use client";

import { useState } from "react";
import Link from "next/link";
import { Autor, FiltroPeriodo, Tarjeta } from "@/components/clientes/comunes";
import { CashIcon } from "@/components/layout/icons";
import { PanelOpciones } from "@/components/layout/PanelOpciones";
import { CAMPO, fechaAR, inicioDePeriodo, pesos, type Periodo } from "@/lib/formato";
import { etiquetaMedio, MEDIOS_PAGO, redondear, type Cliente, type MedioPago, type Movimiento } from "@/lib/tipos";

type FiltroMedio = "todos" | MedioPago | "sin";

const OPCIONES: { id: FiltroMedio; label: string; Icon: typeof CashIcon }[] = [
  { id: "todos", label: "Todos los medios", Icon: CashIcon },
  ...MEDIOS_PAGO.map((m) => ({ id: m.id as FiltroMedio, label: m.label, Icon: CashIcon })),
  { id: "sin", label: "Sin especificar", Icon: CashIcon },
];

const EN_PERIODO: Record<Periodo, string> = {
  todo: "en total",
  semana: "esta semana",
  mes: "este mes",
  trimestre: "este trimestre",
  semestre: "este semestre",
  anio: "este año",
};

const TD = "px-4 py-3";

/** Todos los pagos recibidos, de todos los clientes, para cerrar la caja. */
export function PagosPanel({ clientes, movimientos }: { clientes: Cliente[]; movimientos: Movimiento[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [medio, setMedio] = useState<FiltroMedio>("todos");
  const [busqueda, setBusqueda] = useState("");

  const nombreDe = new Map(clientes.map((c) => [c.id, c.nombreFantasia]));
  const desde = inicioDePeriodo(periodo);
  const delPeriodo = movimientos
    .map((m, orden) => ({ m, orden }))
    .filter((x): x is { m: Extract<Movimiento, { tipo: "pago" }>; orden: number } => x.m.tipo === "pago" && (!desde || x.m.fecha >= desde))
    // Del más nuevo al más viejo.
    .sort((a, b) => b.m.fecha.localeCompare(a.m.fecha) || b.orden - a.orden)
    .map(({ m }) => m);

  const total = (filtro: (m: (typeof delPeriodo)[number]) => boolean) => redondear(delPeriodo.reduce((t, m) => (filtro(m) ? t + m.importe : t), 0));
  const q = busqueda.trim().toLowerCase();
  const visibles = delPeriodo.filter(
    (m) =>
      (medio === "todos" || (medio === "sin" ? m.medioPago === null : m.medioPago === medio)) &&
      (!q || (nombreDe.get(m.clienteId) ?? "").toLowerCase().includes(q) || m.comprobante.toLowerCase().includes(q)),
  );
  const totalVisible = redondear(visibles.reduce((t, m) => t + m.importe, 0));

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Medio de pago" opciones={OPCIONES} seleccion={medio} onSelect={setMedio} fija={false} desplazamiento="xl:mt-20" />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-bold text-brand">Pagos</h1>
          <FiltroPeriodo periodo={periodo} onChange={setPeriodo} />
        </div>
        <p className="mb-6 text-sm text-slate-500">Pagos recibidos de todos los clientes{desde ? ` · desde el ${fechaAR(desde)}` : ""}</p>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tarjeta
            titulo={`Cobrado ${EN_PERIODO[periodo]}`}
            valor={pesos(total(() => true))}
            nota={`${delPeriodo.length} ${delPeriodo.length === 1 ? "pago" : "pagos"}`}
            destacada
          />
          {MEDIOS_PAGO.map(({ id, label }) => (
            <Tarjeta key={id} titulo={label} valor={pesos(total((m) => m.medioPago === id))} />
          ))}
        </div>

        <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-brand-border p-4">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente o N° de recibo"
              aria-label="Buscar pago"
              className={`${CAMPO} max-w-sm`}
            />
            <span className="text-sm text-slate-500">
              {visibles.length} {visibles.length === 1 ? "pago" : "pagos"} · <strong className="text-slate-900">{pesos(totalVisible)}</strong>
            </span>
          </div>

          {visibles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-sm text-slate-500">
              <CashIcon className="h-6 w-6" />
              No hay pagos con estos filtros.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
                  <tr>
                    <th className={`${TD} font-semibold`}>Fecha</th>
                    <th className={`${TD} font-semibold`}>Cliente</th>
                    <th className={`${TD} font-semibold`}>N° recibo</th>
                    <th className={`${TD} font-semibold`}>Medio de pago</th>
                    <th className={`${TD} text-right font-semibold`}>Importe</th>
                    <th className={`${TD} font-semibold`}>Cargó</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {visibles.map((m) => (
                    <tr key={m.id}>
                      <td className={`${TD} whitespace-nowrap text-slate-800`}>{fechaAR(m.fecha)}</td>
                      <td className={TD}>
                        <Link href={`/clientes/${m.clienteId}`} className="font-semibold text-slate-900 hover:text-brand hover:underline">
                          {nombreDe.get(m.clienteId) ?? "(cliente eliminado)"}
                        </Link>
                      </td>
                      <td className={`${TD} text-slate-500`}>{m.comprobante || "—"}</td>
                      <td className={`${TD} ${m.medioPago ? "text-slate-800" : "text-slate-400"}`}>{etiquetaMedio(m.medioPago)}</td>
                      <td className={`${TD} text-right font-semibold tabular-nums text-emerald-700`}>{pesos(m.importe)}</td>
                      <td className={`${TD} text-xs text-slate-500`}>
                        <Autor email={m.creadoPor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
