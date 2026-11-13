import { DetalleCliente } from "@/components/clientes/DetalleCliente";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetalleCliente clienteId={id} />;
}
