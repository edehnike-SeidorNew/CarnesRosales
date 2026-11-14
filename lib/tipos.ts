// Misma forma que las tablas de Supabase (ver supabase/migrations).
import type { Rol } from "@/lib/auth/roles";

export type Cliente = {
  id: string;
  numero: number;
  nombreFantasia: string;
  titular: string;
  direccion: string;
  localidad: string;
  cuit: string;
  contacto: string;
  observaciones: string;
};

export const MEDIOS_PAGO = [
  { id: "efectivo", label: "Efectivo" },
  { id: "cheque", label: "Cheque" },
  { id: "billetera_virtual", label: "Billetera virtual" },
] as const;

export type MedioPago = (typeof MEDIOS_PAGO)[number]["id"];

export const esMedioPago = (valor: unknown): valor is MedioPago => MEDIOS_PAGO.some((m) => m.id === valor);
/** null = pagos anteriores a registrar este dato. */
export const etiquetaMedio = (medio: MedioPago | null) => MEDIOS_PAGO.find((m) => m.id === medio)?.label ?? "Sin especificar";

/** `detalle` es el nombre del producto (corte). */
export type ItemVenta = { detalle: string; kilos: number; precio: number };

type Base = {
  id: string;
  clienteId: string;
  /** AAAA-MM-DD */
  fecha: string;
  /** N° de remito o recibo */
  comprobante: string;
  /** Email de quien lo cargó ("" si vino de la carga inicial). */
  creadoPor: string;
};

export type Movimiento =
  | (Base & { tipo: "saldo_inicial"; importe: number })
  | (Base & { tipo: "venta"; items: ItemVenta[] })
  | (Base & { tipo: "pago"; importe: number; medioPago: MedioPago | null });

type SinAuto<T> = T extends unknown ? Omit<T, "id" | "creadoPor"> : never;
export type NuevoMovimiento = SinAuto<Movimiento>;
/** Lo que se puede corregir de un movimiento ya cargado. */
export type CambiosMovimiento =
  | { tipo: "saldo_inicial"; importe: number }
  | { tipo: "venta"; fecha: string; comprobante: string; items: ItemVenta[] }
  | { tipo: "pago"; fecha: string; comprobante: string; importe: number; medioPago: MedioPago | null };
export type NuevoCliente = Omit<Cliente, "id" | "numero">;

/** Corte del catálogo, con su precio de lista por kilo (null = sin precio cargado). */
export type Producto = { nombre: string; precio: number | null; /** Rubro (Vacuno, Cerdo...); "" si no tiene. */ categoria: string };

/** Entrada de mercadería (compra) o corrección contra el conteo real (ajuste, + o -). */
export type StockMovimiento = {
  id: string;
  fecha: string;
  tipo: "compra" | "ajuste";
  producto: string;
  kilos: number;
  /** Costo por kilo; sólo en compras y puede faltar. */
  costo: number | null;
  proveedorId: string | null;
  comprobante: string;
  nota: string;
  creadoPor: string;
};

export type Proveedor = { id: string; nombre: string; contacto: string };

export type PagoProveedor = {
  id: string;
  proveedorId: string;
  fecha: string;
  importe: number;
  medioPago: MedioPago | null;
  comprobante: string;
  creadoPor: string;
};

export type Datos = {
  clientes: Cliente[];
  movimientos: Movimiento[];
  productos: Producto[];
  stock: StockMovimiento[];
  proveedores: Proveedor[];
  pagosProveedores: PagoProveedor[];
};

export type Miembro = { id: string; email: string; nombre: string; rol: Rol; activo: boolean };
export type Invitacion = { id: string; email: string; rol: Rol };
export type Usuarios = { miembros: Miembro[]; invitaciones: Invitacion[] };

export const redondear = (n: number) => Math.round(n * 100) / 100;

export const subtotalItem = (item: ItemVenta) => redondear(item.kilos * item.precio);

/** Lo que el movimiento suma (compra) o resta (pago) al saldo del cliente. */
export function efectoEnSaldo(m: Movimiento): number {
  if (m.tipo === "pago") return -m.importe;
  if (m.tipo === "saldo_inicial") return m.importe;
  return redondear(m.items.reduce((total, item) => total + subtotalItem(item), 0));
}

/** El saldo nunca se guarda: siempre sale de sumar los movimientos. */
export function saldoDe(clienteId: string, movimientos: Movimiento[]): number {
  return redondear(movimientos.reduce((total, m) => (m.clienteId === clienteId ? total + efectoEnSaldo(m) : total), 0));
}

export type StockDeProducto = {
  nombre: string;
  categoria: string;
  precio: number | null;
  /** Fecha de la primera carga de stock (null = todavía no se cargó: el stock es cero). */
  desde: string | null;
  comprado: number;
  ajustes: number;
  /** Kilos vendidos desde la primera carga. */
  vendido: number;
  /** comprado + ajustes - vendido. Tampoco se guarda. */
  stock: number;
  /** Costo por kilo de la última compra con costo cargado. */
  ultimoCosto: number | null;
};

const kilos3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Stock actual de cada corte del catálogo. Arranca en cero: un corte empieza a llevar stock el día
 * de su primera carga (compra o ajuste), y sólo descuentan las ventas de ese día en adelante.
 */
export function stockPorProducto(datos: Pick<Datos, "productos" | "movimientos" | "stock">): StockDeProducto[] {
  const mapa = new Map<string, StockDeProducto>();
  const de = (nombre: string) => {
    const clave = nombre.toLowerCase();
    let fila = mapa.get(clave);
    if (!fila) {
      fila = { nombre, categoria: "", precio: null, desde: null, comprado: 0, ajustes: 0, vendido: 0, stock: 0, ultimoCosto: null };
      mapa.set(clave, fila);
    }
    return fila;
  };
  for (const p of datos.productos) {
    const fila = de(p.nombre);
    fila.precio = p.precio;
    fila.categoria = p.categoria;
  }

  const ultimaCompra = new Map<string, string>();
  for (const s of datos.stock) {
    const fila = de(s.producto);
    if (fila.desde === null || s.fecha < fila.desde) fila.desde = s.fecha;
    if (s.tipo === "ajuste") {
      fila.ajustes += s.kilos;
      continue;
    }
    fila.comprado += s.kilos;
    const clave = s.producto.toLowerCase();
    if (s.costo !== null && s.fecha >= (ultimaCompra.get(clave) ?? "")) {
      ultimaCompra.set(clave, s.fecha);
      fila.ultimoCosto = s.costo;
    }
  }

  for (const m of datos.movimientos) {
    if (m.tipo !== "venta") continue;
    for (const item of m.items) {
      const fila = de(item.detalle);
      if (fila.desde !== null && m.fecha >= fila.desde) fila.vendido += item.kilos;
    }
  }

  return [...mapa.values()]
    .map((f) => ({
      ...f,
      comprado: kilos3(f.comprado),
      ajustes: kilos3(f.ajustes),
      vendido: kilos3(f.vendido),
      stock: kilos3(f.comprado + f.ajustes - f.vendido),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Lo que se le debe a cada proveedor: compras con costo cargado menos pagos. */
export function saldosProveedores(datos: Pick<Datos, "proveedores" | "stock" | "pagosProveedores">) {
  return datos.proveedores.map((proveedor) => {
    const comprado = redondear(
      datos.stock.reduce(
        (t, s) => (s.tipo === "compra" && s.proveedorId === proveedor.id && s.costo !== null ? t + redondear(s.kilos * s.costo) : t),
        0,
      ),
    );
    const pagado = redondear(datos.pagosProveedores.reduce((t, p) => (p.proveedorId === proveedor.id ? t + p.importe : t), 0));
    return { proveedor, comprado, pagado, saldo: redondear(comprado - pagado) };
  });
}
