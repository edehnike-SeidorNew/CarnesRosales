"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronRightIcon } from "./icons";

/**
 * Columna a la derecha del contenido; apila una o más cards. En pantallas chicas la columna se
 * "disuelve" (display: contents): la card de opciones queda arriba del contenido y las demás, abajo.
 * `fija` la deja pegada mientras se scrollea; no conviene si las cards pueden ser más altas que la pantalla.
 */
export function ColumnaLateral({
  ancho = "xl:w-80",
  fija = true,
  desplazamiento = "",
  children,
}: {
  ancho?: string;
  fija?: boolean;
  /** Margen superior (clase `xl:mt-...`) para alinear la columna con el primer bloque del contenido, sólo en pantallas anchas. */
  desplazamiento?: string;
  children: ReactNode;
}) {
  return (
    <aside className={`space-y-4 max-xl:contents xl:order-last xl:shrink-0 ${fija ? "xl:sticky xl:top-0" : ""} ${ancho} ${desplazamiento}`}>
      {children}
    </aside>
  );
}

/** Card plegable con título. */
export function CardLateral({
  titulo,
  children,
  primero = false,
}: {
  titulo: string;
  children: ReactNode;
  /** En pantallas chicas va arriba del contenido (el menú de opciones); si no, va abajo. */
  primero?: boolean;
}) {
  // null = todavía no se sabe el tamaño de pantalla (antes de cargar): en chico se oculta para que no parpadee abierta.
  const [elegido, setElegido] = useState<boolean | null>(null);
  const abierto = elegido ?? true;

  // En celular y tablet (donde la card va apilada arriba o abajo del contenido) arranca plegada para no ocupar lugar;
  // en pantallas grandes es una columna al costado y queda abierta.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1279px)").matches) setElegido(false);
    else setElegido(true);
  }, []);

  return (
    <section className={`rounded-2xl border border-brand-border p-4 ${primero ? "max-xl:order-first" : "max-xl:order-last"}`}>
      <button
        type="button"
        onClick={() => setElegido(!abierto)}
        aria-expanded={abierto}
        className="flex min-h-10 w-full items-center gap-2 text-left text-sm font-semibold text-brand"
      >
        {titulo}
        <ChevronRightIcon className={`h-4 w-4 transition-transform ${abierto ? "rotate-90" : ""}`} />
      </button>

      {abierto && <div className={`mt-3 ${elegido === null ? "max-xl:hidden" : ""}`}>{children}</div>}
    </section>
  );
}
