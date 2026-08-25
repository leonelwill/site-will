import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buscarEvento } from "@/lib/evento";
import EventoClient from "@/components/evento/EventoClient";

// Link oculto por natureza: além do token de 32 hex na URL, proibir indexação.
export const metadata: Metadata = {
  title: "Lista de Convidados · Ethimos",
  robots: { index: false, follow: false, nocache: true },
};

// Dados mudam a cada confirmação — sempre buscar fresco no load.
export const dynamic = "force-dynamic";

export default async function EventoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await buscarEvento(token);
  if (!data) notFound();

  return <EventoClient token={token} evento={data.evento} convidadosIniciais={data.convidados} />;
}
