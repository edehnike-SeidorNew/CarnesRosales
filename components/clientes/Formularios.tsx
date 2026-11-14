"use client";

import { useState, type FormEvent } from "react";
import { actualizarPago, actualizarVenta, registrarPago, registrarVenta } from "@/app/acciones";
import { useAccion } from "@/components/comun/useAccion";
import { PlusIcon, TrashIcon } from "@/components/layout/icons";
import { Autocompletar } from "@/components/ui/Autocompletar";
import { DateField } from "@/components/ui/DateField";
import { BOTON, BOTON_SECUNDARIO, CAMPO, hoyISO, kilos as formatoKilos, pesos } from "@/lib/formato";
import { MEDIOS_PAGO, type MedioPago, type Movimiento, type StockDeProducto } from "@/lib/tipos";
import { Campo, SelectorMedio } from "./comunes";

type Renglon = { detalle: string; kilos: string; precio: string };
const RENGLON_VACIO: Renglon = { detalle: "", kilos: "", precio: "" };

const numero = (texto: string) => Number(texto.replace(",", "."));
const subtotal = (r: Renglon) => Math.round((numero(r.kilos) || 0) * (numero(r.precio) || 0) * 100) / 100;

type Props = { clienteId: string; onListo: () => void };

/** Venta (remito) con uno o más productos: suma al saldo del cliente y descuenta stock. Con `venta`, la corrige. */
export function FormVenta({
  clienteId,
  stock,
  venta,
  onListo,
}: Props & { stock: StockDeProducto[]; venta?: Extract<Movimiento, { tipo: "venta" }> }) {
  const [fecha, setFecha] = useState(venta?.fecha ?? hoyISO);
  const [comprobante, setComprobante] = useState(venta?.comprobante ?? "");
  const [renglones, setRenglones] = useState<Renglon[]>(
    venta ? venta.items.map((i) => ({ detalle: i.detalle, kilos: String(i.kilos), precio: String(i.precio) })) : [RENGLON_VACIO],
  );
  const { pendiente, error, setError, correr } = useAccion();

  const total = renglones.reduce((suma, r) => suma + subtotal(r), 0);
  const producto = (nombre: string) => stock.find((s) => s.nombre.toLowerCase() === nombre.trim().toLowerCase());
  // Al corregir, los kilos que ya tenía esta venta vuelven a estar disponibles.
  const yaVendido = (nombre: string) =>
    venta?.items.reduce((t, i) => (i.detalle.toLowerCase() === nombre.trim().toLowerCase() ? t + i.kilos : t), 0) ?? 0;

  function cambiar(indice: number, campo: keyof Renglon, valor: string) {
    setRenglones((rs) =>
      rs.map((r, i) => {
        if (i !== indice) return r;
        const nuevo = { ...r, [campo]: valor };
        // Al elegir un corte con precio de lista, completa el precio si estaba vacío.
        const lista = campo === "detalle" ? producto(valor)?.precio : null;
        if (lista && !r.precio) nuevo.precio = String(lista);
        return nuevo;
      }),
    );
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    const items = renglones
      .filter((r) => r.detalle.trim() || r.kilos || r.precio)
      .map((r) => ({ detalle: r.detalle.trim(), kilos: numero(r.kilos), precio: numero(r.precio) }));
    if (!fecha) return setError("Elegí la fecha.");
    if (items.length === 0) return setError("Cargá al menos un producto.");
    if (items.some((i) => !i.detalle || !(i.kilos > 0) || !(i.precio > 0))) return setError("Cada producto necesita detalle, kilos y precio.");
    const datos = { fecha, comprobante, items };
    correr(() => (venta ? actualizarVenta(venta.id, datos) : registrarVenta(clienteId, datos)), onListo);
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Fecha">
          <DateField value={fecha} onChange={setFecha} />
        </Campo>
        <Campo label="N° de remito / factura">
          <input className={CAMPO} value={comprobante} onChange={(e) => setComprobante(e.target.value)} inputMode="numeric" />
        </Campo>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-brand">Productos</h2>

      <div className="space-y-3">
        {renglones.map((r, i) => {
          const p = r.detalle.trim() ? producto(r.detalle) : undefined;
          // Sólo se informa el stock de los cortes que ya lo llevan (los que tuvieron alguna carga).
          const disponible = p && p.desde !== null ? p.stock + yaVendido(r.detalle) : null;
          const falta = disponible !== null && (numero(r.kilos) || 0) > disponible;
          return (
            <div key={i}>
              <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_7rem_9rem_9rem_2.5rem]">
                <Campo label="Producto" className="col-span-2 sm:col-span-1">
                  <Autocompletar
                    value={r.detalle}
                    onChange={(valor) => cambiar(i, "detalle", valor)}
                    sugerencias={stock.map((p) => p.nombre)}
                    placeholder="Elegí uno o escribí uno nuevo"
                    ariaLabel="Producto"
                  />
                </Campo>
                <Campo label="Kilos">
                  <input type="number" min="0" step="0.001" className={CAMPO} value={r.kilos} onChange={(e) => cambiar(i, "kilos", e.target.value)} />
                </Campo>
                <Campo label="Precio por kilo">
                  <input type="number" min="0" step="0.01" className={CAMPO} value={r.precio} onChange={(e) => cambiar(i, "precio", e.target.value)} />
                </Campo>
                <div className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Subtotal</span>
                  <p className="rounded-md bg-brand-soft px-3 py-2 text-right font-semibold tabular-nums text-slate-900">{pesos(subtotal(r))}</p>
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
              {disponible !== null && (
                <p className={`mt-1 text-xs ${falta ? "font-semibold text-amber-700" : "text-slate-500"}`}>
                  Stock disponible: {formatoKilos(disponible)} kg
                  {falta && " · estás vendiendo más de lo que figura en stock (se guarda igual)"}
                </p>
              )}
            </div>
          );
        })}
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
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : venta ? "Guardar cambios" : "Guardar venta"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Pago (recibo): resta del saldo del cliente y registra con qué medio pagó. Con `pago`, lo corrige. */
export function FormPago({ clienteId, saldo, pago, onListo }: Props & { saldo: number; pago?: Extract<Movimiento, { tipo: "pago" }> }) {
  const [fecha, setFecha] = useState(pago?.fecha ?? hoyISO);
  const [comprobante, setComprobante] = useState(pago?.comprobante ?? "");
  const [importe, setImporte] = useState(pago ? String(pago.importe) : "");
  const [medioPago, setMedioPago] = useState<MedioPago>(pago?.medioPago ?? "efectivo");
  const { pendiente, error, setError, correr } = useAccion();

  const monto = numero(importe) || 0;
  // Al corregir, el saldo actual ya tiene descontado este pago.
  const saldoSinEste = saldo + (pago?.importe ?? 0);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!fecha) return setError("Elegí la fecha.");
    if (!(monto > 0)) return setError("Ingresá el importe del pago.");
    const datos = { fecha, comprobante, importe: monto, medioPago };
    correr(() => (pago ? actualizarPago(pago.id, datos) : registrarPago(clienteId, datos)), onListo);
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Fecha">
          <DateField value={fecha} onChange={setFecha} />
        </Campo>
        <Campo label="N° de recibo">
          <input className={CAMPO} value={comprobante} onChange={(e) => setComprobante(e.target.value)} inputMode="numeric" />
        </Campo>
        <Campo label="Importe">
          <input type="number" min="0" step="0.01" className={CAMPO} value={importe} onChange={(e) => setImporte(e.target.value)} autoFocus />
        </Campo>
      </div>

      <div className="mt-5">
        <SelectorMedio opciones={MEDIOS_PAGO} valor={medioPago} onChange={setMedioPago} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{pago ? "Saldo sin este pago" : "Saldo actual"}</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{pesos(saldoSinEste)}</p>
        </div>
        <div className="rounded-xl bg-brand-soft px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">Saldo después del pago</p>
          <p className="text-lg font-bold tabular-nums text-brand">{pesos(saldoSinEste - monto)}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : pago ? "Guardar cambios" : "Guardar pago"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
