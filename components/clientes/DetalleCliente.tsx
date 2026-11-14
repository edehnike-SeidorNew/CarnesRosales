"use client";

import { useState } from "react";
import Link from "next/link";
import { eliminarMovimiento } from "@/app/acciones";
import { useAccion } from "@/components/comun/useAccion";
import { CardLateral } from "@/components/layout/CardLateral";
import { CashIcon, ChevronLeftIcon, DownloadIcon, HistoryIcon, PencilIcon, ReceiptIcon, TrashIcon } from "@/components/layout/icons";
import { PanelOpciones, type OpcionPanel } from "@/components/layout/PanelOpciones";
import { BOTON_SECUNDARIO, fechaAR, inicioDePeriodo, kilos, pesos, type Periodo } from "@/lib/formato";
import { efectoEnSaldo, etiquetaMedio, redondear, subtotalItem, type Cliente, type Movimiento, type StockDeProducto } from "@/lib/tipos";
import { Autor, FiltroPeriodo, Iniciales, Lista, Tarjeta, Vacio } from "./comunes";
import { FormCliente } from "./FormCliente";
import { FormPago, FormVenta } from "./Formularios";

type VistaId = "historial" | "venta" | "pago" | "editar";

const OPCIONES: (OpcionPanel<VistaId> & { titulo: string; requiereCargar: boolean })[] = [
  { id: "historial", label: "Historial", titulo: "Historial de movimientos", Icon: HistoryIcon, requiereCargar: false },
  { id: "venta", label: "Registrar venta", titulo: "Registrar venta", Icon: ReceiptIcon, requiereCargar: true },
  { id: "pago", label: "Registrar pago", titulo: "Registrar pago", Icon: CashIcon, requiereCargar: true },
  { id: "editar", label: "Editar cliente", titulo: "Editar cliente", Icon: PencilIcon, requiereCargar: true },
];

const TD = "px-3 py-2.5";
const NUM = `${TD} text-right tabular-nums`;

function Historial({
  filas,
  filtrado,
  puedeCargar,
  puedeBorrar,
  onEditar,
}: {
  filas: { m: Movimiento; saldo: number }[];
  filtrado: boolean;
  puedeCargar: boolean;
  puedeBorrar: boolean;
  onEditar: (m: Movimiento) => void;
}) {
  const { pendiente, error, correr } = useAccion();

  function borrar(m: Movimiento) {
    if (window.confirm("¿Eliminar este movimiento? El saldo se recalcula.")) correr(() => eliminarMovimiento(m.id));
  }

  if (filas.length === 0) {
    return (
      <Vacio icono={<HistoryIcon className="h-6 w-6" />}>
        {filtrado ? "No hay movimientos en este período." : "Este cliente todavía no tiene movimientos."}
      </Vacio>
    );
  }

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <section className={`overflow-hidden rounded-lg border border-brand-border bg-white ${pendiente ? "opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
              <tr>
                <th className={`${TD} font-semibold`}>Fecha</th>
                <th className={`${TD} font-semibold`}>N° comprobante</th>
                <th className={`${TD} font-semibold`}>Concepto</th>
                <th className={`${TD} font-semibold`}>Medio de pago</th>
                <th className={`${TD} text-right font-semibold`}>Kilos</th>
                <th className={`${TD} text-right font-semibold`}>Precio por kilo</th>
                <th className={`${TD} text-right font-semibold`}>Subtotal</th>
                <th className={`${TD} text-right font-semibold`}>Total compra</th>
                <th className={`${TD} text-right font-semibold`}>Pago entrante</th>
                <th className={`${TD} text-right font-semibold`}>Saldo adeudado</th>
                <th className={`${TD} font-semibold`}>Cargó</th>
                <th className="w-16" />
              </tr>
            </thead>
            {filas.map(({ m, saldo }) => {
              const renglones =
                m.tipo === "venta"
                  ? m.items.map((item) => ({
                      detalle: item.detalle,
                      kilos: kilos(item.kilos),
                      precio: pesos(item.precio),
                      subtotal: pesos(subtotalItem(item)),
                    }))
                  : [{ detalle: m.tipo === "pago" ? "Pago" : "Saldo anterior", kilos: "", precio: "", subtotal: "" }];
              const ultimo = renglones.length - 1;
              const importe = efectoEnSaldo(m);

              return (
                // Un tbody por movimiento: una venta con varios productos se lee como un solo bloque.
                <tbody key={m.id} className="border-t border-brand-border">
                  {renglones.map((r, i) => (
                    <tr key={i} className={m.tipo === "pago" ? "bg-emerald-50/50" : ""}>
                      <td className={`${TD} whitespace-nowrap text-slate-800`}>{i === 0 ? fechaAR(m.fecha) : ""}</td>
                      <td className={`${TD} text-slate-500`}>{i === 0 ? m.comprobante : ""}</td>
                      <td className={`${TD} font-medium ${m.tipo === "pago" ? "text-emerald-800" : "text-slate-900"}`}>{r.detalle}</td>
                      <td className={`${TD} whitespace-nowrap ${m.tipo === "pago" && m.medioPago ? "text-slate-800" : "text-slate-400"}`}>
                        {m.tipo === "pago" ? etiquetaMedio(m.medioPago) : ""}
                      </td>
                      <td className={`${NUM} text-slate-800`}>{r.kilos}</td>
                      <td className={`${NUM} text-slate-800`}>{r.precio}</td>
                      <td className={`${NUM} text-slate-800`}>{r.subtotal}</td>
                      <td className={`${NUM} text-slate-900`}>{i === ultimo && importe > 0 ? pesos(importe) : ""}</td>
                      <td className={`${NUM} font-semibold text-emerald-700`}>{i === ultimo && importe < 0 ? pesos(-importe) : ""}</td>
                      <td className={`${NUM} font-semibold text-slate-900`}>{i === ultimo ? pesos(saldo) : ""}</td>
                      <td className={`${TD} text-xs text-slate-500`}>{i === 0 && <Autor email={m.creadoPor} />}</td>
                      <td className="whitespace-nowrap pr-2 text-right">
                        {i === 0 && puedeCargar && m.tipo !== "saldo_inicial" && (
                          <button
                            type="button"
                            onClick={() => onEditar(m)}
                            aria-label="Corregir movimiento"
                            title="Corregir"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-brand-soft hover:text-brand"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {i === 0 && puedeBorrar && (
                          <button
                            type="button"
                            onClick={() => borrar(m)}
                            disabled={pendiente}
                            aria-label="Eliminar movimiento"
                            title="Eliminar"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      </section>
    </>
  );
}

/** Cuenta corriente de un cliente: saldo en cards, historial y carga o corrección de ventas y pagos. */
export function DetalleCliente({
  cliente,
  movimientos,
  stock,
  puedeCargar,
  puedeBorrar,
}: {
  cliente: Cliente;
  /** Sólo los movimientos de este cliente. */
  movimientos: Movimiento[];
  stock: StockDeProducto[];
  puedeCargar: boolean;
  puedeBorrar: boolean;
}) {
  const [vista, setVista] = useState<VistaId>("historial");
  const [editando, setEditando] = useState<Movimiento | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("todo");

  // Orden cronológico; a igual fecha, en el orden en que se cargaron.
  const propios = movimientos.map((m, orden) => ({ m, orden })).sort((a, b) => a.m.fecha.localeCompare(b.m.fecha) || a.orden - b.orden);

  let acumulado = 0;
  const filas = propios.map(({ m }) => {
    acumulado = redondear(acumulado + efectoEnSaldo(m));
    return { m, saldo: acumulado };
  });

  const sumar = (tipo: Movimiento["tipo"]) =>
    propios.reduce((total, { m }) => (m.tipo === tipo ? total + Math.abs(efectoEnSaldo(m)) : total), 0);
  const saldo = acumulado;
  const compras = sumar("venta");
  const pagos = sumar("pago");
  const saldoAnterior = sumar("saldo_inicial");
  const ultimoPago = [...propios].reverse().find(({ m }) => m.tipo === "pago")?.m;
  const cantidadVentas = propios.filter(({ m }) => m.tipo === "venta").length;
  const cantidadPagos = propios.filter(({ m }) => m.tipo === "pago").length;

  // El filtro sólo recorta lo que se muestra: el saldo de cada fila sigue siendo el acumulado real.
  const desde = inicioDePeriodo(periodo);
  const visibles = desde ? filas.filter(({ m }) => m.fecha >= desde) : filas;
  const delPeriodo = (tipo: Movimiento["tipo"]) =>
    visibles.reduce((total, { m }) => (m.tipo === tipo ? total + Math.abs(efectoEnSaldo(m)) : total), 0);

  const opciones = OPCIONES.filter((o) => puedeCargar || !o.requiereCargar);
  const actual = opciones.find((o) => o.id === vista) ?? opciones[0];
  const volver = () => {
    setEditando(null);
    setVista("historial");
  };
  const elegir = (id: VistaId) => {
    setEditando(null);
    setVista(id);
  };
  const titulo = editando ? (editando.tipo === "venta" ? "Corregir venta" : "Corregir pago") : actual.titulo;

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Cuenta corriente" opciones={opciones} seleccion={vista} onSelect={elegir} fija={false} desplazamiento="xl:mt-[6.625rem]">
        <CardLateral titulo="Datos del cliente">
          <Lista
            filas={[
              ["N°", String(cliente.numero)],
              ["Titular", cliente.titular],
              ["Dirección", cliente.direccion],
              ["Localidad", cliente.localidad],
              ["C.U.I.T.", cliente.cuit],
              ["Contacto", cliente.contacto],
              ["Observaciones", cliente.observaciones],
            ]}
          />
        </CardLateral>
      </PanelOpciones>

      <div className="min-w-0 flex-1">
        <Link href="/clientes" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand">
          <ChevronLeftIcon className="h-4 w-4" />
          Clientes
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <Iniciales nombre={cliente.nombreFantasia} className="h-12 w-12 text-base" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-brand">{cliente.nombreFantasia}</h1>
            <p className="text-sm text-slate-500">
              {[cliente.titular, cliente.localidad].filter(Boolean).join(" · ") || "Sin titular cargado"}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tarjeta titulo="Saldo adeudado" valor={pesos(saldo)} nota={saldo > 0 ? "Pendiente de cobro" : "Al día"} destacada />
          <Tarjeta
            titulo="Compras"
            valor={pesos(compras)}
            nota={`${cantidadVentas} ${cantidadVentas === 1 ? "remito" : "remitos"}${saldoAnterior ? ` · más saldo anterior ${pesos(saldoAnterior)}` : ""}`}
          />
          <Tarjeta titulo="Pagado" valor={pesos(pagos)} nota={`${cantidadPagos} ${cantidadPagos === 1 ? "pago" : "pagos"}`} />
          <Tarjeta
            titulo="Último pago"
            valor={ultimoPago ? pesos(-efectoEnSaldo(ultimoPago)) : "—"}
            nota={
              ultimoPago
                ? `${fechaAR(ultimoPago.fecha)}${ultimoPago.tipo === "pago" && ultimoPago.medioPago ? ` · ${etiquetaMedio(ultimoPago.medioPago)}` : ""}`
                : "Sin pagos registrados"
            }
          />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-lg font-bold text-brand">{titulo}</h2>
          {vista === "historial" && !editando && (
            <>
              <FiltroPeriodo periodo={periodo} onChange={setPeriodo} />
              {/* El PDF respeta el período elegido. */}
              <a
                href={`/api/clientes/${cliente.id}/resumen?periodo=${periodo}`}
                className={`${BOTON_SECUNDARIO} ml-auto !px-3 !py-1.5`}
                title="Descargar el resumen de cuenta para enviarle al cliente"
              >
                <DownloadIcon className="h-4 w-4" />
                Descargar PDF
              </a>
            </>
          )}
        </div>

        {vista === "historial" && !editando && desde && (
          <p className="mb-3 text-sm text-slate-600">
            Desde el {fechaAR(desde)}: compras <strong className="text-slate-900">{pesos(delPeriodo("venta"))}</strong> · pagos{" "}
            <strong className="text-emerald-700">{pesos(delPeriodo("pago"))}</strong>
          </p>
        )}

        {editando?.tipo === "venta" && <FormVenta key={editando.id} clienteId={cliente.id} stock={stock} venta={editando} onListo={volver} />}
        {editando?.tipo === "pago" && <FormPago key={editando.id} clienteId={cliente.id} saldo={saldo} pago={editando} onListo={volver} />}
        {!editando && vista === "historial" && (
          <Historial filas={visibles} filtrado={desde !== null} puedeCargar={puedeCargar} puedeBorrar={puedeBorrar} onEditar={setEditando} />
        )}
        {!editando && vista === "venta" && <FormVenta clienteId={cliente.id} stock={stock} onListo={volver} />}
        {!editando && vista === "pago" && <FormPago clienteId={cliente.id} saldo={saldo} onListo={volver} />}
        {!editando && vista === "editar" && <FormCliente cliente={cliente} onListo={volver} onCancelar={volver} />}
      </div>
    </div>
  );
}
