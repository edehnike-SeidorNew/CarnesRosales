"use client";

import { useRouter } from "next/navigation";
import { eliminarMovimiento } from "@/app/acciones";
import { useAccion } from "@/components/comun/useAccion";
import { useNotificaciones } from "@/components/ui/Notificaciones";
import { TrashIcon } from "@/components/layout/icons";

/** Elimina el remito (la venta) y vuelve a la lista. El saldo del cliente se recalcula solo. */
export function BotonEliminarRemito({ id }: { id: string }) {
  const router = useRouter();
  const { pendiente, error, correr } = useAccion();
  const { confirmar } = useNotificaciones();

  async function eliminar() {
    const ok = await confirmar({
      titulo: "¿Eliminar este remito?",
      mensaje: "Se borra la venta y el saldo del cliente se recalcula. No se puede deshacer.",
      confirmar: "Eliminar remito",
      peligro: true,
    });
    if (!ok) return;
    correr(() => eliminarMovimiento(id), () => router.push("/remitos"), "Remito eliminado");
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={eliminar}
        disabled={pendiente}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        <TrashIcon className="h-4 w-4" />
        {pendiente ? "Eliminando..." : "Eliminar remito"}
      </button>
      {error && <span className="mt-1 text-xs text-red-700">{error}</span>}
    </span>
  );
}
