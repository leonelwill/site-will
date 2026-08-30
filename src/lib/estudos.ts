/**
 * Ponte server-side com a API pública de estudos do Zeno Cloud
 * (GET /api/estudos/<token>). O token é a autenticação do link oculto; as
 * questões exigem PIN de leitura (header `x-pin-leitura`), validado no Zeno.
 *
 * Molde de src/lib/evento.ts: toda chamada sai do SERVIDOR do site (proxy) —
 * o browser nunca fala com o Zeno direto e não há CORS para configurar.
 */

// Mesma env do módulo de eventos — trocar o backend não exige redeploy.
const ZENO_CLOUD_URL =
  process.env.NEXT_PUBLIC_ZENO_CLOUD_URL ??
  "https://zeno-gsuite--zeno-gsuite.us-east4.hosted.app";

// ── Tipos do contrato (congelado — API ainda em construção no Zeno) ──────────

export type CertSlug = "cpa" | "cpro-i" | "cpro-r" | "cfp";
export type OrigemQuestao = "simulado-oficial" | "digitada" | "gerada" | "criada";
export type TipoQuestao = "mc" | "case" | "arvore";

export interface ContagensCurso {
  questoes: number;
  porOrigem: Record<string, number>;
}

export interface CursoInfo {
  /** Presente na resposta completa (com PIN) — usado no POST de sessão. */
  id?: string;
  cert: CertSlug;
  rotulo: string;
  dataProva?: string;
  janelaInicio?: string;
  janelaFim?: string;
  contagens: ContagensCurso;
}

export interface Provenance {
  tipo: string;
  ref: string;
  data: string;
}

export interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  tipo: TipoQuestao;
  origem: OrigemQuestao;
  gabaritoOficial?: number;
  gabaritoIA?: number;
  explicacao?: string;
  microtemaPdId?: string;
  provenance: Provenance;
}

export interface CompletudeItem {
  nome: string;
  totalDeclarado?: number;
  contagens?: { criadas: number; atualizadas: number; inalteradas: number };
  falhas?: Array<{ pagina?: number; motivo: string }>;
}

/** Card de estudo (F1b) — projetado sem o dedupHash (chave interna do Zeno). */
export interface CardEstudo {
  id: string;
  microtemaPdId?: string;
  frente: string;
  verso: string;
  provenance: Provenance;
}

/** Estado SRS de um card — dueEm é data pura ISO. */
export interface ReviewCard {
  cardId: string;
  dueEm: string;
  ease: number;
  intervaloDias: number;
  repeticoes: number;
}

export interface PainelHome {
  diasParaProva: number | null;
  vencidasHoje: number;
  cobertura: { comDerivado: number; total: number; programaVersao: string };
}

/** Item de sessão para o POST (contrato do B4): card OU questão. */
export type ItemSessaoPost =
  | { cardId: string; resultado: "certo" | "errado" | "nulo" }
  | {
      questaoId: string;
      resultado: "certo" | "errado" | "nulo";
      origem: OrigemQuestao;
      tipo: TipoQuestao;
    };

export interface SessaoPost {
  id: string;
  cursoId: string;
  inicioEm: string;
  fimEm: string;
  minutos: number;
  competenciaEm: string;
  itens: ItemSessaoPost[];
}

/** Resposta 200 sem PIN (ou com PIN que o Zeno ainda não validou). */
export interface EstudoBloqueado {
  curso: CursoInfo;
  bloqueado: true;
}

/** Resposta 200 com PIN correto — questões + completude da ingestão. */
export interface EstudoCompleto {
  curso: CursoInfo;
  questoes: Questao[];
  completude: CompletudeItem[];
  /** Extensão F1b (B4) — campos opcionais até o backend despachar. */
  cards?: CardEstudo[];
  reviews?: ReviewCard[];
  painel?: PainelHome;
  microtemaMenosCoberto?: string | null;
  erradasRecentes?: { questaoId: string }[];
  bloqueado: false;
}

export type Estudo = EstudoBloqueado | EstudoCompleto;

// ── Erro tipado — o caller decide pelo `status` ─────────────────────────────

/**
 * 401 → precisa de PIN (ou PIN errado) · 429 → rate limit · 404 → notFound.
 * status 0 = rede/timeout (o proxy devolve 502).
 */
export class EstudoApiError extends Error {
  readonly status: number;
  /** Corpo `{erro}` do Zeno, quando houver (ex. 'pin-invalido'). */
  readonly codigo?: string;

  constructor(mensagem: string, status: number, codigo?: string) {
    super(mensagem);
    this.name = "EstudoApiError";
    this.status = status;
    this.codigo = codigo;
  }
}

/**
 * SSR captou 401 sem PIN — caso anômalo do contrato (o normal é 200 bloqueado;
 * doc novo sem pin "não acontecerá"). Tela de PIN sem metadados do curso: os
 * campos de `curso` são dummies não exibidos — os dados reais chegam no 200
 * do desbloqueio.
 */
export const ESTUDO_BLOQUEADO_SEM_METADADOS: EstudoBloqueado = {
  curso: { cert: "cpa", rotulo: "Curso de estudos", contagens: { questoes: 0, porOrigem: {} } },
  bloqueado: true,
};

// ── Rótulos pt-BR curtos para badges ────────────────────────────────────────

export const RÓTULOS_ORIGEM: Record<OrigemQuestao, string> = {
  "simulado-oficial": "Simulado oficial",
  digitada: "Digitada",
  gerada: "Gerada por IA",
  criada: "Criada",
};

export const RÓTULOS_TIPO: Record<TipoQuestao, string> = {
  mc: "Múltipla escolha",
  case: "Case",
  arvore: "Árvore de decisão",
};

// ── Busca ───────────────────────────────────────────────────────────────────

/**
 * Busca o estudo no Zeno. `pin` vai como header `x-pin-leitura` (header, nunca
 * query: query vaza em log de acesso). 200 → corpo tipado (bloqueado ou
 * completo); 401/429/404/5xx → `EstudoApiError` com o status para o caller
 * decidir (molde do tratamento de 401/429/404 do evento.ts).
 */
export async function buscarEstudo(token: string, pin?: string): Promise<Estudo> {
  let resp: Response;
  try {
    resp = await fetch(`${ZENO_CLOUD_URL}/api/estudos/${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: pin ? { "x-pin-leitura": pin } : undefined,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new EstudoApiError("Zeno indisponível (timeout ou rede)", 0);
  }

  const corpo = (await resp.json().catch(() => null)) as (Estudo & { erro?: string }) | null;
  if (resp.ok) {
    if (corpo && (corpo.bloqueado === true || corpo.bloqueado === false)) return corpo;
    throw new EstudoApiError(`Zeno respondeu ${resp.status} com corpo inválido`, resp.status);
  }
  throw new EstudoApiError(`Zeno respondeu ${resp.status}`, resp.status, corpo?.erro);
}

/**
 * Grava a sessão de estudo (POST /api/estudos/<token>/sessao, via proxy).
 * Barreiras do Zeno: token + x-pin-leitura + rate limits. 200 → {ok, reviewsAtualizados}.
 */
export async function postarSessao(
  token: string,
  pin: string,
  sessao: SessaoPost
): Promise<{ ok: true; reviewsAtualizados: number }> {
  let resp: Response;
  try {
    resp = await fetch(`/api/estudos/${encodeURIComponent(token)}/sessao`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-pin-leitura": pin },
      body: JSON.stringify({ sessao }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new EstudoApiError("Falha ao gravar sessão (rede)", 0);
  }
  const corpo = (await resp.json().catch(() => null)) as { reviewsAtualizados?: number } | null;
  if (resp.ok) return { ok: true, reviewsAtualizados: corpo?.reviewsAtualizados ?? 0 };
  throw new EstudoApiError(`Zeno respondeu ${resp.status}`, resp.status);
}

// ── Data da prova (molde de dataPorExtenso do evento.ts: datas puras, UTC) ──

/** 'YYYY-MM-DD' → 'DD/MM/AAAA' sem passar por Date local (fuso). */
export function formatarDataProva(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

/**
 * Dias corridos de hoje até a prova (diferença de datas puras em UTC, sem
 * fração). null se a prova já passou.
 */
export function diasCorridosAteProva(iso: string): number | null {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  const hoje = new Date();
  const alvo = Date.UTC(ano, mes - 1, dia);
  const base = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dias = Math.round((alvo - base) / 86_400_000);
  return dias > 0 ? dias : null;
}
