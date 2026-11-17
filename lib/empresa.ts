/**
 * Datos de Carnes Rosales que salen en el encabezado del remito.
 * Los que quedan vacíos NO se imprimen: completalos cuando tengas los datos reales.
 */
export const EMPRESA = {
  nombre: "CARNES ROSALES",
  lema: "Calidad y tradición",
  localidad: "San Bernardo",
  // A completar:
  direccion: "",
  telefono: "",
  whatsapp: "",
  email: "",
  cuit: "",
  condicionIva: "",
  inicioActividades: "",
};

/** Líneas del encabezado, sólo con lo que está cargado. */
export function lineasEmpresa(): string[] {
  const e = EMPRESA;
  return [
    [e.direccion, e.localidad].filter(Boolean).join(" · "),
    [e.whatsapp && `WhatsApp ${e.whatsapp}`, e.telefono && `Tel. ${e.telefono}`].filter(Boolean).join(" · "),
    e.email,
    [e.cuit && `CUIT ${e.cuit}`, e.condicionIva].filter(Boolean).join(" · "),
    e.inicioActividades && `Inicio de actividades ${e.inicioActividades}`,
  ].filter(Boolean) as string[];
}

export const LEYENDA_REMITO = "Documento no válido como factura";
