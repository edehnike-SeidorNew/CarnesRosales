import { ListaClientes } from "@/components/clientes/ListaClientes";
import { puede } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const session = await exigirAcceso();
  const datos = await repo().obtenerDatos();
  return <ListaClientes clientes={datos.clientes} movimientos={datos.movimientos} puedeCargar={puede(session.rol, "cargar")} />;
}
