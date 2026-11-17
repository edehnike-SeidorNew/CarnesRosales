"use client";

import { useState, type FormEvent } from "react";
import { crearProducto, guardarProducto } from "@/app/acciones";
import { Campo, Tarjeta, Vacio } from "@/components/clientes/comunes";
import { useAccion } from "@/components/comun/useAccion";
import { ChevronRightIcon, PlusIcon, TagIcon } from "@/components/layout/icons";
import { PanelOpciones, type OpcionPanel } from "@/components/layout/PanelOpciones";
import { Autocompletar } from "@/components/ui/Autocompletar";
import { CampoNumero } from "@/components/ui/CampoNumero";
import { Select } from "@/components/ui/Select";
import { aCampo, aNumero, BOTON, BOTON_SECUNDARIO, CAMPO, pesos } from "@/lib/formato";
import type { Producto } from "@/lib/tipos";

const RUBROS_BASE = ["Vacuno", "Cerdo", "Pollo", "Embutidos y chacinados", "Cordero"];
const SIN_RUBRO = "Sin rubro";
const TD = "px-3 py-2.5 align-middle";

type Filtro = string; // "todos", "sin" o el nombre de un rubro

function precioDeCampo(texto: string): number | null {
  const n = aNumero(texto);
  return texto.trim() && n > 0 ? n : null;
}

/** Un producto: rubro y precio de lista. El administrador los edita y guarda; el resto sólo los ve. */
function FilaProducto({ producto, rubros, editable }: { producto: Producto; rubros: string[]; editable: boolean }) {
  const [categoria, setCategoria] = useState(producto.categoria);
  const [precio, setPrecio] = useState(producto.precio ? aCampo(producto.precio) : "");
  const { pendiente, error, correr } = useAccion();

  const nuevoPrecio = precioDeCampo(precio);
  const cambio = categoria !== producto.categoria || nuevoPrecio !== producto.precio;
  const opciones = [{ value: "", label: SIN_RUBRO }, ...rubros.map((r) => ({ value: r, label: r }))];

  return (
    <tr className="border-t border-brand-border">
      <td className={`${TD} font-medium text-slate-900`}>{producto.nombre}</td>
      <td className={`${TD} w-60`}>
        {editable ? (
          <Select value={categoria} onChange={setCategoria} opciones={opciones} ariaLabel={`Rubro de ${producto.nombre}`} className="w-full" />
        ) : (
          <span className={producto.categoria ? "text-slate-800" : "text-slate-400"}>{producto.categoria || SIN_RUBRO}</span>
        )}
      </td>
      <td className={`${TD} w-44 text-right`}>
        {editable ? (
          <CampoNumero value={precio} onChange={setPrecio} ariaLabel={`Precio por kilo de ${producto.nombre}`} placeholder="Sin precio" />
        ) : (
          <span className="tabular-nums text-slate-800">{producto.precio ? pesos(producto.precio) : "—"}</span>
        )}
      </td>
      {editable && (
        <td className={`${TD} w-32 whitespace-nowrap text-right`}>
          {cambio ? (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => correr(() => guardarProducto(producto.nombre, { categoria, precio: nuevoPrecio }), undefined, "Producto guardado")}
              className={`${BOTON} !px-3 !py-1.5 disabled:opacity-60`}
            >
              {pendiente ? "Guardando..." : "Guardar"}
            </button>
          ) : (
            <span className="text-xs text-slate-400">Sin cambios</span>
          )}
          {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
        </td>
      )}
    </tr>
  );
}

function NuevoProducto({ rubros, onListo }: { rubros: string[]; onListo: () => void }) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const { pendiente, error, setError, correr } = useAccion();

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Escribí el nombre del producto.");
    correr(() => crearProducto({ nombre, categoria, precio: precioDeCampo(precio) }), onListo, "Producto creado");
  }

  return (
    <form onSubmit={enviar} className="mb-5 rounded-lg border border-brand-border bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-brand">Nuevo producto</h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_16rem_10rem]">
        <Campo label="Nombre">
          <input className={CAMPO} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} autoFocus />
        </Campo>
        <Campo label="Rubro">
          <Autocompletar value={categoria} onChange={setCategoria} sugerencias={rubros} placeholder="Elegí uno o escribí uno nuevo" ariaLabel="Rubro" />
        </Campo>
        <Campo label="Precio por kilo">
          <CampoNumero value={precio} onChange={setPrecio} placeholder="Opcional" />
        </Campo>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button type="submit" disabled={pendiente} className={`${BOTON} disabled:opacity-60`}>
          {pendiente ? "Guardando..." : "Crear producto"}
        </button>
        <button type="button" onClick={onListo} className={BOTON_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Lista de productos con su rubro y su precio por kilo (la lista de precios que sugiere la venta). */
export function ProductosPanel({ productos, puedeEditar }: { productos: Producto[]; puedeEditar: boolean }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  // Rubros cerrados (la lista de ese rubro se esconde). Por defecto está todo abierto.
  const [cerrados, setCerrados] = useState<Set<string>>(new Set());

  const rubros = [...new Set([...RUBROS_BASE, ...productos.map((p) => p.categoria).filter(Boolean)])];
  const cantidad = (f: (p: Producto) => boolean) => productos.filter(f).length;
  const conPrecio = cantidad((p) => p.precio !== null);
  const sinRubro = cantidad((p) => !p.categoria);

  const opciones: OpcionPanel<Filtro>[] = [
    { id: "todos", label: `Todos (${productos.length})`, Icon: TagIcon },
    ...rubros.map((r) => ({ id: r, label: `${r} (${cantidad((p) => p.categoria === r)})`, Icon: TagIcon })),
    { id: "sin", label: `Sin rubro (${sinRubro})`, Icon: TagIcon },
  ];

  const q = busqueda.trim().toLowerCase();
  const visibles = productos
    .filter((p) => (filtro === "todos" ? true : filtro === "sin" ? !p.categoria : p.categoria === filtro))
    .filter((p) => !q || p.nombre.toLowerCase().includes(q));

  // Agrupados por rubro, en el orden de la lista; lo que no tiene rubro va al final.
  const grupos = [...rubros, ""].map((r) => ({ rubro: r, lista: visibles.filter((p) => p.categoria === r) })).filter((g) => g.lista.length > 0);

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Rubro" opciones={opciones} seleccion={filtro} onSelect={setFiltro} fija={false} desplazamiento="xl:mt-20" />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-bold text-brand">Productos y precios</h1>
          {puedeEditar && !creando && (
            <button type="button" onClick={() => setCreando(true)} className={`${BOTON_SECUNDARIO} ml-auto !px-3 !py-1.5`}>
              <PlusIcon className="h-4 w-4" />
              Nuevo producto
            </button>
          )}
        </div>
        <p className="mb-5 text-sm text-slate-500">
          {puedeEditar
            ? "Ponele rubro y precio por kilo a cada producto. El precio se sugiere al cargar una venta, y ahí se puede cambiar."
            : "Lista de productos con su rubro y su precio por kilo. Los cambia el administrador."}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Tarjeta titulo="Productos" valor={String(productos.length)} nota={`${conPrecio} con precio de lista`} />
          <Tarjeta titulo="Rubros" valor={String(rubros.filter((r) => productos.some((p) => p.categoria === r)).length)} nota="en uso" />
          <Tarjeta titulo="Sin rubro" valor={String(sinRubro)} nota={sinRubro ? "Aparecen en “Otros” en el Inicio" : "Todos tienen rubro"} />
        </div>

        {creando && <NuevoProducto rubros={rubros} onListo={() => setCreando(false)} />}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            className={`${CAMPO} max-w-sm`}
            placeholder="Buscar producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar producto"
          />
          {!q && grupos.length > 1 && (
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setCerrados(new Set())} className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}>
                Abrir todo
              </button>
              <button type="button" onClick={() => setCerrados(new Set(grupos.map((g) => g.rubro || "sin")))} className={`${BOTON_SECUNDARIO} !px-3 !py-1.5`}>
                Cerrar todo
              </button>
            </div>
          )}
        </div>

        {grupos.length === 0 ? (
          <Vacio icono={<TagIcon className="h-6 w-6" />}>No hay productos para mostrar.</Vacio>
        ) : (
          <div className="space-y-5">
            {grupos.map(({ rubro, lista }) => {
              const clave = rubro || "sin";
              // Mientras se busca, los rubros con resultados se muestran abiertos para que se vean.
              const abierto = Boolean(q) || !cerrados.has(clave);
              return (
              <section key={clave} className="overflow-hidden rounded-lg border border-brand-border bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setCerrados((antes) => {
                      const nuevo = new Set(antes);
                      if (nuevo.has(clave)) nuevo.delete(clave);
                      else nuevo.add(clave);
                      return nuevo;
                    })
                  }
                  aria-expanded={abierto}
                  className="flex w-full items-center gap-2 bg-brand-soft px-3 py-2.5 text-left hover:bg-brand-border/40"
                >
                  <ChevronRightIcon className={`h-4 w-4 shrink-0 text-brand transition-transform ${abierto ? "rotate-90" : ""}`} />
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-brand">{rubro || SIN_RUBRO}</h2>
                  <span className="ml-auto text-xs text-slate-500">{lista.length} {lista.length === 1 ? "producto" : "productos"}</span>
                </button>
                {/* Cerrado se esconde pero sigue en pantalla: así no se pierde lo que se estaba editando. */}
                <div className={abierto ? "overflow-x-auto" : "hidden"}>
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <tbody>
                      {lista.map((p) => (
                        <FilaProducto key={`${p.nombre}|${p.categoria}|${p.precio}`} producto={p} rubros={rubros} editable={puedeEditar} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
