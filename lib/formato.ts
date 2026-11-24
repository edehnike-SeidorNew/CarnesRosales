const moneda = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cantidad = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const pesos = (n: number) => `$ ${moneda.format(n)}`;
export const kilos = (n: number) => cantidad.format(n);

/** "2026-10-15" → "15/10/2026" */
export function fechaAR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Fecha de hoy en formato AAAA-MM-DD (hora local). */
export function hoyISO(): string {
  const h = new Date();
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${h.getFullYear()}-${dos(h.getMonth() + 1)}-${dos(h.getDate())}`;
}

export const PERIODOS = [
  { id: "todo", label: "Todo" },
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Semana actual" },
  { id: "semanaAnterior", label: "Semana anterior" },
  { id: "mes", label: "Mes" },
  { id: "trimestre", label: "Trimestre" },
  { id: "semestre", label: "Semestre" },
  { id: "anio", label: "Año" },
  { id: "fecha", label: "Fecha" },
] as const;

export type Periodo = (typeof PERIODOS)[number]["id"];

/**
 * Primer día (AAAA-MM-DD) del período; null para "todo". La semana arranca el lunes.
 * "hoy" es el día de hoy y "fecha" el día elegido en el calendario (`fecha`).
 */
export function inicioDePeriodo(periodo: Periodo, fecha?: string): string | null {
  if (periodo === "todo") return null;
  if (periodo === "hoy") return hoyISO();
  if (periodo === "fecha") return fecha || hoyISO();
  const h = new Date();
  const anio = h.getFullYear();
  const mes = h.getMonth();
  let inicio: Date;
  if (periodo === "semana") inicio = new Date(anio, mes, h.getDate() - ((h.getDay() + 6) % 7));
  // Semana anterior: desde el lunes de la semana pasada hasta hoy (incluye la semana actual).
  else if (periodo === "semanaAnterior") inicio = new Date(anio, mes, h.getDate() - ((h.getDay() + 6) % 7) - 7);
  else if (periodo === "mes") inicio = new Date(anio, mes, 1);
  else if (periodo === "trimestre") inicio = new Date(anio, mes - (mes % 3), 1);
  else if (periodo === "semestre") inicio = new Date(anio, mes < 6 ? 0 : 6, 1);
  else inicio = new Date(anio, 0, 1);
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${inicio.getFullYear()}-${dos(inicio.getMonth() + 1)}-${dos(inicio.getDate())}`;
}

/** Último día del período: sólo "hoy" y "fecha" son de un único día; el resto llega hasta hoy (null = sin tope). */
export function finDePeriodo(periodo: Periodo, fecha?: string): string | null {
  if (periodo === "hoy") return hoyISO();
  if (periodo === "fecha") return fecha || hoyISO();
  return null;
}

/** ¿La fecha cae dentro del rango? Un extremo null no limita. */
export function enPeriodo(fecha: string, desde: string | null, hasta: string | null): boolean {
  return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
}

/** "desde el 01/11/2026" o, si es un único día, "el 15/11/2026". */
export function describirRango(desde: string, hasta: string | null): string {
  return hasta && hasta === desde ? `el ${fechaAR(desde)}` : `desde el ${fechaAR(desde)}`;
}

export const CAMPO =
  "w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none";
export const BOTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover";
export const BOTON_SECUNDARIO =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft";

/** Fecha de hace `dias` días en formato AAAA-MM-DD (hora local). */
export function haceDiasISO(dias: number): string {
  const h = new Date();
  const f = new Date(h.getFullYear(), h.getMonth(), h.getDate() - dias);
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
}

/** "13.000,50" (como lo muestra CampoNumero) -> 13000.5. Vacío o inválido -> NaN. */
export function aNumero(texto: string): number {
  const limpio = texto.trim().replace(/\./g, "").replace(",", ".");
  return limpio === "" ? NaN : Number(limpio);
}

/** 13000.5 -> "13.000,5", para cargar un valor ya guardado en un CampoNumero. */
export function aCampo(n: number, decimales = 2): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: decimales });
}

/** Días de calendario entre dos fechas AAAA-MM-DD (negativo si `hasta` es anterior). */
export function diasEntre(desde: string, hasta: string): number {
  const t = (s: string) => {
    const [a, m, d] = s.split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((t(hasta) - t(desde)) / 86_400_000);
}
