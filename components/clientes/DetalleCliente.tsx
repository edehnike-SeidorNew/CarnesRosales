"use client";

import { useState } from "react";
import Link from "next/link";
import { eliminarMovimiento } from "@/app/acciones";
import { useAccion } from "@/components/comun/useAccion";
import { useNotificaciones } from "@/components/ui/Notificaciones";
import { CardLateral } from "@/components/layout/CardLateral";
import { CashIcon, ChevronLeftIcon, DownloadIcon, HistoryIcon, PencilIcon, EyeIcon, PlusIcon, PrinterIcon, ReceiptIcon, TagIcon, TrashIcon, WhatsAppIcon } from "@/components/layout/icons";
import { FormCobro } from "@/components/cobranzas/FormCobro";
import { deudaDeCliente } from "@/lib/cobranzas";
import { PanelOpciones, type OpcionPanel } from "@/components/layout/PanelOpciones";
import { useFiltroPeriodo } from "@/components/comun/useFiltroPeriodo";
import { BOTON_SECUNDARIO, describirRango, enPeriodo, fechaAR, hoyISO, kilos, pesos } from "@/lib/formato";
import { efectoEnSaldo, etiquetaMedio, redondear, subtotalItem, type Cliente, type Movimiento, type StockDeProducto } from "@/lib/tipos";
import { Autor, FiltroPeriodo, Iniciales, Lista, Tarjeta, Vacio } from "./comunes";
import { FormCliente } from "./FormCliente";
import { FormCargo, FormDescuento, FormPago, FormVenta } from "./Formularios";

type VistaId = "historial" | "venta" | "pago" | "descuento" | "cargo" | "cobro" | "editar";

const OPCIONES: (OpcionPanel<VistaId> & { titulo: string; requiereCargar: boolean })[] = [
  { id: "historial", label: "Historial", titulo: "Historial de movimientos", Icon: HistoryIcon, requiereCargar: false },
  { id: "venta", label: "Registrar venta", titulo: "Registrar venta", Icon: ReceiptIcon, requiereCargar: true },
  { id: "pago", label: "Registrar pago", titulo: "Registrar pago", Icon: CashIcon, requiereCargar: true },
  { id: "descuento", label: "Registrar descuento", titulo: "Registrar descuento", Icon: TagIcon, requiereCargar: true },
  { id: "cargo", label: "Registrar cargo", titulo: "Registrar cargo", Icon: PlusIcon, requiereCargar: true },
  { id: "cobro", label: "Aviso por WhatsApp", titulo: "Aviso de cobro por WhatsApp", Icon: WhatsAppIcon, requiereCargar: false },
  { id: "editar", label: "Editar cliente", titulo: "Editar cliente", Icon: PencilIcon, requiereCargar: true },
];

const TD = "px-2.5 py-2.5 align-middle";
const NUM = `${TD} whitespace-nowrap text-right tabular-nums`;

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
  const { confirmar } = useNotificaciones();

  async function borrar(m: Movimiento) {
    const que = m.tipo === "venta" ? "venta" : m.tipo === "pago" ? "pago" : m.tipo === "descuento" ? "descuento" : m.tipo === "cargo" ? "cargo" : "movimiento";
    const ok = await confirmar({
      titulo: `¿Eliminar ${m.tipo === "venta" ? "esta" : "este"} ${que}?`,
      mensaje: "El saldo del cliente se recalcula. No se puede deshacer.",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (ok) correr(() => eliminarMovimiento(m.id), undefined, `${que.charAt(0).toUpperCase()}${que.slice(1)} ${m.tipo === "venta" ? "eliminada" : "eliminado"}`);
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
          <table className="tabla-cards tabla-cards-grupo w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand [&_th]:align-middle">
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
                  : [{ detalle: m.tipo === "pago" ? "Pago" : m.tipo === "descuento" ? `Descuento${m.nota ? ` · ${m.nota}` : ""}` : m.tipo === "cargo" ? `Cargo${m.nota ? ` · ${m.nota}` : ""}` : "Saldo anterior", kilos: "", precio: "", subtotal: "" }];
              const ultimo = renglones.length - 1;
              const importe = efectoEnSaldo(m);

              const botones = (
                <>
                  {m.tipo === "venta" && (
                    <Link href={`/remitos/${m.id}`} aria-label="Ver remito" title="Ver remito" className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-brand-soft hover:text-brand">
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  )}
                  {puedeCargar && m.tipo !== "saldo_inicial" && (
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
                  {puedeBorrar && (
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
                </>
              );

              return (
                // Un tbody por movimiento: una venta con varios productos se lee como un solo bloque.
                <tbody key={m.id} className="border-t border-brand-border">
                  {renglones.map((r, i) => (
                    <tr key={i} className={m.tipo === "pago" ? "bg-emerald-50/50" : m.tipo === "descuento" ? "bg-amber-50/60" : m.tipo === "cargo" ? "bg-sky-50/70" : ""}>
                      <td data-label="Fecha" className={`${TD} titulo g-inicio whitespace-nowrap text-slate-800`}>{i === 0 ? fechaAR(m.fecha) : ""}</td>
                      <td data-label="N° comprobante" className={`${TD} g-inicio max-w-[6rem] truncate text-slate-500`} title={i === 0 ? m.comprobante : undefined}>{i === 0 ? m.comprobante : ""}</td>
                      <td data-label="Concepto" className={`${TD} max-w-[14rem] truncate font-medium ${m.tipo === "pago" ? "text-emerald-800" : m.tipo === "descuento" ? "text-amber-800" : m.tipo === "cargo" ? "text-sky-800" : "text-slate-900"}`} title={r.detalle}>{r.detalle}</td>
                      <td data-label="Medio de pago" className={`${TD} g-inicio whitespace-nowrap ${m.tipo === "pago" && m.medioPago ? "text-slate-800" : "text-slate-400"}`}>
                        {m.tipo === "pago" ? etiquetaMedio(m.medioPago) : ""}
                      </td>
                      <td data-label="Kilos" className={`${NUM} text-slate-800`}>{r.kilos}</td>
                      <td data-label="Precio por kilo" className={`${NUM} text-slate-800`}>{r.precio}</td>
                      <td data-label="Subtotal" className={`${NUM} text-slate-800`}>{r.subtotal}</td>
                      <td data-label="Total compra" className={`${NUM} g-fin text-slate-900`}>{i === ultimo && importe > 0 ? pesos(importe) : ""}</td>
                      <td data-label="Pago entrante" className={`${NUM} g-fin font-semibold ${m.tipo === "descuento" ? "text-amber-700" : "text-emerald-700"}`}>{i === ultimo && importe < 0 ? pesos(-importe) : ""}</td>
                      <td data-label="Saldo adeudado" className={`${NUM} g-fin font-semibold text-slate-900`}>{i === ultimo ? pesos(saldo) : ""}</td>
                      <td data-label="Cargó" className={`${TD} solo-escritorio max-w-[6.5rem] truncate text-xs text-slate-500`}>{i === 0 && <Autor email={m.creadoPor} />}</td>
                      <td className="acciones solo-escritorio whitespace-nowrap pr-2 text-right">{i === 0 && botones}</td>
                      {/* En celular quien cargó y los botones van al final de la card, después del total y el saldo. */}
                      <td data-label="Cargó" className={`${TD} g-fin solo-celular text-xs text-slate-500`}>{i === ultimo && <Autor email={m.creadoPor} />}</td>
                      <td className="acciones solo-celular whitespace-nowrap pr-2 text-right">{i === ultimo && botones}</td>
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
  vistaInicial,
  editarId,
}: {
  cliente: Cliente;
  /** Sólo los movimientos de este cliente. */
  movimientos: Movimiento[];
  stock: StockDeProducto[];
  puedeCargar: boolean;
  puedeBorrar: boolean;
  /** Pantalla con la que abre (sólo si puede cargar): por ejemplo la venta, al venir de Nuevo remito. */
  vistaInicial?: VistaId;
  /** Venta que se abre para corregir (al venir de Remitos > Editar). */
  editarId?: string;
}) {
  const [vista, setVista] = useState<VistaId>(vistaInicial && (puedeCargar || vistaInicial === "cobro") ? vistaInicial : "historial");
  const [editando, setEditando] = useState<Movimiento | null>(() =>
    puedeCargar && editarId ? (movimientos.find((m) => m.id === editarId && m.tipo === "venta") ?? null) : null,
  );
  const { periodo, fecha, setPeriodo, setFecha, desde, hasta } = useFiltroPeriodo("todo");

  // Orden cronológico; a igual fecha, en el orden en que se cargaron.
  const propios = movimientos
    .map((m, orden) => ({ m, orden }))
    .sort(
      (a, b) =>
        // El saldo anterior va siempre primero, aunque se haya cargado después.
        Number(b.m.tipo === "saldo_inicial") - Number(a.m.tipo === "saldo_inicial") || a.m.fecha.localeCompare(b.m.fecha) || a.orden - b.orden,
    );

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
  const descuentos = sumar("descuento");
  const cargos = sumar("cargo");
  const saldoAnterior = sumar("saldo_inicial");
  const ultimoPago = [...propios].reverse().find(({ m }) => m.tipo === "pago")?.m;
  const cantidadVentas = propios.filter(({ m }) => m.tipo === "venta").length;
  const cantidadPagos = propios.filter(({ m }) => m.tipo === "pago").length;
  const cantidadDescuentos = propios.filter(({ m }) => m.tipo === "descuento").length;

  // El filtro sólo recorta lo que se muestra: el saldo de cada fila sigue siendo el acumulado real.
  const visibles = filas.filter(({ m }) => enPeriodo(m.fecha, desde, hasta));
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
  const titulo = editando ? (editando.tipo === "venta" ? "Corregir venta" : editando.tipo === "descuento" ? "Corregir descuento" : editando.tipo === "cargo" ? "Corregir cargo" : "Corregir pago") : actual.titulo;

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
          <Tarjeta titulo="Saldo adeudado" valor={pesos(saldo)} nota={saldo > 0 ? "Pendiente de cobro" : "Al día"} destacada alerta={saldo > 0} />
          <Tarjeta
            titulo="Compras"
            valor={pesos(compras)}
            nota={`${cantidadVentas} ${cantidadVentas === 1 ? "remito" : "remitos"}${saldoAnterior ? ` · más saldo anterior ${pesos(saldoAnterior)}` : ""}${cargos ? ` · más cargos ${pesos(cargos)}` : ""}`}
          />
          <Tarjeta titulo="Pagado" valor={pesos(pagos)} nota={`${cantidadPagos} ${cantidadPagos === 1 ? "pago" : "pagos"}${descuentos ? ` · aparte, ${cantidadDescuentos} ${cantidadDescuentos === 1 ? "descuento" : "descuentos"} por ${pesos(descuentos)}` : ""}`} />
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
              <FiltroPeriodo periodo={periodo} onChange={setPeriodo} fecha={fecha} onFecha={setFecha} />
              {/* El PDF respeta el período elegido: con "Semana" trae sólo los movimientos de la semana. */}
              <div className="ml-auto flex flex-wrap gap-2">
                <a
                  href={`/api/clientes/${cliente.id}/resumen?periodo=${periodo}&fecha=${fecha}&ver=1`}
                  target="_blank"
                  rel="noopener"
                  className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}
                  title="Abrir el resumen del período elegido para imprimirlo"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Imprimir
                </a>
                <a
                  href={`/api/clientes/${cliente.id}/resumen?periodo=${periodo}&fecha=${fecha}`}
                  className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}
                  title="Descargar el resumen del período elegido para enviarle al cliente"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Descargar PDF
                </a>
              </div>
            </>
          )}
        </div>

        {vista === "historial" && !editando && desde && (
          <p className="mb-3 text-sm text-slate-600">
            {describirRango(desde, hasta).replace(/^./, (c) => c.toUpperCase())}: compras <strong className="text-slate-900">{pesos(delPeriodo("venta"))}</strong> · pagos{" "}
            <strong className="text-emerald-700">{pesos(delPeriodo("pago"))}</strong>
            {delPeriodo("descuento") > 0 && (
              <>
                {" "}
                · descuentos <strong className="text-amber-700">{pesos(delPeriodo("descuento"))}</strong>
              </>
            )}
          </p>
        )}

        {editando?.tipo === "venta" && <FormVenta key={editando.id} clienteId={cliente.id} stock={stock} venta={editando} onListo={volver} />}
        {editando?.tipo === "pago" && <FormPago key={editando.id} clienteId={cliente.id} saldo={saldo} pago={editando} onListo={volver} />}
        {editando?.tipo === "descuento" && <FormDescuento key={editando.id} clienteId={cliente.id} saldo={saldo} descuento={editando} onListo={volver} />}
        {editando?.tipo === "cargo" && <FormCargo key={editando.id} clienteId={cliente.id} saldo={saldo} cargo={editando} onListo={volver} />}
        {!editando && vista === "historial" && (
          <Historial filas={visibles} filtrado={desde !== null} puedeCargar={puedeCargar} puedeBorrar={puedeBorrar} onEditar={setEditando} />
        )}
        {!editando && vista === "venta" && <FormVenta clienteId={cliente.id} stock={stock} onListo={volver} />}
        {!editando && vista === "pago" && <FormPago clienteId={cliente.id} saldo={saldo} onListo={volver} />}
        {!editando && vista === "descuento" && <FormDescuento clienteId={cliente.id} saldo={saldo} onListo={volver} />}
        {!editando && vista === "cargo" && <FormCargo clienteId={cliente.id} saldo={saldo} onListo={volver} />}
        {!editando && vista === "cobro" && <FormCobro cliente={cliente} deuda={deudaDeCliente(cliente, movimientos, hoyISO())} />}
        {!editando && vista === "editar" && (
          <FormCliente
            cliente={cliente}
            saldoAnterior={saldoAnterior}
            tieneMovimientos={propios.some(({ m }) => m.tipo !== "saldo_inicial")}
            puedeBorrar={puedeBorrar}
            onListo={volver}
            onCancelar={volver}
          />
        )}
      </div>
    </div>
  );
}
