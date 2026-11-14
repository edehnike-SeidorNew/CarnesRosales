import { StockPanel } from "@/components/stock/StockPanel";
import { puede } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";
import { stockPorProducto } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const session = await exigirAcceso();
  const datos = await repo().obtenerDatos();
  return (
    <StockPanel
      stock={stockPorProducto(datos)}
      movimientos={datos.stock}
      proveedores={datos.proveedores}
      puedeCargar={puede(session.rol, "cargar")}
      puedeBorrar={puede(session.rol, "borrar")}
    />
  );
}
