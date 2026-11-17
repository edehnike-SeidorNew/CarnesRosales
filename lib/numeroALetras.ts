const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const DIECES = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
const VEINTES = ["veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

/** `apocope`: "uno" pasa a "un" delante de "mil" y "millones" (veintiún mil, un millón). */
function menorACien(n: number, apocope: boolean): string {
  if (n < 10) return n === 1 && apocope ? "un" : UNIDADES[n];
  if (n < 20) return DIECES[n - 10];
  if (n < 30) return n === 21 && apocope ? "veintiún" : VEINTES[n - 20];
  const unidad = n % 10;
  const decena = DECENAS[Math.floor(n / 10)];
  if (!unidad) return decena;
  return `${decena} y ${unidad === 1 && apocope ? "un" : UNIDADES[unidad]}`;
}

function menorAMil(n: number, apocope: boolean): string {
  if (n === 100) return "cien";
  const centenas = Math.floor(n / 100);
  const resto = n % 100;
  return [CENTENAS[centenas], resto ? menorACien(resto, apocope) : ""].filter(Boolean).join(" ");
}

/** Entero (hasta 999.999.999.999) en palabras: 121500 -> "ciento veintiún mil quinientos". */
export function enteroALetras(valor: number): string {
  const n = Math.floor(Math.abs(valor));
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor(n / 1000) % 1000;
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones) {
    partes.push(millones === 1 ? "un millón" : `${enteroALetras(millones).replace(/veintiuno$/, "veintiún").replace(/uno$/, "un")} millones`);
  }
  if (miles) partes.push(miles === 1 ? "mil" : `${menorAMil(miles, true)} mil`);
  if (resto) partes.push(menorAMil(resto, false));
  return partes.join(" ");
}

/** 121500 -> "Ciento veintiún mil quinientos"; con centavos: "... con 50/100". */
export function importeALetras(valor: number): string {
  const centavos = Math.round(Math.abs(valor) * 100) % 100;
  const palabras = enteroALetras(valor);
  const texto = `${palabras.charAt(0).toUpperCase()}${palabras.slice(1)}`;
  return centavos > 0 ? `${texto} con ${String(centavos).padStart(2, "0")}/100` : texto;
}
