import { cache } from "react";
import { cookies } from "next/headers";
import { decodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";
import { isMockMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface AppSession {
  email: string;
  /** true = modo demo (sin Supabase). */
  mock: boolean;
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
    return session ? { email: session.email, mock: true } : null;
  }

  const supabase = await createClient();
  // getUser() valida el token contra Supabase (no confía sólo en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ? { email: user.email, mock: false } : null;
});
