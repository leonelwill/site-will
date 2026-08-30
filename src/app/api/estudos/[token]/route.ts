import { NextRequest, NextResponse } from "next/server";
import { buscarEstudo, EstudoApiError } from "@/lib/estudos";

/**
 * Proxy server-side do banco de estudos:
 * GET /api/estudos/[token] → estudo do Zeno (metadados sem PIN; questões
 *                            exigem header `x-pin-leitura`, repassado daqui)
 *
 * Molde do proxy de evento: o browser só fala com a própria origem; quem
 * conversa com o Zeno é o servidor. Status e corpo do Zeno são devolvidos
 * crus (sem cache) para o client decidir (401 PIN, 429 rate, 404 curso).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const pin = req.headers.get("x-pin-leitura") ?? undefined;
  try {
    const dados = await buscarEstudo(token, pin);
    return NextResponse.json(dados, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof EstudoApiError && e.status > 0) {
      // Repassa o veredito do Zeno: 401 pin-invalido · 429 muitas-tentativas ·
      // 404 curso-nao-encontrado.
      return NextResponse.json(
        { erro: e.codigo ?? "erro-zeno" },
        { status: e.status, headers: { "cache-control": "no-store" } }
      );
    }
    // status 0 = timeout/rede entre o site e o Zeno.
    return NextResponse.json({ erro: "indisponivel" }, { status: 502 });
  }
}
