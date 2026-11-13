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
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "trimestre", label: "Trimestre" },
  { id: "semestre", label: "Semestre" },
  { id: "anio", label: "Año" },
] as const;

export type Periodo = (typeof PERIODOS)[number]["id"];

/** Primer día (AAAA-MM-DD) del período calendario en curso; null para "todo". La semana arranca el lunes. */
export function inicioDePeriodo(periodo: Periodo): string | null {
  if (periodo === "todo") return null;
  const h = new Date();
  const anio = h.getFullYear();
  const mes = h.getMonth();
  let inicio: Date;
  if (periodo === "semana") inicio = new Date(anio, mes, h.getDate() - ((h.getDay() + 6) % 7));
  else if (periodo === "mes") inicio = new Date(anio, mes, 1);
  else if (periodo === "trimestre") inicio = new Date(anio, mes - (mes % 3), 1);
  else if (periodo === "semestre") inicio = new Date(anio, mes < 6 ? 0 : 6, 1);
  else inicio = new Date(anio, 0, 1);
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${inicio.getFullYear()}-${dos(inicio.getMonth() + 1)}-${dos(inicio.getDate())}`;
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
