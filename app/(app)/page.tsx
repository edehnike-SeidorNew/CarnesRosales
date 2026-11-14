import { Inicio } from "@/components/inicio/Inicio";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";
import { stockPorProducto } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  await exigirAcceso();
  const datos = await repo().obtenerDatos();
  return <Inicio clientes={datos.clientes} movimientos={datos.movimientos} stock={stockPorProducto(datos)} />;
}
