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
  /** Pista exibida ANTES da resposta (ícone "?") — orienta sem revelar o gabarito. */
  dica?: string;
  /** Thumbs-down (questão gerada rejeitada): some das listas, sinal fica no Zeno. */
  rejeitadaEm?: string;
  microtemaPdId?: string;
  provenance: Provenance;
}

/**
 * Dica exibível da questão: `dica` escrita quando existe e/ou o título do
 * microtema do PD como localizador ("isso cai em …"). null = nada a mostrar —
 * a tela NÃO desenha o botão (afordância falsa, não).
 */
export function dicaDaQuestao(
  q: Questao,
  microtemas: Record<string, string> | undefined
): { dica?: string; microtema?: string } | null {
  const dica = q.dica?.trim() || undefined;
  const microtema = q.microtemaPdId ? microtemas?.[q.microtemaPdId] : undefined;
  return dica || microtema ? { dica, microtema } : null;
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

/** Uma questão já respondida em alguma sessão GRAVADA (não o estado da tela). */
export interface ProgressoQuestao {
  questaoId: string;
  acertos: number;
  erros: number;
  /** Data pura ISO da última resposta. */
  ultimaEm?: string;
}

// ── Menu de temas: árvore do PD montada no Zeno ────────────────────────────
// O agrupamento pela numeração oficial do título é decisão do backend
// (zeno_cloud/src/lib/estudos/temas.ts) e chega pronto — reimplementá-lo aqui
// seria a mesma regra em dois repos, divergindo no primeiro ajuste.

export interface MicrotemaNaArvore {
  id: string;
  titulo: string;
  /** Numeração oficial do PD ("2.1.4") — é como a apostila indexa. */
  numero: string;
  questoes: number;
  cards: number;
  /** Coberto SÓ por questão gerada por IA — nada validado por trás. */
  soGerada?: boolean;
}

export interface GrupoDeTemas {
  numero: string;
  titulo: string;
  microtemas: MicrotemaNaArvore[];
  questoes: number;
  cards: number;
  cobertos: number;
  soGerada?: number;
}

export interface ModuloDeTemas {
  id: string;
  titulo: string;
  grupos: GrupoDeTemas[];
  questoes: number;
  cards: number;
  cobertos: number;
  soGerada?: number;
  total: number;
}

export interface PainelHome {
  vencidasHoje: number;
  cobertura: {
    comDerivado: number;
    /** Dos cobertos, quantos só por questão gerada por IA (Carta 3). */
    soGerada?: number;
    total: number;
    programaVersao: string;
  };
}

/** Item de sessão para o POST (contrato do B4): card OU questão. */
export type ItemSessaoPost =
  | { cardId: string; resultado: "certo" | "errado" | "nulo" }
  | {
      questaoId: string;
      resultado: "certo" | "errado" | "nulo";
      origem: OrigemQuestao;
      tipo: TipoQuestao;
      /** Resposta dada com a dica aberta — declarada na sessão (Carta 3). */
      usouDica?: boolean;
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
  /** Questões já respondidas em sessões gravadas — alimenta o filtro homônimo. */
  respondidas?: ProgressoQuestao[];
  /** Árvore de temas (módulo → grupo → microtema) — alimenta o menu de temas. */
  arvoreTemas?: ModuloDeTemas[];
  /** Títulos dos microtemas do PD (id → título) — alimenta a dica de fallback. */
  microtemas?: Record<string, string>;
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

// ── Hub: a vitrine de cursos (porta única do link) ──────────────────────────

/**
 * Um card da vitrine. Sem PIN vem só identidade + contagens (Carta 6/7); com
 * PIN entram `publicToken` — que a tela usa para abrir o curso sem pedir o PIN
 * de novo — e a agenda.
 */
export interface CursoNoHub extends CursoInfo {
  cards: number;
  fonteCurso?: string;
  programaVersao?: string;
  publicToken?: string;
}

export interface Hub {
  cursos: CursoNoHub[];
  bloqueado: boolean;
}

/**
 * Vitrine do hub (GET /api/estudos/hub/<token>). Sem PIN o Zeno responde 200
 * com os cards bloqueados — é o primeiro load legítimo, não erro; PIN ENVIADO e
 * errado é 401.
 */
export async function buscarHub(token: string, pin?: string): Promise<Hub> {
  let resp: Response;
  try {
    resp = await fetch(`${ZENO_CLOUD_URL}/api/estudos/hub/${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: pin ? { "x-pin-leitura": pin } : undefined,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new EstudoApiError("Zeno indisponível (timeout ou rede)", 0);
  }

  const corpo = (await resp.json().catch(() => null)) as (Hub & { erro?: string }) | null;
  if (resp.ok) {
    if (corpo && Array.isArray(corpo.cursos)) return corpo;
    throw new EstudoApiError(`Zeno respondeu ${resp.status} com corpo inválido`, resp.status);
  }
  throw new EstudoApiError(`Zeno respondeu ${resp.status}`, resp.status, corpo?.erro);
}

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
  sessao: SessaoPost,
  /**
   * `true` quando a gravação sai no caminho de saída da página (`pagehide`).
   * Aí o fetch precisa de `keepalive` para o navegador não matar a requisição
   * ao descarregar o documento — e NÃO pode ter `AbortSignal.timeout`, que
   * cancelaria justamente o envio que se quer salvar.
   */
  aoSair = false
): Promise<{ ok: true; reviewsAtualizados: number }> {
  let resp: Response;
  try {
    resp = await fetch(`/api/estudos/${encodeURIComponent(token)}/sessao`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-pin-leitura": pin },
      body: JSON.stringify({ sessao }),
      ...(aoSair ? { keepalive: true } : { signal: AbortSignal.timeout(15_000) }),
    });
  } catch {
    throw new EstudoApiError("Falha ao gravar sessão (rede)", 0);
  }
  const corpo = (await resp.json().catch(() => null)) as { reviewsAtualizados?: number } | null;
  if (resp.ok) return { ok: true, reviewsAtualizados: corpo?.reviewsAtualizados ?? 0 };
  throw new EstudoApiError(`Zeno respondeu ${resp.status}`, resp.status);
}

/**
 * Thumbs-down de questão gerada (POST /api/estudos/<token>/feedback, via proxy).
 * Só aceita `origem='gerada'`; 200 → {ok:true}.
 */
export async function postarFeedback(
  token: string,
  pin: string,
  questaoId: string
): Promise<{ ok: true }> {
  let resp: Response;
  try {
    resp = await fetch(`/api/estudos/${encodeURIComponent(token)}/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-pin-leitura": pin },
      body: JSON.stringify({ questaoId }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new EstudoApiError("Falha ao enviar feedback (rede)", 0);
  }
  if (resp.ok) return { ok: true };
  throw new EstudoApiError(`Zeno respondeu ${resp.status}`, resp.status);
}

// ── Fila de estudo (espelho de zeno_cloud/src/lib/estudos/fila.ts) ──────────
// A decisão de montagem é do Zeno; aqui é o espelho testável que o client usa
// para a fila da sessão e a prévia da home — mesma função, mesmos números.
// W5: o sistema não tem prazo; nada aqui lê `dataProva`.

/** Custo padrão de cada tipo de item, em minutos. */
export const MINUTOS_CARD = 1;
export const MINUTOS_QUESTAO = 2;

/** 'YYYY-MM-DD' no fuso LOCAL — a única fonte de "hoje" do Estudos. */
export function hojeLocalISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

export interface ItemFilaEstudo {
  tipo: "card" | "questao";
  card?: CardEstudo;
  questao?: Questao;
}

export interface FilaEstudoMontada {
  itens: ItemFilaEstudo[];
  minutos: number;
  composicao: { vencidas: number; erradas: number; novas: number };
}

/**
 * Monta a fila zero-decisão dentro do orçamento em minutos: vencidas (due mais
 * antigo primeiro) → erradas recentes (na ordem) → novas sem review (primeiro
 * as do microtema alvo). O orçamento fecha em ITEM inteiro — o próximo entra
 * só se couber inteiro, nunca se corta um raciocínio ao meio.
 */
export function montarFilaEstudo(
  cards: CardEstudo[],
  reviews: ReviewCard[],
  questoes: Questao[],
  erradasRecentes: string[],
  microtemaAlvo: string | null | undefined,
  orcamento: number,
  hoje: string = hojeLocalISO()
): FilaEstudoMontada {
  const reviewPorCard = new Map(reviews.map((r) => [r.cardId, r]));

  const vencidas = cards
    .filter((c) => (reviewPorCard.get(c.id)?.dueEm ?? "9999") <= hoje)
    .sort((a, b) => {
      const da = reviewPorCard.get(a.id)!.dueEm;
      const db = reviewPorCard.get(b.id)!.dueEm;
      return da < db ? -1 : da > db ? 1 : 0; // empate preserva a ordem, como o motor
    });
  const erradas = erradasRecentes
    .map((id) => questoes.find((q) => q.id === id))
    .filter((q): q is Questao => !!q);
  const semReview = cards.filter((c) => !reviewPorCard.has(c.id));
  const novasAlvo = semReview.filter((c) => c.microtemaPdId === microtemaAlvo);
  const novasResto = semReview.filter((c) => c.microtemaPdId !== microtemaAlvo);

  const ordenada: Array<{ item: ItemFilaEstudo; categoria: keyof FilaEstudoMontada["composicao"] }> = [
    ...vencidas.map((card) => ({ item: { tipo: "card", card } as ItemFilaEstudo, categoria: "vencidas" as const })),
    ...erradas.map((questao) => ({ item: { tipo: "questao", questao } as ItemFilaEstudo, categoria: "erradas" as const })),
    ...novasAlvo.map((card) => ({ item: { tipo: "card", card } as ItemFilaEstudo, categoria: "novas" as const })),
    ...novasResto.map((card) => ({ item: { tipo: "card", card } as ItemFilaEstudo, categoria: "novas" as const })),
  ];

  const itens: ItemFilaEstudo[] = [];
  const composicao = { vencidas: 0, erradas: 0, novas: 0 };
  let minutos = 0;
  for (const { item, categoria } of ordenada) {
    const custo = item.tipo === "card" ? MINUTOS_CARD : MINUTOS_QUESTAO;
    if (minutos + custo > orcamento) break;
    itens.push(item);
    composicao[categoria]++;
    minutos += custo;
  }
  return { itens, minutos, composicao };
}

/**
 * Intervalo de Wilson 95% para proporção de acertos — a régua única do Zeno
 * Estudos. Espelho declarado de zeno_cloud/src/lib/estudos/margem.ts (repos
 * separados, sem pacote compartilhado): mudou lá, muda aqui, com teste nos
 * dois lados.
 */
export function wilson(
  acertos: number,
  n: number,
  z = 1.96
): { p: number; inferior: number; superior: number } {
  if (n < 1) throw new Error("wilson exige n >= 1 (amostra vazia não tem intervalo)");
  if (acertos < 0 || acertos > n)
    throw new Error(`acertos (${acertos}) fora do intervalo 0 a ${n}`);
  const p = acertos / n;
  const denom = n + z * z;
  const centro = (p * n + (z * z) / 2) / denom;
  const meia = (z / denom) * Math.sqrt(p * (1 - p) * n + (z * z) / 4);
  return { p, inferior: centro - meia, superior: centro + meia };
}

/** "43,8% · IC95 23,1%–66,8% · n=16" — o formato único de percentual do Estudos. */
export function acertoComMargem(acertos: number, n: number): string {
  const fmt = (x: number): string => {
    const s = x.toFixed(1).replace(".", ",");
    return s === "-0,0" ? "0,0" : s; // zero negativo do float na subtração, não clamp
  };
  const { p, inferior, superior } = wilson(acertos, n);
  return `${fmt(p * 100)}% · IC95 ${fmt(inferior * 100)}%–${fmt(superior * 100)}% · n=${n}`;
}
