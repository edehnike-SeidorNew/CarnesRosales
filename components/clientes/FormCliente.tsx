"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { actualizarCliente, crearCliente, eliminarCliente } from "@/app/acciones";
import { useAccion } from "@/components/comun/useAccion";
import { CampoNumero } from "@/components/ui/CampoNumero";
import { aCampo, aNumero, BOTON, BOTON_SECUNDARIO, CAMPO } from "@/lib/formato";
import type { Cliente, NuevoCliente } from "@/lib/tipos";
import { Campo } from "./comunes";

const VACIO: NuevoCliente = { nombreFantasia: "", titular: "", direccion: "", localidad: "", cuit: "", contacto: "", observaciones: "" };

/** Alta de cliente, o corrección de sus datos si se pasa `cliente`. */
export function FormCliente({
  cliente,
  saldoAnterior: saldoActual = 0,
  tieneMovimientos = false,
  puedeBorrar = false,
  onListo,
  onCancelar,
}: {
  cliente?: Cliente;
  /** Al editar: el saldo anterior que tiene cargado hoy. */
  saldoAnterior?: number;
  /** Al editar: si tiene ventas o pagos (en ese caso no se puede eliminar). */
  tieneMovimientos?: boolean;
  puedeBorrar?: boolean;
  onListo: (id: string) => void;
  onCancelar: () => void;
}) {
  const router = useRouter();
  const [datos, setDatos] = useState<NuevoCliente>(cliente ?? VACIO);
  const [saldoAnterior, setSaldoAnterior] = useState(saldoActual ? aCampo(saldoActual) : "");
  const { pendiente, error, setError, correr } = useAccion();

  const cambiar = (campo: keyof NuevoCliente) => (e: { target: { value: string } }) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!datos.nombreFantasia.trim()) return setError("Ingresá el nombre de fantasía.");
    const saldo = aNumero(saldoAnterior) || 0;
    if (saldo < 0) return setError("El saldo anterior no puede ser negativo.");
    if (cliente) correr(() => actualizarCliente(cliente.id, datos, saldo), () => onListo(cliente.id));
    else correr(() => crearCliente(datos, saldo), (dato) => onListo(dato.id));
  }

  function eliminar() {
    if (!cliente) return;
    if (!window.confirm(`¿Eliminar a ${cliente.nombreFantasia}? No se puede deshacer.`)) return;
    correr(() => eliminarCliente(cliente.id), () => router.push("/clientes"));
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
        <Campo label={cliente ? "Saldo anterior (lo que debía antes de empezar a registrar)" : "Saldo anterior (si ya debía algo)"}>
          <CampoNumero value={saldoAnterior} onChange={setSaldoAnterior} />
        </Campo>
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
        {cliente && puedeBorrar && (
          <button
            type="button"
            onClick={eliminar}
            disabled={pendiente || tieneMovimientos}
            title={tieneMovimientos ? "Tiene ventas o pagos cargados: primero hay que eliminarlos" : undefined}
            className="ml-auto inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
          >
            Eliminar cliente
          </button>
        )}
      </div>
      {cliente && puedeBorrar && tieneMovimientos && (
        <p className="mt-2 text-right text-xs text-slate-500">Para eliminar un cliente, primero hay que eliminar sus ventas y pagos.</p>
      )}
    </form>
  );
}
