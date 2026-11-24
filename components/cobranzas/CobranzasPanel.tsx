"use client";

import { useState } from "react";
import Link from "next/link";
import { Tarjeta, Vacio } from "@/components/clientes/comunes";
import { BellIcon, UsersIcon, WhatsAppIcon } from "@/components/layout/icons";
import { deudasVencidas } from "@/lib/cobranzas";
import { fechaAR, hoyISO, pesos } from "@/lib/formato";
import { telefonoDeContacto } from "@/lib/remito";
import { redondear, type Cliente, type Movimiento } from "@/lib/tipos";

/** Cada filtro muestra sólo su tramo de días sin pagar: 7 = 7, 10 = de 8 a 10, 15 = de 11 a 15, 30 = de 16 a 30 y "+30" = más de 30. */
const PLAZOS = [
  { id: "7", label: "7 días", min: 7, max: 7 },
  { id: "10", label: "10 días", min: 8, max: 10 },
  { id: "15", label: "15 días", min: 11, max: 15 },
  { id: "30", label: "30 días", min: 16, max: 30 },
  { id: "mas30", label: "+ 30 días", min: 31, max: undefined },
  { id: "todos", label: "Todos", min: 0, max: undefined },
] as const;
type PlazoId = (typeof PLAZOS)[number]["id"];

const describir = (min: number, max?: number) => (min === 0 && max === undefined ? "cualquier cantidad de días" : max === undefined ? `más de ${min - 1} días` : min === max ? `${min} días` : `entre ${min} y ${max} días`);

/**
 * Clientes a los que se les vendió y ya pasaron N días sin pagar. Cada uno es una tarjeta roja con su teléfono,
 * lo que debe y desde qué compra; desde ahí se entra a su cuenta o se le manda el recordatorio por WhatsApp.
 */
export function CobranzasPanel({ clientes, movimientos }: { clientes: Cliente[]; movimientos: Movimiento[] }) {
  const [plazoId, setPlazoId] = useState<PlazoId>("7");
  const plazo = PLAZOS.find((p) => p.id === plazoId) ?? PLAZOS[0];
  const deudas = deudasVencidas(clientes, movimientos, hoyISO(), plazo.min, plazo.max);
  const total = redondear(deudas.reduce((t, d) => t + d.saldo, 0));
  // Lo mismo que "Total a cobrar" del Inicio: todos los clientes con saldo, tengan los días que tengan.
  const todos = deudasVencidas(clientes, movimientos, hoyISO(), 0);
  const totalGeneral = redondear(todos.reduce((t, d) => t + d.saldo, 0));
  const sinVencer = todos.filter((d) => d.dias < 7);
  const totalSinVencer = redondear(sinVencer.reduce((t, d) => t + d.saldo, 0));

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold text-brand">Cobranzas</h1>
        <div role="group" aria-label="Días sin pagar" className="flex flex-wrap items-center gap-1.5">
          {PLAZOS.map(({ id, label }) => {
            const activo = id === plazoId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPlazoId(id)}
                aria-pressed={activo}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
                  activo ? "bg-brand text-white ring-brand" : "bg-white text-slate-600 ring-brand-border hover:bg-brand-soft hover:text-brand"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        {plazo.id === "todos" ? "Todos los clientes que deben algo, tengan los días que tengan." : `Clientes que compraron y llevan ${describir(plazo.min, plazo.max)} sin pagar.`} La cuenta corre desde la compra más vieja que sigue sin cubrirse.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tarjeta titulo={`Clientes: ${plazo.label}`} valor={String(deudas.length)} nota="sin pagar" />
        <Tarjeta titulo="Monto adeudado" valor={pesos(total)} nota="de estos clientes" alerta />
        <Tarjeta titulo="Total a cobrar" valor={pesos(totalGeneral)} nota={`${todos.length} clientes con saldo · igual que el Inicio`} />
        <Tarjeta titulo="Todavía sin vencer" valor={pesos(totalSinVencer)} nota={`${sinVencer.length} clientes con menos de 7 días`} />
      </div>

      {deudas.length === 0 ? (
        <Vacio icono={<BellIcon className="h-6 w-6" />}>{plazo.id === "todos" ? "Ningún cliente debe nada." : `Ningún cliente lleva ${describir(plazo.min, plazo.max)} sin pagar.`}</Vacio>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deudas.map((d) => {
            const telefono = telefonoDeContacto(d.cliente.contacto) || d.cliente.contacto;
            return (
              <article key={d.cliente.id} className="flex flex-col rounded-xl bg-[#b4424d] p-3 text-white shadow-sm">
                <Link href={`/clientes/${d.cliente.id}`} className="block rounded-lg outline-offset-4 hover:opacity-95" title="Abrir la cuenta del cliente">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">Cliente N° {d.cliente.numero}</p>
                  <h2 className="truncate text-base font-bold">{d.cliente.nombreFantasia}</h2>
                  <p className="mt-0.5 truncate text-xs text-white/85">{telefono ? `Tel: ${telefono}` : "Sin teléfono cargado"}</p>

                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-white/75">Monto adeudado</p>
                  <p className="text-xl font-bold tabular-nums">{pesos(d.saldo)}</p>
                  <p className="mt-0.5 text-xs text-white/90">
                    {d.dias} {d.dias === 1 ? "día" : "días"} sin pagar · desde la compra del {fechaAR(d.desde)}
                  </p>
                </Link>

                <div className="mt-3 flex gap-1.5">
                  <Link
                    href={`/clientes/${d.cliente.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/15 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/25"
                  >
                    <UsersIcon className="h-4 w-4" />
                    Ver cuenta
                  </Link>
                  <Link
                    href={`/clientes/${d.cliente.id}?vista=cobro`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-[#b4424d] transition-colors hover:bg-white/90"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
