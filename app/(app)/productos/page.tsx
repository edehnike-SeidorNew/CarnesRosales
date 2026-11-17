import { ProductosPanel } from "@/components/productos/ProductosPanel";
import { puede } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const session = await exigirAcceso();
  const datos = await repo().obtenerDatos();
  // Todos ven la lista; sólo el administrador cambia rubros y precios (igual se verifica en el servidor y en la base).
  return <ProductosPanel productos={datos.productos} puedeEditar={puede(session.rol, "usuarios")} />;
}
