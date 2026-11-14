/**
 * URL pública de la app, para los links de confirmación de email y de recuperación de contraseña.
 * Si existe NEXT_PUBLIC_SITE_URL se usa esa (recomendado en producción); si no, el origen del request.
 */
export function getSiteUrl(request: Request): string {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return fixed || new URL(request.url).origin;
}
