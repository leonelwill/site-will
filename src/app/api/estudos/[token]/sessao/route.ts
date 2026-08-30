import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy server-side da sessão de estudo:
 * POST /api/estudos/[token]/sessao → grava sessão + aplica revisões SRS no Zeno.
 *
 * Mesmo molde do proxy GET (rota.ts): o browser só fala com a própria origem;
 * header `x-pin-leitura` e corpo são repassados crus, status devolvido cru.
 * O Zeno valida token + PIN + rate limits e trava a escrita em sessão/reviews.
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
      `${ZENO_CLOUD_URL}/api/estudos/${encodeURIComponent(token)}/sessao`,
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
