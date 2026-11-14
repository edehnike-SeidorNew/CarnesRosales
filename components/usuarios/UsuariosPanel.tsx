"use client";

import { useState, type FormEvent } from "react";
import { cambiarActivoUsuario, cambiarRolUsuario, cancelarInvitacion, invitarUsuario } from "@/app/acciones";
import { Campo, Vacio } from "@/components/clientes/comunes";
import { useAccion } from "@/components/comun/useAccion";
import { CardLateral } from "@/components/layout/CardLateral";
import { ShieldIcon, TrashIcon, UserPlusIcon, UsersIcon } from "@/components/layout/icons";
import { PanelOpciones } from "@/components/layout/PanelOpciones";
import { ROL_DESCRIPCION, ROL_LABEL, ROLES, type Rol } from "@/lib/auth/roles";
import { BOTON, BOTON_SECUNDARIO, CAMPO } from "@/lib/formato";
import type { Invitacion, Miembro } from "@/lib/tipos";

const OPCIONES = [
  { id: "usuarios", label: "Usuarios", Icon: UsersIcon },
  { id: "invitar", label: "Invitar usuario", Icon: UserPlusIcon },
] as const;

type VistaId = (typeof OPCIONES)[number]["id"];
const TD = "px-4 py-3";

function FormInvitar({ onListo }: { onListo: () => void }) {
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol>("vendedor");
  const { pendiente, error, correr } = useAccion();

  function enviar(e: FormEvent) {
    e.preventDefault();
    correr(() => invitarUsuario(email, rol), onListo);
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-brand-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Email de la persona">
          <input type="email" required className={CAMPO} value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </Campo>
        <Campo label="Rol">
          <select className={CAMPO} value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROL_LABEL[r]}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <p className="mt-3 text-sm text-slate-600">{ROL_DESCRIPCION[rol]}</p>
      <p className="mt-3 rounded-xl bg-brand-soft px-4 py-3 text-sm text-slate-700">
        La invitación no manda un mail: avisale a la persona que entre a la app, toque <strong>“Creá tu cuenta”</strong> y se registre con este
        mismo email. Al hacerlo entra directamente con el rol que elegiste.
      </p>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : "Invitar"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Usuarios y roles. Sólo la ven los administradores (la base lo vuelve a verificar con RLS). */
export function UsuariosPanel({ miembros, invitaciones, yoId }: { miembros: Miembro[]; invitaciones: Invitacion[]; yoId: string }) {
  const [vista, setVista] = useState<VistaId>("usuarios");
  const { pendiente, error, correr } = useAccion();

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Usuarios" opciones={OPCIONES} seleccion={vista} onSelect={setVista} fija={false} desplazamiento="xl:mt-14">
        <CardLateral titulo="Qué puede hacer cada rol">
          <dl className="space-y-3 text-sm">
            {ROLES.map((r) => (
              <div key={r}>
                <dt className="font-semibold text-slate-900">{ROL_LABEL[r]}</dt>
                <dd className="text-slate-600">{ROL_DESCRIPCION[r]}</dd>
              </div>
            ))}
          </dl>
        </CardLateral>
      </PanelOpciones>

      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold text-brand">{vista === "invitar" ? "Invitar usuario" : "Usuarios y roles"}</h1>

        {vista === "invitar" ? (
          <FormInvitar onListo={() => setVista("usuarios")} />
        ) : (
          <>
            {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
            <section className={`overflow-hidden rounded-lg border border-brand-border bg-white ${pendiente ? "opacity-60" : ""}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
                    <tr>
                      <th className={`${TD} font-semibold`}>Usuario</th>
                      <th className={`${TD} font-semibold`}>Rol</th>
                      <th className={`${TD} font-semibold`}>Estado</th>
                      <th className={`${TD} text-right font-semibold`}>Acceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {miembros.map((m) => {
                      const soyYo = m.id === yoId;
                      return (
                        <tr key={m.id}>
                          <td className={TD}>
                            <p className="font-semibold text-slate-900">
                              {m.email} {soyYo && <span className="font-normal text-slate-500">(vos)</span>}
                            </p>
                            {m.nombre && <p className="text-xs text-slate-500">{m.nombre}</p>}
                          </td>
                          <td className={TD}>
                            {soyYo ? (
                              <span className="text-slate-800">{ROL_LABEL[m.rol]}</span>
                            ) : (
                              <select
                                aria-label={`Rol de ${m.email}`}
                                className={`${CAMPO} w-44`}
                                value={m.rol}
                                disabled={pendiente}
                                onChange={(e) => correr(() => cambiarRolUsuario(m.id, e.target.value))}
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {ROL_LABEL[r]}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className={TD}>
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                                m.activo ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"
                              }`}
                            >
                              {m.activo ? "Activo" : "Sin acceso"}
                            </span>
                          </td>
                          <td className={`${TD} text-right`}>
                            {!soyYo && (
                              <button
                                type="button"
                                disabled={pendiente}
                                onClick={() => correr(() => cambiarActivoUsuario(m.id, !m.activo))}
                                className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}
                              >
                                {m.activo ? "Desactivar" : "Dar acceso"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <h2 className="mb-3 mt-8 text-lg font-bold text-brand">Invitaciones pendientes</h2>
            {invitaciones.length === 0 ? (
              <Vacio icono={<ShieldIcon className="h-6 w-6" />}>No hay invitaciones pendientes.</Vacio>
            ) : (
              <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
                <ul className="divide-y divide-brand-border">
                  {invitaciones.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{i.email}</p>
                        <p className="text-xs text-slate-500">Va a entrar como {ROL_LABEL[i.rol]} cuando se registre</p>
                      </div>
                      <button
                        type="button"
                        disabled={pendiente}
                        onClick={() => correr(() => cancelarInvitacion(i.id))}
                        aria-label={`Cancelar invitación de ${i.email}`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
