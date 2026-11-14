import { BellIcon } from "@/components/layout/icons";
import { SeccionProxima } from "@/components/layout/SeccionProxima";

export default function AvisosPage() {
  return (
    <SeccionProxima
      titulo="Avisos"
      etapa="Tercera etapa"
      resumen="Que el sistema avise cuando pasó el plazo de cobro o de pago."
      icono={<BellIcon className="h-5 w-5" />}
      funciones={[
        "Aviso cuando pasaron 7 días desde la compra de un cliente y todavía no pagó.",
        "El mismo aviso para los pagos a proveedores, a los 7 días de la compra.",
        "Lista de avisos dentro del sistema, con el cliente o proveedor, el importe y los días de atraso.",
        "Mensaje de WhatsApp ya armado, para enviar con un botón.",
      ]}
    />
  );
}
