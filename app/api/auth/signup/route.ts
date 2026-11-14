import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/site-url";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registro con email y contraseña. Crear la cuenta NO da acceso por sí solo: entra quien fue
 * invitado con ese mismo email (o la primera cuenta de todas, que queda como administrador).
 * El resto queda sin acceso hasta que un administrador lo active.
 */
export async function POST(request: Request) {
  if (isMockMode()) {
    return NextResponse.json({ error: "En modo demo no hace falta registrarse" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  if (!EMAIL.test(email) || password.length < 8 || password.length > 72) {
    return NextResponse.json({ error: "Revisá el email y usá una contraseña de al menos 8 caracteres." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl(request)}/api/auth/callback`,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return NextResponse.json({ error: "La contraseña es muy débil. Usá una más larga y variada." }, { status: 400 });
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return NextResponse.json({ error: "Demasiados intentos. Probá de nuevo en unos minutos." }, { status: 429 });
    }
    return NextResponse.json({ error: "No se pudo crear la cuenta." }, { status: 400 });
  }

  // Si el proyecto exige confirmar el email (recomendado), no hay sesión hasta que lo confirme.
  // La respuesta es la misma exista o no el email, para no revelar quién tiene cuenta.
  return NextResponse.json({ ok: true, needsConfirmation: !data.session });
}
