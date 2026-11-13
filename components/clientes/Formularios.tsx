"use client";

import { useState, useTransition, type FormEvent } from "react";
import { registrarPago, registrarVenta } from "@/app/acciones";
import { PlusIcon, TrashIcon } from "@/components/layout/icons";
import { BOTON, BOTON_SECUNDARIO, CAMPO, hoyISO, pesos } from "@/lib/formato";
import { MEDIOS_PAGO, type MedioPago } from "@/lib/tipos";
import { Campo } from "./comunes";

type Renglon = { detalle: string; kilos: string; precio: string };
const RENGLON_VACIO: Renglon = { detalle: "", kilos: "", precio: "" };

const numero = (texto: string) => Number(texto.replace(",", "."));
const subtotal = (r: Renglon) => Math.round((numero(r.kilos) || 0) * (numero(r.precio) || 0) * 100) / 100;

type Props = { clienteId: string; onListo: () => void };

/** Venta (remito) con uno o más productos: suma al saldo del cliente. */
export function FormVenta({ clienteId, productos, onListo }: Props & { productos: string[] }) {
  const [fecha, setFecha] = useState(hoyISO);
  const [comprobante, setComprobante] = useState("");
  const [renglones, setRenglones] = useState<Renglon[]>([RENGLON_VACIO]);
  const [error, setError] = useState("");
  const [guardando, iniciar] = useTransition();

  const total = renglones.reduce((suma, r) => suma + subtotal(r), 0);

  function cambiar(indice: number, campo: keyof Renglon, valor: string) {
    setRenglones((rs) => rs.map((r, i) => (i === indice ? { ...r, [campo]: valor } : r)));
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    const items = renglones
      .filter((r) => r.detalle.trim() || r.kilos || r.precio)
      .map((r) => ({ detalle: r.detalle.trim(), kilos: numero(r.kilos), precio: numero(r.precio) }));
    if (!fecha) return setError("Elegí la fecha.");
    if (items.length === 0) return setError("Cargá al menos un producto.");
    if (items.some((i) => !i.detalle || !(i.kilos > 0) || !(i.precio > 0)))
      return setError("Cada producto necesita detalle, kilos y precio.");
    setError("");
    iniciar(async () => {
      const r = await registrarVenta({ clienteId, fecha, comprobante, items });
      if (r.ok) onListo();
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Fecha">
          <input type="date" className={CAMPO} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo label="N° de remito / factura">
          <input className={CAMPO} value={comprobante} onChange={(e) => setComprobante(e.target.value)} inputMode="numeric" />
        </Campo>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-brand">Productos</h2>
      <datalist id="productos">
        {productos.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <div className="space-y-3">
        {renglones.map((r, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_7rem_9rem_9rem_2.5rem]">
            <Campo label="Producto" className="col-span-2 sm:col-span-1">
              <input
                className={CAMPO}
                list="productos"
                value={r.detalle}
                onChange={(e) => cambiar(i, "detalle", e.target.value)}
                placeholder="Elegí uno o escribí uno nuevo"
              />
            </Campo>
            <Campo label="Kilos">
              <input
                type="number"
                min="0"
                step="0.001"
                className={CAMPO}
                value={r.kilos}
                onChange={(e) => cambiar(i, "kilos", e.target.value)}
              />
            </Campo>
            <Campo label="Precio por kilo">
              <input
                type="number"
                min="0"
                step="0.01"
                className={CAMPO}
                value={r.precio}
                onChange={(e) => cambiar(i, "precio", e.target.value)}
              />
            </Campo>
            <div className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Subtotal</span>
              <p className="rounded-md bg-brand-soft px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                {pesos(subtotal(r))}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRenglones((rs) => rs.filter((_, j) => j !== i))}
              disabled={renglones.length === 1}
              aria-label="Quitar producto"
              className="flex h-[38px] items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRenglones((rs) => [...rs, RENGLON_VACIO])}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"
      >
        <PlusIcon className="h-4 w-4" />
        Agregar producto
      </button>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-soft px-4 py-3">
        <span className="text-sm font-semibold text-brand">Total compra</span>
        <span className="text-lg font-bold tabular-nums text-brand">{pesos(total)}</span>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={guardando} className={`${BOTON} disabled:opacity-60`}>
          {guardando ? "Guardando..." : "Guardar venta"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Pago (recibo): resta del saldo del cliente. Registra con qué medio pagó. */
export function FormPago({ clienteId, saldo, onListo }: Props & { saldo: number }) {
  const [fecha, setFecha] = useState(hoyISO);
  const [comprobante, setComprobante] = useState("");
  const [importe, setImporte] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [error, setError] = useState("");
  const [guardando, iniciar] = useTransition();

  const monto = numero(importe) || 0;

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!fecha) return setError("Elegí la fecha.");
    if (!(monto > 0)) return setError("Ingresá el importe del pago.");
    setError("");
    iniciar(async () => {
      const r = await registrarPago({ clienteId, fecha, comprobante, importe: monto, medioPago });
      if (r.ok) onListo();
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Fecha">
          <input type="date" className={CAMPO} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo label="N° de recibo">
          <input className={CAMPO} value={comprobante} onChange={(e) => setComprobante(e.target.value)} inputMode="numeric" />
        </Campo>
        <Campo label="Importe">
          <input
            type="number"
            min="0"
            step="0.01"
            className={CAMPO}
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            autoFocus
          />
        </Campo>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-slate-700">Medio de pago</legend>
        <div className="flex flex-wrap gap-2">
          {MEDIOS_PAGO.map(({ id, label }) => {
            const activo = id === medioPago;
            return (
              <label
                key={id}
                className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
                  activo ? "bg-brand text-white ring-brand" : "bg-white text-slate-700 ring-brand-border hover:bg-brand-soft"
                }`}
              >
                <input
                  type="radio"
                  name="medioPago"
                  value={id}
                  checked={activo}
                  onChange={() => setMedioPago(id)}
                  className="sr-only"
                />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Saldo actual</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{pesos(saldo)}</p>
        </div>
        <div className="rounded-xl bg-brand-soft px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">Saldo después del pago</p>
          <p className="text-lg font-bold tabular-nums text-brand">{pesos(saldo - monto)}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={guardando} className={`${BOTON} disabled:opacity-60`}>
          {guardando ? "Guardando..." : "Guardar pago"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
