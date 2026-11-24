import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { describirRango, enPeriodo, fechaAR, kilos, pesos } from "@/lib/formato";
import { efectoEnSaldo, etiquetaMedio, redondear, subtotalItem, type Cliente, type Movimiento } from "@/lib/tipos";
import { LOGO_PDF } from "./logoPdf";

const MARCA = "#2b2d6e";
const BORDE = "#cfd2ec";
const SUAVE = "#eeeffa";

const s = StyleSheet.create({
  pagina: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#0f172a" },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  marca: { fontSize: 18, fontFamily: "Helvetica-Bold", color: MARCA },
  tenue: { color: "#64748b" },
  titulo: { fontSize: 13, fontFamily: "Helvetica-Bold", color: MARCA },
  cliente: { borderWidth: 1, borderColor: BORDE, borderRadius: 6, padding: 10, marginBottom: 12 },
  nombre: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  resumen: { flexDirection: "row", gap: 8, marginBottom: 14 },
  caja: { flex: 1, borderWidth: 1, borderColor: BORDE, borderRadius: 6, padding: 8 },
  cajaFuerte: { width: 220, backgroundColor: MARCA, borderRadius: 6, padding: 8 },
  etiqueta: { fontSize: 7, color: "#64748b", marginBottom: 3 },
  valor: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  fila: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDE, paddingVertical: 4, paddingHorizontal: 4 },
  encabezado: { flexDirection: "row", backgroundColor: SUAVE, paddingVertical: 5, paddingHorizontal: 4 },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: MARCA },
  pie: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#64748b" },
});

// Anchos de columna (suman 100%).
const COL = { fecha: "10%", comp: "11%", concepto: "21%", kilos: "8%", precio: "12%", compra: "13%", pago: "12%", saldo: "13%" } as const;
const der = { textAlign: "right" as const };

export type DatosResumen = {
  cliente: Cliente;
  /** Movimientos del cliente, ya ordenados por fecha. */
  movimientos: Movimiento[];
  /** AAAA-MM-DD desde el que se listan los movimientos (null = todos). */
  desde: string | null;
  /** AAAA-MM-DD hasta el que se listan (null = hasta hoy); sirve para un día puntual. */
  hasta?: string | null;
  /** AAAA-MM-DD de emisión. */
  hoy: string;
};

function ResumenCuenta({ cliente, movimientos, desde, hasta = null, hoy }: DatosResumen) {
  let acumulado = 0;
  const filas = movimientos.map((m) => {
    acumulado = redondear(acumulado + efectoEnSaldo(m));
    return { m, saldo: acumulado };
  });
  const saldo = acumulado;
  const visibles = filas.filter(({ m }) => enPeriodo(m.fecha, desde, hasta));

  return (
    <Document title={`Resumen de cuenta - ${cliente.nombreFantasia}`} author="Carnes Rosales">
      <Page size="A4" style={s.pagina}>
        <View style={s.cabecera}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt */}
            <Image src={LOGO_PDF} style={{ width: 54, height: 54 }} />
            <View>
              <Text style={s.marca}>Carnes Rosales</Text>
              <Text style={s.tenue}>Resumen de cuenta corriente</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.titulo}>Emitido el {fechaAR(hoy)}</Text>
            <Text style={s.tenue}>{desde ? `Movimientos ${describirRango(desde, hasta)}` : "Todos los movimientos"}</Text>
          </View>
        </View>

        <View style={s.cliente}>
          <Text style={s.nombre}>{cliente.nombreFantasia}</Text>
          <Text style={s.tenue}>
            {[
              `Cliente N° ${cliente.numero}`,
              cliente.titular && `Titular: ${cliente.titular}`,
              [cliente.direccion, cliente.localidad].filter(Boolean).join(", "),
              cliente.cuit && `CUIT: ${cliente.cuit}`,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
        </View>

        {/* Sólo el saldo adeudado: el detalle de compras y pagos está en la tabla de abajo. */}
        <View style={s.resumen}>
          <View style={s.cajaFuerte}>
            <Text style={[s.etiqueta, { color: "#cfd2ec" }]}>SALDO ADEUDADO A HOY</Text>
            <Text style={[s.valor, { color: "#ffffff" }]}>{pesos(saldo)}</Text>
          </View>
        </View>

        <View style={s.encabezado} fixed>
          <Text style={[s.th, { width: COL.fecha }]}>FECHA</Text>
          <Text style={[s.th, { width: COL.comp }]}>N° COMP.</Text>
          <Text style={[s.th, { width: COL.concepto }]}>CONCEPTO</Text>
          <Text style={[s.th, der, { width: COL.kilos }]}>KILOS</Text>
          <Text style={[s.th, der, { width: COL.precio }]}>PRECIO X KG</Text>
          <Text style={[s.th, der, { width: COL.compra }]}>TOTAL COMPRA</Text>
          <Text style={[s.th, der, { width: COL.pago }]}>PAGO</Text>
          <Text style={[s.th, der, { width: COL.saldo }]}>SALDO</Text>
        </View>

        {visibles.length === 0 && <Text style={[s.tenue, { padding: 12, textAlign: "center" }]}>No hay movimientos en este período.</Text>}

        {visibles.map(({ m, saldo: saldoFila }) => {
          const renglones =
            m.tipo === "venta"
              ? m.items.map((i) => ({ concepto: i.detalle, kilos: kilos(i.kilos), precio: pesos(i.precio), subtotal: subtotalItem(i) }))
              : [{ concepto: m.tipo === "pago" ? `Pago (${etiquetaMedio(m.medioPago)})` : m.tipo === "descuento" ? `Descuento${m.nota ? ` - ${m.nota}` : ""}` : m.tipo === "cargo" ? `Cargo${m.nota ? ` - ${m.nota}` : ""}` : "Saldo anterior", kilos: "", precio: "", subtotal: 0 }];
          const importe = efectoEnSaldo(m);
          const ultimo = renglones.length - 1;
          return (
            // wrap={false}: un remito con varios productos no se parte entre dos hojas.
            <View key={m.id} wrap={false}>
              {renglones.map((r, i) => (
                <View key={i} style={[s.fila, i < ultimo ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={{ width: COL.fecha }}>{i === 0 ? fechaAR(m.fecha) : ""}</Text>
                  <Text style={[s.tenue, { width: COL.comp }]}>{i === 0 ? m.comprobante : ""}</Text>
                  <Text style={{ width: COL.concepto }}>{r.concepto}</Text>
                  <Text style={[der, { width: COL.kilos }]}>{r.kilos}</Text>
                  <Text style={[der, { width: COL.precio }]}>{r.precio}</Text>
                  <Text style={[der, { width: COL.compra }]}>{i === ultimo && importe > 0 ? pesos(importe) : ""}</Text>
                  <Text style={[der, { width: COL.pago, color: "#047857" }]}>{i === ultimo && importe < 0 ? pesos(-importe) : ""}</Text>
                  <Text style={[der, { width: COL.saldo, fontFamily: "Helvetica-Bold" }]}>{i === ultimo ? pesos(saldoFila) : ""}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <View style={s.pie} fixed>
          <Text>Carnes Rosales · Resumen de cuenta de {cliente.nombreFantasia}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function generarResumenPdf(datos: DatosResumen): Promise<Buffer> {
  return renderToBuffer(<ResumenCuenta {...datos} />);
}
