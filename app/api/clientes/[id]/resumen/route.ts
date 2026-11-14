import { NextResponse } from "next/server";
import { getServerSession, tieneAcceso } from "@/lib/auth/session";
import { hoyISO, inicioDePeriodo, PERIODOS, type Periodo } from "@/lib/formato";
import { generarResumenPdf } from "@/lib/pdf/resumenCuenta";
import { repo } from "@/lib/repo";

/** Resumen de cuenta del cliente en PDF, para descargar y enviarle. `?periodo=mes` recorta los movimientos. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Tu sesión venció. Volvé a iniciar sesión." }, { status: 401 });
  if (!tieneAcceso(session)) return NextResponse.json({ error: "Tu cuenta todavía no tiene acceso." }, { status: 403 });

  const { id } = await params;
  const datos = await repo().obtenerDatos();
  const cliente = datos.clientes.find((c) => c.id === id);
  if (!cliente) return NextResponse.json({ error: "No encontramos ese cliente." }, { status: 404 });

  const pedido = new URL(request.url).searchParams.get("periodo");
  const periodo: Periodo = PERIODOS.some((p) => p.id === pedido) ? (pedido as Periodo) : "todo";

  const movimientos = datos.movimientos
    .map((m, orden) => ({ m, orden }))
    .filter(({ m }) => m.clienteId === id)
    .sort((a, b) => a.m.fecha.localeCompare(b.m.fecha) || a.orden - b.orden)
    .map(({ m }) => m);

  const pdf = await generarResumenPdf({ cliente, movimientos, desde: inicioDePeriodo(periodo), hoy: hoyISO() });

  // Nombre de archivo sin acentos ni símbolos, para que descargue bien en cualquier sistema.
  const nombre = cliente.nombreFantasia
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resumen-${nombre || "cliente"}-${hoyISO()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
