"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { crearCliente } from "@/app/acciones";
import { CardLateral } from "@/components/layout/CardLateral";
import { FunnelIcon, UserPlusIcon, UsersIcon } from "@/components/layout/icons";
import { PanelOpciones } from "@/components/layout/PanelOpciones";
import { BOTON, BOTON_SECUNDARIO, CAMPO, fechaAR, haceDiasISO, pesos } from "@/lib/formato";
import { saldoDe, type Cliente, type Movimiento, type NuevoCliente } from "@/lib/tipos";
import { Campo, Iniciales, Lista } from "./comunes";
import { FILTROS_VACIOS, FiltrosClientes, filtrosActivos, SIN_LOCALIDAD, type Filtros } from "./FiltrosClientes";

const OPCIONES = [
  { id: "lista", label: "Lista de clientes", Icon: UsersIcon },
  { id: "nuevo", label: "Nuevo cliente", Icon: UserPlusIcon },
] as const;

type VistaId = (typeof OPCIONES)[number]["id"];

const CLIENTE_VACIO: NuevoCliente = {
  nombreFantasia: "",
  titular: "",
  direccion: "",
  localidad: "",
  cuit: "",
  contacto: "",
  observaciones: "",
};

function FormCliente({ onCancelar }: { onCancelar: () => void }) {
  const router = useRouter();
  const [datos, setDatos] = useState<NuevoCliente>(CLIENTE_VACIO);
  const [error, setError] = useState("");
  const [guardando, iniciar] = useTransition();

  const cambiar = (campo: keyof NuevoCliente) => (e: { target: { value: string } }) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!datos.nombreFantasia.trim()) {
      setError("Ingresá el nombre de fantasía.");
      return;
    }
    setError("");
    iniciar(async () => {
      const r = await crearCliente(datos);
      if (r.ok) router.push(`/clientes/${r.dato.id}`);
      else setError(r.error);
    });
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
        <Campo label="Observaciones" className="sm:col-span-2">
          <textarea className={CAMPO} rows={3} value={datos.observaciones} onChange={cambiar("observaciones")} />
        </Campo>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={guardando} className={`${BOTON} disabled:opacity-60`}>
          {guardando ? "Guardando..." : "Guardar cliente"}
        </button>
        <button type="button" onClick={onCancelar} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Lista de clientes con buscador y saldo; al tocar un cliente se abre su cuenta corriente. */
export function ListaClientes({ clientes, movimientos }: { clientes: Cliente[]; movimientos: Movimiento[] }) {
  const router = useRouter();
  const [vista, setVista] = useState<VistaId>("lista");
  const [busqueda, setBusqueda] = useState("");

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Último pago de cada cliente (los movimientos pueden no venir ordenados por fecha).
  const ultimoPago = new Map<string, { fecha: string; importe: number }>();
  for (const m of movimientos) {
    if (m.tipo !== "pago") continue;
    const previo = ultimoPago.get(m.clienteId);
    if (!previo || m.fecha >= previo.fecha) ultimoPago.set(m.clienteId, { fecha: m.fecha, importe: m.importe });
  }

  const conSaldo = clientes.map((c) => ({ cliente: c, saldo: saldoDe(c.id, movimientos), pago: ultimoPago.get(c.id) ?? null }));

  const porLocalidad = new Map<string, number>();
  for (const c of clientes) {
    const nombre = c.localidad.trim() || SIN_LOCALIDAD;
    porLocalidad.set(nombre, (porLocalidad.get(nombre) ?? 0) + 1);
  }
  const localidades = [...porLocalidad.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => Number(a.nombre === SIN_LOCALIDAD) - Number(b.nombre === SIN_LOCALIDAD) || a.nombre.localeCompare(b.nombre, "es"));

  const hace7 = haceDiasISO(7);
  const hace30 = haceDiasISO(30);
  const q = busqueda.trim().toLowerCase();
  const filtrados = conSaldo
    .filter(({ cliente: c, saldo, pago }) => {
      if (q && ![c.nombreFantasia, c.titular, c.localidad, c.cuit, String(c.numero)].some((texto) => texto.toLowerCase().includes(q)))
        return false;
      if (filtros.localidades.length > 0 && !filtros.localidades.includes(c.localidad.trim() || SIN_LOCALIDAD)) return false;
      if (filtros.saldo === "con_saldo" && !(saldo > 0)) return false;
      if (filtros.saldo === "al_dia" && saldo > 0) return false;
      if (filtros.ultimoPago === "7" && !(pago && pago.fecha >= hace7)) return false;
      if (filtros.ultimoPago === "30" && !(pago && pago.fecha >= hace30)) return false;
      if (filtros.ultimoPago === "mas_30" && !(pago && pago.fecha < hace30)) return false;
      if (filtros.ultimoPago === "nunca" && pago) return false;
      return true;
    })
    .sort((a, b) => {
      if (filtros.orden === "nombre") return a.cliente.nombreFantasia.localeCompare(b.cliente.nombreFantasia, "es");
      if (filtros.orden === "saldo") return b.saldo - a.saldo || a.cliente.numero - b.cliente.numero;
      if (filtros.orden === "ultimo_pago") return (b.pago?.fecha ?? "").localeCompare(a.pago?.fecha ?? "") || a.cliente.numero - b.cliente.numero;
      return a.cliente.numero - b.cliente.numero;
    });
  const activos = filtrosActivos(filtros);
  const totalACobrar = conSaldo.reduce((total, { saldo }) => total + saldo, 0);
  const conDeuda = conSaldo.filter(({ saldo }) => saldo > 0).length;

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Clientes" opciones={OPCIONES} seleccion={vista} onSelect={setVista} fija={false} desplazamiento="xl:mt-14">
        <CardLateral titulo="Resumen">
          <Lista
            filas={[
              ["Clientes", String(clientes.length)],
              ["Con saldo pendiente", String(conDeuda)],
              ["Total a cobrar", pesos(totalACobrar)],
            ]}
          />
        </CardLateral>
      </PanelOpciones>

      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold text-brand">{vista === "nuevo" ? "Nuevo cliente" : "Clientes"}</h1>

        {vista === "nuevo" ? (
          <FormCliente onCancelar={() => setVista("lista")} />
        ) : (
          <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-brand-border p-4">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, titular o localidad"
                aria-label="Buscar cliente"
                className={`${CAMPO} max-w-sm`}
              />
              <button
                type="button"
                onClick={() => setFiltrosAbiertos(true)}
                aria-label={activos > 0 ? `Filtros (${activos} activos)` : "Filtros"}
                title="Filtros"
                className={`relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border transition-colors ${
                  activos > 0
                    ? "border-brand bg-brand text-white hover:bg-brand-hover"
                    : "border-brand-border bg-white text-slate-600 hover:bg-brand-soft hover:text-brand"
                }`}
              >
                <FunnelIcon className="h-5 w-5" />
                {activos > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-accent px-1 text-[11px] font-bold text-brand-deep ring-2 ring-white">
                    {activos}
                  </span>
                )}
              </button>
              <span className="text-sm text-slate-500">
                {filtrados.length} {filtrados.length === 1 ? "cliente" : "clientes"}
              </span>
              {activos > 0 && (
                <button type="button" onClick={() => setFiltros(FILTROS_VACIOS)} className="text-sm font-semibold text-brand hover:underline">
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
                  <tr>
                    <th className="w-12 px-4 py-3 font-semibold">N°</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Localidad</th>
                    <th className="px-4 py-3 font-semibold">Último pago</th>
                    <th className="px-4 py-3 text-right font-semibold">Saldo adeudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filtrados.map(({ cliente: c, saldo, pago }) => (
                    <tr
                      key={c.id}
                      tabIndex={0}
                      onClick={() => router.push(`/clientes/${c.id}`)}
                      onKeyDown={(e) => e.key === "Enter" && router.push(`/clientes/${c.id}`)}
                      className="cursor-pointer hover:bg-brand-soft/60 focus:bg-brand-soft/60 focus:outline-none"
                    >
                      <td className="px-4 py-3 text-slate-500">{c.numero}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Iniciales nombre={c.nombreFantasia} className="h-9 w-9 text-sm" />
                          <div>
                            <p className="font-semibold text-slate-900">{c.nombreFantasia}</p>
                            <p className="text-xs text-slate-500">{c.titular || "Sin titular cargado"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-800">{c.localidad || "—"}</td>
                      <td className="px-4 py-3">
                        {pago ? (
                          <>
                            <p className="text-slate-800">{fechaAR(pago.fecha)}</p>
                            <p className="text-xs tabular-nums text-slate-500">{pesos(pago.importe)}</p>
                          </>
                        ) : (
                          <span className="text-slate-400">Sin pagos</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${saldo > 0 ? "text-slate-900" : "text-slate-400"}`}>
                        {pesos(saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtrados.length === 0 && (
                <div className="flex flex-col items-center gap-2 p-10 text-sm text-slate-500">
                  <UsersIcon className="h-6 w-6" />
                  {clientes.length === 0 ? "Todavía no hay clientes cargados." : "No hay clientes que coincidan con la búsqueda o los filtros."}
                </div>
              )}
            </div>
          </section>
        )}

        <FiltrosClientes
          abierto={filtrosAbiertos}
          onCerrar={() => setFiltrosAbiertos(false)}
          localidades={localidades}
          filtros={filtros}
          onChange={setFiltros}
          resultados={filtrados.length}
        />

      </div>
    </div>
  );
}
