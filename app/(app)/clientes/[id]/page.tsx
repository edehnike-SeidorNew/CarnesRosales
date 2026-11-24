import Link from "next/link";
import { DetalleCliente } from "@/components/clientes/DetalleCliente";
import { puede } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/session";
import { repo } from "@/lib/repo";
import { stockPorProducto } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function ClientePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ vista?: string; editar?: string }> }) {
  const session = await exigirAcceso();
  const { id } = await params;
  const { vista, editar } = await searchParams;
  const datos = await repo().obtenerDatos();
  const cliente = datos.clientes.find((c) => c.id === id);

  if (!cliente) {
    return (
      <div className="rounded-lg border border-brand-border bg-white p-10 text-center text-sm text-slate-600">
        No encontramos ese cliente.{" "}
        <Link href="/clientes" className="font-semibold text-brand underline">
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <DetalleCliente
      cliente={cliente}
      movimientos={datos.movimientos.filter((m) => m.clienteId === id)}
      stock={stockPorProducto(datos)}
      puedeCargar={puede(session.rol, "cargar")}
      puedeBorrar={puede(session.rol, "borrar")}
      // Desde Remitos > Nuevo remito se abre directo el formulario de venta.
      // Desde Remitos > Editar se abre directo el formulario de esa venta para corregirla.
      editarId={editar}
      vistaInicial={vista === "venta" || vista === "pago" || vista === "descuento" || vista === "cargo" || vista === "cobro" ? vista : undefined}
    />
  );
}
