import { UsuariosPanel } from "@/components/usuarios/UsuariosPanel";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  // Solo administradores (la base lo vuelve a verificar con RLS).
  const session = await exigirAcceso("usuarios");
  const { miembros, invitaciones } = await repo().obtenerUsuarios();
  return <UsuariosPanel miembros={miembros} invitaciones={invitaciones} yoId={session.userId} />;
}
