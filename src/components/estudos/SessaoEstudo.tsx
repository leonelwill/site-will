"use client";

/**
 * Sessão "Estudar agora" — fila zero-decisão (R3 §N2, aprovada na R6).
 *
 * Fila (mesma `montarFilaEstudo` da lib, espelho de
 * zeno_cloud/src/lib/estudos/fila.ts): SRS vencidas (due mais antigo primeiro)
 * → erradas da última sessão → novas do microtema menos coberto; orçamento em
 * MINUTOS fecha em ITEM inteiro (nunca corta no meio de um raciocínio).
 *
 * Rascunho retomável em localStorage (`zeno:est:sessao:<token>`) — dado
 * pessoal do dispositivo, não é segredo (o PIN continua só em memória).
 * Finalizar → POST /api/estudos/<token>/sessao (grava + aplica revisões SM-2
 * com clamp no Zeno; aqui a resposta é só certo/errado).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CircleHelp, RotateCcw, ThumbsDown, X } from "lucide-react";
import {
  RÓTULOS_ORIGEM,
  RÓTULOS_TIPO,
  agendarReteste,
  dicaDaQuestao,
  embaralharComSemente,
  hojeLocalISO,
  intercalarPorMicrotema,
  montarFilaEstudo,
  postarFeedback,
  postarSessao,
  type EstudoCompleto,
  type ItemFilaEstudo,
  type ItemSessaoPost,
  type Questao,
} from "@/lib/estudos";
import { cn } from "@/lib/utils";

const ORCAMENTOS = [20, 30, 45, 60];

interface Rascunho {
  inicioEm: string;
  indice: number;
  resultados: Record<string, "certo" | "errado" | "nulo">;
  /** Questões respondidas com a dica aberta (Carta 3: declara na sessão). */
  dicas?: Record<string, true>;
}

/** Feedback pós-resposta de questão — o avanço espera o "Próxima". */
interface Feedback {
  questaoId: string;
  resultado: "certo" | "errado" | "nulo";
  escolhida: number;
  gabarito: number | null;
  gabaritoEhOficial: boolean;
}

interface Props {
  token: string;
  pin: string;
  dados: EstudoCompleto;
  aoFechar: (salvou: boolean) => void;
  /** Minutos pedidos na porta (home) — sem ela, 20. */
  orcamentoInicial?: number;
  /**
   * Escopo do rascunho (ex.: módulo da sonda). SEM isto, sessão cheia e
   * sessão de módulo compartilham a MESMA chave de retomada — rascunho de uma
   * vaza pra dentro da outra (índice fora da fila, início velho).
   */
  escopoRascunho?: string;
}

export default function SessaoEstudo({ token, pin, dados, aoFechar, orcamentoInicial, escopoRascunho }: Props) {
  const chaveRascunho = `zeno:est:sessao:${token}${escopoRascunho ? `:${escopoRascunho}` : ""}`;
  const chaveAvisoInterleave = `zeno:est:aviso-interleave:${token}`;
  const [orcamento, setOrcamento] = useState(orcamentoInicial ?? 20);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [retomado, setRetomado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [resumo, setResumo] = useState<{
    minutos: number;
    itens: number;
    acertos: number;
    comDica: number;
    retestes: number;
    retidos: number;
  } | null>(null);
  const [selecaoQuestao, setSelecaoQuestao] = useState<number | null>(null);
  /** Feedback da questão respondida — enquanto ativo, o avanço espera "Próxima". */
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  /** Thumbs-down enviado nesta tela (feedback só p/ geradas). */
  const [rejeitadaLocal, setRejeitadaLocal] = useState<Record<string, true>>({});
  // Cards virados na tela (revela o verso SEM avançar — só Errei/Acertei avançam).
  const [versosAbertos, setVersosAbertos] = useState<Set<string>>(new Set());
  /**
   * Itens de RETESTE de recuperação (recall livre, sem alternativas) inseridos
   * na fila viva — o rótulo `recall: true` só existe no POST/resumo, não no
   * rascunho (reteste é evento da sessão ao vivo, não estado persistido).
   */
  const [recallLocal, setRecallLocal] = useState<Record<string, true>>({});
  /** "Rever este ponto" já agendado por questão (não clica de novo). */
  const [reverAgendado, setReverAgendado] = useState<Record<string, true>>({});
  /** Aviso de interleaving dispensável — um clique some (localStorage por token). */
  const [avisoInterleave, setAvisoInterleave] = useState(true);

  // Retomada: rascunho não finalizado existe → usa; senão nasce agora.
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(chaveRascunho);
      if (bruto) {
        setRascunho(JSON.parse(bruto));
        setRetomado(true);
      }
    } catch {
      /* localStorage indisponível: sessão só em memória */
    }
    if (!rascunho && !retomado) {
      setRascunho({ inicioEm: new Date().toISOString(), indice: 0, resultados: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aviso de interleaving: dispensado uma vez por token.
  useEffect(() => {
    try {
      if (localStorage.getItem(chaveAvisoInterleave)) setAvisoInterleave(false);
    } catch {
      /* localStorage indisponível: aviso só em memória */
    }
  }, [chaveAvisoInterleave]);

  const dispensarAvisoInterleave = useCallback(() => {
    setAvisoInterleave(false);
    try {
      localStorage.setItem(chaveAvisoInterleave, "1");
    } catch {
      /* ok */
    }
  }, [chaveAvisoInterleave]);

  const fila = useMemo(
    () =>
      montarFilaEstudo(
        dados.cards ?? [],
        dados.reviews ?? [],
        dados.questoes,
        (dados.erradasRecentes ?? []).map((e) => e.questaoId),
        dados.microtemaMenosCoberto,
        orcamento
      ),
    [dados, orcamento]
  );

  // Fila VIVA: a montada passa pelo interleaving por microtema (espelho do
  // Zeno) e ganha os retestes de recuperação ao longo da sessão. Ao retomar
  // (ou trocar o orçamento antes de responder), re-deriva SEM retestes
  // pendentes — reteste é evento da sessão ao vivo, não estado persistido.
  const [filaViva, setFilaViva] = useState<ItemFilaEstudo[]>(() =>
    intercalarPorMicrotema(fila.itens)
  );
  useEffect(() => {
    setFilaViva(intercalarPorMicrotema(fila.itens));
  }, [fila]);

  // Rascunho novo no localStorage quando a fila muda e não há retomada.
  useEffect(() => {
    if (!retomado && rascunho) {
      try {
        localStorage.setItem(chaveRascunho, JSON.stringify(rascunho));
      } catch {
        /* só em memória */
      }
    }
  }, [rascunho, retomado, chaveRascunho]);

  const itens = filaViva;
  const total = itens.length;
  // Reteste é evento da sessão ao vivo: ao retomar, a fila re-deriva sem os
  // retestes que existiam, então o índice gravado pode passar do novo total —
  // clampa (a fila encolheu, não o usuário andou para trás).
  const indice = Math.min(rascunho?.indice ?? 0, total);
  const atual = itens[indice];
  const respondidos = rascunho ? Object.keys(rascunho.resultados).length : 0;

  /** Grava o resultado no rascunho; `avancar=false` só na questão (o avanço
   *  espera o "Próxima" do feedback — registrar não é avançar às cegas). */
  const registrar = useCallback(
    (id: string, resultado: "certo" | "errado" | "nulo", avancar = true) => {
      setRascunho((r) => {
        if (!r) return r;
        const novo = {
          ...r,
          resultados: { ...r.resultados, [id]: resultado },
          indice: avancar ? Math.min(r.indice + 1, total) : r.indice,
        };
        try {
          localStorage.setItem(chaveRascunho, JSON.stringify(novo));
        } catch {
          /* só em memória */
        }
        return novo;
      });
    },
    [chaveRascunho, total]
  );

  /** Dica aberta para a questão — marca no rascunho (vira usouDica no POST). */
  const marcarDica = useCallback(
    (id: string) => {
      setRascunho((r) => {
        if (!r) return r;
        const novo = { ...r, dicas: { ...(r.dicas ?? {}), [id]: true as const } };
        try {
          localStorage.setItem(chaveRascunho, JSON.stringify(novo));
        } catch {
          /* só em memória */
        }
        return novo;
      });
    },
    [chaveRascunho]
  );

  const avancarFeedback = useCallback(() => {
    setFeedback(null);
    setSelecaoQuestao(null);
    setRascunho((r) => {
      if (!r) return r;
      const novo = { ...r, indice: Math.min(r.indice + 1, total) };
      try {
        localStorage.setItem(chaveRascunho, JSON.stringify(novo));
      } catch {
        /* só em memória */
      }
      return novo;
    });
  }, [chaveRascunho, total]);

  /** Candidatas a reteste do MESMO microtema: fora da fila, sem resposta,
   *  nunca a própria questão errada. O CALLER filtra — o espelho não acopla. */
  const candidatasRecall = useCallback(
    (questao: Questao): Questao[] => {
      const naFila = new Set(
        itens.map((it) => it.questao?.id).filter((id): id is string => !!id)
      );
      return dados.questoes.filter(
        (q) =>
          !!q.microtemaPdId &&
          q.microtemaPdId === questao.microtemaPdId &&
          q.id !== questao.id &&
          !naFila.has(q.id) &&
          !rascunho?.resultados[q.id]
      );
    },
    [itens, dados.questoes, rascunho]
  );

  /** Agenda um recall na fila viva; devolve se entrou (senão, fila intocada). */
  const agendarRecall = useCallback(
    (questao: Questao, posicaoErro: number, distancia: number): boolean => {
      const candidatos = embaralharComSemente(
        candidatasRecall(questao).map(
          (q): ItemFilaEstudo => ({
            tipo: "questao",
            questao: q,
            microtemaPdId: q.microtemaPdId,
          })
        ),
        Date.now()
      );
      const { fila: nova, inserido } = agendarReteste(itens, posicaoErro, candidatos, distancia);
      if (!inserido) return false;
      setFilaViva(nova);
      const id = inserido.questao?.id;
      if (id) setRecallLocal((r) => ({ ...r, [id]: true }));
      return true;
    },
    [itens, candidatasRecall]
  );

  const finalizar = useCallback(async () => {
    if (!rascunho || itens.length === 0) {
      aoFechar(false);
      return;
    }
    setSalvando(true);
    setErroSalvar(null);
    const fimEm = new Date().toISOString();
    const minutos = Math.max(
      1,
      Math.round((Date.now() - new Date(rascunho.inicioEm).getTime()) / 60_000)
    );
    const postItens: ItemSessaoPost[] = [];
    let acertos = 0;
    let comDica = 0;
    let retestes = 0;
    let retidos = 0;
    for (const item of itens) {
      const id = item.tipo === "card" ? item.card?.id : item.questao?.id;
      if (!id) continue;
      const resultado = rascunho.resultados[id];
      if (!resultado) continue;
      if (resultado === "certo") acertos++;
      if (item.tipo === "card") {
        postItens.push({ cardId: id, resultado });
      } else if (item.questao) {
        const usouDica = !!rascunho.dicas?.[id];
        if (usouDica) comDica++;
        const ehRecall = !!recallLocal[id];
        if (ehRecall) {
          retestes++;
          if (resultado === "certo") retidos++;
        }
        postItens.push({
          questaoId: id,
          resultado,
          origem: item.questao.origem,
          tipo: item.questao.tipo,
          ...(ehRecall ? { recall: true as const } : {}),
          ...(usouDica ? { usouDica: true } : {}),
        });
      }
    }
    try {
      await postarSessao(token, pin, {
        id: crypto.randomUUID(),
        cursoId: dados.curso.id ?? `${dados.curso.cert}`,
        inicioEm: rascunho.inicioEm,
        fimEm,
        minutos,
        competenciaEm: hojeLocalISO(),
        itens: postItens,
      });
      try {
        localStorage.removeItem(chaveRascunho);
      } catch {
        /* ok */
      }
      setResumo({ minutos, itens: postItens.length, acertos, comDica, retestes, retidos });
    } catch {
      setErroSalvar("Não consegui gravar a sessão — ela segue salva aqui; tente de novo.");
    } finally {
      setSalvando(false);
    }
  }, [rascunho, itens, token, pin, dados.curso, chaveRascunho, aoFechar, recallLocal]);

  // ── Resumo pós-POST ────────────────────────────────────────────────────
  if (resumo) {
    return (
      <div className="rounded-2xl border bg-est-card p-6 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-est-positive-soft text-est-positive">
          <Check size={24} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-est-primary-ink">Sessão gravada</h2>
        <p className="mt-2 text-sm text-est-fg-soft">
          {resumo.itens} itens · {resumo.acertos} certos · {resumo.minutos} min (competência de hoje)
          {resumo.comDica > 0 && ` · ${resumo.comDica} com dica`}
        </p>
        {resumo.retestes > 0 && (
          <p className="mt-1 text-sm text-est-fg-soft">
            {resumo.retestes} {resumo.retestes === 1 ? "reteste" : "retestes"} · {resumo.retidos}{" "}
            {resumo.retidos === 1 ? "retido" : "retidos"}
          </p>
        )}
        <p className="mt-2 text-xs text-est-fg-soft">
          Revisões agendadas pelo SM-2.
        </p>
        <button
          type="button"
          onClick={() => aoFechar(true)}
          className="mt-5 w-full rounded-xl bg-est-primary px-4 py-3 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border bg-est-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-est-primary-ink">Nada vencido hoje</h2>
        <p className="mt-2 text-sm text-est-fg-soft">
          Sem revisões vencidas, erradas pendentes ou cards novos dentro do orçamento.
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

  const cardAtual = atual?.tipo === "card" ? atual.card : null;
  const questaoAtual = atual?.tipo === "questao" ? atual.questao : null;
  const versoAberto = cardAtual ? versosAbertos.has(cardAtual.id) : false;
  // Feedback vale só para a questão que o originou (estado volátil por item).
  const feedbackAtivo = !!(
    feedback &&
    questaoAtual &&
    feedback.questaoId === questaoAtual.id
  );
  const dicaAberta = !!(questaoAtual && rascunho?.dicas?.[questaoAtual.id]);
  const ehRecall = !!(questaoAtual && recallLocal[questaoAtual.id]);
  const temExplicacaoPorAlternativa = !!questaoAtual?.explicacaoPorAlternativa?.length;

  return (
    <div className="space-y-4">
      {avisoInterleave && (
        <div className="flex items-start gap-2 rounded-xl border border-est-warning/40 bg-est-warning-soft px-3 py-2.5 text-xs text-est-warning">
          <span className="flex-1 leading-relaxed">
            A mistura de temas é intencional (interleaving) — a queda de fluência no meio da
            sessão é esperada.
          </span>
          <button
            type="button"
            onClick={dispensarAvisoInterleave}
            aria-label="Dispensar aviso"
            className="shrink-0 rounded-lg p-1 hover:bg-est-warning/10"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Progresso + orçamento */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-est-primary-ink">
          {respondidos}/{total} itens · {fila.minutos} min estimados
          {retomado && <span className="ml-2 text-xs font-medium text-est-primary-ink">retomada</span>}
        </p>
        {!retomado && respondidos === 0 && (
          <label className="flex items-center gap-1 text-xs text-est-fg-soft">
            Orçamento:
            <select
              value={orcamento}
              onChange={(e) => setOrcamento(Number(e.target.value))}
              className="rounded-lg border bg-est-card px-2 py-1 text-xs font-bold text-est-fg"
            >
              {ORCAMENTOS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-est-sunken">
        <div
          className="h-full rounded-full bg-est-primary transition-[width] duration-200 ease-out"
          style={{ width: `${total ? (respondidos / total) * 100 : 0}%` }}
        />
      </div>

      {/* Item atual */}
      {cardAtual && (
        <article className="rounded-2xl border bg-est-card p-5 shadow-sm">
          {!versoAberto ? (
            <>
              <p className="text-sm font-semibold leading-relaxed text-est-fg">{cardAtual.frente}</p>
              <button
                type="button"
                onClick={() =>
                  setVersosAbertos((s) => new Set(s).add(cardAtual.id))
                }
                className="mt-4 w-full rounded-xl border border-est-primary/60 px-4 py-2.5 text-sm font-bold text-est-primary-ink hover:bg-est-primary/10"
              >
                Virar card
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-est-fg-soft">{cardAtual.frente}</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-est-fg">{cardAtual.verso}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => registrar(cardAtual.id, "errado")}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-est-negative/50 bg-est-negative-soft px-4 py-2.5 text-sm font-bold text-est-negative hover:bg-est-negative-soft"
                >
                  <X size={15} /> Errei
                </button>
                <button
                  type="button"
                  onClick={() => registrar(cardAtual.id, "certo")}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-est-positive/50 bg-est-positive-soft px-4 py-2.5 text-sm font-bold text-est-positive hover:bg-est-positive-soft"
                >
                  <Check size={15} /> Acertei
                </button>
              </div>
            </>
          )}
        </article>
      )}

      {questaoAtual && (
        <article className="rounded-2xl border bg-est-card p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-est-primary/10 px-2 py-0.5 text-est-primary-ink">
              {RÓTULOS_ORIGEM[questaoAtual.origem]}
            </span>
            <span className="rounded-full bg-est-sunken px-2 py-0.5 text-est-fg-soft">
              {RÓTULOS_TIPO[questaoAtual.tipo]}
            </span>
            {ehRecall && (
              <span className="rounded-full bg-est-warning/15 px-2 py-0.5 text-est-warning">
                Reteste de recuperação
              </span>
            )}
            {(() => {
              // (?) só quando há o que mostrar (dica escrita ou microtema do PD)
              // e a resposta ainda não saiu — depois do feedback não existe dúvida.
              const dica = dicaDaQuestao(questaoAtual, dados.microtemas);
              if (!dica || feedbackAtivo || ehRecall) return null;
              if (dicaAberta) return null;
              return (
                <button
                  type="button"
                  onClick={() => marcarDica(questaoAtual.id)}
                  className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-full border border-est-primary/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-est-fg hover:bg-est-primary/10"
                >
                  <CircleHelp size={12} /> Dica
                </button>
              );
            })()}
          </div>
          {(() => {
            const dica = dicaDaQuestao(questaoAtual, dados.microtemas);
            if (!dica || !dicaAberta) return null;
            return (
              <div className="mb-3 rounded-xl border border-est-primary/50 bg-est-primary/10 p-3 text-sm">
                {dica.dica && (
                  <p className="font-medium leading-relaxed text-est-fg">{dica.dica}</p>
                )}
                {dica.microtema && (
                  <p className="mt-1 text-xs text-est-fg-soft">
                    Microtema do PD: {dica.microtema}
                  </p>
                )}
              </div>
            );
          })()}
          <p className="text-sm font-semibold leading-relaxed text-est-fg">{questaoAtual.enunciado}</p>
          {ehRecall ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => registrar(questaoAtual.id, "errado")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-est-negative/50 bg-est-negative-soft px-4 py-2.5 text-sm font-bold text-est-negative hover:bg-est-negative-soft"
              >
                <X size={15} /> Não lembrei
              </button>
              <button
                type="button"
                onClick={() => registrar(questaoAtual.id, "certo")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-est-positive/50 bg-est-positive-soft px-4 py-2.5 text-sm font-bold text-est-positive hover:bg-est-positive-soft"
              >
                <Check size={15} /> Lembrei
              </button>
            </div>
          ) : (
            <>
          <div className="mt-3 space-y-2">
            {questaoAtual.alternativas.map((alt, i) => {
              const eAEscolhida = feedbackAtivo
                ? feedback.escolhida === i
                : selecaoQuestao === i;
              const classe = feedbackAtivo
                ? feedback.gabarito === i
                  ? // Certa: verde em destaque.
                    "border-est-positive bg-est-positive-soft font-semibold text-est-positive"
                  : feedback.escolhida === i
                    ? // A escolhida errada: vermelha com anel forte.
                      "border-est-negative/50 bg-est-negative-soft text-est-negative ring-2 ring-est-negative font-semibold"
                    : "border-est-border bg-est-card text-est-fg opacity-70"
                : selecaoQuestao === i
                  ? "border-est-primary bg-est-primary/5 font-semibold"
                  : "border-est-border bg-est-bg hover:border-est-primary/50";
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={eAEscolhida}
                  disabled={feedbackAtivo}
                  onClick={() => setSelecaoQuestao(i)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm disabled:cursor-default",
                    classe
                  )}
                >
                  <span className="font-mono text-xs font-bold text-est-primary-ink">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-est-fg">{alt}</span>
                </button>
              );
            })}
          </div>
          {feedbackAtivo ? (
            <div
              className={cn(
                "mt-4 rounded-xl border p-4",
                feedback.resultado === "certo"
                  ? "border-est-positive/40 bg-est-positive-soft"
                  : feedback.resultado === "errado"
                    ? "border-est-negative/40 bg-est-negative-soft"
                    : "border-est-border bg-est-sunken"
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm font-bold",
                  feedback.resultado === "certo"
                    ? "text-est-positive"
                    : feedback.resultado === "errado"
                      ? "text-est-negative"
                      : "text-est-fg-soft"
                )}
              >
                {feedback.resultado === "certo" && <><Check size={16} /> Você acertou</>}
                {feedback.resultado === "errado" && <><X size={16} /> Você errou</>}
                {feedback.resultado === "nulo" && <>Sem gabarito — resposta registrada como nula</>}
              </p>
              {feedback.gabarito !== null && (
                <p className="mt-1.5 text-sm font-bold text-est-positive">
                  {feedback.gabaritoEhOficial
                    ? "Gabarito oficial: "
                    : "Gabarito IA — sem oficial: "}
                  {String.fromCharCode(65 + feedback.gabarito)}
                </p>
              )}
              {feedback.resultado === "errado" && (
                <p className="mt-0.5 text-sm font-medium text-est-negative">
                  Sua resposta: {String.fromCharCode(65 + feedback.escolhida)}
                </p>
              )}
              {feedback.resultado !== "nulo" && temExplicacaoPorAlternativa && (
                <ExplicacaoPorAlternativa
                  alternativas={questaoAtual.alternativas}
                  explicacoes={questaoAtual.explicacaoPorAlternativa!}
                  escolhida={feedback.escolhida}
                  gabarito={feedback.gabarito}
                />
              )}
              {feedback.resultado !== "nulo" &&
                !temExplicacaoPorAlternativa &&
                questaoAtual.explicacao && (
                  <div className="mt-2.5 rounded-lg bg-est-card p-3 text-sm leading-relaxed text-est-fg">
                    {questaoAtual.explicacao}
                  </div>
                )}
              {feedback.resultado === "errado" &&
                !temExplicacaoPorAlternativa &&
                !questaoAtual.explicacao && (
                  <p className="mt-2 text-xs text-est-fg-soft">
                    Sem explicação disponível para esta questão.
                  </p>
                )}
              {feedback.resultado === "errado" &&
                (reverAgendado[questaoAtual.id] ? (
                  <p className="mt-2 text-xs font-medium text-est-fg-soft">
                    Rever este ponto agendado ✓ — volta no fim da sessão.
                  </p>
                ) : candidatasRecall(questaoAtual).length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (agendarRecall(questaoAtual, indice, itens.length)) {
                        setReverAgendado((r) => ({ ...r, [questaoAtual.id]: true }));
                      }
                    }}
                    className="mt-2 inline-flex items-center gap-1 self-start text-xs font-bold text-est-primary-ink hover:underline"
                  >
                    <RotateCcw size={13} /> Rever este ponto
                  </button>
                ) : null)}
              {questaoAtual.origem === "gerada" &&
                (rejeitadaLocal[questaoAtual.id] ? (
                  <p className="mt-2 text-xs font-medium text-est-fg-soft">
                    Questão reportada — sai do simulado e da fila.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      postarFeedback(token, pin, questaoAtual.id)
                        .then(() => setRejeitadaLocal((r) => ({ ...r, [questaoAtual.id]: true })))
                        .catch(() => {
                          /* silencioso: fica disponível para tentar de novo */
                        });
                    }}
                    className="mt-2 inline-flex items-center gap-1 self-start text-xs font-bold text-est-negative hover:underline"
                  >
                    <ThumbsDown size={13} /> Reportar questão gerada
                  </button>
                ))}
              <button
                type="button"
                onClick={() =>
                  indice + 1 >= total ? finalizar() : avancarFeedback()
                }
                className="mt-3 w-full rounded-xl bg-est-primary px-4 py-2.5 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90"
              >
                {indice + 1 >= total ? "Última — gravar sessão" : "Próxima"}
              </button>
            </div>
          ) : (
            selecaoQuestao !== null && (
              <button
                type="button"
                onClick={() => {
                  const gabaritoOficial = questaoAtual.gabaritoOficial;
                  const gabaritoIA = questaoAtual.gabaritoIA;
                  const gabarito = gabaritoOficial ?? gabaritoIA;
                  const resultado =
                    gabarito === undefined || gabarito === null
                      ? "nulo"
                      : selecaoQuestao === gabarito
                        ? "certo"
                        : "errado";
                  setFeedback({
                    questaoId: questaoAtual.id,
                    resultado,
                    escolhida: selecaoQuestao,
                    gabarito: gabarito ?? null,
                    gabaritoEhOficial: gabaritoOficial !== undefined && gabaritoOficial !== null,
                  });
                  // Registra SEM avançar: o avanço é decisão do "Próxima".
                  registrar(questaoAtual.id, resultado, false);
                  // Erro em questão: agenda reteste de recuperação 3 itens à frente.
                  if (resultado === "errado") agendarRecall(questaoAtual, indice, 3);
                }}
                className="mt-4 w-full rounded-xl bg-est-primary px-4 py-2.5 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90"
              >
                Responder
              </button>
            )
          )}
            </>
          )}
        </article>
      )}

      {erroSalvar && (
        <p className="rounded-xl border border-est-negative/40 bg-est-negative-soft p-3 text-sm font-medium text-est-negative">
          {erroSalvar}
        </p>
      )}

      <div className="flex gap-2 pb-24 xl:pb-0">
        <button
          type="button"
          onClick={() => aoFechar(false)}
          className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold text-est-fg-soft hover:bg-est-sunken"
        >
          Pausar
        </button>
        <button
          type="button"
          onClick={finalizar}
          disabled={salvando}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-est-primary px-4 py-2.5 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90 disabled:opacity-50"
        >
          <RotateCcw size={15} /> {salvando ? "Gravando…" : "Finalizar e gravar"}
        </button>
      </div>
    </div>
  );
}

/**
 * Explicação por alternativa (F3): abre a ESCOLHIDA e a CORRETA (se distintas);
 * os demais distratores ficam recolhidos em `<details>`. Só é usada quando
 * `questao.explicacaoPorAlternativa` existe — sem o campo, o feedback mantém a
 * `explicacao` única de sempre.
 */
function ExplicacaoPorAlternativa({
  alternativas,
  explicacoes,
  escolhida,
  gabarito,
}: {
  alternativas: string[];
  explicacoes: string[];
  escolhida: number | null;
  gabarito: number | null;
}) {
  const abertas: number[] = [];
  if (escolhida !== null && escolhida !== gabarito) abertas.push(escolhida);
  if (gabarito !== null) abertas.push(gabarito);
  const recolhidas = alternativas.map((_, i) => i).filter((i) => !abertas.includes(i));

  return (
    <div className="mt-2.5 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-est-fg-soft">
        Por que cada alternativa
      </p>
      {abertas.map((i) => (
        <div key={i} className="rounded-lg bg-est-card p-3 text-sm leading-relaxed text-est-fg">
          <p className="font-bold text-est-fg">
            {String.fromCharCode(65 + i)} — {gabarito === i ? "correta" : "sua resposta"}
          </p>
          <p className="mt-1">{explicacoes[i] ?? ""}</p>
        </div>
      ))}
      {recolhidas.map((i) => (
        <details key={i} className="rounded-lg border border-est-border bg-est-card p-3">
          <summary className="cursor-pointer text-sm font-bold text-est-primary-ink">
            {String.fromCharCode(65 + i)} — por que esta parecia certa?
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-est-fg">{explicacoes[i] ?? ""}</p>
        </details>
      ))}
    </div>
  );
}
