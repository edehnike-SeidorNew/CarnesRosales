import { NextResponse } from "next/server";
import { getServerSession, tieneAcceso } from "@/lib/auth/session";
import { hoyISO } from "@/lib/formato";
import { generarRemitoPdf } from "@/lib/pdf/remito";
import { nombreDeArchivo } from "@/lib/remito";
import { repo } from "@/lib/repo";

/** Remito en PDF. `?ver=1` lo abre en el navegador (para imprimir) en vez de descargarlo. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Tu sesión venció. Volvé a iniciar sesión." }, { status: 401 });
  if (!tieneAcceso(session)) return NextResponse.json({ error: "Tu cuenta todavía no tiene acceso." }, { status: 403 });

  const { id } = await params;
  const datos = await repo().obtenerDatos();
  const remito = datos.movimientos.find((m) => m.id === id && m.tipo === "venta");
  if (!remito || remito.tipo !== "venta") return NextResponse.json({ error: "No encontramos ese remito." }, { status: 404 });
  const cliente = datos.clientes.find((c) => c.id === remito.clienteId);
  if (!cliente) return NextResponse.json({ error: "No encontramos el cliente de ese remito." }, { status: 404 });

  const enLinea = new URL(request.url).searchParams.get("ver") === "1";
  const pdf = await generarRemitoPdf(remito, cliente);
  const archivo = `remito-${nombreDeArchivo(remito.comprobante) || "sn"}-${nombreDeArchivo(cliente.nombreFantasia) || "cliente"}-${remito.fecha || hoyISO()}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${enLinea ? "inline" : "attachment"}; filename="${archivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
