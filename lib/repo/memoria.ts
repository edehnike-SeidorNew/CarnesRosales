import { CLIENTES, MOVIMIENTOS } from "@/lib/datos";
import type { Cliente, Datos, Movimiento } from "@/lib/tipos";
import type { Repo } from "./index";

// Modo demo: datos de ejemplo en la memoria del servidor. Se pierden al reiniciarlo.

type Estado = { clientes: Cliente[]; movimientos: Movimiento[]; productosExtra: string[] };

const global = globalThis as { __carnesRosalesDemo?: Estado };
// En globalThis para que sobreviva a las recargas de código en desarrollo.
const estado = (global.__carnesRosalesDemo ??= { clientes: [...CLIENTES], movimientos: [...MOVIMIENTOS], productosExtra: [] });

const nuevoId = (prefijo: string) => `${prefijo}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

function productos(): string[] {
  const vistos = new Map<string, string>();
  for (const m of estado.movimientos) {
    if (m.tipo === "venta") for (const item of m.items) vistos.set(item.detalle.toLowerCase(), item.detalle);
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, "es"));
}

export const repoMemoria: Repo = {
  async obtenerDatos(): Promise<Datos> {
    return {
      clientes: [...estado.clientes].sort((a, b) => a.numero - b.numero),
      movimientos: [...estado.movimientos],
      productos: productos(),
    };
  },

  async crearCliente(datos) {
    const numero = estado.clientes.reduce((max, c) => Math.max(max, c.numero), 0) + 1;
    const cliente: Cliente = { ...datos, id: nuevoId("c"), numero };
    estado.clientes.push(cliente);
    return cliente;
  },

  async crearMovimiento(datos) {
    estado.movimientos.push({ ...datos, id: nuevoId("m") } as Movimiento);
  },

  async eliminarMovimiento(id) {
    estado.movimientos = estado.movimientos.filter((m) => m.id !== id);
  },
};
