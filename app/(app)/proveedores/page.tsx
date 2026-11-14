import { ProveedoresPanel } from "@/components/proveedores/ProveedoresPanel";
import { puede } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const session = await exigirAcceso();
  const datos = await repo().obtenerDatos();
  return (
    <ProveedoresPanel
      proveedores={datos.proveedores}
      compras={datos.stock}
      pagos={datos.pagosProveedores}
      puedeCargar={puede(session.rol, "cargar")}
      puedeBorrar={puede(session.rol, "borrar")}
    />
  );
}
