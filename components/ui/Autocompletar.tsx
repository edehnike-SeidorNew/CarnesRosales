"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ALTO_MAX = 240;

/**
 * Campo de texto con sugerencias, con el estilo de la app (reemplaza al datalist del navegador).
 * Se puede elegir una sugerencia o escribir un valor nuevo. Flechas, Enter y Esc funcionan.
 */
export function Autocompletar({
  value,
  onChange,
  sugerencias,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (valor: string) => void;
  sugerencias: string[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  const idLista = useId();
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [pos, setPos] = useState<{ left: number; width: number; top: number } | null>(null);

  const q = value.trim().toLowerCase();
  const visibles = sugerencias.filter((s) => !q || s.toLowerCase().includes(q));
  // Si lo escrito ya es exactamente una sugerencia, no hace falta mostrar la lista.
  const mostrar = abierto && visibles.length > 0 && !(visibles.length === 1 && visibles[0].toLowerCase() === q);

  const ubicar = useCallback(() => {
    const r = campo.current?.getBoundingClientRect();
    if (r) setPos({ left: r.left, width: r.width, top: r.bottom + 6 });
  }, []);

  useLayoutEffect(() => {
    if (mostrar) ubicar();
  }, [mostrar, ubicar]);

  useEffect(() => {
    if (!mostrar) return;
    const fuera = (e: MouseEvent | TouchEvent) => {
      const n = e.target as Node;
      if (campo.current?.contains(n) || lista.current?.contains(n)) return;
      setAbierto(false);
    };
    window.addEventListener("resize", ubicar);
    window.addEventListener("scroll", ubicar, true);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("touchstart", fuera);
    return () => {
      window.removeEventListener("resize", ubicar);
      window.removeEventListener("scroll", ubicar, true);
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("touchstart", fuera);
    };
  }, [mostrar, ubicar]);

  useEffect(() => {
    if (mostrar && activo >= 0) lista.current?.children[activo]?.scrollIntoView({ block: "nearest" });
  }, [mostrar, activo]);

  function elegir(texto: string) {
    onChange(texto);
    setAbierto(false);
    setActivo(-1);
  }

  function alTeclear(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => Math.min(i + 1, visibles.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && mostrar && activo >= 0) {
      // Enter con una sugerencia resaltada la elige en vez de enviar el formulario.
      e.preventDefault();
      elegir(visibles[activo]);
    } else if (e.key === "Escape" && mostrar) {
      e.preventDefault();
      setAbierto(false);
    } else if (e.key === "Tab") {
      setAbierto(false);
    }
  }

  return (
    <>
      <input
        ref={campo}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={mostrar}
        aria-controls={mostrar ? idLista : undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setAbierto(true);
          setActivo(-1);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alTeclear}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 transition-colors hover:border-brand/60 focus:border-brand focus:outline-none ${
          mostrar ? "border-brand ring-2 ring-brand-accent/50" : "border-brand-border"
        }`}
      />

      {mostrar &&
        pos &&
        createPortal(
          <ul
            ref={lista}
            id={idLista}
            role="listbox"
            aria-label={ariaLabel}
            style={{ left: pos.left, width: pos.width, top: pos.top, maxHeight: ALTO_MAX }}
            className="fixed z-[90] overflow-y-auto rounded-xl border border-brand-border bg-white p-1.5 shadow-xl shadow-brand/15"
          >
            {visibles.map((s, i) => (
              <li
                key={s}
                role="option"
                aria-selected={i === activo}
                onMouseEnter={() => setActivo(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(s)}
                className={`flex min-h-9 cursor-pointer items-center rounded-lg px-3 py-1.5 text-sm ${
                  i === activo ? "bg-brand-soft text-brand" : "text-slate-800"
                }`}
              >
                <span className="truncate">{s}</span>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
