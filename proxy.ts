import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { decodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isMockMode } from "@/lib/supabase/env";

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname === "/favicon.ico";
}

/** Sin sesión: las páginas redirigen al login y las APIs responden 401 (no HTML). */
function unauthenticated(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Tu sesión venció. Volvé a iniciar sesión." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

/**
 * Primer filtro: exige estar autenticado y refresca la sesión de Supabase. Es una barrera
 * "optimista": la sesión se vuelve a verificar en cada página y acción y, por último, en la
 * base de datos con RLS.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isMockMode()) {
    const session = decodeMockSession(request.cookies.get(MOCK_COOKIE_NAME)?.value);
    return session ? NextResponse.next() : unauthenticated(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated(request);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
