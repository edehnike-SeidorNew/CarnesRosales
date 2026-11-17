"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRightIcon } from "@/components/layout/icons";
import { pesos } from "@/lib/formato";

export type ProductoOpcion = { nombre: string; categoria: string; precio: number | null };

const ORDEN_RUBROS = ["Vacuno", "Cerdo", "Pollo", "Embutidos y chacinados", "Cordero"];
const OTROS = "Otros";
const ALTO_PANEL = 420;
const SEPARACION = 6;

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Posicion = { left: number; width: number; top?: number; bottom?: number; alto: number };

/**
 * Selector de producto con buscador: se abre un panel con un campo para buscar (por nombre o por rubro), filtros por rubro
 * y la lista agrupada. Si lo que se busca no está, se puede usar igual como producto nuevo. Funciona con teclado.
 */
export function SelectorProducto({
  value,
  onChange,
  productos,
  placeholder = "Elegí un producto",
  ariaLabel = "Producto",
}: {
  value: string;
  onChange: (nombre: string) => void;
  productos: ProductoOpcion[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  const idLista = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const buscador = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [rubro, setRubro] = useState<string>("todos");
  const [activo, setActivo] = useState(0);
  const [pos, setPos] = useState<Posicion | null>(null);

  const rubros = useMemo(() => {
    const presentes = new Set(productos.map((p) => p.categoria || OTROS));
    return [...ORDEN_RUBROS.filter((r) => presentes.has(r)), ...[...presentes].filter((r) => !ORDEN_RUBROS.includes(r) && r !== OTROS).sort(), ...(presentes.has(OTROS) ? [OTROS] : [])];
  }, [productos]);

  // Búsqueda: todas las palabras tienen que aparecer en el nombre o en el rubro (sin importar mayúsculas ni tildes).
  const grupos = useMemo(() => {
    const palabras = sinTildes(q).split(/\s+/).filter(Boolean);
    const filtrados = productos.filter((p) => {
      const r = p.categoria || OTROS;
      if (rubro !== "todos" && r !== rubro) return false;
      const texto = sinTildes(`${p.nombre} ${r}`);
      return palabras.every((w) => texto.includes(w));
    });
    return rubros
      .map((r) => ({ rubro: r, lista: filtrados.filter((p) => (p.categoria || OTROS) === r).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")) }))
      .filter((g) => g.lista.length > 0);
  }, [productos, q, rubro, rubros]);

  const busquedaLimpia = q.trim();
  const hayExacto = productos.some((p) => sinTildes(p.nombre) === sinTildes(busquedaLimpia));
  const ofrecerNuevo = busquedaLimpia.length > 0 && !hayExacto;
  // Lista plana para el teclado: primero los productos que coinciden y, al final, "usar como nuevo" (si corresponde).
  // Así un Enter apenas escrita la búsqueda elige la primera coincidencia y no crea un producto sin querer.
  const opciones: { nombre: string; nuevo?: boolean }[] = [...grupos.flatMap((g) => g.lista.map((p) => ({ nombre: p.nombre }))), ...(ofrecerNuevo ? [{ nombre: busquedaLimpia, nuevo: true }] : [])];
  const indiceNuevo = ofrecerNuevo ? opciones.length - 1 : -1;

  const ubicar = useCallback(() => {
    const r = boton.current?.getBoundingClientRect();
    if (!r) return;
    const abajo = window.innerHeight - r.bottom - SEPARACION - 12;
    const arriba = r.top - SEPARACION - 12;
    const hacerArriba = abajo < 300 && arriba > abajo;
    const ancho = Math.max(r.width, 340);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - ancho - 8);
    setPos(
      hacerArriba
        ? { left, width: ancho, bottom: window.innerHeight - r.top + SEPARACION, alto: Math.min(ALTO_PANEL, arriba) }
        : { left, width: ancho, top: r.bottom + SEPARACION, alto: Math.min(ALTO_PANEL, abajo) },
    );
  }, []);

  function abrir() {
    setQ("");
    setRubro("todos");
    setActivo(0);
    setAbierto(true);
  }

  function cerrar(devolverFoco = true) {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }

  function elegir(nombre: string) {
    onChange(nombre);
    cerrar();
  }

  useLayoutEffect(() => {
    if (abierto) ubicar();
  }, [abierto, ubicar]);

  // El panel se dibuja recién cuando ya se calculó su lugar: ahí el cursor pasa al buscador.
  const panelListo = abierto && pos !== null;
  useEffect(() => {
    if (panelListo) buscador.current?.focus();
  }, [panelListo]);

  useEffect(() => {
    if (!abierto) return;
    const alScroll = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return;
      ubicar();
    };
    const fuera = (e: MouseEvent | TouchEvent) => {
      const n = e.target as Node;
      if (boton.current?.contains(n) || panel.current?.contains(n)) return;
      setAbierto(false);
    };
    window.addEventListener("resize", ubicar);
    window.addEventListener("scroll", alScroll, true);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("touchstart", fuera);
    return () => {
      window.removeEventListener("resize", ubicar);
      window.removeEventListener("scroll", alScroll, true);
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("touchstart", fuera);
    };
  }, [abierto, ubicar]);

  // Que la opción resaltada con el teclado siempre se vea.
  useEffect(() => {
    if (abierto) lista.current?.querySelector(`[data-indice="${activo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [abierto, activo]);

  function alTeclear(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, opciones.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = opciones[activo] ?? opciones[0];
      if (o) elegir(o.nombre);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
    } else if (e.key === "Tab") {
      setAbierto(false);
    }
  }

  let indice = -1;

  return (
    <>
      <button
        ref={boton}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? idLista : undefined}
        onClick={() => (abierto ? cerrar(false) : abrir())}
        className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm transition-colors hover:border-brand/60 focus:border-brand focus:outline-none ${
          abierto ? "border-brand ring-2 ring-brand-accent/50" : "border-brand-border"
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${value ? "text-slate-900" : "text-slate-500"}`}>{value || placeholder}</span>
        <ChevronRightIcon className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${abierto ? "-rotate-90" : "rotate-90"}`} />
      </button>

      {abierto &&
        pos &&
        createPortal(
          <div
            ref={panel}
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.alto }}
            className="fixed z-[90] flex flex-col overflow-hidden rounded-xl border border-brand-border bg-white shadow-xl shadow-brand/15"
          >
            <div className="border-b border-brand-border p-2">
              <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-white px-2.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-accent/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-slate-500" aria-hidden>
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4 4" />
                </svg>
                <input
                  ref={buscador}
                  type="text"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setActivo(0);
                  }}
                  onKeyDown={alTeclear}
                  placeholder="Buscar producto o rubro"
                  aria-label="Buscar producto"
                  autoComplete="off"
                  className="w-full bg-transparent py-2 text-sm text-slate-900 outline-none"
                />
                {q && (
                  <button type="button" onClick={() => { setQ(""); setActivo(0); buscador.current?.focus(); }} className="text-xs font-semibold text-slate-500 hover:text-brand">
                    Borrar
                  </button>
                )}
              </div>
              {rubros.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["todos", ...rubros].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRubro(r);
                        setActivo(0);
                        buscador.current?.focus();
                      }}
                      aria-pressed={rubro === r}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        rubro === r ? "border-brand bg-brand text-white" : "border-brand-border bg-white text-slate-700 hover:border-brand/60"
                      }`}
                    >
                      {r === "todos" ? "Todos" : r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={lista} id={idLista} role="listbox" aria-label={ariaLabel} className="overflow-y-auto p-1.5">
              {grupos.length === 0 && !ofrecerNuevo && <p className="px-3 py-6 text-center text-sm text-slate-500">No hay productos en este rubro.</p>}
              {grupos.map((g) => (
                <div key={g.rubro}>
                  <p className="sticky top-0 z-10 bg-white/95 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{g.rubro}</p>
                  {g.lista.map((p) => {
                    indice += 1;
                    const i = indice;
                    return (
                      <div
                        key={p.nombre}
                        role="option"
                        aria-selected={i === activo}
                        data-indice={i}
                        onMouseEnter={() => setActivo(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => elegir(p.nombre)}
                        className={`flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm ${
                          i === activo ? "bg-brand-soft text-brand" : "text-slate-800"
                        } ${p.nombre === value ? "font-semibold" : ""}`}
                      >
                        <span className="truncate">{p.nombre}</span>
                        {p.precio !== null && <span className="shrink-0 text-xs tabular-nums text-slate-500">{pesos(p.precio)}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
              {ofrecerNuevo && (
                <button
                  type="button"
                  role="option"
                  aria-selected={activo === indiceNuevo}
                  data-indice={indiceNuevo}
                  onMouseEnter={() => setActivo(indiceNuevo)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(busquedaLimpia)}
                  className={`mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-brand-border px-3 py-2 text-left text-sm ${
                    activo === indiceNuevo ? "bg-brand-soft text-brand" : "text-slate-700"
                  }`}
                >
                  <span className="font-semibold">Usar “{busquedaLimpia}”</span>
                  <span className="text-xs text-slate-500">como producto nuevo</span>
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
