import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/site-url";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pide el email para restablecer la contraseña. La respuesta es siempre la misma exista o no la
 * cuenta (no revela qué emails están registrados). El link del mail vuelve a
 * /api/auth/callback-recuperar, que abre una sesión temporal para elegir la nueva contraseña.
 */
export async function POST(request: Request) {
  if (isMockMode()) {
    return NextResponse.json({ error: "En modo demo no hay contraseñas que recuperar" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl(request)}/api/auth/callback-recuperar`,
  });

  // Solo al log del servidor (no a la respuesta): sirve para diagnosticar mails que no llegan.
  if (error) console.warn("[recover] Supabase respondió:", error.status, error.code, error.message);

  if (error && (error.code === "over_email_send_rate_limit" || error.status === 429)) {
    return NextResponse.json({ error: "Demasiados intentos. Probá de nuevo en unos minutos." }, { status: 429 });
  }
  // Cualquier otro resultado (incluida una cuenta inexistente) responde igual.
  return NextResponse.json({ ok: true });
}
