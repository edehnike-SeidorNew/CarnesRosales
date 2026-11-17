import { RemitosPanel } from "@/components/remitos/RemitosPanel";
import { puede } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function RemitosPage() {
  const session = await exigirAcceso();
  const datos = await repo().obtenerDatos();
  return <RemitosPanel clientes={datos.clientes} movimientos={datos.movimientos} puedeCargar={puede(session.rol, "cargar")} puedeBorrar={puede(session.rol, "borrar")} />;
}
