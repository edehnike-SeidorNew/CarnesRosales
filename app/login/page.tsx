import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getServerSession } from "@/lib/auth/session";
import { isMockMode } from "@/lib/supabase/env";

// Fondo de la pantalla, por fuera de la tarjeta. Alternativa: "/fondo-dorado.jpg" (partículas doradas).
const FONDO = "/fondo-brasas.jpg";

const ERRORES: Record<string, string> = {
  auth: "No se pudo completar el inicio de sesión. Probá de nuevo.",
  recuperar: "El enlace para cambiar la contraseña venció o ya se usó. Pedí uno nuevo con \"¿Olvidaste tu contraseña?\".",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const session = await getServerSession();
  if (session) {
    redirect("/");
  }
  const mock = isMockMode();

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-[#08090d] bg-cover bg-center px-4 py-8 text-white"
      style={{ backgroundImage: `url(${FONDO})` }}
    >
      {/* Oscurece un poco el fondo para que la tarjeta destaque. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0a0b24]/50" />
      <main className="relative grid w-full max-w-[1180px] overflow-hidden rounded-[28px] bg-[#0f1030]/92 shadow-[0_40px_120px_rgba(0,0,0,0.75)] ring-1 ring-white/10 backdrop-blur-sm md:h-[720px] md:grid-cols-2">
        {/* Izquierda: la foto. En celular pasa arriba y más baja. */}
        <aside
          aria-hidden
          className="relative order-first h-56 bg-black bg-[url('/login-parrilla.jpg')] bg-cover bg-[position:center_55%] md:h-auto md:bg-[position:center_38%]"
        >
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0f1030] to-transparent md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[42%] md:bg-gradient-to-l md:from-[#0f1030] md:via-[#0f1030]/55 md:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 hidden h-[38%] bg-gradient-to-t from-[#090a1f]/85 to-transparent md:block" />
          <div className="absolute bottom-8 left-11 z-10 hidden md:block">
            <p className="font-serif text-[22px] font-semibold tracking-wide">Calidad y tradición</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/60">Carnes Rosales</p>
          </div>
        </aside>

        {/* Derecha: el ingreso, con el logo arriba de todo. */}
        <section className="relative -mt-20 flex flex-col items-center justify-center bg-[radial-gradient(520px_340px_at_85%_0%,rgba(170,180,247,0.16),transparent_70%),#0f1030] px-7 pb-9 md:mt-0 md:px-[72px] md:py-9">
          <img
            src="/logo.png"
            alt="Carnes Rosales"
            className="h-36 w-36 object-contain drop-shadow-[0_10px_28px_rgba(170,180,247,0.35)] md:h-[170px] md:w-[170px]"
          />
          <div className="mt-2.5 text-center leading-tight">
            <p className="text-[15px] font-semibold uppercase tracking-[0.32em]">Carnes Rosales</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/60">Cuentas corrientes</p>
          </div>

          <h1 className="sr-only">Iniciar sesión</h1>

          <div className="mt-6 w-full max-w-[340px]">
            {mock && (
              <div className="mb-5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                Modo demo: Supabase no está configurado todavía. Cualquier email y contraseña inicia sesión, con datos
                de ejemplo que no se guardan. Ver <code>README.md</code> para conectar Supabase.
              </div>
            )}
            <LoginForm mock={mock} initialError={(error && ERRORES[error]) || null} />
          </div>
        </section>
      </main>
    </div>
  );
}
