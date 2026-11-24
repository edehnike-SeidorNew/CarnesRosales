import { CobranzasPanel } from "@/components/cobranzas/CobranzasPanel";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function CobranzasPage() {
  await exigirAcceso();
  const datos = await repo().obtenerDatos();
  return <CobranzasPanel clientes={datos.clientes} movimientos={datos.movimientos} />;
}
