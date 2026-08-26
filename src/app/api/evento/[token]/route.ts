import { NextRequest, NextResponse } from "next/server";
import { buscarEvento, desbloquearEvento, marcarStatus } from "@/lib/evento";

/**
 * Proxy server-side da lista de convidados:
 * GET  /api/evento/[token]  → lista (metadados sem PIN; convidados exigem
 *                             header `x-pin-acesso`, repassado daqui)
 * POST /api/evento/[token]  → marcar status { convidadoId, status, pin }
 *
 * O browser só fala com a própria origem; quem conversa com o Zeno é o servidor.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const pinAcesso = req.headers.get("x-pin-acesso") ?? undefined;
  try {
    if (pinAcesso) {
      // Chamada de desbloqueio/refresh: devolve o veredito cru do PIN.
      const r = await desbloquearEvento(token, pinAcesso);
      if (r.ok) return NextResponse.json({ convidados: r.convidados }, { headers: { "cache-control": "no-store" } });
      return NextResponse.json({ erro: r.motivo }, { status: r.motivo === "pin" ? 401 : r.motivo === "limite" ? 429 : 502 });
    }
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
