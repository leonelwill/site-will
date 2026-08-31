import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buscarEstudo,
  buscarHub,
  ESTUDO_BLOQUEADO_SEM_METADADOS,
  EstudoApiError,
  type Estudo,
  type Hub,
} from "@/lib/estudos";
import EstudosClient from "@/components/estudos/EstudosClient";
import HubEstudos from "@/components/estudos/HubEstudos";

// Link oculto por natureza: além do token na URL, proibir indexação.
export const metadata: Metadata = {
  title: "Estudos · William Leonel",
  robots: { index: false, follow: false, nocache: true },
};

// Dados mudam a cada ingestão de questões — sempre buscar fresco no load.
export const dynamic = "force-dynamic";

/**
 * Uma rota, dois tipos de token:
 *
 * - token do HUB (o link normal, que o William divulga) → vitrine com CPA /
 *   C-Pro I / C-Pro R / CFP, um PIN para todos;
 * - token de CURSO (atalho direto, gerado na tela de gestão) → o banco daquele
 *   curso, como antes.
 *
 * Tenta o hub primeiro; 404 ali cai no curso. Assim os links de curso que já
 * circulavam continuam funcionando e ninguém precisa saber qual é qual.
 */
export default async function EstudosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let hub: Hub | null = null;
  try {
    hub = await buscarHub(token);
  } catch (e) {
    // Só um 404 significa "este token não é de hub"; qualquer outra falha é do
    // hub mesmo e não deve ser mascarada por uma segunda busca.
    if (!(e instanceof EstudoApiError) || e.status !== 404) throw e;
  }
  // Fora do try: JSX construído dentro dele teria o erro de RENDER capturado
  // pelo catch, que é para o fetch (regra react-hooks/error-boundaries).
  if (hub) return <HubEstudos token={token} inicial={hub} />;

  // Sem PIN aqui: o primeiro load traz só os metadados (curso + contagens) —
  // as questões exigem o PIN de leitura, digitado no client (molde /e/[token]).
  let dados: Estudo;
  try {
    dados = await buscarEstudo(token);
  } catch (e) {
    if (e instanceof EstudoApiError && e.status === 404) notFound();
    // 401 sem PIN = o curso existe e exige PIN: abre a tela de PIN sem os
    // metadados — os dados reais chegam no 200 do desbloqueio.
    if (e instanceof EstudoApiError && e.status === 401) {
      dados = ESTUDO_BLOQUEADO_SEM_METADADOS;
    } else {
      throw e;
    }
  }

  return <EstudosClient token={token} inicial={dados} />;
}
