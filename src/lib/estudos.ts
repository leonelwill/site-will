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

/**
 * Config da Sonda (mini-simulado por temas). Ausente em cert sem PD/pesos
 * ingeridos (ex. C-Pro R) — aí a porta da Sonda fica desabilitada.
 */
export interface SondaConfig {
  /** moduloId → fração do peso oficial (ex. 0.2) — soma 1 (ou renormaliza). */
  pesos: Record<string, number>;
  /** Fonte oficial do peso — exibida na escolha (G3). */
  fonte: string;
  /** Alvo de aprovação (ex. 0.7) — régua do acumulado. */
  alvo: number;
  alvoFonte: string;
  /** Mínimo de validadas por módulo para entrar no sorteio. */
  pisoValidadas: number;
  /** Durações da porta — n vem daqui (8 min → 8 · 20 min → 16). */
  duracoes: readonly { minutos: number; questoes: number }[];
}

/**
 * Veredito por tema DERIVADO das sessões (espelho do motor do Zeno): só com
 * `estado === "estude"` a tela mostra o bloco "Estude"; fora disso é evento
 * de amostra.
 */
export interface VereditoTema {
  moduloId: string;
  unicas: number;
  sessoes: number;
  dias: number;
  acertos: number;
  estado: "insuficiente" | "estude";
  /** Limite SUPERIOR do IC95 das únicas; null quando `unicas = 0`. */
  wilsonSuperior: number | null;
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
  /** Sonda — config do mini-simulado por temas (ausente sem PD/pesos). */
  sonda?: SondaConfig;
  /** Vereditos por tema derivados das sessões — alimenta o acumulado da Sonda. */
  vereditosTemas?: VereditoTema[];
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
  aoSair = false,
  /** Modo da sessão: sonda (mini-simulado por temas) ou livre. O Zeno persiste. */
  modo?: "livre" | "sonda"
): Promise<{ ok: true; reviewsAtualizados: number }> {
  let resp: Response;
  try {
    resp = await fetch(`/api/estudos/${encodeURIComponent(token)}/sessao`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-pin-leitura": pin },
      body: JSON.stringify(modo ? { sessao, modo } : { sessao }),
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

// ── Sonda (espelho de zeno_cloud/src/lib/estudos/{embaralhar,sonda}.ts) ─────
// Rodada curta que toca TODOS os módulos da certificação. NÃO é simulado: a
// amostra (8 ou 16) não sustenta diagnóstico por tema, então o motor entrega só
// os números — "evento, não percentual" é decisão da tela. Repos separados, sem
// pacote compartilhado: mudou lá, muda aqui, com teste nos dois lados.

/** PRNG semeado (mulberry32) — mesma semente, mesma sequência. */
function geradorSemeado(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates com PRNG semeado — determinístico e reprodutível. */
export function embaralharComSemente<T>(itens: readonly T[], semente: number): T[] {
  const saida = [...itens];
  const proximo = geradorSemeado(semente);
  for (let i = saida.length - 1; i > 0; i--) {
    const j = Math.floor(proximo() * (i + 1));
    [saida[i], saida[j]] = [saida[j], saida[i]];
  }
  return saida;
}

/** Tolerância para comparar restos fracionários (peso × n vem de float). */
const EPS_SONDA = 1e-9;

/**
 * Divisão proporcional por maior resto (espelho de `alocarPorMaiorResto`).
 *
 * `bruto = peso * n`; `base = floor(bruto)`; a sobra vai aos maiores restos.
 * Empate de resto é desempatado por ROTAÇÃO `(posição + rodada) mod nºEmpatados`
 * — sem isso o mesmo módulo levaria a sobra toda rodada após rodada. Pesos que
 * não somam 1 são renormalizados aqui: a fonte pode arredondar. A soma do
 * resultado é EXATAMENTE `n`.
 */
export function alocarPorMaiorRestoEstudo(
  pesos: Record<string, number>,
  n: number,
  rodada: number
): Record<string, number> {
  const ids = Object.keys(pesos);
  const resultado: Record<string, number> = {};
  for (const id of ids) resultado[id] = 0;
  if (ids.length === 0 || n <= 0) return resultado;

  const soma = ids.reduce((s, id) => s + pesos[id], 0);
  const fator = soma > 0 && Math.abs(soma - 1) > EPS_SONDA ? 1 / soma : 1;
  const itens = ids.map((id) => {
    const bruto = pesos[id] * fator * n;
    const base = Math.floor(bruto);
    return { id, base, frac: bruto - base };
  });
  const sobra = n - itens.reduce((s, it) => s + it.base, 0);
  for (const it of itens) resultado[it.id] = it.base;

  // Resto desc; empates agrupados (tolerância) e rotacionados pela rodada.
  const ordenados = [...itens].sort((a, b) => b.frac - a.frac);
  const grupos: (typeof itens)[] = [];
  for (const it of ordenados) {
    const atual = grupos[grupos.length - 1];
    if (atual && Math.abs(atual[0].frac - it.frac) <= EPS_SONDA) atual.push(it);
    else grupos.push([it]);
  }
  const fila: typeof itens = [];
  for (const g of grupos) {
    if (g.length === 1) {
      fila.push(g[0]);
      continue;
    }
    const posicao = new Map(g.map((it, p) => [it.id, p]));
    fila.push(
      ...[...g].sort(
        (a, b) =>
          ((posicao.get(a.id)! + rodada) % g.length) - ((posicao.get(b.id)! + rodada) % g.length)
      )
    );
  }
  for (let k = 0; k < sobra && k < fila.length; k++) resultado[fila[k].id] += 1;
  return resultado;
}

export interface EntradaSondaEstudo {
  questaoId: string;
  moduloId: string;
  origem: OrigemQuestao;
  /** Data (ISO dia) da última resposta — ausente = nunca vista. */
  vistaEm?: string;
}

/**
 * Monta a sonda a partir do acervo e dos pesos (espelho de `montarSonda`).
 *
 * `embaralhavel` chega JÁ embaralhado pelo caller (semente da rodada) — a
 * função só respeita a ordem e particiona nunca-vistas / vistas dentro de cada
 * módulo. Pool só de questão VALIDADA (`origem !== "gerada"`): gerada nunca
 * entra, e módulo com acervo abaixo do piso fica de fora declarando a contagem
 * real, em vez de fingir cobertura.
 */
export function montarSondaEstudo(
  entradas: EntradaSondaEstudo[],
  pesos: Record<string, number>,
  questoes: number,
  rodada: number,
  embaralhavel: string[],
  pisoValidadas: number
): {
  itens: { questaoId: string; moduloId: string }[];
  composicao: { moduloId: string; qtd: number }[];
  insuficientes: { moduloId: string; validadas: number }[];
} {
  // Pool validado por módulo: 'gerada' NUNCA entra em sonda.
  const poolPorModulo = new Map<string, Map<string, { vistaEm?: string }>>();
  for (const e of entradas) {
    if (e.origem === "gerada") continue;
    const pool = poolPorModulo.get(e.moduloId) ?? new Map();
    pool.set(e.questaoId, { vistaEm: e.vistaEm });
    poolPorModulo.set(e.moduloId, pool);
  }

  const insuficientes: { moduloId: string; validadas: number }[] = [];
  const pesosElegiveis: Record<string, number> = {};
  for (const moduloId of Object.keys(pesos)) {
    const validadas = poolPorModulo.get(moduloId)?.size ?? 0;
    if (validadas < pisoValidadas) {
      insuficientes.push({ moduloId, validadas });
      continue;
    }
    pesosElegiveis[moduloId] = pesos[moduloId];
  }

  const alocacao = alocarPorMaiorRestoEstudo(pesosElegiveis, questoes, rodada);

  const itens: { questaoId: string; moduloId: string }[] = [];
  const composicao: { moduloId: string; qtd: number }[] = [];
  for (const moduloId of Object.keys(pesosElegiveis)) {
    const qtd = alocacao[moduloId] ?? 0;
    if (qtd <= 0) continue;
    const pool = poolPorModulo.get(moduloId)!;
    const nuncaVistas: string[] = [];
    const vistas: string[] = [];
    for (const questaoId of embaralhavel) {
      const estado = pool.get(questaoId);
      if (!estado) continue;
      if (estado.vistaEm) vistas.push(questaoId);
      else nuncaVistas.push(questaoId);
    }
    // Nunca vista primeiro; a ordem relativa de cada grupo é a do embaralho.
    const escolhidas = [...nuncaVistas, ...vistas].slice(0, qtd);
    composicao.push({ moduloId, qtd: escolhidas.length });
    for (const questaoId of escolhidas) itens.push({ questaoId, moduloId });
  }

  return { itens, composicao, insuficientes };
}
