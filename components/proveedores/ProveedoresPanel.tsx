"use client";

import { useState, type FormEvent } from "react";
import { eliminarPagoProveedor, registrarPagoProveedor } from "@/app/acciones";
import { Autor, Campo, SelectorMedio, Tarjeta, Vacio } from "@/components/clientes/comunes";
import { useAccion } from "@/components/comun/useAccion";
import { CardLateral } from "@/components/layout/CardLateral";
import { CashIcon, HistoryIcon, TrashIcon, TruckIcon } from "@/components/layout/icons";
import { PanelOpciones, type OpcionPanel } from "@/components/layout/PanelOpciones";
import { BOTON, BOTON_SECUNDARIO, CAMPO, fechaAR, hoyISO, kilos, pesos } from "@/lib/formato";
import {
  etiquetaMedio,
  MEDIOS_PAGO,
  redondear,
  saldosProveedores,
  type MedioPago,
  type PagoProveedor,
  type Proveedor,
  type StockMovimiento,
} from "@/lib/tipos";

type VistaId = "cuentas" | "pago" | "historial";

const OPCIONES: (OpcionPanel<VistaId> & { titulo: string; requiereCargar: boolean })[] = [
  { id: "cuentas", label: "Cuentas a pagar", titulo: "Proveedores", Icon: TruckIcon, requiereCargar: false },
  { id: "pago", label: "Registrar pago", titulo: "Registrar pago a proveedor", Icon: CashIcon, requiereCargar: true },
  { id: "historial", label: "Compras y pagos", titulo: "Compras y pagos", Icon: HistoryIcon, requiereCargar: false },
];

const TD = "px-4 py-3";

function FormPagoProveedor({
  saldos,
  inicial,
  onListo,
}: {
  saldos: ReturnType<typeof saldosProveedores>;
  inicial: string;
  onListo: () => void;
}) {
  const [proveedorId, setProveedorId] = useState(inicial || saldos[0]?.proveedor.id || "");
  const [fecha, setFecha] = useState(hoyISO);
  const [comprobante, setComprobante] = useState("");
  const [importe, setImporte] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago>("transferencia");
  const { pendiente, error, setError, correr } = useAccion();

  const monto = Number(importe.replace(",", ".")) || 0;
  const saldo = saldos.find((s) => s.proveedor.id === proveedorId)?.saldo ?? 0;

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!proveedorId) return setError("Elegí el proveedor.");
    if (!(monto > 0)) return setError("Ingresá el importe del pago.");
    correr(() => registrarPagoProveedor({ proveedorId, fecha, importe: monto, medioPago, comprobante }), onListo);
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Proveedor">
          <select className={CAMPO} value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            {saldos.map(({ proveedor }) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Fecha">
          <input type="date" className={CAMPO} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo label="N° de comprobante">
          <input className={CAMPO} value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
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
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Se le debe hoy</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{pesos(saldo)}</p>
        </div>
        <div className="rounded-xl bg-brand-soft px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">Queda después del pago</p>
          <p className="text-lg font-bold tabular-nums text-brand">{pesos(saldo - monto)}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : "Guardar pago"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Proveedores y cuentas a pagar: lo comprado (con costo) menos lo que ya se les pagó. */
export function ProveedoresPanel({
  proveedores,
  compras,
  pagos,
  puedeCargar,
  puedeBorrar,
}: {
  proveedores: Proveedor[];
  /** Movimientos de stock (se usan las compras). */
  compras: StockMovimiento[];
  pagos: PagoProveedor[];
  puedeCargar: boolean;
  puedeBorrar: boolean;
}) {
  const [vista, setVista] = useState<VistaId>("cuentas");
  const [elegido, setElegido] = useState("");
  const { pendiente, error, correr } = useAccion();

  const saldos = saldosProveedores({ proveedores, stock: compras, pagosProveedores: pagos });
  const totalAPagar = redondear(saldos.reduce((t, s) => t + Math.max(s.saldo, 0), 0));
  const opciones = OPCIONES.filter((o) => (puedeCargar && proveedores.length > 0) || !o.requiereCargar);
  const actual = opciones.find((o) => o.id === vista) ?? opciones[0];
  const nombreDe = new Map(proveedores.map((p) => [p.id, p.nombre]));

  // Compras y pagos mezclados, del más nuevo al más viejo.
  const historial = [
    ...compras
      .filter((c) => c.tipo === "compra" && c.proveedorId)
      .map((c) => ({
        id: c.id,
        fecha: c.fecha,
        proveedorId: c.proveedorId as string,
        esPago: false,
        detalle: `${c.producto} · ${kilos(c.kilos)} kg${c.costo === null ? " (sin costo cargado)" : ` a ${pesos(c.costo)}`}`,
        comprobante: c.comprobante,
        importe: c.costo === null ? 0 : redondear(c.kilos * c.costo),
        creadoPor: c.creadoPor,
      })),
    ...pagos.map((p) => ({
      id: p.id,
      fecha: p.fecha,
      proveedorId: p.proveedorId,
      esPago: true,
      detalle: `Pago · ${etiquetaMedio(p.medioPago)}`,
      comprobante: p.comprobante,
      importe: p.importe,
      creadoPor: p.creadoPor,
    })),
  ]
    .filter((h) => !elegido || h.proveedorId === elegido)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Proveedores" opciones={opciones} seleccion={vista} onSelect={setVista} fija={false} desplazamiento="xl:mt-14">
        <CardLateral titulo="De dónde salen">
          <p className="text-sm text-slate-600">
            Los proveedores se crean solos al registrar una compra en <strong className="text-slate-900">Stock</strong>. Las compras con costo
            cargado suman a lo que se les debe.
          </p>
        </CardLateral>
      </PanelOpciones>

      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold text-brand">{actual.titulo}</h1>

        {vista === "cuentas" &&
          (saldos.length === 0 ? (
            <Vacio icono={<TruckIcon className="h-6 w-6" />}>Todavía no hay proveedores. Aparecen al registrar una compra con proveedor en Stock.</Vacio>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tarjeta titulo="Total a pagar" valor={pesos(totalAPagar)} nota={`${saldos.filter((s) => s.saldo > 0).length} con saldo pendiente`} destacada />
                <Tarjeta titulo="Comprado" valor={pesos(redondear(saldos.reduce((t, s) => t + s.comprado, 0)))} nota="Compras con costo cargado" />
                <Tarjeta titulo="Pagado" valor={pesos(redondear(saldos.reduce((t, s) => t + s.pagado, 0)))} />
              </div>
              <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
                      <tr>
                        <th className={`${TD} font-semibold`}>Proveedor</th>
                        <th className={`${TD} text-right font-semibold`}>Comprado</th>
                        <th className={`${TD} text-right font-semibold`}>Pagado</th>
                        <th className={`${TD} text-right font-semibold`}>Saldo a pagar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {saldos.map(({ proveedor, comprado, pagado, saldo }) => (
                        <tr
                          key={proveedor.id}
                          tabIndex={0}
                          onClick={() => {
                            setElegido(proveedor.id);
                            setVista("historial");
                          }}
                          className="cursor-pointer hover:bg-brand-soft/60 focus:bg-brand-soft/60 focus:outline-none"
                        >
                          <td className={`${TD} font-semibold text-slate-900`}>{proveedor.nombre}</td>
                          <td className={`${TD} text-right tabular-nums text-slate-800`}>{pesos(comprado)}</td>
                          <td className={`${TD} text-right tabular-nums text-slate-800`}>{pesos(pagado)}</td>
                          <td className={`${TD} text-right font-semibold tabular-nums ${saldo > 0 ? "text-slate-900" : "text-slate-400"}`}>{pesos(saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ))}

        {vista === "pago" && <FormPagoProveedor saldos={saldos} inicial={elegido} onListo={() => setVista("cuentas")} />}

        {vista === "historial" && (
          <>
            <div className="mb-4 max-w-xs">
              <Campo label="Proveedor">
                <select className={CAMPO} value={elegido} onChange={(e) => setElegido(e.target.value)}>
                  <option value="">Todos</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
            {historial.length === 0 ? (
              <Vacio icono={<HistoryIcon className="h-6 w-6" />}>No hay compras ni pagos para mostrar.</Vacio>
            ) : (
              <section className={`overflow-hidden rounded-lg border border-brand-border bg-white ${pendiente ? "opacity-60" : ""}`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
                      <tr>
                        <th className={`${TD} font-semibold`}>Fecha</th>
                        <th className={`${TD} font-semibold`}>Proveedor</th>
                        <th className={`${TD} font-semibold`}>Detalle</th>
                        <th className={`${TD} font-semibold`}>Comprobante</th>
                        <th className={`${TD} text-right font-semibold`}>Compra</th>
                        <th className={`${TD} text-right font-semibold`}>Pago</th>
                        <th className={`${TD} font-semibold`}>Cargó</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {historial.map((h) => (
                        <tr key={h.id} className={h.esPago ? "bg-emerald-50/50" : ""}>
                          <td className={`${TD} whitespace-nowrap text-slate-800`}>{fechaAR(h.fecha)}</td>
                          <td className={`${TD} font-medium text-slate-900`}>{nombreDe.get(h.proveedorId) ?? "—"}</td>
                          <td className={`${TD} ${h.esPago ? "text-emerald-800" : "text-slate-700"}`}>{h.detalle}</td>
                          <td className={`${TD} text-slate-500`}>{h.comprobante || "—"}</td>
                          <td className={`${TD} text-right tabular-nums text-slate-900`}>{!h.esPago && h.importe > 0 ? pesos(h.importe) : ""}</td>
                          <td className={`${TD} text-right font-semibold tabular-nums text-emerald-700`}>{h.esPago ? pesos(h.importe) : ""}</td>
                          <td className={`${TD} text-xs text-slate-500`}>
                            <Autor email={h.creadoPor} />
                          </td>
                          <td className="pr-2 text-right">
                            {h.esPago && puedeBorrar && (
                              <button
                                type="button"
                                disabled={pendiente}
                                onClick={() => window.confirm("¿Eliminar este pago al proveedor?") && correr(() => eliminarPagoProveedor(h.id))}
                                aria-label="Eliminar pago"
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
