import type { ReactNode } from "react";
import { PERIODOS, type Periodo } from "@/lib/formato";

/** Pares etiqueta / valor, como en las cards laterales de Ezmel. */
export function Lista({ filas }: { filas: [string, string][] }) {
  return (
    <dl className="divide-y divide-brand-border">
      {filas.map(([label, valor]) => (
        <div key={label} className="flex justify-between gap-3 py-1.5 text-sm">
          <dt className="shrink-0 text-slate-500">{label}</dt>
          <dd className="break-words text-right font-medium text-slate-900">{valor || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Iniciales({ nombre, className }: { nombre: string; className: string }) {
  const letras = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-brand-mid font-bold text-white ${className}`}>
      {letras}
    </span>
  );
}

export function Campo({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function Tarjeta({ titulo, valor, nota, destacada = false }: { titulo: string; valor: string; nota?: string; destacada?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${destacada ? "border-brand bg-brand text-white" : "border-brand-border bg-white"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${destacada ? "text-white/70" : "text-slate-500"}`}>{titulo}</p>
      <p className={`mt-1 break-words text-lg font-bold tabular-nums sm:text-xl ${destacada ? "text-white" : "text-slate-900"}`}>{valor}</p>
      {nota && <p className={`mt-0.5 text-xs ${destacada ? "text-white/70" : "text-slate-500"}`}>{nota}</p>}
    </div>
  );
}

/** Badges para elegir el período (semana, mes, trimestre, semestre, año). */
export function FiltroPeriodo({
  periodo,
  onChange,
  conTodo = true,
}: {
  periodo: Periodo;
  onChange: (p: Periodo) => void;
  conTodo?: boolean;
}) {
  return (
    <div role="group" aria-label="Filtrar por período" className="flex flex-wrap gap-1.5">
      {PERIODOS.filter((p) => conTodo || p.id !== "todo").map(({ id, label }) => {
        const activo = id === periodo;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={activo}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
              activo ? "bg-brand text-white ring-brand" : "bg-white text-slate-600 ring-brand-border hover:bg-brand-soft hover:text-brand"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Usuario corto para la columna "Cargó": lo que va antes de la @. */
export function Autor({ email }: { email: string }) {
  if (!email) return <span className="text-slate-400">—</span>;
  return <span title={email}>{email.split("@")[0]}</span>;
}

/** Botones para elegir el medio de pago. */
export function SelectorMedio<Id extends string>({
  opciones,
  valor,
  onChange,
  nombre = "medioPago",
}: {
  opciones: readonly { id: Id; label: string }[];
  valor: Id;
  onChange: (id: Id) => void;
  nombre?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">Medio de pago</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map(({ id, label }) => {
          const activo = id === valor;
          return (
            <label
              key={id}
              className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
                activo ? "bg-brand text-white ring-brand" : "bg-white text-slate-700 ring-brand-border hover:bg-brand-soft"
              }`}
            >
              <input type="radio" name={nombre} value={id} checked={activo} onChange={() => onChange(id)} className="sr-only" />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Mensaje de lista vacía, con un ícono arriba. */
export function Vacio({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-brand-border bg-white p-10 text-center text-sm text-slate-500">
      {icono}
      {children}
    </div>
  );
}
