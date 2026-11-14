import { cookies } from "next/headers";
import { CLIENTES, MOVIMIENTOS } from "@/lib/datos";
import { decodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";
import type { Cliente, Datos, Invitacion, Miembro, Movimiento, PagoProveedor, Producto, Proveedor, StockMovimiento } from "@/lib/tipos";
import type { Repo } from "./index";

// Modo demo: datos de ejemplo en la memoria del servidor. Se pierden al reiniciarlo.

type Estado = {
  clientes: Cliente[];
  movimientos: Movimiento[];
  precios: Map<string, number>;
  /** Cortes agregados a mano al catálogo. */
  cortes: string[];
  stock: StockMovimiento[];
  proveedores: Proveedor[];
  pagosProveedores: PagoProveedor[];
  miembros: Miembro[];
  invitaciones: Invitacion[];
};

const global = globalThis as { __carnesRosalesDemo3?: Estado };
// En globalThis para que sobreviva a las recargas de código en desarrollo.
const estado: Estado = (global.__carnesRosalesDemo3 ??= {
  clientes: [...CLIENTES],
  movimientos: [...MOVIMIENTOS],
  precios: new Map(),
  cortes: [],
  stock: [],
  proveedores: [],
  pagosProveedores: [],
  miembros: [{ id: "demo-2", email: "vendedor@demo.test", nombre: "Vendedor de ejemplo", rol: "vendedor", activo: true }],
  invitaciones: [],
});

const nuevoId = (prefijo: string) => `${prefijo}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
const limpio = (texto: string) => texto.trim().replace(/\s+/g, " ");

async function quien(): Promise<string> {
  const store = await cookies();
  return decodeMockSession(store.get(MOCK_COOKIE_NAME)?.value)?.email ?? "";
}

function productos(): Producto[] {
  const vistos = new Map<string, string>();
  for (const m of estado.movimientos) {
    if (m.tipo === "venta") for (const item of m.items) if (!vistos.has(item.detalle.toLowerCase())) vistos.set(item.detalle.toLowerCase(), item.detalle);
  }
  for (const s of estado.stock) if (!vistos.has(s.producto.toLowerCase())) vistos.set(s.producto.toLowerCase(), s.producto);
  for (const c of estado.cortes) if (!vistos.has(c.toLowerCase())) vistos.set(c.toLowerCase(), c);
  return [...vistos.entries()]
    .map(([clave, nombre]) => ({ nombre, precio: estado.precios.get(clave) ?? null }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Usa el nombre ya existente si sólo cambian mayúsculas (igual que la base). */
function nombreDeProducto(nombre: string): string {
  const pedido = limpio(nombre);
  return productos().find((p) => p.nombre.toLowerCase() === pedido.toLowerCase())?.nombre ?? pedido;
}

function proveedorPorNombre(nombre: string): string | null {
  const pedido = limpio(nombre);
  if (!pedido) return null;
  let proveedor = estado.proveedores.find((p) => p.nombre.toLowerCase() === pedido.toLowerCase());
  if (!proveedor) {
    proveedor = { id: nuevoId("prov"), nombre: pedido, contacto: "" };
    estado.proveedores.push(proveedor);
  }
  return proveedor.id;
}

export const repoMemoria: Repo = {
  async obtenerDatos(): Promise<Datos> {
    return {
      clientes: [...estado.clientes].sort((a, b) => a.numero - b.numero),
      movimientos: [...estado.movimientos],
      productos: productos(),
      stock: [...estado.stock],
      proveedores: [...estado.proveedores].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
      pagosProveedores: [...estado.pagosProveedores],
    };
  },

  async crearCliente(datos) {
    const numero = estado.clientes.reduce((max, c) => Math.max(max, c.numero), 0) + 1;
    const cliente: Cliente = { ...datos, id: nuevoId("c"), numero };
    estado.clientes.push(cliente);
    return cliente;
  },

  async actualizarCliente(id, datos) {
    estado.clientes = estado.clientes.map((c) => (c.id === id ? { ...c, ...datos } : c));
  },

  async crearMovimiento(datos) {
    const movimiento = { ...datos, id: nuevoId("m"), creadoPor: await quien() } as Movimiento;
    if (movimiento.tipo === "venta") movimiento.items = movimiento.items.map((i) => ({ ...i, detalle: nombreDeProducto(i.detalle) }));
    estado.movimientos.push(movimiento);
  },

  async actualizarMovimiento(id, cambios) {
    estado.movimientos = estado.movimientos.map((m) => {
      if (m.id !== id || m.tipo !== cambios.tipo) return m;
      if (cambios.tipo === "venta") {
        return { ...m, ...cambios, items: cambios.items.map((i) => ({ ...i, detalle: nombreDeProducto(i.detalle) })) } as Movimiento;
      }
      return { ...m, ...cambios } as Movimiento;
    });
  },

  async eliminarMovimiento(id) {
    estado.movimientos = estado.movimientos.filter((m) => m.id !== id);
  },

  async registrarCompra(compra) {
    const proveedorId = proveedorPorNombre(compra.proveedor);
    const creadoPor = await quien();
    for (const item of compra.items) {
      estado.stock.push({
        id: nuevoId("s"),
        fecha: compra.fecha,
        tipo: "compra",
        producto: nombreDeProducto(item.producto),
        kilos: item.kilos,
        costo: item.costo,
        proveedorId,
        comprobante: compra.comprobante,
        nota: "",
        creadoPor,
      });
    }
  },

  async registrarAjuste(ajuste) {
    estado.stock.push({
      id: nuevoId("s"),
      fecha: ajuste.fecha,
      tipo: "ajuste",
      producto: nombreDeProducto(ajuste.producto),
      kilos: ajuste.kilos,
      costo: null,
      proveedorId: null,
      comprobante: "",
      nota: ajuste.nota,
      creadoPor: await quien(),
    });
  },

  async eliminarStockMovimiento(id) {
    estado.stock = estado.stock.filter((s) => s.id !== id);
  },

  async fijarPrecio(producto, precio) {
    const clave = limpio(producto).toLowerCase();
    if (precio === null) estado.precios.delete(clave);
    else estado.precios.set(clave, precio);
  },

  async crearCorte(nombre) {
    const corte = nombreDeProducto(nombre);
    if (!estado.cortes.some((c) => c.toLowerCase() === corte.toLowerCase())) estado.cortes.push(corte);
  },

  async registrarPagoProveedor(pago) {
    estado.pagosProveedores.push({ ...pago, id: nuevoId("pp"), creadoPor: await quien() });
  },

  async eliminarPagoProveedor(id) {
    estado.pagosProveedores = estado.pagosProveedores.filter((p) => p.id !== id);
  },

  async obtenerUsuarios() {
    const yo: Miembro = { id: "demo", email: await quien(), nombre: "Vos (demo)", rol: "admin", activo: true };
    return { miembros: [yo, ...estado.miembros], invitaciones: [...estado.invitaciones] };
  },

  async invitar(email, rol) {
    estado.invitaciones = [...estado.invitaciones.filter((i) => i.email.toLowerCase() !== email.toLowerCase()), { id: nuevoId("inv"), email, rol }];
  },

  async cancelarInvitacion(id) {
    estado.invitaciones = estado.invitaciones.filter((i) => i.id !== id);
  },

  async cambiarRol(id, rol) {
    estado.miembros = estado.miembros.map((m) => (m.id === id ? { ...m, rol } : m));
  },

  async cambiarActivo(id, activo) {
    estado.miembros = estado.miembros.map((m) => (m.id === id ? { ...m, activo } : m));
  },
};
