import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { EMPRESA, LEYENDA_REMITO, lineasEmpresa } from "@/lib/empresa";
import { pesos } from "@/lib/formato";
import { importeALetras } from "@/lib/numeroALetras";
import { partesDeFecha, renglonesDeRemito, titularDe, totalDeRemito, type Remito } from "@/lib/remito";
import type { Cliente } from "@/lib/tipos";
import { LOGO_PDF } from "./logoPdf";

// Sin cortes de palabra automáticos (react-pdf corta en inglés).
Font.registerHyphenationCallback((palabra) => [palabra]);

// Colores del logo: negro y rojo.
const ROJO = "#c8161d";
const NEGRO = "#15161b";
const TINTA = "#14151a";
const BORDE = "#e1d9d9";
const LINEA = "#d8cdcd";
const SUAVE = "#fbeeee";
const TENUE = "#6b7280";

/** La planilla de papel trae renglones para completar: el PDF también, aunque haya pocos productos. */
const RENGLONES_MINIMOS = 12;

const s = StyleSheet.create({
  pagina: { paddingTop: 28, paddingBottom: 56, paddingHorizontal: 30, fontSize: 9, fontFamily: "Helvetica", color: TINTA },
  negrita: { fontFamily: "Helvetica-Bold" },

  // Encabezado: empresa | letra X | tipo de comprobante y fecha
  encabezado: { flexDirection: "row", alignItems: "stretch" },
  empresa: { flex: 1, border: `1pt solid ${BORDE}`, borderRadius: 8, padding: 10, alignItems: "center", justifyContent: "center" },
  logo: { width: 96, height: 96 },
  empresaLinea: { fontSize: 8.5, color: "#374151", marginTop: 3, textAlign: "center" },
  colX: { width: 74, alignItems: "center", justifyContent: "center" },
  cajaX: { width: 46, height: 46, border: `1.5pt solid ${NEGRO}`, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  letraX: { fontFamily: "Helvetica-Bold", fontSize: 28, color: NEGRO },
  notaX: { fontSize: 6, color: TENUE, textAlign: "center", marginTop: 4, width: 66 },
  doc: { flex: 1, border: `1pt solid ${BORDE}`, borderRadius: 8, padding: 10, alignItems: "center", justifyContent: "center" },
  docTitulo: { fontFamily: "Helvetica-Bold", fontSize: 21, letterSpacing: 3, color: NEGRO, textAlign: "center" },
  docNumero: { fontFamily: "Helvetica-Bold", fontSize: 11, color: ROJO, marginTop: 2, textAlign: "center" },
  filaFecha: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10 },
  etiquetaFecha: { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: TENUE, letterSpacing: 1, marginRight: 6 },
  casillero: { width: 30, height: 22, border: `1pt solid ${ROJO}`, borderRadius: 4, marginRight: 4, alignItems: "center", justifyContent: "center", backgroundColor: SUAVE },
  textoCasillero: { fontFamily: "Helvetica-Bold", fontSize: 11, color: NEGRO },

  // Franja de datos del cliente
  franja: { flexDirection: "row", marginTop: 10, backgroundColor: NEGRO, borderRadius: 8 },
  celda: { flex: 1, paddingVertical: 7, paddingHorizontal: 10 },
  celdaBorde: { borderLeft: "0.5pt solid #4b4d57" },
  franjaEtiqueta: { fontSize: 6.5, color: "#f3b4b8", letterSpacing: 1.2, fontFamily: "Helvetica-Bold" },
  franjaValor: { fontSize: 10.5, color: "#ffffff", fontFamily: "Helvetica-Bold", marginTop: 2, letterSpacing: 0.5 },

  // Datos del cliente: renglones como la planilla
  tarjeta: { marginTop: 10, border: `1pt solid ${BORDE}`, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  fila: { flexDirection: "row" },
  campo: { flexDirection: "row", alignItems: "flex-end", paddingVertical: 4 },
  campoEtiqueta: { fontSize: 8, color: TENUE, marginRight: 6 },
  campoValor: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", borderBottom: `0.75pt dotted ${LINEA}`, paddingBottom: 1, minHeight: 13 },

  // Tabla
  tabla: { marginTop: 10, border: `1pt solid ${BORDE}`, borderRadius: 8, overflow: "hidden" },
  marcaAgua: { position: "absolute", top: 60, left: "50%", marginLeft: -110, width: 220, height: 220, opacity: 0.07 },
  thead: { flexDirection: "row", backgroundColor: ROJO },
  th: { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", paddingVertical: 6, paddingHorizontal: 6, letterSpacing: 0.8 },
  tr: { flexDirection: "row", borderBottom: `0.5pt solid ${LINEA}`, minHeight: 20 },
  trCompacto: { minHeight: 17 },
  td: { fontSize: 9.5, paddingVertical: 5, paddingHorizontal: 6 },
  sepColumna: { borderRight: `0.5pt solid ${LINEA}` },

  // Total
  abajo: { flexDirection: "row", marginTop: 10, alignItems: "stretch" },
  letras: { flex: 1, paddingRight: 12, justifyContent: "center" },
  letrasEtiqueta: { fontFamily: "Helvetica-Bold", fontSize: 8, color: TENUE, letterSpacing: 1 },
  letrasTexto: { fontSize: 9, marginTop: 2, color: "#374151" },
  cajaTotal: { width: 210, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: NEGRO, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  totalEtiqueta: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#ffffff", letterSpacing: 1.5 },
  totalValor: { fontFamily: "Helvetica-Bold", fontSize: 17, color: "#ffffff" },

  // Firma
  firmas: { flexDirection: "row", marginTop: 26, gap: 30 },
  firma: { flex: 1, borderTop: `0.75pt solid ${TENUE}`, paddingTop: 4, fontSize: 7.5, color: TENUE, textAlign: "center" },

  pie: { position: "absolute", bottom: 22, left: 30, right: 30, borderTop: `0.5pt solid ${BORDE}`, paddingTop: 5 },
  pieLinea: { fontSize: 7, textAlign: "center", color: TENUE, marginTop: 1.5 },
});

// Cantidad | Descripción | Precio por kilo | Importe, como la planilla.
const COL = { cant: "14%", desc: "46%", precio: "20%", importe: "20%" } as const;

function Campo({ etiqueta, valor, ancho }: { etiqueta: string; valor: string; ancho: string }) {
  return (
    <View style={[s.campo, { width: ancho }]}>
      <Text style={s.campoEtiqueta}>{etiqueta}</Text>
      <Text style={s.campoValor}>{valor}</Text>
    </View>
  );
}

function RemitoDocumento({ remito, cliente }: { remito: Remito; cliente: Cliente }) {
  const renglones = renglonesDeRemito(remito);
  const total = totalDeRemito(remito);
  const [dd, mm, aa] = partesDeFecha(remito.fecha);
  const compacto = renglones.length > 10;
  const vacios = Math.max(0, RENGLONES_MINIMOS - renglones.length);
  const numero = remito.comprobante ? `N° ${remito.comprobante}` : "Sin número";
  const quien = remito.creadoPor ? remito.creadoPor.split("@")[0] : "—";

  return (
    <Document title={`Remito ${remito.comprobante || "s/n"} - ${cliente.nombreFantasia}`} author={EMPRESA.nombre}>
      <Page size="A4" style={s.pagina}>
        {/* Si el remito pasa a una 2.ª hoja, ésa arranca identificada. */}
        <View
          fixed
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottom: `1pt solid ${BORDE}`, paddingBottom: 6, marginBottom: 10 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: TENUE }}>REMITO {numero} · {cliente.nombreFantasia}</Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: TENUE }}>Hoja {pageNumber}</Text>
              </View>
            ) : null
          }
        />

        <View style={s.encabezado}>
          <View style={s.empresa}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt */}
            <Image src={LOGO_PDF} style={s.logo} />
            {lineasEmpresa().map((linea) => (
              <Text key={linea} style={s.empresaLinea}>
                {linea}
              </Text>
            ))}
          </View>

          <View style={s.colX}>
            <View style={s.cajaX}>
              <Text style={s.letraX}>X</Text>
            </View>
            <Text style={s.notaX}>{LEYENDA_REMITO}</Text>
          </View>

          <View style={s.doc}>
            <View>
              <Text style={s.docTitulo}>REMITO</Text>
              <Text style={s.docNumero}>{numero}</Text>
            </View>
            <View style={s.filaFecha}>
              <Text style={s.etiquetaFecha}>FECHA</Text>
              {[dd, mm, aa].map((parte, i) => (
                <View key={i} style={s.casillero}>
                  <Text style={s.textoCasillero}>{parte}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.franja}>
          {[
            ["N° DE CLIENTE", String(cliente.numero)],
            ["CONDICIÓN DE VENTA", "Cuenta corriente"],
            ["CARGÓ", quien],
          ].map(([etiqueta, valor], i) => (
            <View key={etiqueta} style={i ? [s.celda, s.celdaBorde] : s.celda}>
              <Text style={s.franjaEtiqueta}>{etiqueta}</Text>
              <Text style={s.franjaValor}>{valor}</Text>
            </View>
          ))}
        </View>

        <View style={s.tarjeta}>
          <View style={s.fila}>
            <Campo etiqueta="Señor/a:" valor={titularDe(cliente)} ancho="64%" />
            <View style={{ width: "4%" }} />
            <Campo etiqueta="C.U.I.T.:" valor={cliente.cuit} ancho="32%" />
          </View>
          <View style={s.fila}>
            <Campo etiqueta="Dirección:" valor={cliente.direccion} ancho="64%" />
            <View style={{ width: "4%" }} />
            <Campo etiqueta="Localidad:" valor={cliente.localidad} ancho="32%" />
          </View>
          <View style={s.fila}>
            <Campo etiqueta="Tel:" valor={cliente.contacto} ancho="100%" />
          </View>
        </View>

        <View style={s.tabla}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt */}
          <Image src={LOGO_PDF} style={s.marcaAgua} fixed={false} />
          <View style={s.thead}>
            <Text style={[s.th, { width: COL.cant, textAlign: "center" }]}>CANT.</Text>
            <Text style={[s.th, { width: COL.desc }]}>DESCRIPCIÓN</Text>
            <Text style={[s.th, { width: COL.precio, textAlign: "right" }]}>PRECIO POR KILO</Text>
            <Text style={[s.th, { width: COL.importe, textAlign: "right" }]}>IMPORTE</Text>
          </View>
          {renglones.map((r, i) => (
            <View key={i} style={compacto ? [s.tr, s.trCompacto] : s.tr} wrap={false}>
              <Text style={[s.td, s.sepColumna, { width: COL.cant, textAlign: "center" }]}>{r.cantidad}</Text>
              <Text style={[s.td, s.sepColumna, { width: COL.desc }]}>{r.descripcion}</Text>
              <Text style={[s.td, s.sepColumna, { width: COL.precio, textAlign: "right" }]}>{pesos(r.precio)}</Text>
              <Text style={[s.td, s.negrita, { width: COL.importe, textAlign: "right" }]}>{pesos(r.importe)}</Text>
            </View>
          ))}
          {Array.from({ length: vacios }, (_, i) => (
            <View key={`vacio-${i}`} style={s.tr}>
              <View style={[s.sepColumna, { width: COL.cant }]} />
              <View style={[s.sepColumna, { width: COL.desc }]} />
              <View style={[s.sepColumna, { width: COL.precio }]} />
              <View style={{ width: COL.importe }} />
            </View>
          ))}
        </View>

        <View style={s.abajo} wrap={false}>
          <View style={s.letras}>
            <Text style={s.letrasEtiqueta}>SON PESOS</Text>
            <Text style={s.letrasTexto}>{importeALetras(total)}</Text>
          </View>
          <View style={s.cajaTotal}>
            <Text style={s.totalEtiqueta}>TOTAL $</Text>
            <Text style={s.totalValor}>{pesos(total).replace("$ ", "")}</Text>
          </View>
        </View>

        <View style={s.firmas} wrap={false}>
          <Text style={s.firma}>Recibí conforme (firma)</Text>
          <Text style={s.firma}>Aclaración</Text>
          <Text style={s.firma}>DNI</Text>
        </View>

        <View style={s.pie} fixed>
          <Text style={[s.pieLinea, s.negrita, { color: TINTA }]}>Gracias por confiar en {EMPRESA.nombre} · {EMPRESA.lema}</Text>
          <Text style={s.pieLinea}>{LEYENDA_REMITO}</Text>
          <Text style={s.pieLinea} render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Página ${pageNumber} de ${totalPages}` : "")} />
        </View>
      </Page>
    </Document>
  );
}

export async function generarRemitoPdf(remito: Remito, cliente: Cliente): Promise<Buffer> {
  return renderToBuffer(<RemitoDocumento remito={remito} cliente={cliente} />);
}
