"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "@/components/layout/icons";
import { BOTON } from "@/lib/formato";

export const SIN_LOCALIDAD = "(sin localidad)";

export const OPCIONES_SALDO = [
  { id: "todos", label: "Todos" },
  { id: "con_saldo", label: "Con saldo pendiente" },
  { id: "al_dia", label: "Al día (sin deuda)" },
] as const;

export const OPCIONES_ULTIMO_PAGO = [
  { id: "todos", label: "Todos" },
  { id: "7", label: "Pagó en los últimos 7 días" },
  { id: "30", label: "Pagó en los últimos 30 días" },
  { id: "mas_30", label: "No paga hace más de 30 días" },
  { id: "nunca", label: "Sin pagos registrados" },
] as const;

export const OPCIONES_ORDEN = [
  { id: "numero", label: "N° de cliente" },
  { id: "nombre", label: "Nombre" },
  { id: "saldo", label: "Mayor saldo adeudado" },
  { id: "ultimo_pago", label: "Último pago más reciente" },
] as const;

export type Filtros = {
  localidades: string[];
  saldo: (typeof OPCIONES_SALDO)[number]["id"];
  ultimoPago: (typeof OPCIONES_ULTIMO_PAGO)[number]["id"];
  orden: (typeof OPCIONES_ORDEN)[number]["id"];
};

export const FILTROS_VACIOS: Filtros = { localidades: [], saldo: "todos", ultimoPago: "todos", orden: "numero" };

/** Cuántos filtros están puestos (el orden no cuenta como filtro). */
export const filtrosActivos = (f: Filtros) =>
  (f.localidades.length > 0 ? 1 : 0) + (f.saldo !== "todos" ? 1 : 0) + (f.ultimoPago !== "todos" ? 1 : 0);

const TITULO = "border-b border-brand-border pb-2 text-xs font-semibold uppercase tracking-wider text-slate-600";
const FILA = "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-900 hover:bg-brand-soft";

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className={TITULO}>{titulo}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

function Radios<Id extends string>({
  nombre,
  opciones,
  valor,
  onChange,
}: {
  nombre: string;
  opciones: readonly { id: Id; label: string }[];
  valor: Id;
  onChange: (id: Id) => void;
}) {
  return opciones.map(({ id, label }) => (
    <label key={id} className={FILA}>
      <input type="radio" name={nombre} checked={valor === id} onChange={() => onChange(id)} className="accent-brand" />
      <span>{label}</span>
    </label>
  ));
}

/** Panel lateral de filtros de la lista de clientes (se abre con el embudo). */
export function FiltrosClientes({
  abierto,
  onCerrar,
  localidades,
  filtros,
  onChange,
  resultados,
}: {
  abierto: boolean;
  onCerrar: () => void;
  /** Localidades que existen entre los clientes, con cuántos clientes tiene cada una. */
  localidades: { nombre: string; cantidad: number }[];
  filtros: Filtros;
  onChange: (f: Filtros) => void;
  resultados: number;
}) {
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const alternarLocalidad = (nombre: string) =>
    onChange({
      ...filtros,
      localidades: filtros.localidades.includes(nombre)
        ? filtros.localidades.filter((l) => l !== nombre)
        : [...filtros.localidades, nombre],
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Cerrar filtros" onClick={onCerrar} className="absolute inset-0 bg-brand-deep/40" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de clientes"
        className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="text-lg font-bold text-brand">Filtros</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-soft hover:text-brand">
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <Seccion titulo="Localidad">
            {localidades.map(({ nombre, cantidad }) => (
              <label key={nombre} className={FILA}>
                <input
                  type="checkbox"
                  checked={filtros.localidades.includes(nombre)}
                  onChange={() => alternarLocalidad(nombre)}
                  className="accent-brand"
                />
                <span className={`flex-1 truncate ${nombre === SIN_LOCALIDAD ? "text-slate-500" : ""}`}>
                  {nombre === SIN_LOCALIDAD ? "Sin localidad cargada" : nombre}
                </span>
                <span className="text-xs tabular-nums text-slate-500">{cantidad}</span>
              </label>
            ))}
          </Seccion>

          <Seccion titulo="Saldo adeudado">
            <Radios nombre="saldo" opciones={OPCIONES_SALDO} valor={filtros.saldo} onChange={(saldo) => onChange({ ...filtros, saldo })} />
          </Seccion>

          <Seccion titulo="Último pago">
            <Radios
              nombre="ultimoPago"
              opciones={OPCIONES_ULTIMO_PAGO}
              valor={filtros.ultimoPago}
              onChange={(ultimoPago) => onChange({ ...filtros, ultimoPago })}
            />
          </Seccion>

          <Seccion titulo="Ordenar por">
            <Radios nombre="orden" opciones={OPCIONES_ORDEN} valor={filtros.orden} onChange={(orden) => onChange({ ...filtros, orden })} />
          </Seccion>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={() => onChange(FILTROS_VACIOS)}
            disabled={filtrosActivos(filtros) === 0 && filtros.orden === "numero"}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            Limpiar filtros
          </button>
          <button type="button" onClick={onCerrar} className={BOTON}>
            Mostrar resultados ({resultados})
          </button>
        </footer>
      </aside>
    </div>
  );
}
