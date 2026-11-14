"use client";

import { CAMPO } from "@/lib/formato";

/**
 * Deja lo escrito en formato argentino: puntos de miles puestos solos y coma para los decimales.
 * "13000,5" -> "13.000,5". Los puntos que escriba la persona se ignoran (los pone el campo).
 */
export function formatearNumero(texto: string, decimales: number): string {
  const limpio = texto.replace(/[^\d,]/g, "");
  const coma = limpio.indexOf(",");
  const entero = (coma >= 0 ? limpio.slice(0, coma) : limpio).replace(/^0+(?=\d)/, "");
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (coma < 0 || decimales === 0) return conPuntos;
  return `${conPuntos || "0"},${limpio.slice(coma + 1).replace(/,/g, "").slice(0, decimales)}`;
}

/** Campo para importes y kilos: agrega los puntos de miles mientras se escribe y usa coma para los decimales. */
export function CampoNumero({
  value,
  onChange,
  decimales = 2,
  className = "",
  placeholder,
  ariaLabel,
  autoFocus,
}: {
  /** Texto ya formateado ("13.000,50"); se convierte a número con `aNumero`. */
  value: string;
  onChange: (valor: string) => void;
  decimales?: number;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(formatearNumero(e.target.value, decimales))}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      className={`${CAMPO} tabular-nums ${className}`}
    />
  );
}
