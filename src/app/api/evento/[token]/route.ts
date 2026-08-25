import { NextRequest, NextResponse } from "next/server";
import { buscarEvento, marcarStatus } from "@/lib/evento";

/**
 * Proxy server-side da lista de convidados:
 * GET  /api/evento/[token]         → lista fresca (o client usa para atualizar)
 * POST /api/evento/[token]         → marcar status { convidadoId, status, pin }
 *
 * O browser só fala com a própria origem; quem conversa com o Zeno é o servidor.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const data = await buscarEvento(token);
    if (!data) return NextResponse.json({ erro: "evento-nao-encontrado" }, { status: 404 });
    return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ erro: "indisponivel" }, { status: 502 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const body = await req.json();
    const resp = await marcarStatus(token, body);
    const texto = await resp.text();
    return new NextResponse(texto, {
      status: resp.status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ erro: "indisponivel" }, { status: 502 });
  }
}
