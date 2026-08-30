"use client";

/**
 * Tela pública do banco de estudos (link oculto /est/<token>).
 *
 * Molde visual do EventoClient, mas sobre os TOKENS da marca do site
 * (--brand-primary #253164, --brand-gold #C9A84C, superfícies theme-* do
 * globals.css) — nenhuma cor nova fora dos tokens; verde/vermelho de
 * certo/errado são cores semânticas de status, como no EventoClient.
 *
 * Privacidade: PIN de leitura e respostas vivem SÓ em memória (estado React)
 * — nada em localStorage. O browser só fala com o proxy da própria origem
 * (/api/estudos/<token>); quem conversa com o Zeno é o servidor.
 *
 * Mobile-first (360px): cards empilhados, filtros em chips com scroll
 * horizontal, painel de sessão sticky acima da StickyContactBar do layout
 * (bottom-24; xl:static porque a barra some no desktop).
 */

import { useCallback, useMemo, useState } from "react";
import { Calendar, Check, Lock, Play, RefreshCw, Search, Timer } from "lucide-react";
import {
  RÓTULOS_ORIGEM,
  RÓTULOS_TIPO,
  diasCorridosAteProva,
  formatarDataProva,
  type Estudo,
  type OrigemQuestao,
  type TipoQuestao,
} from "@/lib/estudos";
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
}

export default function EstudosClient({ token, inicial }: Props) {
  const [dados, setDados] = useState<Estudo>(inicial);
  const [fase, setFase] = useState<Fase>(inicial.bloqueado ? "bloqueado" : "completo");

  // ── PIN de leitura: só em memória ──────────────────────────────────────
  const [pin, setPin] = useState("");
  const [pinErro, setPinErro] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  // ── Sessão de estudo: seleção e respostas só em memória ────────────────
  const [selecao, setSelecao] = useState<Record<string, number>>({});
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [filtroOrigem, setFiltroOrigem] = useState<OrigemQuestao | "todas">("todas");
  const [filtroTipo, setFiltroTipo] = useState<TipoQuestao | "todos">("todos");
  const [busca, setBusca] = useState("");
  // F1b: home ("banco" = lista de questões) · sessão zero-decisão · simulado.
  const [vista, setVista] = useState<"banco" | "estudar" | "simulado">("banco");

  const questoes = useMemo(() => (dados.bloqueado ? [] : dados.questoes), [dados]);

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

  const listaFiltrada = useMemo(() => {
    const termo = fold(busca.trim());
    return questoes.filter(
      (q) =>
        (filtroOrigem === "todas" || q.origem === filtroOrigem) &&
        (filtroTipo === "todos" || q.tipo === filtroTipo) &&
        (!termo || fold(q.enunciado).includes(termo))
    );
  }, [questoes, filtroOrigem, filtroTipo, busca]);

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
    return { respondidas, acertos, nOficial, acOficial, nDigitada, acDigitada, nGerada, acGerada };
  }, [questoes, respostas]);

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

  const responder = (questaoId: string) => {
    const escolhida = selecao[questaoId];
    if (escolhida === undefined) return;
    setRespostas((r) => ({ ...r, [questaoId]: escolhida }));
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
      <section className="flex min-h-[60vh] items-center bg-background px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-brand-primary">Não deu para carregar</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{erroMsg}</p>
          <button
            type="button"
            onClick={() => setFase("bloqueado")}
            className="mt-5 w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
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
      <section className="flex min-h-[60vh] items-center bg-background px-4 py-16">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-gold/15 text-brand-primary">
              <Lock size={26} />
            </span>
            <h1 className="mt-5 text-xl font-bold text-brand-primary">{curso.rotulo}</h1>
            {curso.contagens.questoes > 0 && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {curso.contagens.questoes} questões ingeridas
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
              className="mt-5 w-full rounded-xl border bg-muted px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.4em] text-foreground focus:border-brand-primary focus:outline-none disabled:opacity-50"
            />
            {pinErro && <p className="mt-2 text-sm font-medium text-rose-600">{pinErro}</p>}
            <button
              type="button"
              onClick={desbloquear}
              disabled={verificando}
              className="mt-4 w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {verificando ? "Verificando…" : "Desbloquear"}
            </button>
            <p className="mt-6 text-xs text-muted-foreground">
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
    <section className="bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl">
            {curso.rotulo}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {curso.contagens.questoes} questões ingeridas
          </p>
          {/* Dias corridos dependem do relógio local × servidor: diferença de
              fuso não deve virar erro de hidratação. */}
          {linhaProva && (
            <p
              suppressHydrationWarning
              className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-foreground"
            >
              <Calendar size={16} className="shrink-0 text-brand-gold" />
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
              <div className="rounded-xl border bg-card p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Dias p/ a prova
                </p>
                <p className="mt-1 text-xl font-bold text-brand-primary" suppressHydrationWarning>
                  {diasCorridosAteProva(dados.curso.dataProva) ?? "—"}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">dias corridos</span>
                </p>
              </div>
            )}
            <div className="rounded-xl border bg-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Revisões vencidas hoje
              </p>
              <p className="mt-1 text-xl font-bold text-brand-primary">
                {dados.painel?.vencidasHoje ?? dados.reviews?.length ?? 0}
                <span className="ml-1 text-xs font-medium text-muted-foreground">cards</span>
              </p>
            </div>
            <div className="rounded-xl border bg-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Cobertura do programa
              </p>
              <p className="mt-1 text-xl font-bold text-brand-primary">
                {dados.painel ? `${dados.painel.cobertura.comDerivado}/${dados.painel.cobertura.total}` : "—"}
                <span className="ml-1 text-xs font-medium text-muted-foreground">microtemas</span>
              </p>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <button
                type="button"
                onClick={() => setVista("estudar")}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
              >
                <Play size={15} /> Estudar agora
              </button>
              <button
                type="button"
                onClick={() => setVista("simulado")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-gold/60 px-3 py-2.5 text-sm font-bold text-brand-primary hover:bg-brand-gold/10"
              >
                <Timer size={15} /> Simulado
              </button>
            </div>
          </div>
        )}

        {/* Vista F1b: sessão zero-decisão ou simulado substituem o banco.
            O guard !dados.bloqueado estreita a union para o tipo completo. */}
        {vista === "estudar" && !dados.bloqueado ? (
          <div className="mt-6">
            <SessaoEstudo
              token={token}
              pin={pin}
              dados={dados}
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
              dados={dados}
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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no enunciado…"
              className="w-full rounded-xl border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none"
            />
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
                  ? "bg-brand-primary text-white"
                  : "border bg-card text-muted-foreground hover:text-brand-primary"
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
                      ? "bg-brand-primary text-white"
                      : "border bg-card text-muted-foreground hover:text-brand-primary"
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
                  ? "bg-brand-gold text-brand-dark"
                  : "border bg-card text-muted-foreground hover:text-brand-primary"
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
                      ? "bg-brand-gold text-brand-dark"
                      : "border bg-card text-muted-foreground hover:text-brand-primary"
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
              return (
                <article
                  key={q.id}
                  id={`questao-${indice}`}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-card p-4 shadow-sm scroll-mt-24",
                    respondida ? "border-brand-gold ring-1 ring-brand-gold/40" : "border-border"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-brand-primary/20 bg-brand-primary/5 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-brand-primary">
                      {RÓTULOS_ORIGEM[q.origem]}
                    </span>
                    <span className="rounded-full border border-brand-gold/40 bg-brand-gold/10 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-brand-dark">
                      {RÓTULOS_TIPO[q.tipo]}
                    </span>
                    {respondida && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-wide text-brand-gold">
                        <Check size={12} /> Respondida
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 whitespace-pre-line text-sm font-semibold leading-relaxed text-foreground">
                    {q.enunciado}
                  </p>

                  <div className="mt-3 flex flex-col gap-2">
                    {q.alternativas.map((alternativa, idx) => {
                      const eAEscolhida = escolhida === idx;
                      let classe = "border-border bg-card hover:border-brand-accent";
                      if (!respondida) {
                        if (eAEscolhida)
                          classe = "border-brand-primary bg-brand-primary/5 font-semibold ring-1 ring-brand-primary";
                      } else if (gabarito !== null && idx === gabarito) {
                        // Certa: verde em destaque.
                        classe = "border-emerald-600 bg-emerald-50 font-semibold text-emerald-900";
                      } else {
                        // Erradas: vermelhas; a escolhida errada ganha anel forte.
                        classe = cn(
                          "border-rose-300 bg-rose-50 text-rose-900",
                          eAEscolhida && "ring-2 ring-rose-500 font-semibold"
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
                      className="mt-3 self-start rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
                    >
                      Responder
                    </button>
                  ) : (
                    <div className="mt-3 flex flex-col gap-3">
                      {q.gabaritoOficial !== undefined && q.gabaritoOficial !== null ? (
                        <p className="text-sm font-bold text-emerald-700">
                          Gabarito oficial: {letra(q.gabaritoOficial)}
                        </p>
                      ) : q.gabaritoIA !== undefined && q.gabaritoIA !== null ? (
                        <p className="text-sm font-medium text-muted-foreground">
                          Gabarito IA — sem oficial: {letra(q.gabaritoIA)}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">
                          Sem gabarito (oficial ou IA) para esta questão.
                        </p>
                      )}
                      {q.explicacao && (
                        <div className="rounded-lg bg-muted p-3 text-sm leading-relaxed text-foreground">
                          {q.explicacao}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => irParaProxima(indice)}
                        disabled={indice === listaFiltrada.length - 1}
                        className="self-start rounded-xl border px-4 py-2 text-sm font-bold text-brand-primary transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        Próxima
                      </button>
                    </div>
                  )}

                  <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                    {q.provenance.tipo} · {q.provenance.ref} · {q.provenance.data}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
            <p className="font-semibold text-brand-primary">
              {questoes.length === 0
                ? "Nenhuma questão ingerida ainda"
                : "Nenhuma questão com esses filtros"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {questoes.length === 0
                ? "As questões aparecem aqui assim que a ingestão rodar no Zeno."
                : "Ajuste a busca ou volte para “Todas”/“Todos”."}
            </p>
          </div>
        )}

        {/* Painel de sessão — sticky bottom no mobile, acima da barra de
            contato do layout; estático no desktop (xl). */}
        <div className="sticky bottom-24 z-30 mt-8 xl:static">
          <div className="theme-card-surface rounded-2xl p-4 shadow-xl shadow-brand-dark/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <span className="font-bold text-brand-primary">
                  Acertos: {sessao.acertos}/{sessao.respondidas}
                </span>
                <span className="text-muted-foreground">
                  Oficial:{" "}
                  <strong className="text-foreground">
                    {sessao.nOficial < 1
                      ? "—"
                      : `${fmt1((sessao.acOficial / sessao.nOficial) * 100)}%`}
                  </strong>{" "}
                  (n={sessao.nOficial})
                  {sessao.nOficial >= 1 && ` ±${fmt1(margemBinomial(sessao.nOficial) * 100)}pp`}
                </span>
                <span className="text-muted-foreground">
                  Cursinho:{" "}
                  <strong className="text-foreground">
                    {sessao.nDigitada < 1
                      ? "—"
                      : `${fmt1((sessao.acDigitada / sessao.nDigitada) * 100)}%`}
                  </strong>{" "}
                  (n={sessao.nDigitada})
                  {sessao.nDigitada >= 1 && ` ±${fmt1(margemBinomial(sessao.nDigitada) * 100)}pp`}
                </span>
                <span className="text-muted-foreground">
                  Gerada:{" "}
                  <strong className="text-foreground">
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
                className="inline-flex items-center gap-2 self-start rounded-xl border px-3 py-2 text-xs font-bold text-brand-primary transition-colors hover:bg-muted sm:self-auto"
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
