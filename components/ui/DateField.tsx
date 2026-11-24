"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/layout/icons";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const pad = (n: number) => String(n).padStart(2, "0");

function parseIso(value?: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
}

/** "2026-10-05" -> "05/10/2026" (vacío si no hay fecha). */
function formatDMY(value?: string) {
  const p = parseIso(value);
  return p ? `${pad(p.d)}/${pad(p.m + 1)}/${p.y}` : "";
}

/**
 * Campo de fecha con calendario propio, con los colores de la app (el del navegador no se puede
 * personalizar). Guarda el valor como "AAAA-MM-DD", igual que el input nativo.
 */
export function DateField({
  value,
  onChange,
  ariaLabel = "Fecha",
  className = "",
  abrirAlMontar = false,
}: {
  value: string;
  onChange: (valor: string) => void;
  ariaLabel?: string;
  className?: string;
  /** Abre el calendario apenas aparece el campo. */
  abrirAlMontar?: boolean;
}) {
  const selected = parseIso(value);
  const now = new Date();
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };

  const [open, setOpen] = useState(abrirAlMontar);
  const [view, setView] = useState({ y: (selected ?? today).y, m: (selected ?? today).m });
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // El calendario se dibuja fuera de la tarjeta (portal) para que no lo recorte su overflow.
  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const h = popRef.current?.offsetHeight ?? 340;
    const cabeAbajo = window.innerHeight - r.bottom >= h + 16;
    const top = cabeAbajo || r.top < h + 16 ? r.bottom + 8 : r.top - h - 8;
    const left = Math.max(12, Math.min(r.left, window.innerWidth - 288 - 12));
    setPos({ top, left });
  }, []);

  // Si arranca abierto, se acomoda debajo del campo apenas se dibuja.
  useEffect(() => {
    if (abrirAlMontar) place();
  }, [abrirAlMontar, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  function toggle() {
    if (!open) {
      const base = selected ?? today;
      setView({ y: base.y, m: base.m });
      place();
    }
    setOpen((o) => !o);
  }

  function pick(y: number, m: number, d: number) {
    onChange(`${y}-${pad(m + 1)}-${pad(d)}`);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const total = v.y * 12 + v.m + delta;
      return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
    });
  }

  const lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={`${ariaLabel}: ${formatDMY(value) || "sin elegir"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:border-brand/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 ${
          open ? "border-brand ring-2 ring-brand-accent/50" : "border-brand-border"
        } ${className}`}
      >
        <span className={`tabular-nums ${value ? "" : "text-slate-500"}`}>{formatDMY(value) || "dd/mm/aaaa"}</span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-brand" />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label="Elegir fecha"
            style={{ position: "fixed", top: pos.top, left: pos.left }}
            className="z-[90] w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-brand-border bg-white p-4 shadow-xl shadow-brand/15"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-bold text-brand">
                {MESES[view.m]} {view.y}
              </span>
              <div className="flex gap-1">
                <button type="button" aria-label="Mes anterior" onClick={() => shiftMonth(-1)} className="rounded-full p-1.5 text-slate-700 hover:bg-brand-soft hover:text-brand">
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Mes siguiente" onClick={() => shiftMonth(1)} className="rounded-full p-1.5 text-slate-700 hover:bg-brand-soft hover:text-brand">
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500">
              {DIAS.map((d) => (
                <span key={d} className="py-1">
                  {d}
                </span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-y-1 text-center">
              {cells.map((day, i) => {
                if (day === null) return <span key={`b${i}`} />;
                const isSelected = !!selected && selected.y === view.y && selected.m === view.m && selected.d === day;
                const isToday = today.y === view.y && today.m === view.m && today.d === day;
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => pick(view.y, view.m, day)}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors ${
                      isSelected ? "bg-brand font-bold text-white" : `text-slate-800 hover:bg-brand-soft hover:text-brand ${isToday ? "ring-2 ring-brand-accent" : ""}`
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-brand-border pt-3 text-sm">
              <button type="button" onClick={() => pick(today.y, today.m, today.d)} className="font-semibold text-brand hover:underline">
                Hoy
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
