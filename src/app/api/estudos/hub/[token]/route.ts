import { NextRequest, NextResponse } from "next/server";
import { buscarHub, EstudoApiError } from "@/lib/estudos";

/**
 * Proxy server-side da vitrine de cursos:
 * GET /api/estudos/hub/[token] → lista de cursos do Zeno (identidade e
 *                                contagens sem PIN; token de cada curso e
 *                                agenda exigem `x-pin-leitura`, repassado daqui)
 *
 * Mesmo molde do proxy de curso: o browser só fala com a própria origem.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const pin = req.headers.get("x-pin-leitura") ?? undefined;
  try {
    const dados = await buscarHub(token, pin);
    return NextResponse.json(dados, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof EstudoApiError && e.status > 0) {
      // 401 pin-invalido · 429 muitas-tentativas · 404 hub-nao-encontrado.
      return NextResponse.json(
        { erro: e.codigo ?? "erro-zeno" },
        { status: e.status, headers: { "cache-control": "no-store" } }
      );
    }
    return NextResponse.json({ erro: "indisponivel" }, { status: 502 });
  }
}
