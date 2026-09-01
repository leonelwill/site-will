"use client";

/**
 * Tela pública do banco de estudos (link oculto /est/<token>).
 *
 * Veste o **Zeno Concept**, não a marca institucional do site: o escopo
 * `.estudos` do globals.css redefine tudo (azul-gelo + azul vivo no claro,
 * Tokyo Night no escuro) e os componentes só leem `--est-*`. O dourado do site
 * saiu daqui por decisão do William (30/08/2026) — isto é ferramenta de
 * estudo, não peça de marca. Verde/vermelho de certo/errado continuam sendo
 * status, mas agora tokenizados (`est-positive`/`est-negative`), senão o
 * `emerald-50` fixo viraria bloco branco no tema escuro.
 *
 * Privacidade: PIN de leitura e respostas vivem SÓ em memória (estado React)
 * — nada em localStorage. O browser só fala com o proxy da própria origem
 * (/api/estudos/<token>); quem conversa com o Zeno é o servidor.
 *
 * Mobile-first (360px): cards empilhados, filtros em chips com scroll
 * horizontal, painel de sessão sticky acima da StickyContactBar do layout
 * (bottom-24; xl:static porque a barra some no desktop).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, Check, CircleHelp, ListTree, Lock, Play, RefreshCw, Search, ThumbsDown, Timer, X } from "lucide-react";
import {
  RÓTULOS_ORIGEM,
  RÓTULOS_TIPO,
  diasCorridosAteProva,
  dicaDaQuestao,
  formatarDataProva,
  postarFeedback,
  postarSessao,
  type ItemSessaoPost,
  type Estudo,
  type OrigemQuestao,
  type TipoQuestao,
} from "@/lib/estudos";
import MenuTemas from "./MenuTemas";
import SessaoEstudo from "./SessaoEstudo";
import Simulado from "./Simulado";
import { cn } from "@/lib/utils";

/** Busca sem acento/caixa (molde do EventoClient). */
function fold(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** A/B/C/D… pelo índice da alternativa. */
function letra(idx: number): string {
  return String.fromCharCode(65 + idx);
}

/**
 * Margem de erro binomial (pior caso p = 0,5, nível 95%).
 * espelho de zeno_cloud/src/lib/estudos/margem.ts (repos separados)
 */
function margemBinomial(n: number): number {
  return 1.96 * Math.sqrt(0.25 / n);
}

/** "62,5" / "12,1" — uma casa, vírgula decimal (mesma régua do Zeno). */
function fmt1(x: number): string {
  return x.toFixed(1).replace(".", ",");
}

type Fase = "bloqueado" | "carregando" | "erro" | "completo";

interface Props {
  token: string;
  /** Dados do SSR: bloqueado (200 sem PIN) ou completo (doc sem pin no SSR). */
  inicial: Estudo;
  /**
   * PIN já digitado na vitrine do hub. Quando o hub abre um curso, o curso
   * chega DESTRAVADO e o PIN precisa vir junto — é ele que autentica o POST de
   * sessão e o de feedback. Sem isto, gravar a sessão devolveria 401.
   */
  pinInicial?: string;
  /** Volta para a vitrine — só existe quando se chegou por ela. */
  aoVoltar?: () => void;
}

export default function EstudosClient({ token, inicial, pinInicial, aoVoltar }: Props) {
  const [dados, setDados] = useState<Estudo>(inicial);
  const [fase, setFase] = useState<Fase>(inicial.bloqueado ? "bloqueado" : "completo");

  // ── PIN de leitura: só em memória ──────────────────────────────────────
  const [pin, setPin] = useState(pinInicial ?? "");
  const [pinErro, setPinErro] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  // ── Sessão de estudo: seleção e respostas só em memória ────────────────
  const [selecao, setSelecao] = useState<Record<string, number>>({});
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  /** Questões respondidas com a dica aberta (Carta 3: declarado no painel). */
  const [dicasAbertas, setDicasAbertas] = useState<Record<string, true>>({});
  /** Thumbs-down enviados nesta sessão de navegação (feedback só p/ geradas). */
  const [rejeitadasLocal, setRejeitadasLocal] = useState<Record<string, true>>({});

  const rejeitarQuestao = useCallback(
    async (questaoId: string) => {
      try {
        await postarFeedback(token, pin, questaoId);
        setRejeitadasLocal((r) => ({ ...r, [questaoId]: true }));
      } catch {
        /* silencioso: botão continua disponível para tentar de novo */
      }
    },
    [token, pin]
  );
  const [filtroOrigem, setFiltroOrigem] = useState<OrigemQuestao | "todas">("todas");
  const [filtroTipo, setFiltroTipo] = useState<TipoQuestao | "todos">("todos");
  /**
   * Estado da questão. `pendentes` é o padrão: quem já respondeu numa sessão
   * gravada sai da lista, senão o banco vira uma pilha que nunca diminui.
   */
  const [filtroEstado, setFiltroEstado] = useState<"pendentes" | "respondidas" | "todas">(
    "pendentes"
  );
  /** Recorte vindo do menu de temas: ids de microtema + o rótulo para a tela. */
  const [recorteTema, setRecorteTema] = useState<{ ids: string[]; rotulo: string } | null>(null);
  const [busca, setBusca] = useState("");
  // F1b: home ("banco" = lista de questões) · sessão zero-decisão · simulado.
  // F1c: "temas" = menu de macrotemas/microtemas do programa.
  const [vista, setVista] = useState<"banco" | "estudar" | "simulado" | "temas">("banco");

  const questoes = useMemo(
    () => (dados.bloqueado ? [] : dados.questoes.filter((q) => !q.rejeitadaEm)),
    [dados]
  );

  /** Títulos do PD (dica de fallback) — undefined quando bloqueado. */
  const microtemas = dados.bloqueado ? undefined : dados.microtemas;

  const contagemOrigem = useMemo(() => {
    const m = new Map<OrigemQuestao, number>();
    for (const q of questoes) m.set(q.origem, (m.get(q.origem) ?? 0) + 1);
    return m;
  }, [questoes]);

  const contagemTipo = useMemo(() => {
    const m = new Map<TipoQuestao, number>();
    for (const q of questoes) m.set(q.tipo, (m.get(q.tipo) ?? 0) + 1);
    return m;
  }, [questoes]);

  /**
   * Questões já respondidas em sessões GRAVADAS. Só o que veio do servidor —
   * o que foi respondido agora, nesta tela, continua visível até o próximo
   * carregamento: fazer a questão sumir debaixo do dedo assim que se responde
   * seria hostil no meio de uma sessão.
   */
  const jaRespondidas = useMemo(
    () => new Set((dados.bloqueado ? [] : (dados.respondidas ?? [])).map((r) => r.questaoId)),
    [dados]
  );

  const temasEscolhidos = useMemo(
    () => (recorteTema ? new Set(recorteTema.ids) : null),
    [recorteTema]
  );

  const listaFiltrada = useMemo(() => {
    const termo = fold(busca.trim());
    return questoes.filter((q) => {
      if (filtroOrigem !== "todas" && q.origem !== filtroOrigem) return false;
      if (filtroTipo !== "todos" && q.tipo !== filtroTipo) return false;
      if (filtroEstado === "pendentes" && jaRespondidas.has(q.id)) return false;
      if (filtroEstado === "respondidas" && !jaRespondidas.has(q.id)) return false;
      if (temasEscolhidos && !(q.microtemaPdId && temasEscolhidos.has(q.microtemaPdId))) return false;
      if (termo && !fold(q.enunciado).includes(termo)) return false;
      return true;
    });
  }, [questoes, filtroOrigem, filtroTipo, filtroEstado, jaRespondidas, temasEscolhidos, busca]);

  const contagemEstado = useMemo(() => {
    const respondidas = questoes.filter((q) => jaRespondidas.has(q.id)).length;
    return { respondidas, pendentes: questoes.length - respondidas };
  }, [questoes, jaRespondidas]);

  /** Vem do menu de temas: recorta o banco e volta para ele. */
  const escolherTema = useCallback((ids: string[], rotulo: string) => {
    setRecorteTema({ ids, rotulo });
    // Um tema escolhido quer TODAS as suas questões à vista, inclusive as já
    // respondidas — o gesto é "quero ver isso", não "quero o que falta".
    setFiltroEstado("todas");
    setVista("banco");
  }, []);

  /** Acertos/respondidas gerais + % oficial (simulado-oficial) e % gerada,
   *  SEPARADOS — nunca somadas. Sem gabarito (oficial ou IA) não entra nas %. */
  const sessao = useMemo(() => {
    let respondidas = 0;
    let acertos = 0;
    let nOficial = 0;
    let acOficial = 0;
    let nDigitada = 0;
    let acDigitada = 0;
    let nGerada = 0;
    let acGerada = 0;
    for (const q of questoes) {
      const resp = respostas[q.id];
      if (resp === undefined) continue;
      respondidas++;
      const gabarito = q.gabaritoOficial ?? q.gabaritoIA;
      if (gabarito === undefined || gabarito === null) continue;
      const ok = resp === gabarito;
      if (ok) acertos++;
      if (q.origem === "simulado-oficial") {
        nOficial++;
        if (ok) acOficial++;
      } else if (q.origem === "digitada") {
        nDigitada++;
        if (ok) acDigitada++;
      } else if (q.origem === "gerada") {
        nGerada++;
        if (ok) acGerada++;
      }
    }
    const comDica = questoes.filter(
      (q) => respostas[q.id] !== undefined && dicasAbertas[q.id]
    ).length;
    return {
      respondidas,
      acertos,
      nOficial,
      acOficial,
      nDigitada,
      acDigitada,
      nGerada,
      acGerada,
      comDica,
    };
  }, [questoes, respostas, dicasAbertas]);

  // ── Desbloqueio (client → proxy da própria origem → Zeno) ──────────────
  const desbloquear = useCallback(async () => {
    if (!/^\d{6}$/.test(pin)) {
      setPinErro("O PIN tem 6 dígitos.");
      return;
    }
    setFase("carregando");
    setPinErro(null);
    try {
      const resp = await fetch(`/api/estudos/${encodeURIComponent(token)}`, {
        cache: "no-store",
        headers: { "x-pin-leitura": pin },
      });
      if (resp.ok) {
        const data = (await resp.json()) as Estudo | null;
        if (data && data.bloqueado === false) {
          setDados(data);
          setFase("completo");
          return;
        }
        setFase("bloqueado");
        setPinErro("PIN incorreto — confira e tente de novo.");
        return;
      }
      if (resp.status === 401) {
        setFase("bloqueado");
        setPinErro("PIN incorreto — confira e tente de novo.");
      } else if (resp.status === 429) {
        setFase("bloqueado");
        setPinErro("Muitas tentativas — aguarde alguns minutos.");
      } else if (resp.status === 404) {
        setFase("erro");
        setErroMsg("Curso não encontrado — confira o link recebido.");
      } else {
        setFase("erro");
        setErroMsg("Servidor indisponível — tente novamente.");
      }
    } catch {
      setFase("erro");
      setErroMsg("Sem conexão — tente novamente.");
    }
  }, [token, pin]);

  // ── Gravação das respostas do banco ────────────────────────────────────
  // Antes daqui, responder no banco só mexia no estado do React: nada era
  // gravado, o filtro "já respondidas" nunca saía de zero e a questão voltava
  // intacta no próximo acesso. Sessão e Simulado gravavam; o banco, não.
  //
  // Desenho: UMA sessão por visita, reenviada inteira a cada lote. O servidor
  // grava por `id` (setDoc), então reenviar o mesmo id ATUALIZA em vez de criar
  // outra sessão — em vez de uma sessão por questão respondida.
  //
  // Nada disso nasce no primeiro render: id e início saem na PRIMEIRA resposta,
  // dentro de refs. `useState(() => Date.now())` no topo divergiria entre
  // servidor e cliente e viraria erro de hidratação.
  const sessaoRef = useRef<{ id: string; inicioEm: string } | null>(null);
  const itensRef = useRef<Map<string, ItemSessaoPost>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gravacao, setGravacao] = useState<"ocioso" | "gravando" | "salvo" | "erro">("ocioso");
  /** Quantas respostas desta visita já estão gravadas no servidor. */
  const [gravadas, setGravadas] = useState(0);

  const enviarSessao = useCallback(
    async (aoSair = false) => {
      const sessao = sessaoRef.current;
      const itens = [...itensRef.current.values()];
      if (!sessao || itens.length === 0 || !pin || dados.bloqueado) return;
      const cursoId = dados.curso.id;
      if (!cursoId) return;

      const fim = new Date();
      if (!aoSair) setGravacao("gravando");
      try {
        await postarSessao(
          token,
          pin,
          {
            id: sessao.id,
            cursoId,
            inicioEm: sessao.inicioEm,
            fimEm: fim.toISOString(),
            // Carta 8: minutos na data de COMPETÊNCIA. No banco a sessão é
            // navegação livre, então o tempo é o decorrido desde a 1ª resposta.
            minutos: Math.max(
              0,
              Math.round((fim.getTime() - new Date(sessao.inicioEm).getTime()) / 60000)
            ),
            competenciaEm: sessao.inicioEm.slice(0, 10),
            itens,
          },
          aoSair
        );
        if (!aoSair) {
          setGravacao("salvo");
          setGravadas(itens.length);
        }
      } catch {
        if (!aoSair) setGravacao("erro");
      }
    },
    [token, pin, dados]
  );

  /** Agenda o envio; respostas em sequência entram no MESMO lote. */
  const agendarEnvio = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void enviarSessao(), 1200);
  }, [enviarSessao]);

  // Rede de segurança: fechar a aba ou trocar de app no celular não pode
  // perder o que ainda estava no debounce.
  useEffect(() => {
    const aoSair = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void enviarSessao(true);
    };
    const aoEsconder = () => {
      if (document.visibilityState === "hidden") aoSair();
    };
    window.addEventListener("pagehide", aoSair);
    document.addEventListener("visibilitychange", aoEsconder);
    return () => {
      window.removeEventListener("pagehide", aoSair);
      document.removeEventListener("visibilitychange", aoEsconder);
    };
  }, [enviarSessao]);

  const responder = (questaoId: string) => {
    const escolhida = selecao[questaoId];
    if (escolhida === undefined) return;
    setRespostas((r) => ({ ...r, [questaoId]: escolhida }));

    const q = questoes.find((x) => x.id === questaoId);
    if (!q) return;
    const gabarito = q.gabaritoOficial ?? q.gabaritoIA;
    itensRef.current.set(questaoId, {
      questaoId,
      // Sem gabarito não há como julgar: 'nulo' conta como respondida e fica
      // fora de acerto e de erro, em vez de inventar um veredito.
      resultado:
        gabarito === undefined || gabarito === null
          ? "nulo"
          : escolhida === gabarito
            ? "certo"
            : "errado",
      origem: q.origem,
      tipo: q.tipo,
      ...(dicasAbertas[questaoId] ? { usouDica: true as const } : {}),
    });
    sessaoRef.current ??= {
      id: `banco-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      inicioEm: new Date().toISOString(),
    };
    setGravacao("gravando");
    agendarEnvio();
  };

  const irParaProxima = (indiceAtual: number) => {
    const proxima = listaFiltrada[indiceAtual + 1];
    if (!proxima) return;
    document
      .getElementById(`questao-${listaFiltrada.indexOf(proxima)}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reiniciarSessao = () => {
    setRespostas({});
    setSelecao({});
    setDicasAbertas({});
  };

  // Prova: DD/MM/AAAA · N dias corridos (dias só no futuro; datas puras UTC).
  const linhaProva = useMemo(() => {
    if (dados.bloqueado) return null;
    const iso = dados.curso.dataProva;
    if (!iso) return null;
    const dias = diasCorridosAteProva(iso);
    const texto = `Prova: ${formatarDataProva(iso)}`;
    return dias !== null && dias > 0
      ? `${texto} · ${dias} ${dias === 1 ? "dia corrido" : "dias corridos"}`
      : texto;
  }, [dados]);

  // ── Tela: PIN (bloqueado + carregando) e erro de rede ──────────────────
  if (fase === "erro") {
    return (
      <section className="estudos flex min-h-[60vh] items-center px-4">
        <div className="mx-auto max-w-md rounded-2xl border bg-est-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-est-primary-ink">Não deu para carregar</h1>
          <p className="mt-2 text-sm leading-relaxed text-est-fg-soft">{erroMsg}</p>
          <button
            type="button"
            onClick={() => setFase("bloqueado")}
            className="mt-5 w-full rounded-xl bg-est-primary px-4 py-3 text-sm font-bold text-est-primary-fg transition-colors hover:bg-est-primary/90"
          >
            Tentar de novo
          </button>
        </div>
      </section>
    );
  }

  if (fase === "bloqueado" || fase === "carregando") {
    const verificando = fase === "carregando";
    const curso = dados.curso;
    return (
      <section className="estudos flex min-h-[60vh] items-center px-4">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border bg-est-card p-8 text-center shadow-sm">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-est-primary/10 text-est-primary-ink">
              <Lock size={26} />
            </span>
            <h1 className="mt-5 text-xl font-bold text-est-primary-ink">{curso.rotulo}</h1>
            {curso.contagens.questoes > 0 && (
              <p className="mt-1 text-sm font-medium text-est-fg-soft">
                {curso.contagens.questoes} questões ingeridas
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-est-fg-soft">
              Digite o PIN de leitura para abrir o banco de questões.
            </p>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") desbloquear();
              }}
              inputMode="numeric"
              disabled={verificando}
              placeholder="••••••"
              aria-label="PIN de leitura (6 dígitos)"
              className="mt-5 w-full rounded-xl border border-est-border bg-est-sunken px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.4em] text-est-fg focus:border-est-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-est-primary focus-visible:ring-offset-2 focus-visible:ring-offset-est-bg disabled:opacity-50"
            />
            {pinErro && <p className="mt-2 text-sm font-medium text-est-negative">{pinErro}</p>}
            <button
              type="button"
              onClick={desbloquear}
              disabled={verificando}
              className="mt-4 w-full rounded-xl bg-est-primary px-4 py-3 text-sm font-bold text-est-primary-fg transition-colors hover:bg-est-primary/90 disabled:opacity-50"
            >
              {verificando ? "Verificando…" : "Desbloquear"}
            </button>
            <p className="mt-6 text-xs text-est-fg-soft">
              Acesso pessoal e intransferível · William Leonel
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── Tela completa ────────────────────────────────────────────────────────
  const curso = dados.curso; // EstudoCompleto (fase "completo")

  return (
    <section className="estudos px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <header>
          {aoVoltar && (
            <button
              type="button"
              onClick={aoVoltar}
              className="mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-est-border px-3 py-2.5 text-xs font-bold text-est-fg-soft transition-colors hover:bg-est-sunken hover:text-est-fg"
            >
              <ArrowLeft size={14} /> Todos os cursos
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-est-primary-ink sm:text-3xl">
            {curso.rotulo}
          </h1>
          <p className="mt-1 text-sm font-medium text-est-fg-soft">
            {curso.contagens.questoes} questões ingeridas
          </p>
          {/* Dias corridos dependem do relógio local × servidor: diferença de
              fuso não deve virar erro de hidratação. */}
          {linhaProva && (
            <p
              suppressHydrationWarning
              className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-est-card px-3 py-2 text-sm font-medium text-est-fg"
            >
              <Calendar size={16} className="shrink-0 text-est-primary-ink" />
              {linhaProva}
            </p>
          )}
        </header>

        {/* Painel da home (F1b): números COM unidade. Dados do painel vêm do
            Zeno (B4); vencidas degradam para contagem local quando o backend
            ainda não despachou. Sem dataProva → 2 números (Carta 9: countdown
            só existe quando o fato existe). */}
        {!dados.bloqueado && vista === "banco" && (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {dados.curso.dataProva && (
              <div className="rounded-xl border border-est-border bg-est-card p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-est-fg-soft">
                  Dias p/ a prova
                </p>
                <p
                  className="mt-1 flex flex-wrap items-baseline gap-x-1 text-xl font-bold tabular-nums text-est-primary-ink"
                  suppressHydrationWarning
                >
                  {diasCorridosAteProva(dados.curso.dataProva) ?? "—"}
                  <span className="text-xs font-medium text-est-fg-soft">dias corridos</span>
                </p>
              </div>
            )}
            <div className="rounded-xl border border-est-border bg-est-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-est-fg-soft">
                Revisões vencidas hoje
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-1 text-xl font-bold tabular-nums text-est-primary-ink">
                {dados.painel?.vencidasHoje ?? dados.reviews?.length ?? 0}
                <span className="text-xs font-medium text-est-fg-soft">cards</span>
              </p>
            </div>
            <div className="rounded-xl border border-est-border bg-est-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-est-fg-soft">
                Cobertura do programa
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-1 text-xl font-bold tabular-nums text-est-primary-ink">
                {dados.painel ? `${dados.painel.cobertura.comDerivado}/${dados.painel.cobertura.total}` : "—"}
                <span className="text-xs font-medium text-est-fg-soft">microtemas</span>
              </p>
              {/* Carta 3: cobertura sustentada só por questão gerada é declarada
                  ao lado do número, não somada em silêncio a material validado. */}
              {!!dados.painel?.cobertura.soGerada && (
                <p className="mt-0.5 text-[0.7rem] font-medium text-est-warning">
                  {dados.painel.cobertura.soGerada} só com questão gerada
                </p>
              )}
            </div>
            <div className="flex flex-col justify-center gap-2">
              <button
                type="button"
                onClick={() => setVista("estudar")}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-est-primary px-3 py-3 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90"
              >
                <Play size={15} /> Estudar agora
              </button>
              <button
                type="button"
                onClick={() => setVista("simulado")}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-est-primary/60 px-3 py-3 text-sm font-bold text-est-primary-ink hover:bg-est-primary/10"
              >
                <Timer size={15} /> Simulado
              </button>
              <button
                type="button"
                onClick={() => setVista("temas")}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-est-border px-3 py-3 text-sm font-bold text-est-fg-soft hover:bg-est-sunken hover:text-est-fg"
              >
                <ListTree size={15} /> Temas
              </button>
            </div>
          </div>
        )}

        {/* Vista F1b: sessão zero-decisão ou simulado substituem o banco.
            O guard !dados.bloqueado estreita a union para o tipo completo. */}
        {vista === "temas" && !dados.bloqueado ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setVista("banco")}
              className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-est-border px-3 py-2.5 text-xs font-bold text-est-fg-soft transition-colors hover:bg-est-sunken hover:text-est-fg"
            >
              <ArrowLeft size={14} /> Voltar ao banco
            </button>
            {dados.arvoreTemas && dados.arvoreTemas.length > 0 ? (
              <MenuTemas modulos={dados.arvoreTemas} aoEscolher={escolherTema} />
            ) : (
              // Curso sem PD ingerido (o C-Pro R está assim): dizer isso é mais
              // honesto que uma árvore vazia que parece um erro de carregamento.
              <p className="rounded-xl border border-est-warning/40 bg-est-warning-soft px-3 py-2.5 text-sm text-est-warning">
                O programa detalhado desta certificação ainda não foi ingerido — sem ele não há
                como montar o menu de temas.
              </p>
            )}
          </div>
        ) : vista === "estudar" && !dados.bloqueado ? (
          <div className="mt-6">
            <SessaoEstudo
              token={token}
              pin={pin}
              dados={{ ...dados, questoes }}
              aoFechar={(salvou) => {
                setVista("banco");
                if (salvou) {
                  // Reviews/erradas mudaram no Zeno — busca de novo COM o PIN.
                  void desbloquear();
                }
              }}
            />
          </div>
        ) : vista === "simulado" && !dados.bloqueado ? (
          <div className="mt-6">
            <Simulado
              token={token}
              pin={pin}
              dados={{ ...dados, questoes }}
              aoFechar={(salvou) => {
                setVista("banco");
                if (salvou) void desbloquear();
              }}
            />
          </div>
        ) : (
          <>
        {/* Filtros: busca + chips de origem (com contagem) e de tipo */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-est-fg-soft" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no enunciado…"
              className="min-h-11 w-full rounded-xl border border-est-border bg-est-card py-3 pl-9 pr-3 text-sm text-est-fg placeholder:text-est-fg-soft focus:border-est-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-est-primary focus-visible:ring-offset-2 focus-visible:ring-offset-est-bg"
            />
          </div>

          {/* Recorte vindo do menu de temas — sempre visível e sempre removível:
              filtro escondido é a origem do "sumiram minhas questões". */}
          {recorteTema && (
            <div className="flex items-center gap-2 rounded-xl border border-est-primary/40 bg-est-primary/10 px-3 py-2">
              <ListTree size={15} className="shrink-0 text-est-primary-ink" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-est-fg">
                Tema: {recorteTema.rotulo}
              </span>
              <button
                type="button"
                onClick={() => setRecorteTema(null)}
                aria-label="Remover o filtro de tema"
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-est-primary-ink hover:bg-est-primary/10"
              >
                <X size={14} /> Limpar
              </button>
            </div>
          )}

          {/* Estado da questão. Eixo SEPARADO do de origem: misturar "digitada"
              com "já respondida" no mesmo grupo faria dois recortes parecerem
              alternativas um do outro. */}
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filtrar por estado da questão"
          >
            <button
              type="button"
              aria-pressed={filtroEstado === "pendentes"}
              onClick={() => setFiltroEstado("pendentes")}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                filtroEstado === "pendentes" ? "bg-est-primary text-est-primary-fg" : "border bg-est-card text-est-fg-soft hover:text-est-primary-ink"
              )}
            >
              Ainda não respondidas · {contagemEstado.pendentes}
            </button>
            <button
              type="button"
              aria-pressed={filtroEstado === "respondidas"}
              onClick={() => setFiltroEstado("respondidas")}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                filtroEstado === "respondidas" ? "bg-est-primary text-est-primary-fg" : "border bg-est-card text-est-fg-soft hover:text-est-primary-ink"
              )}
            >
              Já respondidas · {contagemEstado.respondidas}
            </button>
            <button
              type="button"
              aria-pressed={filtroEstado === "todas"}
              onClick={() => setFiltroEstado("todas")}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                filtroEstado === "todas" ? "bg-est-primary text-est-primary-fg" : "border bg-est-card text-est-fg-soft hover:text-est-primary-ink"
              )}
            >
              Todas · {questoes.length}
            </button>
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filtrar por origem"
          >
            <button
              type="button"
              aria-pressed={filtroOrigem === "todas"}
              onClick={() => setFiltroOrigem("todas")}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                filtroOrigem === "todas"
                  ? "bg-est-primary text-est-primary-fg"
                  : "border bg-est-card text-est-fg-soft hover:text-est-primary-ink"
              )}
            >
              Todas · {questoes.length}
            </button>
            {(Object.keys(RÓTULOS_ORIGEM) as OrigemQuestao[])
              .filter((origem) => contagemOrigem.has(origem))
              .map((origem) => (
                <button
                  key={origem}
                  type="button"
                  aria-pressed={filtroOrigem === origem}
                  onClick={() => setFiltroOrigem(origem)}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                    filtroOrigem === origem
                      ? "bg-est-primary text-est-primary-fg"
                      : "border bg-est-card text-est-fg-soft hover:text-est-primary-ink"
                  )}
                >
                  {RÓTULOS_ORIGEM[origem]} · {contagemOrigem.get(origem)}
                </button>
              ))}
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filtrar por tipo"
          >
            <button
              type="button"
              aria-pressed={filtroTipo === "todos"}
              onClick={() => setFiltroTipo("todos")}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                filtroTipo === "todos"
                  ? "bg-est-primary text-est-primary-fg"
                  : "border bg-est-card text-est-fg-soft hover:text-est-primary-ink"
              )}
            >
              Todos
            </button>
            {(Object.keys(RÓTULOS_TIPO) as TipoQuestao[])
              .filter((tipo) => contagemTipo.has(tipo))
              .map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  aria-pressed={filtroTipo === tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                    filtroTipo === tipo
                      ? "bg-est-primary text-est-primary-fg"
                      : "border bg-est-card text-est-fg-soft hover:text-est-primary-ink"
                  )}
                >
                  {RÓTULOS_TIPO[tipo]}
                </button>
              ))}
          </div>
        </div>

        {/* Lista de questões: 1 coluna no mobile, 2 a partir de 1024px */}
        {listaFiltrada.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {listaFiltrada.map((q, indice) => {
              const escolhida = selecao[q.id];
              const respondida = respostas[q.id] !== undefined;
              const gabarito = q.gabaritoOficial ?? q.gabaritoIA ?? null;
              const dica = dicaDaQuestao(q, microtemas);
              const dicaAberta = !!dicasAbertas[q.id];
              return (
                <article
                  key={q.id}
                  id={`questao-${indice}`}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-est-card p-4 shadow-sm scroll-mt-24",
                    respondida ? "border-est-primary ring-1 ring-est-primary/40" : "border-est-border"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-est-primary/20 bg-est-primary/5 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-est-primary-ink">
                      {RÓTULOS_ORIGEM[q.origem]}
                    </span>
                    <span className="rounded-full border border-est-primary/40 bg-est-primary/10 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-est-fg">
                      {RÓTULOS_TIPO[q.tipo]}
                    </span>
                    {respondida && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-wide text-est-primary-ink">
                        <Check size={12} /> Respondida
                      </span>
                    )}
                    {dica && !respondida && !dicaAberta && (
                      <button
                        type="button"
                        onClick={() => setDicasAbertas((d) => ({ ...d, [q.id]: true }))}
                        aria-label={`Ver dica da questão ${indice + 1}`}
                        className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-full border border-est-primary/60 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-est-fg hover:bg-est-primary/10"
                      >
                        <CircleHelp size={12} /> Dica
                      </button>
                    )}
                  </div>

                  {dica && dicaAberta && (
                    <div className="mt-2.5 rounded-xl border border-est-primary/50 bg-est-primary/10 p-3 text-sm">
                      {dica.dica && (
                        <p className="font-medium leading-relaxed text-est-fg">{dica.dica}</p>
                      )}
                      {dica.microtema && (
                        <p className="mt-1 text-xs text-est-fg-soft">
                          Microtema do PD: {dica.microtema}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="mt-2.5 whitespace-pre-line text-sm font-semibold leading-relaxed text-est-fg">
                    {q.enunciado}
                  </p>

                  <div className="mt-3 flex flex-col gap-2">
                    {q.alternativas.map((alternativa, idx) => {
                      const eAEscolhida = escolhida === idx;
                      let classe = "border-est-border bg-est-card hover:border-est-primary/50";
                      if (!respondida) {
                        if (eAEscolhida)
                          classe = "border-est-primary bg-est-primary/5 font-semibold ring-1 ring-est-primary";
                      } else if (gabarito !== null && idx === gabarito) {
                        // Certa: verde em destaque.
                        classe = "border-est-positive bg-est-positive-soft font-semibold text-est-positive";
                      } else {
                        // Erradas: vermelhas; a escolhida errada ganha anel forte.
                        classe = cn(
                          "border-est-negative/50 bg-est-negative-soft text-est-negative",
                          eAEscolhida && "ring-2 ring-est-negative font-semibold"
                        );
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={respondida}
                          aria-pressed={eAEscolhida}
                          onClick={() =>
                            setSelecao((s) => ({ ...s, [q.id]: idx }))
                          }
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default",
                            classe
                          )}
                        >
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-current/30 text-xs font-bold">
                            {letra(idx)}
                          </span>
                          <span className="leading-relaxed">{alternativa}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Ações + gabarito + explicação */}
                  {!respondida ? (
                    <button
                      type="button"
                      onClick={() => responder(q.id)}
                      disabled={escolhida === undefined}
                      className="mt-3 min-h-11 self-start rounded-xl bg-est-primary px-5 py-2.5 text-sm font-bold text-est-primary-fg transition-colors hover:bg-est-primary/90 disabled:opacity-40"
                    >
                      Responder
                    </button>
                  ) : (
                    <div className="mt-3 flex flex-col gap-3">
                      {q.gabaritoOficial !== undefined && q.gabaritoOficial !== null ? (
                        <p className="text-sm font-bold text-est-positive">
                          Gabarito oficial: {letra(q.gabaritoOficial)}
                        </p>
                      ) : q.gabaritoIA !== undefined && q.gabaritoIA !== null ? (
                        <p className="text-sm font-medium text-est-fg-soft">
                          Gabarito IA — sem oficial: {letra(q.gabaritoIA)}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-est-fg-soft">
                          Sem gabarito (oficial ou IA) para esta questão.
                        </p>
                      )}
                      {q.explicacao && (
                        <div className="rounded-lg bg-est-sunken p-3 text-sm leading-relaxed text-est-fg">
                          {q.explicacao}
                        </div>
                      )}
                      {q.origem === "gerada" &&
                        (rejeitadasLocal[q.id] ? (
                          <p className="text-xs font-medium text-est-fg-soft">
                            Questão reportada — sai do simulado e da fila de estudo.
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void rejeitarQuestao(q.id)}
                            className="inline-flex items-center gap-1 self-start rounded-xl border px-3 py-1.5 text-xs font-bold text-est-negative hover:bg-est-negative-soft"
                          >
                            <ThumbsDown size={13} /> Reportar questão gerada
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={() => irParaProxima(indice)}
                        disabled={indice === listaFiltrada.length - 1}
                        className="self-start rounded-xl border px-4 py-2 text-sm font-bold text-est-primary-ink transition-colors hover:bg-est-sunken disabled:opacity-40"
                      >
                        Próxima
                      </button>
                    </div>
                  )}

                  <p className="mt-3 border-t pt-2 text-xs text-est-fg-soft">
                    {q.provenance.tipo} · {q.provenance.ref} · {q.provenance.data}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed bg-est-card/60 px-6 py-14 text-center">
            {/* Vazio tem CAUSAS diferentes e a mais provável — "já respondi
                todas" — é sucesso, não falha. Dizer qual é evita o susto de
                achar que o banco sumiu. */}
            {questoes.length === 0 ? (
              <>
                <p className="font-semibold text-est-primary-ink">Nenhuma questão ingerida ainda</p>
                <p className="mt-1 text-sm text-est-fg-soft">
                  As questões aparecem aqui assim que você adicionar material no Zeno.
                </p>
              </>
            ) : filtroEstado === "pendentes" && contagemEstado.pendentes === 0 ? (
              <>
                <p className="font-semibold text-est-positive">
                  Você já respondeu todas as {questoes.length} questões
                </p>
                <p className="mt-1 text-sm text-est-fg-soft">
                  Abra “Já respondidas” para revisar, ou “Estudar agora” para as revisões vencidas.
                </p>
              </>
            ) : filtroEstado === "respondidas" && contagemEstado.respondidas === 0 ? (
              <>
                <p className="font-semibold text-est-primary-ink">Nada respondido ainda</p>
                <p className="mt-1 text-sm text-est-fg-soft">
                  Uma questão entra aqui quando você a responde numa sessão gravada.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-est-primary-ink">
                  Nenhuma questão com esses filtros
                </p>
                <p className="mt-1 text-sm text-est-fg-soft">
                  {recorteTema
                    ? "Este tema não tem questão que case com os outros filtros — limpe o tema ou volte para “Todas”."
                    : "Ajuste a busca ou volte para “Todas”/“Todos”."}
                </p>
              </>
            )}
          </div>
        )}

        {/* Painel de sessão — sticky bottom no mobile, acima da barra de
            contato do layout; estático no desktop (xl). */}
        <div className="sticky bottom-24 z-30 mt-8 xl:static">
          <div className="rounded-2xl border border-est-border bg-est-card p-4 shadow-xl shadow-est-fg/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <span className="font-bold text-est-primary-ink">
                  Acertos: {sessao.acertos}/{sessao.respondidas}
                  {sessao.comDica > 0 && ` · ${sessao.comDica} com dica`}
                </span>
                {/* Confirmação de que a resposta CONTOU. Sem isto o usuário não
                    tem como saber que gravou — e foi assim que respostas se
                    perderam em silêncio até 01/09. */}
                {gravacao !== "ocioso" && (
                  <span
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-bold",
                      gravacao === "erro" ? "text-est-negative" : "text-est-fg-soft"
                    )}
                  >
                    {gravacao === "gravando" && (
                      <>
                        <RefreshCw size={12} className="animate-spin" aria-hidden /> Gravando…
                      </>
                    )}
                    {gravacao === "salvo" && (
                      <>
                        <Check size={12} className="text-est-positive" aria-hidden />
                        <span className="text-est-positive">
                          {gravadas} {gravadas === 1 ? "resposta salva" : "respostas salvas"}
                        </span>
                      </>
                    )}
                    {gravacao === "erro" && (
                      <>
                        Não deu para salvar
                        <button
                          type="button"
                          onClick={() => void enviarSessao()}
                          className="underline underline-offset-2"
                        >
                          tentar de novo
                        </button>
                      </>
                    )}
                  </span>
                )}
                <span className="text-est-fg-soft">
                  Oficial:{" "}
                  <strong className="text-est-fg">
                    {sessao.nOficial < 1
                      ? "—"
                      : `${fmt1((sessao.acOficial / sessao.nOficial) * 100)}%`}
                  </strong>{" "}
                  (n={sessao.nOficial})
                  {sessao.nOficial >= 1 && ` ±${fmt1(margemBinomial(sessao.nOficial) * 100)}pp`}
                </span>
                <span className="text-est-fg-soft">
                  Cursinho:{" "}
                  <strong className="text-est-fg">
                    {sessao.nDigitada < 1
                      ? "—"
                      : `${fmt1((sessao.acDigitada / sessao.nDigitada) * 100)}%`}
                  </strong>{" "}
                  (n={sessao.nDigitada})
                  {sessao.nDigitada >= 1 && ` ±${fmt1(margemBinomial(sessao.nDigitada) * 100)}pp`}
                </span>
                <span className="text-est-fg-soft">
                  Gerada:{" "}
                  <strong className="text-est-fg">
                    {sessao.nGerada < 1
                      ? "—"
                      : `${fmt1((sessao.acGerada / sessao.nGerada) * 100)}%`}
                  </strong>{" "}
                  (n={sessao.nGerada})
                  {sessao.nGerada >= 1 && ` ±${fmt1(margemBinomial(sessao.nGerada) * 100)}pp`}
                </span>
              </div>
              <button
                type="button"
                onClick={reiniciarSessao}
                className="inline-flex items-center gap-2 self-start rounded-xl border px-3 py-2 text-xs font-bold text-est-primary-ink transition-colors hover:bg-est-sunken sm:self-auto"
              >
                <RefreshCw size={14} />
                Reiniciar sessão
              </button>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  );
}
