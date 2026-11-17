"use client";

import { useState, useTransition } from "react";
import type { Resultado } from "@/app/acciones";
import { useNotificaciones } from "@/components/ui/Notificaciones";

/**
 * Corre una acción del servidor mostrando "guardando" y el error si falla.
 * `mensajeOk` es el aviso que sale arriba de todo cuando salió bien ("Pago registrado"); si falla, el error también sale como aviso.
 */
export function useAccion() {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");
  const { avisar } = useNotificaciones();

  function correr<T>(accion: () => Promise<Resultado<T>>, alTerminar?: (dato: T) => void, mensajeOk?: string) {
    setError("");
    iniciar(async () => {
      const r = await accion();
      if (r.ok) {
        if (mensajeOk) avisar(mensajeOk);
        alTerminar?.(r.dato);
      } else {
        setError(r.error);
        avisar(r.error, "error");
      }
    });
  }

  return { pendiente, error, setError, correr };
}
