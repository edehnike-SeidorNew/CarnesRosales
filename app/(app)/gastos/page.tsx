import { WalletIcon } from "@/components/layout/icons";
import { SeccionProxima } from "@/components/layout/SeccionProxima";

export default function GastosPage() {
  return (
    <SeccionProxima
      titulo="Gastos"
      etapa="Tercera etapa"
      resumen="Documentar mes a mes los gastos de la empresa."
      icono={<WalletIcon className="h-5 w-5" />}
      funciones={[
        "Carga de cada gasto con fecha, rubro e importe: luz, combustible y los rubros que se definan.",
        "Total de gastos del mes y desglose por rubro.",
        "Comparación mes a mes.",
        "Tarjeta de gastos del mes en el Inicio.",
      ]}
    />
  );
}
