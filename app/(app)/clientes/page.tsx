import { ListaClientes } from "@/components/clientes/ListaClientes";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const datos = await repo().obtenerDatos();
  return <ListaClientes clientes={datos.clientes} movimientos={datos.movimientos} />;
}
