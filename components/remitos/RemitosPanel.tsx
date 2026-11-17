"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { eliminarMovimiento } from "@/app/acciones";
import { FiltroPeriodo, Tarjeta, Vacio } from "@/components/clientes/comunes";
import { useAccion } from "@/components/comun/useAccion";
import { useNotificaciones } from "@/components/ui/Notificaciones";
import { DownloadIcon, EyeIcon, PlusIcon, PrinterIcon, ReceiptIcon, TrashIcon } from "@/components/layout/icons";
import { Autocompletar } from "@/components/ui/Autocompletar";
import { BOTON, BOTON_SECUNDARIO, fechaAR, inicioDePeriodo, kilos, pesos, type Periodo } from "@/lib/formato";
import { kilosDeRemito, resumenDeProductos, totalDeRemito, type Remito } from "@/lib/remito";
import { redondear, type Cliente, type Movimiento } from "@/lib/tipos";

const EN_PERIODO: Record<Periodo, string> = {
  todo: "en total",
  semana: "esta semana",
  mes: "este mes",
  trimestre: "este trimestre",
  semestre: "este semestre",
  anio: "este año",
};

const TD = "px-3 py-3 align-middle";
const ICONO = "inline-flex rounded-md p-1.5 text-slate-500 hover:bg-brand-soft hover:text-brand";

/** Nuevo remito: se elige el cliente y se abre su cuenta con el formulario de venta listo. */
function NuevoRemito({ clientes, onCerrar }: { clientes: Cliente[]; onCerrar: () => void }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  function continuar() {
    const pedido = nombre.trim().toLowerCase();
    const cliente = clientes.find((c) => c.nombreFantasia.toLowerCase() === pedido);
    if (!cliente) return setError("Elegí un cliente de la lista.");
    router.push(`/clientes/${cliente.id}?vista=venta`);
  }

  return (
    <div className="mb-5 rounded-lg border border-brand-border bg-white p-5">
      <h2 className="mb-1 text-sm font-semibold text-brand">Nuevo remito</h2>
      <p className="mb-3 text-sm text-slate-500">Elegí el cliente: se abre su cuenta con la venta lista para cargar. Al guardarla, el remito queda en esta lista.</p>
      <div className="max-w-md">
        <Autocompletar
          value={nombre}
          onChange={(v) => {
            setNombre(v);
            setError("");
          }}
          sugerencias={clientes.map((c) => c.nombreFantasia)}
          placeholder="Escribí o elegí un cliente"
          ariaLabel="Cliente"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={continuar} className={BOTON}>
          Cargar remito
        </button>
        <button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/** Todos los remitos (ventas) de todos los clientes, para buscarlos, verlos, imprimirlos o bajarlos en PDF. */
export function RemitosPanel({
  clientes,
  movimientos,
  puedeCargar,
  puedeBorrar,
}: {
  clientes: Cliente[];
  movimientos: Movimiento[];
  puedeCargar: boolean;
  puedeBorrar: boolean;
}) {
  const { pendiente, error, correr } = useAccion();
  const { confirmar } = useNotificaciones();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);

  const nombreDe = new Map(clientes.map((c) => [c.id, c.nombreFantasia]));
  const desde = inicioDePeriodo(periodo);

  const remitos = movimientos
    .map((m, orden) => ({ m, orden }))
    .filter((x): x is { m: Remito; orden: number } => x.m.tipo === "venta" && (!desde || x.m.fecha >= desde))
    // Del más nuevo al más viejo.
    .sort((a, b) => b.m.fecha.localeCompare(a.m.fecha) || b.orden - a.orden)
    .map(({ m }) => m);

  async function eliminar(r: Remito) {
    const cliente = nombreDe.get(r.clienteId) ?? "el cliente";
    const ok = await confirmar({
      titulo: `¿Eliminar el remito ${r.comprobante ? `N° ${r.comprobante}` : "sin número"}?`,
      mensaje: `Es de ${cliente}. Se borra la venta y el saldo del cliente se recalcula. No se puede deshacer.`,
      confirmar: "Eliminar remito",
      peligro: true,
    });
    if (ok) correr(() => eliminarMovimiento(r.id), undefined, "Remito eliminado");
  }

  const q = busqueda.trim().toLowerCase();
  const visibles = remitos.filter(
    (r) =>
      !q ||
      (nombreDe.get(r.clienteId) ?? "").toLowerCase().includes(q) ||
      r.comprobante.toLowerCase().includes(q) ||
      r.items.some((i) => i.detalle.toLowerCase().includes(q)),
  );
  const totalVisible = redondear(visibles.reduce((t, r) => t + totalDeRemito(r), 0));
  const kilosVisibles = redondear(visibles.reduce((t, r) => t + kilosDeRemito(r), 0));

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold text-brand">Remitos</h1>
        <FiltroPeriodo periodo={periodo} onChange={setPeriodo} />
        {puedeCargar && !creando && (
          <button type="button" onClick={() => setCreando(true)} className={`${BOTON} ml-auto !px-3 !py-1.5`}>
            <PlusIcon className="h-4 w-4" />
            Nuevo remito
          </button>
        )}
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Cada venta es un remito. Desde acá lo ves, lo imprimís o lo descargás en PDF para entregarlo al cliente.
      </p>

      {creando && <NuevoRemito clientes={clientes} onCerrar={() => setCreando(false)} />}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tarjeta titulo={`Remitos ${EN_PERIODO[periodo]}`} valor={String(visibles.length)} nota={q ? "Según la búsqueda" : "Ventas del período"} />
        <Tarjeta titulo="Kilos" valor={`${kilos(kilosVisibles)} kg`} nota="Sin contar lo vendido por unidad" />
        <Tarjeta titulo="Total" valor={pesos(totalVisible)} nota="Suma de los remitos" destacada />
      </div>

      <input
        className="mb-4 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        placeholder="Buscar por cliente, N° de remito o producto"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        aria-label="Buscar remito"
      />

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      {visibles.length === 0 ? (
        <Vacio icono={<ReceiptIcon className="h-6 w-6" />}>{q || desde ? "No hay remitos con ese filtro." : "Todavía no hay remitos cargados."}</Vacio>
      ) : (
        <section className={`overflow-hidden rounded-lg border border-brand-border bg-white ${pendiente ? "opacity-60" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
                <tr>
                  <th className={`${TD} font-semibold`}>Fecha</th>
                  <th className={`${TD} font-semibold`}>N° remito</th>
                  <th className={`${TD} font-semibold`}>Cliente</th>
                  <th className={`${TD} font-semibold`}>Productos</th>
                  <th className={`${TD} text-right font-semibold`}>Kilos</th>
                  <th className={`${TD} text-right font-semibold`}>Total</th>
                  <th className="w-36" />
                </tr>
              </thead>
              <tbody>
                {visibles.map((r) => (
                  <tr key={r.id} className="border-t border-brand-border hover:bg-slate-50">
                    <td className={`${TD} whitespace-nowrap text-slate-800`}>{fechaAR(r.fecha)}</td>
                    <td className={`${TD} max-w-[7rem] truncate text-slate-600`} title={r.comprobante || undefined}>
                      {r.comprobante || <span className="text-slate-400">—</span>}
                    </td>
                    <td className={`${TD} max-w-[14rem] truncate font-medium text-slate-900`}>
                      <Link href={`/clientes/${r.clienteId}`} className="hover:text-brand hover:underline" title="Abrir la cuenta del cliente">
                        {nombreDe.get(r.clienteId) ?? "(cliente eliminado)"}
                      </Link>
                    </td>
                    <td className={`${TD} max-w-[16rem] truncate text-slate-600`} title={resumenDeProductos(r)}>
                      {resumenDeProductos(r)}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-right tabular-nums text-slate-800`}>{kilos(kilosDeRemito(r))}</td>
                    <td className={`${TD} whitespace-nowrap text-right font-semibold tabular-nums text-slate-900`}>{pesos(totalDeRemito(r))}</td>
                    <td className="whitespace-nowrap pr-2 text-right">
                      <Link href={`/remitos/${r.id}`} className={ICONO} title="Ver remito" aria-label="Ver remito">
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <a href={`/api/remitos/${r.id}?ver=1`} target="_blank" rel="noopener" className={ICONO} title="Imprimir" aria-label="Imprimir remito">
                        <PrinterIcon className="h-4 w-4" />
                      </a>
                      <a href={`/api/remitos/${r.id}`} className={ICONO} title="Descargar PDF" aria-label="Descargar PDF del remito">
                        <DownloadIcon className="h-4 w-4" />
                      </a>
                      {puedeBorrar && (
                        <button
                          type="button"
                          onClick={() => eliminar(r)}
                          disabled={pendiente}
                          className="inline-flex rounded-md p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          title="Eliminar remito"
                          aria-label="Eliminar remito"
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
    </div>
  );
}
