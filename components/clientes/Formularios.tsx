"use client";

import { useState, type FormEvent } from "react";
import { actualizarCargo, actualizarDescuento, actualizarPago, actualizarVenta, registrarCargo, registrarDescuento, registrarPago, registrarVenta } from "@/app/acciones";
import { useAccion } from "@/components/comun/useAccion";
import { PlusIcon, TrashIcon } from "@/components/layout/icons";
import { SelectorProducto } from "@/components/ui/SelectorProducto";
import { CampoNumero } from "@/components/ui/CampoNumero";
import { DateField } from "@/components/ui/DateField";
import { aCampo, aNumero, BOTON, BOTON_SECUNDARIO, CAMPO, hoyISO, kilos as formatoKilos, pesos } from "@/lib/formato";
import { MEDIOS_PAGO, type MedioPago, type Movimiento, type StockDeProducto } from "@/lib/tipos";
import { Campo, SelectorMedio } from "./comunes";

/** `libre`: el producto se escribe a mano (personalizado), sin lista ni precio sugerido. */
type Renglon = { detalle: string; kilos: string; precio: string; libre?: boolean };
const RENGLON_VACIO: Renglon = { detalle: "", kilos: "", precio: "" };

const numero = aNumero;
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
    venta ? venta.items.map((i) => ({ detalle: i.detalle, kilos: aCampo(i.kilos, 3), precio: aCampo(i.precio) })) : [RENGLON_VACIO],
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
        // En un producto personalizado no hay precio de lista que sugerir.
        if (r.libre) return nuevo;
        // Al elegir un producto con precio de lista, lo sugiere. Si el precio actual era el de lista del producto
        // anterior (o estaba vacío) lo reemplaza; si la persona ya escribió otro, se respeta.
        if (campo === "detalle") {
          const lista = producto(valor)?.precio;
          const anterior = producto(r.detalle)?.precio;
          if (lista && (!r.precio || (anterior && r.precio === aCampo(anterior)))) nuevo.precio = aCampo(lista);
        }
        return nuevo;
      }),
    );
  }

  /** Cambia un renglón entre "elegir de la lista" y "escribir un producto personalizado". */
  function alternarLibre(indice: number) {
    setRenglones((rs) => rs.map((r, i) => (i === indice ? { ...r, libre: !r.libre } : r)));
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
    correr(() => (venta ? actualizarVenta(venta.id, datos) : registrarVenta(clienteId, datos)), onListo, venta ? "Venta corregida" : "Venta registrada");
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
                <Campo label={r.libre ? "Producto personalizado" : "Producto"} className="col-span-2 sm:col-span-1">
                  {r.libre ? (
                    <input
                      className={CAMPO}
                      value={r.detalle}
                      onChange={(e) => cambiar(i, "detalle", e.target.value)}
                      placeholder="Escribí el nombre del producto"
                      maxLength={80}
                      aria-label="Producto personalizado"
                      autoFocus={!r.detalle}
                    />
                  ) : (
                    <SelectorProducto
                      value={r.detalle}
                      onChange={(valor) => cambiar(i, "detalle", valor)}
                      productos={stock.map((p) => ({ nombre: p.nombre, categoria: p.categoria, precio: p.precio }))}
                      placeholder="Elegí o buscá un producto"
                      ariaLabel="Producto"
                    />
                  )}
                </Campo>
                <Campo label="Kilos">
                  <CampoNumero value={r.kilos} onChange={(valor) => cambiar(i, "kilos", valor)} decimales={3} />
                </Campo>
                <Campo label="Precio por kilo">
                  <CampoNumero value={r.precio} onChange={(valor) => cambiar(i, "precio", valor)} />
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
              <button type="button" onClick={() => alternarLibre(i)} className="mt-1 text-xs font-semibold text-brand hover:underline">
                {r.libre ? "Elegir de la lista" : "Escribir otro producto"}
              </button>
              {r.libre && (
                <p className="mt-1 text-xs text-slate-500">Se guarda como producto nuevo con el precio que pongas acá; el rubro y el precio de lista los define el administrador en Productos.</p>
              )}
              {p?.precio && (
                <p className="mt-1 text-xs text-slate-500">
                  Precio de lista: {pesos(p.precio)} por kilo
                  {numero(r.precio) > 0 && Math.abs(numero(r.precio) - p.precio) > 0.004 && (
                    <span className="font-semibold text-amber-700"> · estás usando otro precio ({pesos(numero(r.precio))}); se guarda así en esta venta</span>
                  )}
                </p>
              )}
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

      <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
        <button
          type="button"
          onClick={() => setRenglones((rs) => [...rs, RENGLON_VACIO])}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar producto
        </button>
        <button
          type="button"
          onClick={() => setRenglones((rs) => [...rs, { ...RENGLON_VACIO, libre: true }])}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar producto personalizado
        </button>
      </div>

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
  const [importe, setImporte] = useState(pago ? aCampo(pago.importe) : "");
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
    correr(() => (pago ? actualizarPago(pago.id, datos) : registrarPago(clienteId, datos)), onListo, pago ? "Pago corregido" : "Pago registrado");
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
          <CampoNumero value={importe} onChange={setImporte} autoFocus />
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

type Ajuste = Extract<Movimiento, { tipo: "descuento" | "cargo" }>;

/**
 * Descuento (resta del saldo, pero no es plata cobrada: retiros, comida...) o cargo (suma al saldo, pero no es una venta de
 * productos: un préstamo, un ajuste...). Comparten pantalla. Con `ajuste`, lo corrige.
 */
function FormAjuste({ tipo, clienteId, saldo, ajuste, onListo }: Props & { tipo: "descuento" | "cargo"; saldo: number; ajuste?: Ajuste }) {
  const esCargo = tipo === "cargo";
  const [fecha, setFecha] = useState(ajuste?.fecha ?? hoyISO);
  const [comprobante, setComprobante] = useState(ajuste?.comprobante ?? "");
  const [importe, setImporte] = useState(ajuste ? aCampo(ajuste.importe) : "");
  const [nota, setNota] = useState(ajuste?.nota ?? "");
  const { pendiente, error, setError, correr } = useAccion();

  const monto = numero(importe) || 0;
  const signo = esCargo ? 1 : -1;
  // Al corregir, el saldo actual ya incluye este movimiento.
  const saldoSinEste = saldo - (ajuste ? signo * ajuste.importe : 0);
  const que = esCargo ? "cargo" : "descuento";

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!fecha) return setError("Elegí la fecha.");
    if (!(monto > 0)) return setError(`Ingresá el importe del ${que}.`);
    if (!nota.trim()) return setError(esCargo ? "Contá de qué es (por ejemplo: préstamo)." : "Contá de qué es (por ejemplo: retiro de asado).");
    const datos = { fecha, comprobante, importe: monto, nota };
    const accion = ajuste ? (esCargo ? actualizarCargo : actualizarDescuento)(ajuste.id, datos) : (esCargo ? registrarCargo : registrarDescuento)(clienteId, datos);
    correr(() => accion, onListo, `${esCargo ? "Cargo" : "Descuento"} ${ajuste ? "corregido" : "registrado"}`);
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <p className="mb-4 text-sm text-slate-600">
        {esCargo ? (
          <>
            Suma al saldo del cliente, pero <strong>no es una venta</strong> (no cuenta en lo vendido ni en los kilos). Sirve para préstamos, ajustes a favor, etc.
          </>
        ) : (
          <>
            Resta del saldo del cliente, pero <strong>no se cuenta como plata cobrada</strong>. Sirve para descuentos, retiros de mercadería, comida, etc.
          </>
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Fecha">
          <DateField value={fecha} onChange={setFecha} />
        </Campo>
        <Campo label="N° de comprobante">
          <input className={CAMPO} value={comprobante} onChange={(e) => setComprobante(e.target.value)} inputMode="numeric" />
        </Campo>
        <Campo label="Importe">
          <CampoNumero value={importe} onChange={setImporte} autoFocus />
        </Campo>
      </div>
      <div className="mt-4">
        <Campo label="Concepto">
          <input
            className={CAMPO}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={esCargo ? "Préstamo, ajuste, deuda anterior..." : "Retiro de asado, descuento, comida..."}
            maxLength={200}
          />
        </Campo>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{ajuste ? `Saldo sin este ${que}` : "Saldo actual"}</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{pesos(saldoSinEste)}</p>
        </div>
        <div className="rounded-xl bg-brand-soft px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">Saldo después del {que}</p>
          <p className="text-lg font-bold tabular-nums text-brand">{pesos(saldoSinEste + signo * monto)}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : ajuste ? "Guardar cambios" : `Guardar ${que}`}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function FormDescuento({ clienteId, saldo, descuento, onListo }: Props & { saldo: number; descuento?: Extract<Movimiento, { tipo: "descuento" }> }) {
  return <FormAjuste tipo="descuento" clienteId={clienteId} saldo={saldo} ajuste={descuento} onListo={onListo} />;
}

export function FormCargo({ clienteId, saldo, cargo, onListo }: Props & { saldo: number; cargo?: Extract<Movimiento, { tipo: "cargo" }> }) {
  return <FormAjuste tipo="cargo" clienteId={clienteId} saldo={saldo} ajuste={cargo} onListo={onListo} />;
}
