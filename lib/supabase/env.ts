export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Modo demo: sólo en desarrollo, mientras no haya credenciales de Supabase en `.env.local`
 * (login que acepta cualquier email y datos de ejemplo en memoria).
 *
 * En producción NUNCA se cae a modo demo por una variable faltante: un deploy mal configurado
 * dejaría la app abierta. En su lugar se corta con un error claro. Para una demo pública a
 * propósito existe NEXT_PUBLIC_ALLOW_MOCK=true, que no se debe usar con datos reales.
 */
export function isMockMode(): boolean {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) return false;

  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ALLOW_MOCK !== "true") {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. Cargalas en las variables de entorno del deploy (Vercel) y volvé a desplegar.",
    );
  }
  return true;
}
