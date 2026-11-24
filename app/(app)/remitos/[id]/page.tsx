import Link from "next/link";
import { BotonEliminarRemito } from "@/components/remitos/BotonEliminarRemito";
import { BotonWhatsApp } from "@/components/remitos/BotonWhatsApp";
import { RemitoVista } from "@/components/remitos/RemitoVista";
import { ChevronLeftIcon, DownloadIcon, PencilIcon, PrinterIcon, UsersIcon } from "@/components/layout/icons";
import { puede } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/session";
import { BOTON, BOTON_SECUNDARIO } from "@/lib/formato";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function RemitoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await exigirAcceso();
  const { id } = await params;
  const datos = await repo().obtenerDatos();
  const remito = datos.movimientos.find((m) => m.id === id && m.tipo === "venta");
  const cliente = remito && datos.clientes.find((c) => c.id === remito.clienteId);

  if (!remito || remito.tipo !== "venta" || !cliente) {
    return (
      <div className="rounded-lg border border-brand-border bg-white p-10 text-center text-sm text-slate-600">
        No encontramos ese remito.{" "}
        <Link href="/remitos" className="font-semibold text-brand underline">
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/remitos" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand">
        <ChevronLeftIcon className="h-4 w-4" />
        Remitos
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-brand">Remito {remito.comprobante ? `N° ${remito.comprobante}` : "sin número"}</h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={`/api/remitos/${remito.id}?ver=1`} target="_blank" rel="noopener" className={`${BOTON} !px-3 !py-1.5`}>
            <PrinterIcon className="h-4 w-4" />
            Imprimir
          </a>
          <a href={`/api/remitos/${remito.id}`} className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}>
            <DownloadIcon className="h-4 w-4" />
            Descargar PDF
          </a>
          <BotonWhatsApp remito={remito} cliente={cliente} variante="boton" />
          {puede(session.rol, "cargar") && (
            <Link href={`/clientes/${cliente.id}?editar=${remito.id}`} className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}>
              <PencilIcon className="h-4 w-4" />
              Editar
            </Link>
          )}
          <Link href={`/clientes/${cliente.id}`} className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}>
            <UsersIcon className="h-4 w-4" />
            Ver cuenta del cliente
          </Link>
          {puede(session.rol, "borrar") && <BotonEliminarRemito id={remito.id} />}
        </div>
      </div>
      <RemitoVista remito={remito} cliente={cliente} />
    </div>
  );
}
