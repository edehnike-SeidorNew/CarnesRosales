import { IdIcon } from "@/components/layout/icons";
import { SeccionProxima } from "@/components/layout/SeccionProxima";

export default function EmpleadosPage() {
  return (
    <SeccionProxima
      titulo="Empleados"
      etapa="Tercera etapa"
      resumen="Registro informativo de los pagos a empleados."
      icono={<IdIcon className="h-5 w-5" />}
      funciones={[
        "Lista de empleados.",
        "Fecha y monto de cada pago, por empleado.",
        "Total pagado por mes.",
        "Solo para consulta: no genera recibos de sueldo ni liquidaciones.",
      ]}
    />
  );
}
