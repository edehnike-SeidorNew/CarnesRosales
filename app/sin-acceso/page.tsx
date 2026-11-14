import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getServerSession, tieneAcceso } from "@/lib/auth/session";

/** Cuenta autenticada pero sin rol activo (falta la invitación, o la desactivaron). */
export default async function SinAccesoPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (tieneAcceso(session)) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand to-brand-mid px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent text-lg font-bold text-brand-deep">CR</span>
        <h1 className="mt-6 text-2xl font-bold text-brand">Tu cuenta todavía no tiene acceso</h1>
        <p className="mt-3 text-sm text-slate-600">
          Iniciaste sesión como <strong className="text-slate-900">{session.email}</strong>, pero esa cuenta no está habilitada.
        </p>
        <p className="mt-3 text-sm text-slate-600">Pedile a un administrador que te dé acceso. Cuando lo haga, volvé a ingresar.</p>
        <div className="mt-6 flex justify-center">
          <LogoutButton variant="text" />
        </div>
      </div>
    </div>
  );
}
