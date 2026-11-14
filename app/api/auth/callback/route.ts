import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/site-url";

/** Destino del link de confirmación de email: intercambia el `code` por una sesión. */
export async function GET(request: Request) {
  const site = getSiteUrl(request);
  const code = new URL(request.url).searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // La pantalla "/" decide si la cuenta tiene acceso o va a /sin-acceso.
    if (!error) return NextResponse.redirect(`${site}/`);
  }
  return NextResponse.redirect(`${site}/login?error=auth`);
}
