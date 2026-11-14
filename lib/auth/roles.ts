/** Roles de la app. Tienen que coincidir con el enum `rol_usuario` de la base (migración 0003). */
export const ROLES = ["admin", "vendedor", "lectura"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  lectura: "Solo lectura",
};

/** Qué puede hacer cada rol, para mostrarlo en la pantalla de usuarios. */
export const ROL_DESCRIPCION: Record<Rol, string> = {
  admin: "Hace todo: carga, corrige y borra, y es el único que administra usuarios.",
  vendedor: "Carga y corrige clientes, ventas, pagos, compras y stock. No borra ni administra usuarios.",
  lectura: "Solo consulta. No carga ni modifica nada.",
};

export type Permiso = "cargar" | "borrar" | "usuarios";

const PERMISOS: Record<Rol, readonly Permiso[]> = {
  admin: ["cargar", "borrar", "usuarios"],
  vendedor: ["cargar"],
  lectura: [],
};

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === "string" && (ROLES as readonly string[]).includes(valor);
}

/** Qué puede hacer cada rol. La base de datos aplica las mismas reglas con RLS. */
export function puede(rol: Rol | null | undefined, permiso: Permiso): boolean {
  return !!rol && PERMISOS[rol].includes(permiso);
}
