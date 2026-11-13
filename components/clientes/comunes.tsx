import type { ReactNode } from "react";

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
