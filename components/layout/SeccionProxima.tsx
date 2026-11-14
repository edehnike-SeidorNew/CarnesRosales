import type { ReactNode } from "react";

/** Pantalla de una sección que todavía no está construida: cuenta qué va a hacer. */
export function SeccionProxima({
  titulo,
  etapa,
  resumen,
  funciones,
  icono,
}: {
  titulo: string;
  etapa: string;
  resumen: string;
  funciones: string[];
  icono: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-brand">{titulo}</h1>

      <section className="rounded-2xl border border-dashed border-brand-border bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{icono}</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etapa} · en definición</p>
            <p className="font-semibold text-slate-900">{resumen}</p>
          </div>
        </div>

        <h2 className="mb-2 mt-6 text-sm font-semibold text-brand">Qué va a hacer</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {funciones.map((f) => (
            <li key={f} className="flex gap-2">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-mid" />
              {f}
            </li>
          ))}
        </ul>

        <p className="mt-6 rounded-xl bg-brand-soft px-4 py-3 text-sm text-slate-700">
          Esta sección todavía no está disponible. Se construye en una etapa posterior.
        </p>
      </section>
    </div>
  );
}
