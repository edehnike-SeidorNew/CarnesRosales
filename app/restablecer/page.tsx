import { redirect } from "next/navigation";
import { RestablecerForm } from "@/components/auth/RestablecerForm";
import { getServerSession } from "@/lib/auth/session";

/** Pantalla para elegir la nueva contraseña. Se llega desde el link del mail de recuperación. */
export default async function RestablecerPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?error=recuperar");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand to-brand-mid px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <img src="/logo.png" alt="Carnes Rosales" className="mx-auto h-20 w-20 object-contain" />
        <h1 className="mt-6 text-center text-2xl font-bold text-brand">Elegí tu nueva contraseña</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Cuenta: <strong className="text-slate-900">{session.email}</strong>
        </p>
        <RestablecerForm />
      </div>
    </div>
  );
}
