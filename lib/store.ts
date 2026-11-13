"use client";

import { useSyncExternalStore } from "react";
import { CLIENTES, MOVIMIENTOS } from "./datos";
import type { Cliente, Movimiento, NuevoCliente, NuevoMovimiento } from "./tipos";

// Demo sin base de datos: arranca con los datos en duro y guarda lo que se carga en el navegador.
// Cuando haya base de datos, sólo hay que reemplazar este archivo.

type Estado = { clientes: Cliente[]; movimientos: Movimiento[] };

const CLAVE = "carnes_rosales_demo_v1";
const SEMILLA: Estado = { clientes: CLIENTES, movimientos: MOVIMIENTOS };

let estado: Estado | null = null;
const oyentes = new Set<() => void>();

function leer(): Estado {
  if (estado) return estado;
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) {
      estado = JSON.parse(guardado) as Estado;
      return estado;
    }
  } catch {
    /* sin almacenamiento o dato roto: se usan los datos de ejemplo */
  }
  estado = SEMILLA;
  return estado;
}

function guardar(nuevo: Estado) {
  estado = nuevo;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    /* queda sólo en memoria */
  }
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
}

export function useDatos(): Estado {
  return useSyncExternalStore(suscribir, leer, () => SEMILLA);
}

const nuevoId = (prefijo: string) => `${prefijo}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

export function agregarCliente(datos: NuevoCliente): Cliente {
  const actual = leer();
  const numero = actual.clientes.reduce((max, c) => Math.max(max, c.numero), 0) + 1;
  const cliente: Cliente = { ...datos, id: nuevoId("c"), numero };
  guardar({ ...actual, clientes: [...actual.clientes, cliente] });
  return cliente;
}

export function agregarMovimiento(datos: NuevoMovimiento) {
  const actual = leer();
  const movimiento = { ...datos, id: nuevoId("m") } as Movimiento;
  guardar({ ...actual, movimientos: [...actual.movimientos, movimiento] });
}

export function eliminarMovimiento(id: string) {
  const actual = leer();
  guardar({ ...actual, movimientos: actual.movimientos.filter((m) => m.id !== id) });
}

export function restablecerDatos() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
  estado = SEMILLA;
  oyentes.forEach((avisar) => avisar());
}
