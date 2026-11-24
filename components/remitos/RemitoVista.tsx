import { EMPRESA, LEYENDA_REMITO, lineasEmpresa } from "@/lib/empresa";
import { pesos } from "@/lib/formato";
import { importeALetras } from "@/lib/numeroALetras";
import { partesDeFecha, renglonesDeRemito, titularDe, totalDeRemito, type Remito } from "@/lib/remito";
import type { Cliente } from "@/lib/tipos";

/** Mínimo de renglones: la planilla de papel trae renglones para completar, la vista previa también. */
const RENGLONES_MINIMOS = 10;

const TARJETA = "rounded-lg border border-[#e1d9d9]";

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-end gap-1.5 py-0.5">
      <span className="shrink-0 text-[11px] text-slate-500">{etiqueta}</span>
      <span className="min-h-4 min-w-0 flex-1 break-words border-b border-dotted border-[#d8cdcd] text-xs font-bold">{valor}</span>
    </div>
  );
}

/** Una copia del remito (el PDF imprime dos por hoja apaisada: original y duplicado). */
function Copia({ remito, cliente, etiqueta }: { remito: Remito; cliente: Cliente; etiqueta: string }) {
  const renglones = renglonesDeRemito(remito);
  const total = totalDeRemito(remito);
  const [dd, mm, aa] = partesDeFecha(remito.fecha);
  const vacios = Math.max(0, RENGLONES_MINIMOS - renglones.length);
  const quien = remito.creadoPor ? remito.creadoPor.split("@")[0] : "—";

  return (
    <div className="min-w-0 bg-white p-3 text-slate-900 shadow-sm ring-1 ring-black/5 sm:p-4">
      <p className="mb-1.5 text-[11px] font-bold tracking-[0.25em] text-[#c8161d]">{etiqueta}</p>

      {/* Empresa | X | remito y fecha */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <div className={`${TARJETA} flex flex-col items-center justify-center p-2 text-center`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen estática, igual a la del PDF */}
          <img src="/logo.png" alt={EMPRESA.nombre} className="mx-auto h-16 w-16 object-contain" />
          {lineasEmpresa().map((linea) => (
            <p key={linea} className="mt-0.5 text-[10px] text-slate-600">
              {linea}
            </p>
          ))}
        </div>

        <div className="flex w-14 flex-col items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-[#15161b] text-2xl font-bold leading-none text-[#15161b]">X</div>
          <p className="mt-1 text-center text-[6px] leading-tight text-slate-500">{LEYENDA_REMITO}</p>
        </div>

        <div className={`${TARJETA} flex flex-col items-center justify-center p-2 text-center`}>
          <p className="text-xl font-bold tracking-[0.18em] text-[#15161b]">REMITO</p>
          <p className="text-xs font-bold text-[#c8161d]">{remito.comprobante ? `N° ${remito.comprobante}` : "Sin número"}</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <span className="mr-0.5 text-[9px] font-bold tracking-widest text-slate-500">FECHA</span>
            {[dd, mm, aa].map((parte, i) => (
              <span key={i} className="flex h-6 w-7 items-center justify-center rounded border border-[#c8161d] bg-[#fbeeee] text-xs font-bold text-[#15161b]">
                {parte}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Datos del cliente en la franja oscura */}
      <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-lg bg-[#15161b] text-white">
        {[
          ["N° DE CLIENTE", String(cliente.numero)],
          ["CONDICIÓN DE VENTA", "Cuenta corriente"],
          ["CARGÓ", quien],
        ].map(([et, valor], i) => (
          <div key={et} className={`min-w-0 px-2.5 py-1.5 ${i ? "border-l border-[#4b4d57]" : ""}`}>
            <p className="text-[8px] font-bold tracking-[0.12em] text-[#f3b4b8]">{et}</p>
            <p className="break-words text-xs font-bold tracking-wide">{valor}</p>
          </div>
        ))}
      </div>

      <div className={`${TARJETA} mt-2 px-3 py-1`}>
        <Campo etiqueta="Señor/a:" valor={titularDe(cliente)} />
        <div className="grid grid-cols-[3fr_2fr] gap-x-4">
          <Campo etiqueta="Dirección:" valor={cliente.direccion} />
          <Campo etiqueta="Localidad:" valor={cliente.localidad} />
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <Campo etiqueta="Tel:" valor={cliente.contacto} />
          <Campo etiqueta="C.U.I.T.:" valor={cliente.cuit} />
        </div>
      </div>

      {/* Tabla con marca de agua */}
      <div className={`${TARJETA} relative mt-2 overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- marca de agua estática */}
        <img src="/logo.png" alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]" />
        <table className="relative w-full table-fixed border-collapse text-xs">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[42%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#c8161d] text-[10px] tracking-wider text-white">
              <th className="px-1.5 py-1.5 text-center font-bold">CANT.</th>
              <th className="px-1.5 py-1.5 text-left font-bold">DESCRIPCIÓN</th>
              <th className="px-1.5 py-1.5 text-right font-bold">PRECIO POR KILO</th>
              <th className="px-1.5 py-1.5 text-right font-bold">IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            {renglones.map((r, i) => (
              <tr key={i} className="border-b border-[#d8cdcd]">
                <td className="border-r border-[#d8cdcd] px-1.5 py-1 text-center tabular-nums">{r.cantidad}</td>
                <td className="break-words border-r border-[#d8cdcd] px-1.5 py-1">{r.descripcion}</td>
                <td className="border-r border-[#d8cdcd] px-1.5 py-1 text-right tabular-nums">{pesos(r.precio)}</td>
                <td className="px-1.5 py-1 text-right font-bold tabular-nums">{pesos(r.importe)}</td>
              </tr>
            ))}
            {Array.from({ length: vacios }, (_, i) => (
              <tr key={`vacio-${i}`} className="h-6 border-b border-[#d8cdcd] last:border-b-0">
                <td className="border-r border-[#d8cdcd]" />
                <td className="border-r border-[#d8cdcd]" />
                <td className="border-r border-[#d8cdcd]" />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-widest text-slate-500">SON PESOS</p>
          <p className="text-xs text-slate-700">{importeALetras(total)}</p>
        </div>
        <div className="flex min-w-44 items-center justify-between gap-6 rounded-lg bg-[#15161b] px-3 py-2 text-white">
          <span className="text-xs font-bold tracking-[0.15em]">TOTAL $</span>
          <span className="text-lg font-bold tabular-nums">{pesos(total).replace("$ ", "")}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-500">
        <p className="border-t border-slate-400 pt-1">Recibí conforme (firma)</p>
        <p className="border-t border-slate-400 pt-1">Aclaración</p>
        <p className="border-t border-slate-400 pt-1">DNI</p>
      </div>

      <div className="mt-4 border-t border-[#e1d9d9] pt-2 text-center">
        <p className="text-[11px] font-bold">
          Gracias por confiar en {EMPRESA.nombre} · {EMPRESA.lema}
        </p>
        <p className="text-[10px] text-slate-500">{LEYENDA_REMITO}</p>
      </div>
    </div>
  );
}

/** Vista previa en pantalla del remito; replica `lib/pdf/remito.tsx`: hoja apaisada con original y duplicado lado a lado. */
export function RemitoVista({ remito, cliente }: { remito: Remito; cliente: Cliente }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Copia remito={remito} cliente={cliente} etiqueta="ORIGINAL" />
      <Copia remito={remito} cliente={cliente} etiqueta="DUPLICADO" />
    </div>
  );
}
