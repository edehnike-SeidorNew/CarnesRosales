import type { Rol } from "@/lib/auth/roles";
import { isMockMode } from "@/lib/supabase/env";
import type { CambiosMovimiento, Cliente, Datos, MedioPago, NuevoCliente, NuevoMovimiento, Usuarios } from "@/lib/tipos";
import { repoMemoria } from "./memoria";
import { repoSupabase } from "./supabase";

export type NuevaCompra = {
  fecha: string;
  proveedor: string;
  comprobante: string;
  items: { producto: string; kilos: number; costo: number | null }[];
};
export type NuevoAjuste = { fecha: string; producto: string; /** Diferencia a sumar (+) o restar (-). */ kilos: number; nota: string };
export type NuevoPagoProveedor = { proveedorId: string; fecha: string; importe: number; medioPago: MedioPago; comprobante: string };

/** Acceso a los datos. Sólo se usa en el servidor (páginas y acciones). */
export interface Repo {
  obtenerDatos(): Promise<Datos>;

  crearCliente(datos: NuevoCliente): Promise<Cliente>;
  actualizarCliente(id: string, datos: NuevoCliente): Promise<void>;

  crearMovimiento(movimiento: NuevoMovimiento): Promise<void>;
  actualizarMovimiento(id: string, cambios: CambiosMovimiento): Promise<void>;
  eliminarMovimiento(id: string): Promise<void>;

  registrarCompra(compra: NuevaCompra): Promise<void>;
  registrarAjuste(ajuste: NuevoAjuste): Promise<void>;
  eliminarStockMovimiento(id: string): Promise<void>;
  fijarPrecio(producto: string, precio: number | null): Promise<void>;

  registrarPagoProveedor(pago: NuevoPagoProveedor): Promise<void>;
  eliminarPagoProveedor(id: string): Promise<void>;

  obtenerUsuarios(): Promise<Usuarios>;
  invitar(email: string, rol: Rol): Promise<void>;
  cancelarInvitacion(id: string): Promise<void>;
  cambiarRol(id: string, rol: Rol): Promise<void>;
  cambiarActivo(id: string, activo: boolean): Promise<void>;
}

/** Supabase si está configurado; si no, los datos de ejemplo en memoria (modo demo). */
export function repo(): Repo {
  return isMockMode() ? repoMemoria : repoSupabase;
}
