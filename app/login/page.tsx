import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getServerSession } from "@/lib/auth/session";
import { isMockMode } from "@/lib/supabase/env";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/");
  }
  const mock = isMockMode();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand to-brand-mid px-4 py-8">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-accent/15" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-brand-accent/15" />

      <div className="relative w-full max-w-4xl rounded-[2rem] border border-white/25 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
        <div className="grid overflow-hidden rounded-3xl bg-white md:grid-cols-2">
          <section className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-brand-mid to-brand p-8 text-white md:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-16 top-10 h-48 w-48 rounded-full bg-brand-accent/15" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand-accent/15" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent text-lg font-bold text-brand-deep">
                  CR
                </span>
                <div className="leading-tight">
                  <p className="text-xl font-bold">Carnes Rosales</p>
                  <p className="text-xs uppercase tracking-wider text-white/60">Cuentas corrientes</p>
                </div>
              </div>
              <div aria-hidden className="mt-6 h-1 w-14 rounded-full bg-brand-accent" />
              <h2 className="mt-6 text-3xl font-bold leading-tight">Las cuentas de tus clientes, siempre al día</h2>
              <p className="mt-3 max-w-sm text-base text-white/85">
                Registrá ventas y pagos, mirá cuánto debe cada cliente y cuánta carne se vendió en el mes.
              </p>
            </div>
          </section>

          <section className="flex flex-col justify-center p-8 md:p-12">
            <h1 className="text-3xl font-bold text-brand">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-600">Ingresá con tu cuenta</p>

            {mock && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Modo demo: Supabase no está configurado todavía. Cualquier email y contraseña inicia sesión, con datos
                de ejemplo que no se guardan. Ver <code>README.md</code> para conectar Supabase.
              </div>
            )}

            <div className="mt-6">
              <LoginForm mock={mock} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
