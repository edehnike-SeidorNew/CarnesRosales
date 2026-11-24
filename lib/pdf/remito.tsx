import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { EMPRESA, LEYENDA_REMITO, lineasEmpresa } from "@/lib/empresa";
import { pesos } from "@/lib/formato";
import { importeALetras } from "@/lib/numeroALetras";
import { partesDeFecha, renglonesDeRemito, titularDe, totalDeRemito, type Remito, type RenglonRemito } from "@/lib/remito";
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

/**
 * Hoja A4 apaisada con dos copias iguales lado a lado: original y duplicado.
 * Cada hoja tiene una cantidad fija de renglones (como la planilla de papel); si el remito trae más, sigue en otra hoja.
 */
const RENGLONES_POR_HOJA = 14;

const s = StyleSheet.create({
  pagina: { padding: 18, fontSize: 8, fontFamily: "Helvetica", color: TINTA },
  hoja: { flexDirection: "row", flex: 1 },
  corte: { width: 0, borderLeft: `0.75pt dashed ${LINEA}`, marginHorizontal: 9 },
  copia: { flex: 1 },
  negrita: { fontFamily: "Helvetica-Bold" },

  // Etiqueta de la copia
  etiquetaFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  etiquetaCopia: { fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 2, color: ROJO },
  etiquetaHoja: { fontSize: 7, color: TENUE },

  // Encabezado: empresa | letra X | tipo de comprobante y fecha
  encabezado: { flexDirection: "row", alignItems: "stretch" },
  empresa: { flex: 1, border: `1pt solid ${BORDE}`, borderRadius: 6, padding: 6, alignItems: "center", justifyContent: "center" },
  logo: { width: 56, height: 56 },
  empresaLinea: { fontSize: 7, color: "#374151", marginTop: 2, textAlign: "center" },
  colX: { width: 46, alignItems: "center", justifyContent: "center" },
  cajaX: { width: 30, height: 30, border: `1.25pt solid ${NEGRO}`, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  letraX: { fontFamily: "Helvetica-Bold", fontSize: 19, color: NEGRO },
  notaX: { fontSize: 4.5, color: TENUE, textAlign: "center", marginTop: 3, width: 42 },
  doc: { flex: 1, border: `1pt solid ${BORDE}`, borderRadius: 6, padding: 6, alignItems: "center", justifyContent: "center" },
  docTitulo: { fontFamily: "Helvetica-Bold", fontSize: 16, letterSpacing: 2.5, color: NEGRO, textAlign: "center" },
  docNumero: { fontFamily: "Helvetica-Bold", fontSize: 10, color: ROJO, marginTop: 1, textAlign: "center" },
  filaFecha: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 6 },
  etiquetaFecha: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: TENUE, letterSpacing: 1, marginRight: 4 },
  casillero: { width: 22, height: 17, border: `0.75pt solid ${ROJO}`, borderRadius: 3, marginRight: 3, alignItems: "center", justifyContent: "center", backgroundColor: SUAVE },
  textoCasillero: { fontFamily: "Helvetica-Bold", fontSize: 9, color: NEGRO },

  // Franja de datos del cliente
  franja: { flexDirection: "row", marginTop: 6, backgroundColor: NEGRO, borderRadius: 6 },
  celda: { flex: 1, paddingVertical: 4, paddingHorizontal: 7 },
  celdaBorde: { borderLeft: "0.5pt solid #4b4d57" },
  franjaEtiqueta: { fontSize: 5.5, color: "#f3b4b8", letterSpacing: 1, fontFamily: "Helvetica-Bold" },
  franjaValor: { fontSize: 8.5, color: "#ffffff", fontFamily: "Helvetica-Bold", marginTop: 1.5, letterSpacing: 0.3 },

  // Datos del cliente: renglones como la planilla
  tarjeta: { marginTop: 6, border: `1pt solid ${BORDE}`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  fila: { flexDirection: "row" },
  campo: { flexDirection: "row", alignItems: "flex-end", paddingVertical: 2.5 },
  campoEtiqueta: { fontSize: 7, color: TENUE, marginRight: 4 },
  campoValor: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", borderBottom: `0.75pt dotted ${LINEA}`, paddingBottom: 1, minHeight: 11 },

  // Tabla
  tabla: { marginTop: 6, border: `1pt solid ${BORDE}`, borderRadius: 6, overflow: "hidden" },
  marcaAgua: { position: "absolute", top: 30, left: "50%", marginLeft: -70, width: 140, height: 140, opacity: 0.07 },
  thead: { flexDirection: "row", backgroundColor: ROJO },
  th: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: "#ffffff", paddingVertical: 4.5, paddingHorizontal: 4, letterSpacing: 0.5 },
  // Altura fija con holgura: si el texto no entra en la fila, react-pdf lo descarta en silencio.
  tr: { flexDirection: "row", borderBottom: `0.5pt solid ${LINEA}`, height: 17 },
  td: { fontSize: 8, paddingVertical: 3, paddingHorizontal: 4 },
  sepColumna: { borderRight: `0.5pt solid ${LINEA}` },

  // Total
  abajo: { flexDirection: "row", marginTop: 6, alignItems: "stretch" },
  letras: { flex: 1, paddingRight: 8, justifyContent: "center" },
  letrasEtiqueta: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: TENUE, letterSpacing: 1 },
  letrasTexto: { fontSize: 7.5, marginTop: 1.5, color: "#374151" },
  cajaTotal: { width: 140, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: NEGRO, borderRadius: 6, paddingVertical: 7, paddingHorizontal: 10 },
  totalEtiqueta: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#ffffff", letterSpacing: 1.2 },
  totalValor: { fontFamily: "Helvetica-Bold", fontSize: 13, color: "#ffffff" },
  continua: { fontFamily: "Helvetica-Bold", fontSize: 8, color: TENUE, textAlign: "right", flex: 1, paddingVertical: 7 },

  // Firma
  firmas: { flexDirection: "row", marginTop: 16, gap: 14 },
  firma: { flex: 1, borderTop: `0.75pt solid ${TENUE}`, paddingTop: 3, fontSize: 6.5, color: TENUE, textAlign: "center" },

  pie: { borderTop: `0.5pt solid ${BORDE}`, paddingTop: 4, marginTop: 8 },
  pieLinea: { fontSize: 6, textAlign: "center", color: TENUE, marginTop: 1 },
});

// Cantidad | Descripción | Precio por kilo | Importe, como la planilla.
const COL = { cant: "14%", desc: "42%", precio: "22%", importe: "22%" } as const;

function Campo({ etiqueta, valor, ancho }: { etiqueta: string; valor: string; ancho: string }) {
  return (
    <View style={[s.campo, { width: ancho }]}>
      <Text style={s.campoEtiqueta}>{etiqueta}</Text>
      <Text style={s.campoValor}>{valor}</Text>
    </View>
  );
}

type DatosCopia = {
  remito: Remito;
  cliente: Cliente;
  etiqueta: string;
  renglones: RenglonRemito[];
  hoja: number;
  hojas: number;
};

/** Una copia del remito (ocupa media hoja apaisada). */
function Copia({ remito, cliente, etiqueta, renglones, hoja, hojas }: DatosCopia) {
  const total = totalDeRemito(remito);
  const [dd, mm, aa] = partesDeFecha(remito.fecha);
  const vacios = Math.max(0, RENGLONES_POR_HOJA - renglones.length);
  const numero = remito.comprobante ? `N° ${remito.comprobante}` : "Sin número";
  const quien = remito.creadoPor ? remito.creadoPor.split("@")[0] : "—";
  const ultima = hoja === hojas;

  return (
    <View style={s.copia}>
      <View style={s.etiquetaFila}>
        <Text style={s.etiquetaCopia}>{etiqueta}</Text>
        {hojas > 1 && <Text style={s.etiquetaHoja}>Hoja {hoja} de {hojas}</Text>}
      </View>

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
        ].map(([et, valor], i) => (
          <View key={et} style={i ? [s.celda, s.celdaBorde] : s.celda}>
            <Text style={s.franjaEtiqueta}>{et}</Text>
            <Text style={s.franjaValor}>{valor}</Text>
          </View>
        ))}
      </View>

      <View style={s.tarjeta}>
        <View style={s.fila}>
          <Campo etiqueta="Señor/a:" valor={titularDe(cliente)} ancho="100%" />
        </View>
        <View style={s.fila}>
          <Campo etiqueta="Dirección:" valor={cliente.direccion} ancho="60%" />
          <View style={{ width: "4%" }} />
          <Campo etiqueta="Localidad:" valor={cliente.localidad} ancho="36%" />
        </View>
        <View style={s.fila}>
          <Campo etiqueta="Tel:" valor={cliente.contacto} ancho="48%" />
          <View style={{ width: "4%" }} />
          <Campo etiqueta="C.U.I.T.:" valor={cliente.cuit} ancho="48%" />
        </View>
      </View>

      <View style={s.tabla}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt */}
        <Image src={LOGO_PDF} style={s.marcaAgua} />
        <View style={s.thead}>
          <Text style={[s.th, { width: COL.cant, textAlign: "center" }]}>CANT.</Text>
          <Text style={[s.th, { width: COL.desc }]}>DESCRIPCIÓN</Text>
          <Text style={[s.th, { width: COL.precio, textAlign: "right" }]}>PRECIO POR KILO</Text>
          <Text style={[s.th, { width: COL.importe, textAlign: "right" }]}>IMPORTE</Text>
        </View>
        {renglones.map((r, i) => (
          <View key={i} style={s.tr}>
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

      <View style={s.abajo}>
        {ultima ? (
          <>
            <View style={s.letras}>
              <Text style={s.letrasEtiqueta}>SON PESOS</Text>
              <Text style={s.letrasTexto}>{importeALetras(total)}</Text>
            </View>
            <View style={s.cajaTotal}>
              <Text style={s.totalEtiqueta}>TOTAL $</Text>
              <Text style={s.totalValor}>{pesos(total).replace("$ ", "")}</Text>
            </View>
          </>
        ) : (
          <Text style={s.continua}>Continúa en la hoja siguiente…</Text>
        )}
      </View>

      <View style={s.firmas}>
        <Text style={s.firma}>Recibí conforme (firma)</Text>
        <Text style={s.firma}>Aclaración</Text>
        <Text style={s.firma}>DNI</Text>
      </View>

      <View style={s.pie}>
        <Text style={[s.pieLinea, s.negrita, { color: TINTA }]}>Gracias por confiar en {EMPRESA.nombre} · {EMPRESA.lema}</Text>
        <Text style={s.pieLinea}>{LEYENDA_REMITO}</Text>
      </View>
    </View>
  );
}

function RemitoDocumento({ remito, cliente }: { remito: Remito; cliente: Cliente }) {
  const renglones = renglonesDeRemito(remito);
  // Si hay más productos que renglones por hoja, el remito sigue en otra hoja (con sus dos copias).
  const grupos: RenglonRemito[][] = [];
  for (let i = 0; i < renglones.length; i += RENGLONES_POR_HOJA) grupos.push(renglones.slice(i, i + RENGLONES_POR_HOJA));
  if (grupos.length === 0) grupos.push([]);

  return (
    <Document title={`Remito ${remito.comprobante || "s/n"} - ${cliente.nombreFantasia}`} author={EMPRESA.nombre}>
      {grupos.map((grupo, i) => (
        <Page key={i} size="A4" orientation="landscape" style={s.pagina}>
          <View style={s.hoja}>
            <Copia remito={remito} cliente={cliente} etiqueta="ORIGINAL" renglones={grupo} hoja={i + 1} hojas={grupos.length} />
            <View style={s.corte} />
            <Copia remito={remito} cliente={cliente} etiqueta="DUPLICADO" renglones={grupo} hoja={i + 1} hojas={grupos.length} />
          </View>
        </Page>
      ))}
    </Document>
  );
}

export async function generarRemitoPdf(remito: Remito, cliente: Cliente): Promise<Buffer> {
  return renderToBuffer(<RemitoDocumento remito={remito} cliente={cliente} />);
}
