"use client";

import { useState } from "react";
import { Campo } from "@/components/clientes/comunes";
import { WhatsAppIcon } from "@/components/layout/icons";
import { mensajeCobro, type Deuda } from "@/lib/cobranzas";
import { BOTON, CAMPO, fechaAR, pesos } from "@/lib/formato";
import { numeroWhatsApp, telefonoDeContacto } from "@/lib/remito";
import type { Cliente } from "@/lib/tipos";

/**
 * Recordatorio de pago por WhatsApp desde la cuenta del cliente. Si el contacto no está cargado se escribe el nombre
 * y el teléfono a mano; los días sin pagar vienen calculados pero se pueden cambiar. El mensaje lleva el monto
 * adeudado y la fecha de la compra.
 */
export function FormCobro({ cliente, deuda }: { cliente: Cliente; deuda: Deuda | null }) {
  const [nombre, setNombre] = useState(cliente.titular || cliente.nombreFantasia);
  const [telefono, setTelefono] = useState(telefonoDeContacto(cliente.contacto));
  const [dias, setDias] = useState(String(deuda?.dias ?? 7));
  // Texto escrito a mano: mientras sea null, el mensaje se arma solo con los datos de arriba.
  const [escrito, setEscrito] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!deuda) {
    return (
      <div className="rounded-lg border border-brand-border bg-white p-6 text-sm text-slate-600">
        {cliente.nombreFantasia} no tiene saldo pendiente: no hay nada para recordarle.
      </div>
    );
  }

  const cantidadDias = Math.max(0, Math.round(Number(dias) || 0));
  const numero = numeroWhatsApp(telefono);
  const sugerido = mensajeCobro({ nombre: nombre.trim(), dias: cantidadDias, monto: deuda.saldo, fecha: deuda.desde });
  const mensaje = escrito ?? sugerido;

  function enviar() {
    if (!numero) return setError("Escribí el teléfono con el código de área, por ejemplo 11 5555-1234.");
    if (!mensaje.trim()) return setError("El mensaje está vacío.");
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
  }

  return (
    <div className="rounded-lg border border-brand-border bg-white p-5">
      <p className="mb-4 text-sm text-slate-600">
        Saldo adeudado <strong className="text-[#b4424d]">{pesos(deuda.saldo)}</strong> · compra más vieja sin pagar del{" "}
        <strong className="text-slate-900">{fechaAR(deuda.desde)}</strong> (hace {deuda.dias} {deuda.dias === 1 ? "día" : "días"}).
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Nombre" className="sm:col-span-1">
          <input className={CAMPO} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
        </Campo>
        <Campo label="Teléfono (WhatsApp)">
          <input
            className={CAMPO}
            value={telefono}
            onChange={(e) => {
              setTelefono(e.target.value);
              setError("");
            }}
            inputMode="tel"
            placeholder="Ej.: 11 5555-1234"
          />
          <span className="mt-1 block text-xs text-slate-500">{numero ? `Se envía al +${numero}.` : "Con código de área, sin 0 ni 15."}</span>
        </Campo>
        <Campo label="Días sin pagar">
          <input className={CAMPO} value={dias} onChange={(e) => setDias(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" />
        </Campo>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <label htmlFor="mensaje-cobro" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Mensaje (podés editarlo)
        </label>
        {escrito !== null && (
          <button type="button" onClick={() => setEscrito(null)} className="text-xs font-semibold text-brand underline">
            Volver al mensaje original
          </button>
        )}
      </div>
      <textarea
        id="mensaje-cobro"
        className={`${CAMPO} mt-1 min-h-28 resize-y leading-relaxed`}
        value={mensaje}
        onChange={(e) => setEscrito(e.target.value)}
        maxLength={1000}
      />
      {escrito !== null && <p className="mt-1 text-xs text-slate-500">Con el mensaje editado, el nombre, los días y el monto de arriba ya no lo modifican.</p>}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4">
        <button type="button" onClick={enviar} className={BOTON}>
          <WhatsAppIcon className="h-4 w-4" />
          Abrir WhatsApp
        </button>
      </div>
    </div>
  );
}
