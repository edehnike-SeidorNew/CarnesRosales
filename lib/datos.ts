import type { Cliente, Movimiento } from "./tipos";

// Datos en duro tomados de la planilla de Carnes Rosales.

const vacio = { titular: "", direccion: "", localidad: "", cuit: "", contacto: "", observaciones: "" };

export const CLIENTES: Cliente[] = [
  { ...vacio, id: "1", numero: 1, nombreFantasia: "El Buen Gusto", titular: "Bruno" },
  { ...vacio, id: "2", numero: 2, nombreFantasia: "Eber" },
  { ...vacio, id: "3", numero: 3, nombreFantasia: "Tomasa" },
  { ...vacio, id: "4", numero: 4, nombreFantasia: "Fer 222" },
  {
    ...vacio,
    id: "5",
    numero: 5,
    nombreFantasia: "La Rotonda",
    titular: "Gonzalo Benitez",
    direccion: "Av. San Bernardo",
    localidad: "San Bernardo",
  },
];

type SinAutor<T> = T extends unknown ? Omit<T, "creadoPor"> : never;

const BASE: SinAutor<Movimiento>[] = [
  { id: "m1", clienteId: "1", fecha: "2026-10-15", tipo: "saldo_inicial", comprobante: "", importe: 77050 },
  {
    id: "m2",
    clienteId: "1",
    fecha: "2026-10-15",
    tipo: "venta",
    comprobante: "5575",
    items: [
      { detalle: "Picada", kilos: 11.8, precio: 13000 },
      { detalle: "Vacíos", kilos: 9.6, precio: 16500 },
    ],
  },
  { id: "m3", clienteId: "1", fecha: "2026-10-22", tipo: "pago", comprobante: "5539", importe: 100000, medioPago: null },
  {
    id: "m4",
    clienteId: "1",
    fecha: "2026-10-22",
    tipo: "venta",
    comprobante: "5889",
    items: [{ detalle: "Picada", kilos: 10, precio: 12500 }],
  },
  { id: "m5", clienteId: "1", fecha: "2026-10-23", tipo: "pago", comprobante: "5970", importe: 100000, medioPago: null },
  { id: "m6", clienteId: "1", fecha: "2026-10-26", tipo: "pago", comprobante: "5542", importe: 180000, medioPago: null },
  {
    id: "m7",
    clienteId: "1",
    fecha: "2026-11-04",
    tipo: "venta",
    comprobante: "3077",
    items: [{ detalle: "Picada", kilos: 17, precio: 13000 }],
  },
  {
    id: "m8",
    clienteId: "1",
    fecha: "2026-11-11",
    tipo: "venta",
    comprobante: "2734",
    items: [{ detalle: "Picada", kilos: 15.8, precio: 13000 }],
  },
];

// La planilla no dice quién cargó cada movimiento.
export const MOVIMIENTOS: Movimiento[] = BASE.map((m) => ({ ...m, creadoPor: "" }) as Movimiento);
