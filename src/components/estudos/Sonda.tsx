"use client";

/**
 * Sonda — mini-simulado por temas (Fase 2 do Estudos v2).
 *
 * Rodada CURTA que toca todos os módulos da certificação e aponta onde doeu.
 * NÃO é simulado: sem relógio, sem prazo, sem countdown (C13/W5) — a amostra
 * (8 ou 16) não sustenta diagnóstico por tema, então o resumo entrega só os
 * números. "Evento, não percentual": módulo onde errou é EVENTO clicável
 * (contagem e n, sem cor por tema), nunca uma competência.
 *
 * Composição e sorteio são espelhos testáveis do motor do Zeno
 * (`src/lib/estudos.ts`): peso oficial por módulo, pool só de questão validada
 * (gerada nunca entra) e piso de acervo declarado quando falta.
 *
 * Rascunho/rodada: o contador local `zeno:est:sonda-rodada:<token>` gira a
 * rotação do excedente entre rodadas; a semente do embaralho é o relógio (o
 * sorteio é de verdade) — a reprodutibilidade fica nos testes das funções puras.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { Check, Radar, RefreshCw, RotateCcw, X } from "lucide-react";
import {
  acertoComMargem,
  embaralharComSemente,
  hojeLocalISO,
  montarSondaEstudo,
  postarSessao,
  type EstudoCompleto,
  type ItemSessaoPost,
  type Questao,
} from "@/lib/estudos";
import { cn } from "@/lib/utils";

/** "62,5" / "12,1" — uma casa, vírgula decimal (mesma régua do Zeno). */
function fmt1(x: number): string {
  return x.toFixed(1).replace(".", ",");
}

/** A/B/C/D… pelo índice da alternativa. */
function letra(idx: number): string {
  return String.fromCharCode(65 + idx);
}

interface Props {
  token: string;
  pin: string;
  dados: EstudoCompleto;
  aoFechar: (salvou: boolean) => void;
  /** Abre uma sessão só do módulo (clique no evento de erro do resumo). */
  aoEstudarTema: (moduloId: string) => void;
}

type Duracao = { minutos: number; questoes: number };
type Resultado = "certo" | "errado" | "nulo";

interface Feedback {
  questaoId: string;
  escolhida: number;
  gabarito: number | null;
  oficial: boolean;
  resultado: Resultado;
}

/** Contador local de rodadas — gira a rotação do excedente. Nunca é segredo. */
function proximaRodada(token: string): number {
  const chave = `zeno:est:sonda-rodada:${token}`;
  try {
    const atual = Number(localStorage.getItem(chave) ?? "0");
    const proxima = (Number.isFinite(atual) ? atual : 0) + 1;
    localStorage.setItem(chave, String(proxima));
    return proxima;
  } catch {
    return 0;
  }
}

export default function Sonda({ token, pin, dados, aoFechar, aoEstudarTema }: Props) {
  const sonda = dados.sonda;

  // microtema → módulo (arvoreTemas) e módulo → título. O agrupamento é do
  // backend; aqui só se lê.
  const moduloDoMicrotema = useMemo(() => {
    const m = new Map<string, string>();
    for (const mod of dados.arvoreTemas ?? []) {
      for (const g of mod.grupos) for (const mt of g.microtemas) m.set(mt.id, mod.id);
    }
    return m;
  }, [dados.arvoreTemas]);

  const nomeDoModulo = useMemo(() => {
    const m = new Map<string, string>();
    for (const mod of dados.arvoreTemas ?? []) m.set(mod.id, mod.titulo);
    return m;
  }, [dados.arvoreTemas]);

  const entradas = useMemo(() => {
    const vistaPorQuestao = new Map<string, string>();
    for (const r of dados.respondidas ?? []) {
      if (r.ultimaEm) vistaPorQuestao.set(r.questaoId, r.ultimaEm);
    }
    return dados.questoes.map((q) => ({
      questaoId: q.id,
      moduloId: q.microtemaPdId ? (moduloDoMicrotema.get(q.microtemaPdId) ?? "") : "",
      origem: q.origem,
      vistaEm: vistaPorQuestao.get(q.id),
    }));
  }, [dados.questoes, dados.respondidas, moduloDoMicrotema]);

  const questoesPorId = useMemo(
    () => new Map(dados.questoes.map((q) => [q.id, q])),
    [dados.questoes]
  );

  // Selos de acervo insuficiente independem da duração (só do pool e do piso):
  // a montagem com n=0 devolve exatamente `insuficientes`.
  const insuficientes = useMemo(() => {
    if (!sonda) return [];
    return montarSondaEstudo(entradas, sonda.pesos, 0, 0, [], sonda.pisoValidadas).insuficientes;
  }, [sonda, entradas]);

  const [fase, setFase] = useState<"escolha" | "rodada" | "resumo">("escolha");
  const [montada, setMontada] = useState<ReturnType<typeof montarSondaEstudo> | null>(null);
  const [indice, setIndice] = useState(0);
  const [selecao, setSelecao] = useState<number | null>(null);
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const inicioRef = useRef<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const itensResolvidos = useMemo(() => {
    if (!montada) return [];
    return montada.itens
      .map((it) => ({ ...it, questao: questoesPorId.get(it.questaoId) }))
      .filter(
        (it): it is { questaoId: string; moduloId: string; questao: Questao } => !!it.questao
      );
  }, [montada, questoesPorId]);

  const total = itensResolvidos.length;
  const atual = itensResolvidos[indice];

  const comecar = (duracao: Duracao) => {
    if (!sonda) return;
    const rodada = proximaRodada(token);
    const semente = Date.now() % 0xffffffff;
    const embaralhavel = embaralharComSemente(
      entradas.map((e) => e.questaoId),
      semente
    );
    const m = montarSondaEstudo(
      entradas,
      sonda.pesos,
      duracao.questoes,
      rodada,
      embaralhavel,
      sonda.pisoValidadas
    );
    // Todos os módulos com acervo insuficiente: os selos da escolha já
    // explicam; começar uma rodada vazia só criaria confusão.
    if (m.itens.length === 0) return;
    setMontada(m);
    setIndice(0);
    setSelecao(null);
    setResultados({});
    setFeedback(null);
    setSalvo(false);
    setErroSalvar(null);
    inicioRef.current = new Date().toISOString();
    setFase("rodada");
  };

  const responder = () => {
    if (!atual || selecao === null) return;
    const gabarito = atual.questao.gabaritoOficial ?? atual.questao.gabaritoIA;
    const resultado: Resultado =
      gabarito === undefined || gabarito === null
        ? "nulo"
        : selecao === gabarito
          ? "certo"
          : "errado";
    setResultados((r) => ({ ...r, [atual.questaoId]: resultado }));
    setFeedback({
      questaoId: atual.questaoId,
      escolhida: selecao,
      gabarito: gabarito ?? null,
      oficial: atual.questao.gabaritoOficial !== undefined && atual.questao.gabaritoOficial !== null,
      resultado,
    });
  };

  const proxima = () => {
    if (indice + 1 >= total) {
      setFase("resumo");
      return;
    }
    setIndice((i) => i + 1);
    setSelecao(null);
    setFeedback(null);
  };

  const gravar = useCallback(async () => {
    if (!montada || salvo) return;
    setSalvando(true);
    setErroSalvar(null);
    const itens: ItemSessaoPost[] = [];
    for (const it of itensResolvidos) {
      const resultado = resultados[it.questaoId];
      if (!resultado) continue;
      // Sonda não tem dica: nada de `usouDica` no item.
      itens.push({
        questaoId: it.questaoId,
        resultado,
        origem: it.questao.origem,
        tipo: it.questao.tipo,
      });
    }
    const inicio = inicioRef.current ?? new Date().toISOString();
    const fim = new Date();
    try {
      await postarSessao(
        token,
        pin,
        {
          id: crypto.randomUUID(),
          cursoId: dados.curso.id ?? dados.curso.cert,
          inicioEm: inicio,
          fimEm: fim.toISOString(),
          // Sem relógio: os minutos são o decorrido real, nunca um prazo.
          minutos: Math.max(1, Math.round((fim.getTime() - new Date(inicio).getTime()) / 60_000)),
          competenciaEm: hojeLocalISO(),
          itens,
        },
        false,
        "sonda"
      );
      setSalvo(true);
    } catch {
      setErroSalvar("Não consegui gravar a sessão da sonda — tente de novo.");
    } finally {
      setSalvando(false);
    }
  }, [montada, itensResolvidos, resultados, token, pin, dados.curso, salvo]);

  // ── Resumo: agregação por módulo (evento) + acumulado (vereditosTemas) ──
  const porModulo = useMemo(() => {
    if (!montada) return [];
    const mapa = new Map<
      string,
      { moduloId: string; qtd: number; certas: number; erradas: number; n: number }
    >();
    for (const c of montada.composicao) {
      mapa.set(c.moduloId, { moduloId: c.moduloId, qtd: c.qtd, certas: 0, erradas: 0, n: 0 });
    }
    for (const it of itensResolvidos) {
      const r = resultados[it.questaoId];
      if (!r) continue;
      const agg = mapa.get(it.moduloId);
      if (!agg) continue;
      agg.n++;
      if (r === "certo") agg.certas++;
      else if (r === "errado") agg.erradas++;
    }
    return [...mapa.values()];
  }, [montada, itensResolvidos, resultados]);

  const acertos = itensResolvidos.filter((it) => resultados[it.questaoId] === "certo").length;
  const respondidas = itensResolvidos.filter(
    (it) => resultados[it.questaoId] !== undefined
  ).length;

  // ── Sem config (cert sem PD/pesos) — porta desabilitada lá, guarda aqui ──
  if (!sonda) {
    return (
      <div className="rounded-2xl border bg-est-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-est-primary-ink">Sonda indisponível</h2>
        <p className="mt-2 text-sm text-est-fg-soft">
          O programa detalhado desta certificação ainda não foi ingerido.
        </p>
        <button
          type="button"
          onClick={() => aoFechar(false)}
          className="mt-5 rounded-xl border px-4 py-2.5 text-sm font-bold text-est-primary-ink hover:bg-est-sunken"
        >
          Voltar
        </button>
      </div>
    );
  }

  // ── Escolha: duas durações + fonte do peso + selos de acervo ────────────
  if (fase === "escolha") {
    return (
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => aoFechar(false)}
          className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-est-border px-3 py-2.5 text-xs font-bold text-est-fg-soft transition-colors hover:bg-est-sunken hover:text-est-fg"
        >
          Voltar
        </button>
        <h2 className="text-lg font-bold text-est-primary-ink">
          Sonda — mini-simulado por temas
        </h2>
        <p className="mt-1 text-sm text-est-fg-soft">
          Rodada curta que toca todos os módulos da certificação. Sem relógio, sem prazo.
        </p>

        <div className="mt-4 grid gap-2">
          {sonda.duracoes.map((d) => (
            <button
              key={d.minutos}
              type="button"
              onClick={() => comecar(d)}
              disabled={insuficientes.length === Object.keys(sonda.pesos).length}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-est-primary px-4 py-4 text-base font-bold text-est-primary-fg transition-colors hover:bg-est-primary/90 disabled:opacity-50"
            >
              <Radar size={18} /> Sonda {d.minutos} min · {d.questoes} questões
            </button>
          ))}
        </div>

        {/* G3: composição sem fonte é número sem unidade. */}
        <p className="mt-3 text-xs text-est-fg-soft">Pesos: {sonda.fonte}</p>

        {insuficientes.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {insuficientes.map((i) => (
              <p
                key={i.moduloId}
                className="rounded-lg border border-est-warning/40 bg-est-warning-soft px-3 py-2 text-xs font-medium text-est-warning"
              >
                {nomeDoModulo.get(i.moduloId) ?? i.moduloId} — acervo insuficiente: {i.validadas}{" "}
                {i.validadas === 1 ? "questão validada" : "questões validadas"}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Rodada: questão a questão, sem cronômetro NENHUM ────────────────────
  if (fase === "rodada" && montada && atual) {
    const q = atual.questao;
    const fb = feedback && feedback.questaoId === q.id ? feedback : null;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-est-primary-ink">
            {indice + 1}/{total} questões
          </p>
          <button
            type="button"
            onClick={() => setFase("escolha")}
            className="text-xs font-bold text-est-fg-soft hover:text-est-fg"
          >
            Sair da rodada
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-est-sunken">
          <div
            className="h-full rounded-full bg-est-primary transition-[width] duration-200 ease-out"
            style={{ width: `${total ? (indice / total) * 100 : 0}%` }}
          />
        </div>

        <article className="rounded-2xl border bg-est-card p-5 shadow-sm">
          <p className="text-sm font-semibold leading-relaxed text-est-fg">{q.enunciado}</p>
          <div className="mt-3 space-y-2">
            {q.alternativas.map((alt, i) => {
              const eAEscolhida = fb ? fb.escolhida === i : selecao === i;
              const classe = fb
                ? fb.gabarito === i
                  ? "border-est-positive bg-est-positive-soft font-semibold text-est-positive"
                  : fb.escolhida === i
                    ? "border-est-negative/50 bg-est-negative-soft text-est-negative ring-2 ring-est-negative font-semibold"
                    : "border-est-border bg-est-card text-est-fg opacity-70"
                : selecao === i
                  ? "border-est-primary bg-est-primary/5 font-semibold"
                  : "border-est-border bg-est-bg hover:border-est-primary/50";
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={eAEscolhida}
                  disabled={!!fb}
                  onClick={() => setSelecao(i)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm disabled:cursor-default",
                    classe
                  )}
                >
                  <span className="font-mono text-xs font-bold text-est-primary-ink">
                    {letra(i)}
                  </span>
                  <span className="text-est-fg">{alt}</span>
                </button>
              );
            })}
          </div>

          {fb ? (
            <div
              className={cn(
                "mt-4 rounded-xl border p-4",
                fb.resultado === "certo"
                  ? "border-est-positive/40 bg-est-positive-soft"
                  : fb.resultado === "errado"
                    ? "border-est-negative/40 bg-est-negative-soft"
                    : "border-est-border bg-est-sunken"
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm font-bold",
                  fb.resultado === "certo"
                    ? "text-est-positive"
                    : fb.resultado === "errado"
                      ? "text-est-negative"
                      : "text-est-fg-soft"
                )}
              >
                {fb.resultado === "certo" && (
                  <>
                    <Check size={16} /> Você acertou
                  </>
                )}
                {fb.resultado === "errado" && (
                  <>
                    <X size={16} /> Você errou
                  </>
                )}
                {fb.resultado === "nulo" && <>Sem gabarito — resposta registrada como nula</>}
              </p>
              {fb.gabarito !== null && (
                <p className="mt-1.5 text-sm font-bold text-est-positive">
                  {fb.oficial ? "Gabarito oficial: " : "Gabarito IA — sem oficial: "}
                  {letra(fb.gabarito)}
                </p>
              )}
              {fb.resultado === "errado" && (
                <p className="mt-0.5 text-sm font-medium text-est-negative">
                  Sua resposta: {letra(fb.escolhida)}
                </p>
              )}
              {fb.resultado !== "nulo" && q.explicacao && (
                <div className="mt-2.5 rounded-lg bg-est-card p-3 text-sm leading-relaxed text-est-fg">
                  {q.explicacao}
                </div>
              )}
              <button
                type="button"
                onClick={proxima}
                className="mt-3 w-full rounded-xl bg-est-primary px-4 py-2.5 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90"
              >
                {indice + 1 >= total ? "Ver resumo da rodada" : "Próxima"}
              </button>
            </div>
          ) : (
            selecao !== null && (
              <button
                type="button"
                onClick={responder}
                className="mt-4 w-full rounded-xl bg-est-primary px-4 py-2.5 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90"
              >
                Responder
              </button>
            )
          )}
        </article>
      </div>
    );
  }

  // ── Resumo: global rotulado "desempenho desta rodada" + eventos + acumulado
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl border bg-est-card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-est-primary-ink">Rodada concluída</h2>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-est-fg-soft">
          Desempenho desta rodada
        </p>
        <p className="mt-1 text-lg font-bold text-est-fg">
          {respondidas >= 1 ? acertoComMargem(acertos, respondidas) : "—"}
        </p>
        {/* Composição por módulo: quantas questões saíram de cada um — só
            contagem, sem acertos (placar por tema é diagnóstico que a amostra
            não sustenta; o "Onde doeu" abaixo é o evento). */}
        {porModulo.length > 0 && (
          <p className="mt-2 text-xs text-est-fg-soft">
            {porModulo
              .map(
                (m) =>
                  `${nomeDoModulo.get(m.moduloId) ?? m.moduloId} — ${m.qtd} ${m.qtd === 1 ? "questão" : "questões"}`
              )
              .join(" · ")}
          </p>
        )}
      </div>

      {porModulo.length > 0 && (
        <div className="rounded-2xl border bg-est-card p-5 shadow-sm">
          <h3 className="text-sm font-bold text-est-primary-ink">Onde doeu</h3>
          <p className="mt-0.5 text-xs text-est-fg-soft">
            Evento da rodada — amostra curta, não é diagnóstico por tema.
          </p>
          <div className="mt-3 space-y-2">
            {porModulo.map((m) => {
              const nome = nomeDoModulo.get(m.moduloId) ?? m.moduloId;
              if (m.erradas > 0) {
                return (
                  <button
                    key={m.moduloId}
                    type="button"
                    onClick={() => aoEstudarTema(m.moduloId)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-est-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-est-sunken"
                  >
                    <span className="min-w-0 flex-1 font-medium text-est-fg">
                      {nome} — {m.erradas} {m.erradas === 1 ? "errada" : "erradas"} de {m.n} · n=
                      {m.n}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-est-primary-ink">
                      Estudar módulo
                    </span>
                  </button>
                );
              }
              return (
                <p
                  key={m.moduloId}
                  className="rounded-xl border border-est-border px-3 py-2.5 text-sm text-est-fg-soft"
                >
                  {nome} — {m.certas}/{m.n} certas
                </p>
              );
            })}
          </div>
        </div>
      )}

      {dados.vereditosTemas && dados.vereditosTemas.length > 0 && (
        <div className="rounded-2xl border bg-est-card p-5 shadow-sm">
          <h3 className="text-sm font-bold text-est-primary-ink">Acumulado por tema</h3>
          <p className="mt-0.5 text-xs text-est-fg-soft">
            Só vira “estude” quando o motor manda (amostra suficiente); fora disso é evento.
          </p>
          <div className="mt-3 space-y-2">
            {dados.vereditosTemas.map((v) => {
              const nome = nomeDoModulo.get(v.moduloId) ?? v.moduloId;
              if (v.estado === "estude" && v.wilsonSuperior !== null) {
                return (
                  <p key={v.moduloId} className="text-sm font-medium text-est-fg">
                    Estude {nome} — n={v.unicas} únicas · topo de Wilson{" "}
                    {fmt1(v.wilsonSuperior * 100)}% {"<"} alvo {fmt1(sonda.alvo * 100)}%
                  </p>
                );
              }
              return (
                <p key={v.moduloId} className="text-sm text-est-fg-soft">
                  Módulo {nome}: {v.unicas} questões únicas — amostra insuficiente para veredito
                </p>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-est-fg-soft">Alvo: {sonda.alvoFonte}</p>
        </div>
      )}

      {erroSalvar && (
        <p className="rounded-xl border border-est-negative/40 bg-est-negative-soft p-3 text-sm font-medium text-est-negative">
          {erroSalvar}
        </p>
      )}

      <div className="flex gap-2 pb-24 xl:pb-0">
        <button
          type="button"
          onClick={() => aoFechar(salvo)}
          className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold text-est-fg-soft hover:bg-est-sunken"
        >
          {salvo ? "Voltar" : "Sair sem gravar"}
        </button>
        <button
          type="button"
          onClick={gravar}
          disabled={salvando || salvo}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-est-primary px-4 py-2.5 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90 disabled:opacity-50"
        >
          {salvando ? (
            <>
              <RefreshCw size={15} className="animate-spin" aria-hidden /> Gravando…
            </>
          ) : salvo ? (
            <>
              <Check size={15} /> Gravado
            </>
          ) : (
            <>
              <RotateCcw size={15} /> Gravar sessão da sonda
            </>
          )}
        </button>
      </div>
      {salvo && (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-1.5 text-xs font-bold text-est-positive"
        >
          <Check size={12} aria-hidden /> Sessão da sonda gravada.
        </p>
      )}
    </div>
  );
}
