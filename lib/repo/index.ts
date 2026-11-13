import { isMockMode } from "@/lib/supabase/env";
import type { Cliente, Datos, NuevoCliente, NuevoMovimiento } from "@/lib/tipos";
import { repoMemoria } from "./memoria";
import { repoSupabase } from "./supabase";

/** Acceso a los datos. Sólo se usa en el servidor (páginas y acciones). */
export interface Repo {
  obtenerDatos(): Promise<Datos>;
  crearCliente(datos: NuevoCliente): Promise<Cliente>;
  crearMovimiento(movimiento: NuevoMovimiento): Promise<void>;
  eliminarMovimiento(id: string): Promise<void>;
}

/** Supabase si está configurado; si no, los datos de ejemplo en memoria (modo demo). */
export function repo(): Repo {
  return isMockMode() ? repoMemoria : repoSupabase;
}
