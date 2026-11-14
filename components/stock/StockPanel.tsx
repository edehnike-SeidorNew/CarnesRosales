"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { crearCorte, eliminarStockMovimiento, fijarPrecio, registrarAjuste, registrarCompra } from "@/app/acciones";
import { Autor, Campo, Vacio } from "@/components/clientes/comunes";
import { useAccion } from "@/components/comun/useAccion";
import { CardLateral } from "@/components/layout/CardLateral";
import { BoxIcon, ChevronLeftIcon, HistoryIcon, PlusIcon, ReceiptIcon, SlidersIcon, TagIcon, TrashIcon } from "@/components/layout/icons";
import { PanelOpciones, type OpcionPanel } from "@/components/layout/PanelOpciones";
import { Autocompletar } from "@/components/ui/Autocompletar";
import { DateField } from "@/components/ui/DateField";
import { Select } from "@/components/ui/Select";
import { BOTON, BOTON_SECUNDARIO, CAMPO, fechaAR, hoyISO, kilos, pesos } from "@/lib/formato";
import type { Proveedor, StockDeProducto, StockMovimiento } from "@/lib/tipos";

type VistaId = "actual" | "compra" | "ajuste" | "precios" | "movimientos";

const OPCIONES: (OpcionPanel<VistaId> & { titulo: string; requiereCargar: boolean })[] = [
  { id: "actual", label: "Stock actual", titulo: "Stock", Icon: BoxIcon, requiereCargar: false },
  { id: "compra", label: "Registrar compra", titulo: "Registrar compra", Icon: ReceiptIcon, requiereCargar: true },
  { id: "ajuste", label: "Ajustar por conteo", titulo: "Ajustar stock por conteo", Icon: SlidersIcon, requiereCargar: true },
  { id: "precios", label: "Cortes y precios", titulo: "Cortes y lista de precios", Icon: TagIcon, requiereCargar: false },
  { id: "movimientos", label: "Compras y ajustes", titulo: "Compras y ajustes", Icon: HistoryIcon, requiereCargar: false },
];

const numero = (texto: string) => Number(texto.replace(",", "."));
const TD = "px-4 py-3";

function StockActual({ stock }: { stock: StockDeProducto[] }) {
  if (stock.length === 0) {
    return <Vacio icono={<BoxIcon className="h-6 w-6" />}>Todavía no hay cortes cargados. Registrá una compra para empezar.</Vacio>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
      {stock.map((p) => {
        const negativo = p.stock < 0;
        return (
          <div key={p.nombre} className={`rounded-2xl border bg-white p-4 ${negativo ? "border-red-300" : "border-brand-border"}`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${negativo ? "bg-red-50 text-red-700" : "bg-brand-soft text-brand"}`}>
                <BoxIcon className="h-4 w-4" />
              </span>
              <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{p.nombre}</p>
            </div>
            <p className={`mt-3 text-xl font-bold tabular-nums ${negativo ? "text-red-700" : "text-slate-900"}`}>{kilos(p.stock)} kg</p>
            {p.desde === null ? (
              <p className="mt-0.5 text-xs text-slate-500">Sin stock cargado todavía</p>
            ) : (
              <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                Desde el {fechaAR(p.desde)}: comprado {kilos(p.comprado)} · vendido {kilos(p.vendido)}
                {p.ajustes !== 0 && ` · ajustes ${p.ajustes > 0 ? "+" : ""}${kilos(p.ajustes)}`}
              </p>
            )}
            {negativo && <p className="mt-1 text-xs font-medium text-red-700">Se vendió más de lo cargado: falta registrar compras o ajustar por conteo.</p>}
          </div>
        );
      })}
    </div>
  );
}

type RenglonCompra = { producto: string; kilos: string; costo: string };
const RENGLON_VACIO: RenglonCompra = { producto: "", kilos: "", costo: "" };

function FormCompra({ stock, proveedores, onListo }: { stock: StockDeProducto[]; proveedores: Proveedor[]; onListo: () => void }) {
  const [fecha, setFecha] = useState(hoyISO);
  const [proveedor, setProveedor] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [renglones, setRenglones] = useState<RenglonCompra[]>([RENGLON_VACIO]);
  const { pendiente, error, setError, correr } = useAccion();

  const subtotal = (r: RenglonCompra) => Math.round((numero(r.kilos) || 0) * (numero(r.costo) || 0) * 100) / 100;
  const total = renglones.reduce((t, r) => t + subtotal(r), 0);
  const cambiar = (indice: number, campo: keyof RenglonCompra, valor: string) =>
    setRenglones((rs) => rs.map((r, i) => (i === indice ? { ...r, [campo]: valor } : r)));

  function enviar(e: FormEvent) {
    e.preventDefault();
    const items = renglones
      .filter((r) => r.producto.trim() || r.kilos || r.costo)
      .map((r) => ({ producto: r.producto.trim(), kilos: numero(r.kilos), costo: r.costo.trim() ? numero(r.costo) : null }));
    if (!fecha) return setError("Elegí la fecha.");
    if (items.length === 0) return setError("Cargá al menos un producto.");
    if (items.some((i) => !i.producto || !(i.kilos > 0))) return setError("Cada producto necesita nombre y kilos.");
    correr(() => registrarCompra({ fecha, proveedor, comprobante, items }), onListo);
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Fecha">
          <DateField value={fecha} onChange={setFecha} />
        </Campo>
        <Campo label="Proveedor">
          <Autocompletar value={proveedor} onChange={setProveedor} sugerencias={proveedores.map((p) => p.nombre)} placeholder="Elegí uno o escribí uno nuevo" ariaLabel="Proveedor" />
        </Campo>
        <Campo label="N° de factura / remito">
          <input className={CAMPO} value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
        </Campo>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-brand">Mercadería que entra</h2>
      <div className="space-y-3">
        {renglones.map((r, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_7rem_9rem_9rem_2.5rem]">
            <Campo label="Producto" className="col-span-2 sm:col-span-1">
              <Autocompletar value={r.producto} onChange={(valor) => cambiar(i, "producto", valor)} sugerencias={stock.map((p) => p.nombre)} placeholder="Elegí uno o escribí uno nuevo" ariaLabel="Producto" />
            </Campo>
            <Campo label="Kilos">
              <input type="number" min="0" step="0.001" className={CAMPO} value={r.kilos} onChange={(e) => cambiar(i, "kilos", e.target.value)} />
            </Campo>
            <Campo label="Costo por kilo">
              <input type="number" min="0" step="0.01" className={CAMPO} value={r.costo} onChange={(e) => cambiar(i, "costo", e.target.value)} placeholder="Opcional" />
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
              className="flex h-[38px] items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
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
        <span className="text-sm font-semibold text-brand">Total de la compra</span>
        <span className="text-lg font-bold tabular-nums text-brand">{pesos(total)}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">Con proveedor y costo cargados, la compra suma a lo que se le debe a ese proveedor.</p>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : "Guardar compra"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Se carga lo que hay de verdad en la cámara y el sistema registra la diferencia (merma, error de carga, stock inicial). */
function FormAjuste({ stock, onListo }: { stock: StockDeProducto[]; onListo: () => void }) {
  const [fecha, setFecha] = useState(hoyISO);
  const [producto, setProducto] = useState(stock[0]?.nombre ?? "");
  const [contado, setContado] = useState("");
  const [nota, setNota] = useState("");
  const { pendiente, error, setError, correr } = useAccion();

  const enSistema = stock.find((s) => s.nombre === producto)?.stock ?? 0;
  const real = contado.trim() ? numero(contado) : null;
  const diferencia = real === null ? 0 : Math.round((real - enSistema) * 1000) / 1000;

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!producto) return setError("Elegí el producto.");
    if (real === null || !(real >= 0)) return setError("Ingresá los kilos contados.");
    if (diferencia === 0) return setError("El conteo coincide con el sistema: no hay nada que ajustar.");
    correr(() => registrarAjuste({ fecha, producto, kilos: diferencia, nota: nota || "Ajuste por conteo" }), onListo);
  }

  if (stock.length === 0) {
    return <Vacio icono={<SlidersIcon className="h-6 w-6" />}>Todavía no hay cortes para ajustar. Registrá una compra primero.</Vacio>;
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Fecha">
          <DateField value={fecha} onChange={setFecha} />
        </Campo>
        <Campo label="Producto">
          <Select value={producto} onChange={setProducto} opciones={stock.map((p) => ({ value: p.nombre, label: p.nombre }))} ariaLabel="Producto" />
        </Campo>
        <Campo label="Kilos contados (lo que hay de verdad)">
          <input type="number" min="0" step="0.001" className={CAMPO} value={contado} onChange={(e) => setContado(e.target.value)} autoFocus />
        </Campo>
        <Campo label="Nota" className="sm:col-span-3">
          <input className={CAMPO} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: merma, stock inicial, error de carga" />
        </Campo>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stock según el sistema</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{kilos(enSistema)} kg</p>
        </div>
        <div className="rounded-xl bg-brand-soft px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">Diferencia que se registra</p>
          <p className="text-lg font-bold tabular-nums text-brand">
            {diferencia > 0 ? "+" : ""}
            {kilos(diferencia)} kg
          </p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : "Guardar ajuste"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function FilaPrecio({ producto, puedeCargar }: { producto: StockDeProducto; puedeCargar: boolean }) {
  const [valor, setValor] = useState(producto.precio === null ? "" : String(producto.precio));
  const { pendiente, error, correr } = useAccion();
  const nuevo = valor.trim() ? numero(valor) : null;
  const cambio = nuevo !== producto.precio;
  const margen = producto.precio !== null && producto.ultimoCosto !== null ? producto.precio - producto.ultimoCosto : null;

  return (
    <tr>
      <td className={`${TD} font-semibold text-slate-900`}>{producto.nombre}</td>
      <td className={`${TD} text-right tabular-nums text-slate-800`}>{producto.ultimoCosto === null ? "—" : pesos(producto.ultimoCosto)}</td>
      <td className={TD}>
        {puedeCargar ? (
          <div className="flex items-center justify-end gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              aria-label={`Precio por kilo de ${producto.nombre}`}
              placeholder="Sin precio"
              className={`${CAMPO} w-36 text-right`}
            />
            <button
              type="button"
              disabled={!cambio || pendiente}
              onClick={() => correr(() => fijarPrecio(producto.nombre, nuevo))}
              className={`${BOTON} !px-3 !py-2 disabled:opacity-40`}
            >
              {pendiente ? "..." : "Guardar"}
            </button>
          </div>
        ) : (
          <p className="text-right tabular-nums text-slate-800">{producto.precio === null ? "—" : pesos(producto.precio)}</p>
        )}
        {error && <p className="mt-1 text-right text-xs text-red-700">{error}</p>}
      </td>
      <td className={`${TD} text-right tabular-nums ${margen !== null && margen < 0 ? "font-semibold text-red-700" : "text-slate-800"}`}>
        {margen === null ? "—" : pesos(margen)}
      </td>
    </tr>
  );
}

function NuevoCorte() {
  const [nombre, setNombre] = useState("");
  const { pendiente, error, setError, correr } = useAccion();

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Escribí el nombre del corte.");
    correr(() => crearCorte(nombre), () => setNombre(""));
  }

  return (
    <form onSubmit={enviar} className="mb-4 rounded-lg border border-brand-border bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Campo label="Agregar cortes al catálogo (varios separados por coma)" className="min-w-56 flex-1">
          <input className={CAMPO} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Asado, Nalga, Cuadril" />
        </Campo>
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          <PlusIcon className="h-4 w-4" />
          {pendiente ? "Agregando..." : "Agregar corte"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <p className="mt-2 text-xs text-slate-500">Cada corte del catálogo tiene su card en el Inicio y en Stock, aunque todavía no se haya vendido.</p>
    </form>
  );
}

function ListaPrecios({ stock, puedeCargar }: { stock: StockDeProducto[]; puedeCargar: boolean }) {
  if (stock.length === 0) {
    return (
      <>
        {puedeCargar && <NuevoCorte />}
        <Vacio icono={<TagIcon className="h-6 w-6" />}>Todavía no hay cortes cargados.</Vacio>
      </>
    );
  }
  return (
    <>
    {puedeCargar && <NuevoCorte />}
    <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
            <tr>
              <th className={`${TD} font-semibold`}>Corte</th>
              <th className={`${TD} text-right font-semibold`}>Último costo por kilo</th>
              <th className={`${TD} text-right font-semibold`}>Precio de venta por kilo</th>
              <th className={`${TD} text-right font-semibold`}>Margen por kilo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {stock.map((p) => (
              <FilaPrecio key={`${p.nombre}-${p.precio}`} producto={p} puedeCargar={puedeCargar} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
    </>
  );
}

function Movimientos({ movimientos, proveedores, puedeBorrar }: { movimientos: StockMovimiento[]; proveedores: Proveedor[]; puedeBorrar: boolean }) {
  const { pendiente, error, correr } = useAccion();
  const proveedor = new Map(proveedores.map((p) => [p.id, p.nombre]));
  const filas = movimientos.map((m, orden) => ({ m, orden })).sort((a, b) => b.m.fecha.localeCompare(a.m.fecha) || b.orden - a.orden);

  if (filas.length === 0) return <Vacio icono={<HistoryIcon className="h-6 w-6" />}>Todavía no hay compras ni ajustes cargados.</Vacio>;

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <section className={`overflow-hidden rounded-lg border border-brand-border bg-white ${pendiente ? "opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
              <tr>
                <th className={`${TD} font-semibold`}>Fecha</th>
                <th className={`${TD} font-semibold`}>Tipo</th>
                <th className={`${TD} font-semibold`}>Producto</th>
                <th className={`${TD} text-right font-semibold`}>Kilos</th>
                <th className={`${TD} text-right font-semibold`}>Costo por kilo</th>
                <th className={`${TD} font-semibold`}>Proveedor / nota</th>
                <th className={`${TD} font-semibold`}>Comprobante</th>
                <th className={`${TD} font-semibold`}>Cargó</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filas.map(({ m }) => (
                <tr key={m.id}>
                  <td className={`${TD} whitespace-nowrap text-slate-800`}>{fechaAR(m.fecha)}</td>
                  <td className={TD}>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                        m.tipo === "compra" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {m.tipo === "compra" ? "Compra" : "Ajuste"}
                    </span>
                  </td>
                  <td className={`${TD} font-medium text-slate-900`}>{m.producto}</td>
                  <td className={`${TD} text-right tabular-nums ${m.kilos < 0 ? "text-red-700" : "text-slate-800"}`}>
                    {m.kilos > 0 ? "+" : ""}
                    {kilos(m.kilos)}
                  </td>
                  <td className={`${TD} text-right tabular-nums text-slate-800`}>{m.costo === null ? "—" : pesos(m.costo)}</td>
                  <td className={`${TD} text-slate-700`}>{m.tipo === "compra" ? (proveedor.get(m.proveedorId ?? "") ?? "—") : m.nota || "—"}</td>
                  <td className={`${TD} text-slate-500`}>{m.comprobante || "—"}</td>
                  <td className={`${TD} text-xs text-slate-500`}>
                    <Autor email={m.creadoPor} />
                  </td>
                  <td className="pr-2 text-right">
                    {puedeBorrar && (
                      <button
                        type="button"
                        disabled={pendiente}
                        onClick={() => window.confirm("¿Eliminar este movimiento de stock?") && correr(() => eliminarStockMovimiento(m.id))}
                        aria-label="Eliminar"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/** Stock de mercadería: entra con las compras, sale solo con cada venta y se corrige con el conteo. */
export function StockPanel({
  stock,
  movimientos,
  proveedores,
  puedeCargar,
  puedeBorrar,
  desdeInicio,
}: {
  stock: StockDeProducto[];
  movimientos: StockMovimiento[];
  proveedores: Proveedor[];
  puedeCargar: boolean;
  puedeBorrar: boolean;
  /** Se llegó desde el Inicio ("Ver stock"): la pantalla principal ofrece volver ahí. */
  desdeInicio: boolean;
}) {
  const [vista, setVista] = useState<VistaId>("actual");
  const opciones = OPCIONES.filter((o) => puedeCargar || !o.requiereCargar);
  const actual = opciones.find((o) => o.id === vista) ?? opciones[0];
  const volver = () => setVista("actual");
  const total = stock.reduce((t, p) => t + p.stock, 0);
  const negativos = stock.filter((p) => p.stock < 0).length;

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      {/* Con el "volver" arriba del título, el panel baja lo mismo para seguir alineado con el contenido. */}
      <PanelOpciones
        titulo="Stock"
        opciones={opciones}
        seleccion={vista}
        onSelect={setVista}
        fija={false}
        desplazamiento={vista === "actual" && !desdeInicio ? "xl:mt-14" : "xl:mt-[5.5rem]"}
      >
        <CardLateral titulo="Cómo funciona">
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <strong className="text-slate-900">Entra</strong> con cada compra que registrás.
            </li>
            <li>
              <strong className="text-slate-900">Sale solo</strong> con los kilos de cada venta.
            </li>
            <li>
              <strong className="text-slate-900">Se corrige</strong> con el conteo real (merma).
            </li>
          </ul>
        </CardLateral>
      </PanelOpciones>

      <div className="min-w-0 flex-1">
        {vista === "actual" && desdeInicio && (
          <Link href="/" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand">
            <ChevronLeftIcon className="h-4 w-4" />
            Volver al inicio
          </Link>
        )}
        {vista !== "actual" && (
          <button type="button" onClick={volver} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand">
            <ChevronLeftIcon className="h-4 w-4" />
            Volver al stock
          </button>
        )}
        <h1 className="mb-6 text-2xl font-bold text-brand">{actual.titulo}</h1>

        {vista === "actual" && (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Total en stock: <strong className="text-slate-900">{kilos(total)} kg</strong> entre {stock.length} {stock.length === 1 ? "corte" : "cortes"}
              {negativos > 0 && (
                <>
                  {" "}
                  · <strong className="text-red-700">{negativos} en negativo</strong>
                </>
              )}
            </p>
            <StockActual stock={stock} />
          </>
        )}
        {vista === "compra" && <FormCompra stock={stock} proveedores={proveedores} onListo={volver} />}
        {vista === "ajuste" && <FormAjuste stock={stock} onListo={volver} />}
        {vista === "precios" && <ListaPrecios stock={stock} puedeCargar={puedeCargar} />}
        {vista === "movimientos" && <Movimientos movimientos={movimientos} proveedores={proveedores} puedeBorrar={puedeBorrar} />}
      </div>
    </div>
  );
}
