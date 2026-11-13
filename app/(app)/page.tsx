import { Inicio } from "@/components/inicio/Inicio";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const datos = await repo().obtenerDatos();
  return <Inicio clientes={datos.clientes} movimientos={datos.movimientos} />;
}
