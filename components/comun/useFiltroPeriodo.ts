"use client";

import { useState } from "react";
import { finDePeriodo, hoyISO, inicioDePeriodo, type Periodo } from "@/lib/formato";

/** Estado del filtro por período (con "Hoy" y "Fecha"): devuelve también el rango de fechas que le corresponde. */
export function useFiltroPeriodo(inicial: Periodo) {
  const [periodo, setPeriodo] = useState<Periodo>(inicial);
  const [fecha, setFecha] = useState(hoyISO());
  return {
    periodo,
    fecha,
    setPeriodo,
    setFecha,
    desde: inicioDePeriodo(periodo, fecha),
    hasta: finDePeriodo(periodo, fecha),
  };
}
