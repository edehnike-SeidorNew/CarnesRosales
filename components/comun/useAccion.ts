"use client";

import { useState, useTransition } from "react";
import type { Resultado } from "@/app/acciones";

/** Corre una acción del servidor mostrando "guardando" y el error si falla. */
export function useAccion() {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");

  function correr<T>(accion: () => Promise<Resultado<T>>, alTerminar?: (dato: T) => void) {
    setError("");
    iniciar(async () => {
      const r = await accion();
      if (r.ok) alTerminar?.(r.dato);
      else setError(r.error);
    });
  }

  return { pendiente, error, setError, correr };
}
