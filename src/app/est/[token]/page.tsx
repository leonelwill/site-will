import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buscarEstudo,
  ESTUDO_BLOQUEADO_SEM_METADADOS,
  EstudoApiError,
  type Estudo,
} from "@/lib/estudos";
import EstudosClient from "@/components/estudos/EstudosClient";

// Link oculto por natureza: além do token na URL, proibir indexação.
export const metadata: Metadata = {
  title: "Estudos · William Leonel",
  robots: { index: false, follow: false, nocache: true },
};

// Dados mudam a cada ingestão de questões — sempre buscar fresco no load.
export const dynamic = "force-dynamic";

export default async function EstudosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Sem PIN aqui: o primeiro load traz só os metadados (curso + contagens) —
  // as questões exigem o PIN de leitura, digitado no client (molde /e/[token]).
  let dados: Estudo;
  try {
    dados = await buscarEstudo(token);
  } catch (e) {
    if (e instanceof EstudoApiError && e.status === 404) notFound();
    // 401 sem PIN = doc exige PIN (anômalo; o normal é 200 bloqueado): abre a
    // tela de PIN sem metadados — os dados reais chegam no desbloqueio.
    if (e instanceof EstudoApiError && e.status === 401) {
      dados = ESTUDO_BLOQUEADO_SEM_METADADOS;
    } else {
      throw e;
    }
  }

  return <EstudosClient token={token} inicial={dados} />;
}
