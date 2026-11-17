import { EMPRESA, LEYENDA_REMITO, lineasEmpresa } from "@/lib/empresa";
import { pesos } from "@/lib/formato";
import { importeALetras } from "@/lib/numeroALetras";
import { partesDeFecha, renglonesDeRemito, titularDe, totalDeRemito, type Remito } from "@/lib/remito";
import type { Cliente } from "@/lib/tipos";

/** Mínimo de renglones: la planilla de papel trae renglones para completar, la vista previa también. */
const RENGLONES_MINIMOS = 10;

const TARJETA = "rounded-xl border border-[#e1d9d9]";

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-end gap-2 py-1">
      <span className="shrink-0 text-xs text-slate-500">{etiqueta}</span>
      <span className="min-h-5 min-w-0 flex-1 break-words border-b border-dotted border-[#d8cdcd] text-sm font-bold">{valor}</span>
    </div>
  );
}

/** Vista previa en pantalla del remito; replica `lib/pdf/remito.tsx` (estilo de la planilla en papel). */
export function RemitoVista({ remito, cliente }: { remito: Remito; cliente: Cliente }) {
  const renglones = renglonesDeRemito(remito);
  const total = totalDeRemito(remito);
  const [dd, mm, aa] = partesDeFecha(remito.fecha);
  const vacios = Math.max(0, RENGLONES_MINIMOS - renglones.length);
  const quien = remito.creadoPor ? remito.creadoPor.split("@")[0] : "—";

  return (
    <div className="mx-auto max-w-3xl bg-white p-4 text-slate-900 shadow-sm ring-1 ring-black/5 sm:p-8">
      {/* Empresa | X | remito y fecha */}
      <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className={`${TARJETA} flex flex-col items-center justify-center p-3 text-center`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen estática, igual a la del PDF */}
          <img src="/logo.png" alt={EMPRESA.nombre} className="mx-auto h-24 w-24 object-contain" />
          {lineasEmpresa().map((linea) => (
            <p key={linea} className="mt-0.5 text-xs text-slate-600">
              {linea}
            </p>
          ))}
        </div>

        <div className="flex flex-row items-center justify-center gap-3 sm:w-20 sm:flex-col sm:gap-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-[#15161b] text-3xl font-bold text-[#15161b]">X</div>
          <p className="text-center text-[8px] leading-tight text-slate-500 sm:mt-1">{LEYENDA_REMITO}</p>
        </div>

        <div className={`${TARJETA} flex flex-col items-center justify-center p-3 text-center`}>
          <p className="text-2xl font-bold tracking-[0.2em] text-[#15161b]">REMITO</p>
          <p className="mt-0.5 text-sm font-bold text-[#c8161d]">{remito.comprobante ? `N° ${remito.comprobante}` : "Sin número"}</p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="mr-1 text-[10px] font-bold tracking-widest text-slate-500">FECHA</span>
            {[dd, mm, aa].map((parte, i) => (
              <span key={i} className="flex h-7 w-9 items-center justify-center rounded border border-[#c8161d] bg-[#fbeeee] text-sm font-bold text-[#15161b]">
                {parte}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Datos del cliente en la franja oscura */}
      <div className="mt-3 grid grid-cols-1 overflow-hidden rounded-xl bg-[#15161b] text-white sm:grid-cols-3">
        {[
          ["N° DE CLIENTE", String(cliente.numero)],
          ["CONDICIÓN DE VENTA", "Cuenta corriente"],
          ["CARGÓ", quien],
        ].map(([etiqueta, valor], i) => (
          <div key={etiqueta} className={`px-3 py-2 ${i ? "border-t border-[#4b4d57] sm:border-l sm:border-t-0" : ""}`}>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#f3b4b8]">{etiqueta}</p>
            <p className="break-words text-sm font-bold tracking-wide">{valor}</p>
          </div>
        ))}
      </div>

      <div className={`${TARJETA} mt-3 px-4 py-2`}>
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-[2fr_1fr]">
          <Campo etiqueta="Señor/a:" valor={titularDe(cliente)} />
          <Campo etiqueta="C.U.I.T.:" valor={cliente.cuit} />
          <Campo etiqueta="Dirección:" valor={cliente.direccion} />
          <Campo etiqueta="Localidad:" valor={cliente.localidad} />
        </div>
        <Campo etiqueta="Tel:" valor={cliente.contacto} />
      </div>

      {/* Tabla con marca de agua */}
      <div className={`${TARJETA} relative mt-3 overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- marca de agua estática */}
        <img src="/logo.png" alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]" />
        <div className="overflow-x-auto">
          <table className="relative w-full min-w-[30rem] table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[46%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#c8161d] text-xs tracking-wider text-white">
                <th className="px-2 py-1.5 text-center font-bold">CANT.</th>
                <th className="px-2 py-1.5 text-left font-bold">DESCRIPCIÓN</th>
                <th className="px-2 py-1.5 text-right font-bold">PRECIO POR KILO</th>
                <th className="px-2 py-1.5 text-right font-bold">IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              {renglones.map((r, i) => (
                <tr key={i} className="border-b border-[#d8cdcd]">
                  <td className="border-r border-[#d8cdcd] px-2 py-1 text-center tabular-nums">{r.cantidad}</td>
                  <td className="border-r border-[#d8cdcd] px-2 py-1">{r.descripcion}</td>
                  <td className="border-r border-[#d8cdcd] px-2 py-1 text-right tabular-nums">{pesos(r.precio)}</td>
                  <td className="px-2 py-1 text-right font-bold tabular-nums">{pesos(r.importe)}</td>
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
      </div>

      {/* Total */}
      <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500">SON PESOS</p>
          <p className="text-sm text-slate-700">{importeALetras(total)}</p>
        </div>
        <div className="flex items-center justify-between gap-8 rounded-xl bg-[#15161b] px-4 py-3 text-white sm:min-w-56">
          <span className="text-sm font-bold tracking-[0.15em]">TOTAL $</span>
          <span className="text-xl font-bold tabular-nums">{pesos(total).replace("$ ", "")}</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[11px] text-slate-500">
        <p className="border-t border-slate-400 pt-1">Recibí conforme (firma)</p>
        <p className="border-t border-slate-400 pt-1">Aclaración</p>
        <p className="border-t border-slate-400 pt-1">DNI</p>
      </div>

      <div className="mt-8 border-t border-[#e1d9d9] pt-3 text-center">
        <p className="text-xs font-bold">
          Gracias por confiar en {EMPRESA.nombre} · {EMPRESA.lema}
        </p>
        <p className="text-[11px] text-slate-500">{LEYENDA_REMITO}</p>
      </div>
    </div>
  );
}
