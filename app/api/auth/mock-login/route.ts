import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { encodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";
import { isMockMode } from "@/lib/supabase/env";

/** Login demo (email sin verificar). Sólo activo en modo demo, que en producción está apagado. */
export async function POST(request: Request) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "Modo demo deshabilitado" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const store = await cookies();
  store.set(MOCK_COOKIE_NAME, encodeMockSession({ email }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
