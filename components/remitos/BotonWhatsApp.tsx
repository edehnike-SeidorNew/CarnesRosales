"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, WhatsAppIcon } from "@/components/layout/icons";
import { BOTON, BOTON_SECUNDARIO, CAMPO } from "@/lib/formato";
import { mensajeWhatsApp, numeroWhatsApp, telefonoDeContacto, type Remito } from "@/lib/remito";
import type { Cliente } from "@/lib/tipos";

/**
 * Manda el remito por WhatsApp: se escribe (o confirma) el teléfono del cliente y se abre WhatsApp con el mensaje armado.
 * Por un link no se puede adjuntar el PDF, así que el mensaje lleva el detalle del remito y el PDF se baja desde acá para adjuntarlo.
 */
export function BotonWhatsApp({ remito, cliente, variante }: { remito: Remito; cliente: Cliente; variante: "icono" | "boton" }) {
  const [abierto, setAbierto] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [escrito, setEscrito] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return;
    const alTocarTecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", alTocarTecla);
    return () => window.removeEventListener("keydown", alTocarTecla);
  }, [abierto]);

  function abrir() {
    setTelefono(telefonoDeContacto(cliente.contacto));
    setError("");
    setEscrito(null);
    setAbierto(true);
  }

  const numero = numeroWhatsApp(telefono);
  const mensaje = escrito ?? mensajeWhatsApp(remito, cliente);

  function enviar() {
    if (!numero) return setError("Escribí el teléfono con el código de área, por ejemplo 11 5555-1234.");
    if (!mensaje.trim()) return setError("El mensaje está vacío.");
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
    setAbierto(false);
  }

  return (
    <>
      {variante === "icono" ? (
        <button
          type="button"
          onClick={abrir}
          className="inline-flex rounded-md p-1.5 text-slate-500 hover:bg-brand-soft hover:text-brand"
          title="Enviar por WhatsApp"
          aria-label="Enviar remito por WhatsApp"
        >
          <WhatsAppIcon className="h-4 w-4" />
        </button>
      ) : (
        <button type="button" onClick={abrir} className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}>
          <WhatsAppIcon className="h-4 w-4" />
          WhatsApp
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && setAbierto(false)}>
          <div role="dialog" aria-modal="true" aria-label="Enviar remito por WhatsApp" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-brand">Enviar por WhatsApp</h2>
            <p className="mt-1 text-sm text-slate-500">
              Remito {remito.comprobante ? `N° ${remito.comprobante}` : "sin número"} · {cliente.nombreFantasia}
            </p>

            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="telefono-whatsapp">
              Teléfono del cliente
            </label>
            <input
              id="telefono-whatsapp"
              className={`${CAMPO} mt-1`}
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              inputMode="tel"
              placeholder="Ej.: 11 5555-1234"
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-500">
              {numero ? `Se envía al +${numero}.` : "Con código de área, sin 0 ni 15."}
            </p>
            {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

            <div className="mt-4 flex items-center justify-between gap-3">
              <label htmlFor="mensaje-remito" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mensaje (podés editarlo)
              </label>
              {escrito !== null && (
                <button type="button" onClick={() => setEscrito(null)} className="text-xs font-semibold text-brand underline">
                  Volver al original
                </button>
              )}
            </div>
            <textarea
              id="mensaje-remito"
              className={`${CAMPO} mt-1 h-36 resize-y text-xs leading-relaxed`}
              value={mensaje}
              onChange={(e) => setEscrito(e.target.value)}
              maxLength={1000}
            />
            <p className="mt-2 text-xs text-slate-500">
              WhatsApp no deja adjuntar el PDF desde un link: se abre el chat con este mensaje. Si querés mandar también el PDF,{" "}
              <a href={`/api/remitos/${remito.id}`} className="inline-flex items-center gap-1 font-semibold text-brand underline">
                <DownloadIcon className="h-3 w-3" />
                descargalo
              </a>{" "}
              y adjuntalo en el chat.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setAbierto(false)} className={BOTON_SECUNDARIO}>
                Cancelar
              </button>
              <button type="button" onClick={enviar} className={BOTON}>
                <WhatsAppIcon className="h-4 w-4" />
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
