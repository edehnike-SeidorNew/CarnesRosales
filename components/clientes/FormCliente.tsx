"use client";

import { useState, type FormEvent } from "react";
import { actualizarCliente, crearCliente } from "@/app/acciones";
import { useAccion } from "@/components/comun/useAccion";
import { BOTON, BOTON_SECUNDARIO, CAMPO } from "@/lib/formato";
import type { Cliente, NuevoCliente } from "@/lib/tipos";
import { Campo } from "./comunes";

const VACIO: NuevoCliente = { nombreFantasia: "", titular: "", direccion: "", localidad: "", cuit: "", contacto: "", observaciones: "" };

/** Alta de cliente, o corrección de sus datos si se pasa `cliente`. */
export function FormCliente({
  cliente,
  onListo,
  onCancelar,
}: {
  cliente?: Cliente;
  onListo: (id: string) => void;
  onCancelar: () => void;
}) {
  const [datos, setDatos] = useState<NuevoCliente>(cliente ?? VACIO);
  const [saldoAnterior, setSaldoAnterior] = useState("");
  const { pendiente, error, setError, correr } = useAccion();

  const cambiar = (campo: keyof NuevoCliente) => (e: { target: { value: string } }) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!datos.nombreFantasia.trim()) return setError("Ingresá el nombre de fantasía.");
    if (cliente) correr(() => actualizarCliente(cliente.id, datos), () => onListo(cliente.id));
    else correr(() => crearCliente(datos, Number(saldoAnterior.replace(",", ".")) || 0), (dato) => onListo(dato.id));
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre de fantasía *">
          <input className={CAMPO} value={datos.nombreFantasia} onChange={cambiar("nombreFantasia")} autoFocus />
        </Campo>
        <Campo label="Titular">
          <input className={CAMPO} value={datos.titular} onChange={cambiar("titular")} />
        </Campo>
        <Campo label="Dirección">
          <input className={CAMPO} value={datos.direccion} onChange={cambiar("direccion")} />
        </Campo>
        <Campo label="Localidad">
          <input className={CAMPO} value={datos.localidad} onChange={cambiar("localidad")} />
        </Campo>
        <Campo label="C.U.I.T.">
          <input className={CAMPO} value={datos.cuit} onChange={cambiar("cuit")} placeholder="00-00000000-0" />
        </Campo>
        <Campo label="Contacto">
          <input className={CAMPO} value={datos.contacto} onChange={cambiar("contacto")} placeholder="Teléfono o email" />
        </Campo>
        {!cliente && (
          <Campo label="Saldo anterior (si ya debía algo)">
            <input type="number" min="0" step="0.01" className={CAMPO} value={saldoAnterior} onChange={(e) => setSaldoAnterior(e.target.value)} />
          </Campo>
        )}
        <Campo label="Observaciones" className="sm:col-span-2">
          <textarea className={CAMPO} rows={3} value={datos.observaciones} onChange={cambiar("observaciones")} />
        </Campo>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : cliente ? "Guardar cambios" : "Guardar cliente"}
        </button>
        <button type="button" onClick={onCancelar} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
