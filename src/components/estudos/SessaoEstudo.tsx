"use client";

/**
 * Sessão "Estudar agora" — fila zero-decisão (R3 §N2, aprovada na R6).
 *
 * Fila (espelho de zeno_cloud/src/lib/estudos/fila.ts — repos separados):
 * SRS vencidas (due mais antigo primeiro) → erradas da última sessão →
 * novas do microtema menos coberto; orçamento em MINUTOS fecha em ITEM
 * inteiro (nunca corta no meio de um raciocínio).
 *
 * Rascunho retomável em localStorage (`zeno:est:sessao:<token>`) — dado
 * pessoal do dispositivo, não é segredo (o PIN continua só em memória).
 * Finalizar → POST /api/estudos/<token>/sessao (grava + aplica revisões SM-2
 * com clamp no Zeno; aqui a resposta é só certo/errado).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import {
  RÓTULOS_ORIGEM,
  RÓTULOS_TIPO,
  postarSessao,
  type CardEstudo,
  type EstudoCompleto,
  type ItemSessaoPost,
  type Questao,
  type ReviewCard,
} from "@/lib/estudos";
import { cn } from "@/lib/utils";

const MINUTOS_CARD = 1;
const MINUTOS_QUESTAO = 2;
const ORCAMENTOS = [15, 30, 45, 60];

type ItemFila =
  | { tipo: "card"; card: CardEstudo }
  | { tipo: "questao"; questao: Questao };

interface Rascunho {
  inicioEm: string;
  indice: number;
  resultados: Record<string, "certo" | "errado" | "nulo">;
}

function hojeISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

/** Espelho client da montagemFila (decisão do Zeno é a fonte; aqui é conveniência). */
function montarFilaLocal(
  cards: CardEstudo[],
  reviews: ReviewCard[],
  questoes: Questao[],
  erradasRecentes: string[],
  microtemaAlvo: string | null | undefined,
  orcamento: number
): { itens: ItemFila[]; minutos: number } {
  const hoje = hojeISO();
  const reviewPorCard = new Map(reviews.map((r) => [r.cardId, r]));

  const vencidas = cards
    .filter((c) => (reviewPorCard.get(c.id)?.dueEm ?? "9999") <= hoje)
    .sort((a, b) =>
      reviewPorCard.get(a.id)!.dueEm < reviewPorCard.get(b.id)!.dueEm ? -1 : 1
    );
  const erradas = erradasRecentes
    .map((id) => questoes.find((q) => q.id === id))
    .filter((q): q is Questao => !!q);
  const semReview = cards.filter((c) => !reviewPorCard.has(c.id));
  const novasAlvo = semReview.filter((c) => c.microtemaPdId === microtemaAlvo);
  const novasResto = semReview.filter((c) => c.microtemaPdId !== microtemaAlvo);

  const itens: ItemFila[] = [];
  let minutos = 0;
  const custo = (i: ItemFila) => (i.tipo === "card" ? MINUTOS_CARD : MINUTOS_QUESTAO);
  for (const item of [
    ...vencidas.map((card): ItemFila => ({ tipo: "card", card })),
    ...erradas.map((questao): ItemFila => ({ tipo: "questao", questao })),
    ...novasAlvo.map((card): ItemFila => ({ tipo: "card", card })),
    ...novasResto.map((card): ItemFila => ({ tipo: "card", card })),
  ]) {
    if (minutos + custo(item) > orcamento) break;
    itens.push(item);
    minutos += custo(item);
  }
  return { itens, minutos };
}

interface Props {
  token: string;
  pin: string;
  dados: EstudoCompleto;
  aoFechar: (salvou: boolean) => void;
}

export default function SessaoEstudo({ token, pin, dados, aoFechar }: Props) {
  const chaveRascunho = `zeno:est:sessao:${token}`;
  const [orcamento, setOrcamento] = useState(45);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [retomado, setRetomado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [resumo, setResumo] = useState<{ minutos: number; itens: number; acertos: number } | null>(null);
  const [selecaoQuestao, setSelecaoQuestao] = useState<number | null>(null);
  // Cards virados na tela (revela o verso SEM avançar — só Errei/Acertei avançam).
  const [versosAbertos, setVersosAbertos] = useState<Set<string>>(new Set());

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

  const fila = useMemo(
    () =>
      montarFilaLocal(
        dados.cards ?? [],
        dados.reviews ?? [],
        dados.questoes,
        (dados.erradasRecentes ?? []).map((e) => e.questaoId),
        dados.microtemaMenosCoberto,
        orcamento
      ),
    [dados, orcamento]
  );

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

  const itens = fila.itens;
  const indice = rascunho?.indice ?? 0;
  const atual = itens[indice];
  const total = itens.length;
  const respondidos = rascunho ? Object.keys(rascunho.resultados).length : 0;

  const registrar = useCallback(
    (id: string, resultado: "certo" | "errado" | "nulo") => {
      setRascunho((r) => {
        if (!r) return r;
        const novo = { ...r, resultados: { ...r.resultados, [id]: resultado }, indice: Math.min(r.indice + 1, total) };
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
    for (const item of itens) {
      const id = item.tipo === "card" ? item.card.id : item.questao.id;
      const resultado = rascunho.resultados[id];
      if (!resultado) continue;
      if (resultado === "certo") acertos++;
      if (item.tipo === "card") {
        postItens.push({ cardId: id, resultado });
      } else {
        postItens.push({
          questaoId: id,
          resultado,
          origem: item.questao.origem,
          tipo: item.questao.tipo,
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
        competenciaEm: hojeISO(),
        itens: postItens,
      });
      try {
        localStorage.removeItem(chaveRascunho);
      } catch {
        /* ok */
      }
      setResumo({ minutos, itens: postItens.length, acertos });
    } catch {
      setErroSalvar("Não consegui gravar a sessão — ela segue salva aqui; tente de novo.");
    } finally {
      setSalvando(false);
    }
  }, [rascunho, itens, token, pin, dados.curso, chaveRascunho, aoFechar]);

  // ── Resumo pós-POST ────────────────────────────────────────────────────
  if (resumo) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check size={24} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-brand-primary">Sessão gravada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {resumo.itens} itens · {resumo.acertos} certos · {resumo.minutos} min (competência de hoje)
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Revisões agendadas — nenhuma além da véspera da prova.
        </p>
        <button
          type="button"
          onClick={() => aoFechar(true)}
          className="mt-5 w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-brand-primary">Nada vencido hoje</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sem revisões vencidas, erradas pendentes ou cards novos dentro do orçamento.
        </p>
        <button
          type="button"
          onClick={() => aoFechar(false)}
          className="mt-5 rounded-xl border px-4 py-2.5 text-sm font-bold text-brand-primary hover:bg-muted"
        >
          Voltar
        </button>
      </div>
    );
  }

  const cardAtual = atual?.tipo === "card" ? atual.card : null;
  const questaoAtual = atual?.tipo === "questao" ? atual.questao : null;
  const versoAberto = cardAtual ? versosAbertos.has(cardAtual.id) : false;

  return (
    <div className="space-y-4">
      {/* Progresso + orçamento */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-brand-primary">
          {respondidos}/{total} itens · {fila.minutos} min estimados
          {retomado && <span className="ml-2 text-xs font-medium text-brand-gold">retomada</span>}
        </p>
        {!retomado && respondidos === 0 && (
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            Orçamento:
            <select
              value={orcamento}
              onChange={(e) => setOrcamento(Number(e.target.value))}
              className="rounded-lg border bg-card px-2 py-1 text-xs font-bold text-foreground"
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
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand-gold transition-all"
          style={{ width: `${total ? (respondidos / total) * 100 : 0}%` }}
        />
      </div>

      {/* Item atual */}
      {cardAtual && (
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          {!versoAberto ? (
            <>
              <p className="text-sm font-semibold leading-relaxed text-foreground">{cardAtual.frente}</p>
              <button
                type="button"
                onClick={() =>
                  setVersosAbertos((s) => new Set(s).add(cardAtual.id))
                }
                className="mt-4 w-full rounded-xl border border-brand-gold/60 px-4 py-2.5 text-sm font-bold text-brand-primary hover:bg-brand-gold/10"
              >
                Virar card
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground">{cardAtual.frente}</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{cardAtual.verso}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => registrar(cardAtual.id, "errado")}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100"
                >
                  <X size={15} /> Errei
                </button>
                <button
                  type="button"
                  onClick={() => registrar(cardAtual.id, "certo")}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <Check size={15} /> Acertei
                </button>
              </div>
            </>
          )}
        </article>
      )}

      {questaoAtual && (
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-brand-primary">
              {RÓTULOS_ORIGEM[questaoAtual.origem]}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              {RÓTULOS_TIPO[questaoAtual.tipo]}
            </span>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-foreground">{questaoAtual.enunciado}</p>
          <div className="mt-3 space-y-2">
            {questaoAtual.alternativas.map((alt, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={selecaoQuestao === i}
                onClick={() => setSelecaoQuestao(i)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm",
                  selecaoQuestao === i
                    ? "border-brand-primary bg-brand-primary/5 font-semibold"
                    : "border-border bg-background hover:border-brand-primary/50"
                )}
              >
                <span className="font-mono text-xs font-bold text-brand-gold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-foreground">{alt}</span>
              </button>
            ))}
          </div>
          {selecaoQuestao !== null && (
            <button
              type="button"
              onClick={() => {
                const gabarito = questaoAtual.gabaritoOficial ?? questaoAtual.gabaritoIA;
                const resultado =
                  gabarito === undefined || gabarito === null
                    ? "nulo"
                    : selecaoQuestao === gabarito
                      ? "certo"
                      : "errado";
                setSelecaoQuestao(null);
                registrar(questaoAtual.id, resultado);
              }}
              className="mt-4 w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
            >
              Responder
            </button>
          )}
        </article>
      )}

      {erroSalvar && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
          {erroSalvar}
        </p>
      )}

      <div className="flex gap-2 pb-24 xl:pb-0">
        <button
          type="button"
          onClick={() => aoFechar(false)}
          className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted"
        >
          Pausar
        </button>
        <button
          type="button"
          onClick={finalizar}
          disabled={salvando}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          <RotateCcw size={15} /> {salvando ? "Gravando…" : "Finalizar e gravar"}
        </button>
      </div>
    </div>
  );
}
