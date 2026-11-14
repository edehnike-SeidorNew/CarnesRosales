import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";
import { isMockMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { esRol, puede, type Permiso, type Rol } from "./roles";

export interface AppSession {
  userId: string;
  email: string;
  nombre: string;
  /** true = modo demo (sin Supabase). */
  mock: boolean;
  /** null = la cuenta existe pero no tiene acceso (sin invitación, o desactivada). */
  rol: Rol | null;
}

export type SesionActiva = AppSession & { rol: Rol };

export function tieneAcceso(session: AppSession | null): session is SesionActiva {
  return !!session && !!session.rol;
}

/**
 * Sesión actual, unificada entre modo demo y Supabase real. Uso: Server Components,
 * Route Handlers y Server Actions. Se resuelve una sola vez por request (cache de React).
 */
export const getServerSession = cache(async (): Promise<AppSession | null> => {
  // Leer las cookies primero marca la página como dinámica: nunca se prerenderiza con la sesión de otro.
  const store = await cookies();

  if (isMockMode()) {
    const session = decodeMockSession(store.get(MOCK_COOKIE_NAME)?.value);
    return session ? { userId: "demo", email: session.email, nombre: "", mock: true, rol: "admin" } : null;
  }

  const supabase = await createClient();
  // getUser() valida el token contra Supabase (no confía sólo en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  // RLS: cada usuario puede leer su propio perfil.
  const { data: perfil, error } = await supabase.from("perfiles").select("nombre, rol, activo").eq("id", user.id).maybeSingle();
  if (error) console.error("[auth] No se pudo leer el perfil:", error.message);

  return {
    userId: user.id,
    email: user.email,
    nombre: perfil?.nombre ?? "",
    mock: false,
    rol: perfil?.activo && esRol(perfil.rol) ? perfil.rol : null,
  };
});

/** Guarda para páginas: redirige si no hay sesión, si la cuenta no tiene acceso o si el rol no alcanza. */
export async function exigirAcceso(permiso?: Permiso): Promise<SesionActiva> {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!tieneAcceso(session)) redirect("/sin-acceso");
  if (permiso && !puede(session.rol, permiso)) redirect("/");
  return session;
}
