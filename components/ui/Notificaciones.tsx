"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckIcon, CloseIcon, WarningIcon } from "@/components/layout/icons";
import { BOTON_SECUNDARIO } from "@/lib/formato";

export type OpcionesConfirmar = {
  titulo: string;
  mensaje?: string;
  /** Texto del botón que confirma (por defecto "Aceptar"). */
  confirmar?: string;
  cancelar?: string;
  /** Pinta el botón en rojo: para eliminar o cosas que no se pueden deshacer. */
  peligro?: boolean;
};

type TipoAviso = "ok" | "error";
type Aviso = { id: number; texto: string; tipo: TipoAviso };

type Contexto = {
  /** Muestra el modal centrado y devuelve true si la persona confirmó. */
  confirmar: (opciones: OpcionesConfirmar) => Promise<boolean>;
  /** Muestra un aviso arriba de todo ("Pago registrado", "Remito eliminado"...). */
  avisar: (texto: string, tipo?: TipoAviso) => void;
};

// Sin proveedor (por ejemplo en pantallas sueltas) se cae al cuadro del navegador, para no romper nada.
const porDefecto: Contexto = {
  confirmar: async (o) => window.confirm(o.mensaje ? `${o.titulo}\n\n${o.mensaje}` : o.titulo),
  avisar: () => {},
};

const NotificacionesContexto = createContext<Contexto>(porDefecto);
export const useNotificaciones = () => useContext(NotificacionesContexto);

const DURACION_AVISO = 4200;

/** Modal de confirmación centrado y avisos con el estilo de Carnes Rosales. Se monta una vez, en el layout de la app. */
export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [dialogo, setDialogo] = useState<(OpcionesConfirmar & { resolver: (valor: boolean) => void }) | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguienteId = useRef(1);
  const botonCancelar = useRef<HTMLButtonElement>(null);

  const confirmar = useCallback(
    (opciones: OpcionesConfirmar) => new Promise<boolean>((resolver) => setDialogo({ ...opciones, resolver })),
    [],
  );

  const quitarAviso = useCallback((id: number) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const avisar = useCallback(
    (texto: string, tipo: TipoAviso = "ok") => {
      const id = siguienteId.current++;
      setAvisos((lista) => [...lista.slice(-3), { id, texto, tipo }]);
      window.setTimeout(() => quitarAviso(id), tipo === "error" ? DURACION_AVISO + 2500 : DURACION_AVISO);
    },
    [quitarAviso],
  );

  const cerrarDialogo = useCallback(
    (valor: boolean) => {
      dialogo?.resolver(valor);
      setDialogo(null);
    },
    [dialogo],
  );

  // Con el modal abierto: Esc cancela y el foco arranca en "Cancelar" (así Enter no borra por accidente).
  useEffect(() => {
    if (!dialogo) return;
    botonCancelar.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarDialogo(false);
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [dialogo, cerrarDialogo]);

  const valor = useMemo(() => ({ confirmar, avisar }), [confirmar, avisar]);

  return (
    <NotificacionesContexto.Provider value={valor}>
      {children}

      {dialogo && (
        <div
          className="cr-anim fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm [animation:cr-fundido_0.15s_ease-out]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarDialogo(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialogo-titulo"
            aria-describedby={dialogo.mensaje ? "dialogo-mensaje" : undefined}
            className="cr-anim w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-black/10 [animation:cr-aparecer_0.18s_ease-out] sm:p-8"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- logo estático */}
            <img src="/logo.png" alt="" aria-hidden className="mx-auto h-20 w-20 object-contain" />
            <h2 id="dialogo-titulo" className="mt-3 text-xl font-bold text-brand">
              {dialogo.titulo}
            </h2>
            {dialogo.mensaje && (
              <p id="dialogo-mensaje" className="mt-2 text-sm leading-relaxed text-slate-600">
                {dialogo.mensaje}
              </p>
            )}
            <div className="mt-7 flex gap-3">
              <button ref={botonCancelar} type="button" onClick={() => cerrarDialogo(false)} className={`${BOTON_SECUNDARIO} flex-1 justify-center`}>
                {dialogo.cancelar ?? "Cancelar"}
              </button>
              <button
                type="button"
                onClick={() => cerrarDialogo(true)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md ${
                  dialogo.peligro ? "bg-[#b4424d] hover:bg-[#9d3640]" : "bg-brand hover:bg-brand-hover"
                }`}
              >
                {dialogo.confirmar ?? "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avisos: arriba de todo, centrados, por encima del resto (también del modal). */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-3">
        {avisos.map((a) => (
          <div
            key={a.id}
            role={a.tipo === "error" ? "alert" : "status"}
            className={`cr-anim pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border-l-4 bg-white py-3 pl-3 pr-2 shadow-xl ring-1 ring-black/10 [animation:cr-bajar_0.22s_ease-out] ${
              a.tipo === "error" ? "border-[#b4424d]" : "border-emerald-500"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                a.tipo === "error" ? "bg-[#b4424d]/10 text-[#b4424d]" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {a.tipo === "error" ? <WarningIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{a.texto}</p>
            <button
              type="button"
              onClick={() => quitarAviso(a.id)}
              aria-label="Cerrar aviso"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificacionesContexto.Provider>
  );
}
