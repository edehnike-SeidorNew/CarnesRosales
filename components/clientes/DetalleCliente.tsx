"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { eliminarMovimiento } from "@/app/acciones";
import { CardLateral } from "@/components/layout/CardLateral";
import { CashIcon, ChevronLeftIcon, HistoryIcon, ReceiptIcon, TrashIcon } from "@/components/layout/icons";
import { PanelOpciones } from "@/components/layout/PanelOpciones";
import { fechaAR, inicioDePeriodo, kilos, pesos, type Periodo } from "@/lib/formato";
import { efectoEnSaldo, etiquetaMedio, redondear, subtotalItem, type Cliente, type Movimiento } from "@/lib/tipos";
import { FiltroPeriodo, Iniciales, Lista, Tarjeta } from "./comunes";
import { FormPago, FormVenta } from "./Formularios";

const OPCIONES = [
  { id: "historial", label: "Historial", titulo: "Historial de movimientos", Icon: HistoryIcon },
  { id: "venta", label: "Registrar venta", titulo: "Registrar venta", Icon: ReceiptIcon },
  { id: "pago", label: "Registrar pago", titulo: "Registrar pago", Icon: CashIcon },
] as const;

type VistaId = (typeof OPCIONES)[number]["id"];

const TD = "px-3 py-2.5";
const NUM = `${TD} text-right tabular-nums`;

function Historial({ filas, filtrado }: { filas: { m: Movimiento; saldo: number }[]; filtrado: boolean }) {
  const [borrando, iniciar] = useTransition();
  const [error, setError] = useState("");

  function borrar(m: Movimiento) {
    if (!window.confirm("¿Eliminar este movimiento? El saldo se recalcula.")) return;
    setError("");
    iniciar(async () => {
      const r = await eliminarMovimiento(m.id);
      if (!r.ok) setError(r.error);
    });
  }

  if (filas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-brand-border bg-white p-10 text-sm text-slate-500">
        <HistoryIcon className="h-6 w-6" />
        {filtrado
          ? "No hay movimientos en este período."
          : "Este cliente todavía no tiene movimientos. Registrá una venta o un pago desde el menú de la derecha."}
      </div>
    );
  }

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <section className={`overflow-hidden rounded-lg border border-brand-border bg-white ${borrando ? "opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
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
                <th className="w-10" />
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
                      <td className={`${TD} font-medium ${m.tipo === "pago" ? "text-emerald-800" : "text-slate-900"}`}>
                        {r.detalle}
                      </td>
                      <td className={`${TD} whitespace-nowrap ${m.tipo === "pago" && m.medioPago ? "text-slate-800" : "text-slate-400"}`}>
                        {m.tipo === "pago" ? etiquetaMedio(m.medioPago) : ""}
                      </td>
                      <td className={`${NUM} text-slate-800`}>{r.kilos}</td>
                      <td className={`${NUM} text-slate-800`}>{r.precio}</td>
                      <td className={`${NUM} text-slate-800`}>{r.subtotal}</td>
                      <td className={`${NUM} text-slate-900`}>{i === ultimo && importe > 0 ? pesos(importe) : ""}</td>
                      <td className={`${NUM} font-semibold text-emerald-700`}>{i === ultimo && importe < 0 ? pesos(-importe) : ""}</td>
                      <td className={`${NUM} font-semibold text-slate-900`}>{i === ultimo ? pesos(saldo) : ""}</td>
                      <td className="pr-2 text-right">
                        {i === 0 && (
                          <button
                            type="button"
                            onClick={() => borrar(m)}
                            disabled={borrando}
                            aria-label="Eliminar movimiento"
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

/** Cuenta corriente de un cliente: saldo en cards, historial y carga de ventas y pagos. */
export function DetalleCliente({
  cliente,
  movimientos,
  productos,
}: {
  cliente: Cliente;
  /** Sólo los movimientos de este cliente. */
  movimientos: Movimiento[];
  productos: string[];
}) {
  const [vista, setVista] = useState<VistaId>("historial");
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

  const actual = OPCIONES.find((o) => o.id === vista) ?? OPCIONES[0];
  const volver = () => setVista("historial");

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones
        titulo="Cuenta corriente"
        opciones={OPCIONES}
        seleccion={vista}
        onSelect={setVista}
        fija={false}
        desplazamiento="xl:mt-[6.625rem]"
      >
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
          <h2 className="text-lg font-bold text-brand">{actual.titulo}</h2>
          {vista === "historial" && <FiltroPeriodo periodo={periodo} onChange={setPeriodo} />}
        </div>

        {vista === "historial" && desde && (
          <p className="mb-3 text-sm text-slate-600">
            Desde el {fechaAR(desde)}: compras <strong className="text-slate-900">{pesos(delPeriodo("venta"))}</strong> · pagos{" "}
            <strong className="text-emerald-700">{pesos(delPeriodo("pago"))}</strong>
          </p>
        )}

        {vista === "historial" && <Historial filas={visibles} filtrado={desde !== null} />}
        {vista === "venta" && <FormVenta clienteId={cliente.id} productos={productos} onListo={volver} />}
        {vista === "pago" && <FormPago clienteId={cliente.id} saldo={saldo} onListo={volver} />}
      </div>
    </div>
  );
}
