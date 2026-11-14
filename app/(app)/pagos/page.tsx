import { PagosPanel } from "@/components/pagos/PagosPanel";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  await exigirAcceso();
  const datos = await repo().obtenerDatos();
  return <PagosPanel clientes={datos.clientes} movimientos={datos.movimientos} />;
}
