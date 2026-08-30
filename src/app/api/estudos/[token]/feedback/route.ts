import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy server-side do feedback:
 * POST /api/estudos/[token]/feedback → registrar thumbs-down de questão gerada no Zeno.
 *
 * Mesmo molde do proxy GET (rota.ts): o browser só fala com a própria origem;
 * header `x-pin-leitura` e corpo são repassados crus, status devolvido cru.
 * O Zeno valida token + PIN + rate limits e só marca rejeitadaEm em questões geradas do curso.
 */
const ZENO_CLOUD_URL =
  process.env.NEXT_PUBLIC_ZENO_CLOUD_URL ??
  "https://zeno-gsuite--zeno-gsuite.us-east4.hosted.app";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const pin = req.headers.get("x-pin-leitura") ?? "";
  let corpo: string;
  try {
    corpo = JSON.stringify(await req.json());
  } catch {
    return NextResponse.json({ erro: "payload-invalido" }, { status: 400 });
  }

  let resp: Response;
  try {
    resp = await fetch(
      `${ZENO_CLOUD_URL}/api/estudos/${encodeURIComponent(token)}/feedback`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-pin-leitura": pin },
        body: corpo,
        signal: AbortSignal.timeout(15_000),
      }
    );
  } catch {
    return NextResponse.json({ erro: "indisponivel" }, { status: 502 });
  }

  const texto = await resp.text();
  return new NextResponse(texto || "{}", {
    status: resp.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
