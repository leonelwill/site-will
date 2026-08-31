"use client";

/**
 * Simulado fiel (I1 + travas R6 §5) — fluxo SEPARADO da sessão de estudo:
 * relógio da composição oficial, questão a questão, sem pausa infinita.
 *
 * Composição (espelho de zeno_cloud/src/lib/estudos/simulado.ts — repos
 * separados): CPA 40 MC + 10 árvore / 150 min; C-Pro R 30 MC + 15 case|árvore
 * / 150 min. Oficial primeiro; gerada completa lacuna SEMPRE sinalizada;
 * resumo por origem com margem — NUNCA somadas (Carta 3). Fonte da composição
 * declarada na tela (G3): edital fixa total/duração; divisão por formato é da
 * página ANBIMA Edu.
 *
 * Ao final grava como SESSÃO (erradas alimentam a próxima fila) — mesmo POST,
 * minutos = tempo consumido do relógio.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, RotateCcw } from "lucide-react";
import {
  RÓTULOS_ORIGEM,
  RÓTULOS_TIPO,
  postarSessao,
  type EstudoCompleto,
  type ItemSessaoPost,
  type Questao,
  type TipoQuestao,
} from "@/lib/estudos";
import { cn } from "@/lib/utils";

/** espelho de margemBinomial (zeno_cloud) — n=0 não tem texto. */
function margemBinomial(n: number): number {
  return 1.96 * Math.sqrt(0.25 / n);
}
const fmt1 = (x: number) => x.toFixed(1).replace(".", ",");

interface Grupo {
  tipos: TipoQuestao[];
  qtd: number;
}

const COMPOSICOES: Partial<Record<string, { total: number; minutos: number; grupos: Grupo[]; fonte: string }>> = {
  cpa: {
    total: 50,
    minutos: 150,
    grupos: [
      { tipos: ["mc"], qtd: 40 },
      { tipos: ["arvore"], qtd: 10 },
    ],
    fonte: "Edital v1.4 (total/duração) + página ANBIMA Edu (divisão por formato)",
  },
  "cpro-r": {
    total: 45,
    minutos: 150,
    grupos: [
      { tipos: ["mc"], qtd: 30 },
      { tipos: ["case", "arvore"], qtd: 15 },
    ],
    fonte: "Edital v1.4 (total/duração) + página ANBIMA Edu (divisão por formato)",
  },
};

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hojeISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

const letra = (idx: number) => String.fromCharCode(65 + idx);

interface Props {
  pin: string;
  token: string;
  dados: EstudoCompleto;
  aoFechar: (salvou: boolean) => void;
}

export default function Simulado({ pin, token, dados, aoFechar }: Props) {
  const composicao = COMPOSICOES[dados.curso.cert];
  const inicioRef = useRef<number>(Date.now());

  const montado = useMemo(() => {
    if (!composicao) return null;
    const questoes: Questao[] = [];
    const porGrupo: { tipos: TipoQuestao[]; alvo: number; oficiais: number; digitadas: number; geradas: number }[] = [];
    for (const grupo of composicao.grupos) {
      const doGrupo = dados.questoes.filter((q) => grupo.tipos.includes(q.tipo));
      const oficiais = embaralhar(doGrupo.filter((q) => q.origem === "simulado-oficial"));
      const digitadas = embaralhar(doGrupo.filter((q) => q.origem === "digitada"));
      const geradas = embaralhar(doGrupo.filter((q) => q.origem === "gerada"));
      const escolhidas = oficiais.slice(0, grupo.qtd);
      const faltam = grupo.qtd - escolhidas.length;
      const digUsadas = digitadas.slice(0, faltam);
      escolhidas.push(...digUsadas);
      const faltam2 = faltam - digUsadas.length;
      if (faltam2 > 0) escolhidas.push(...geradas.slice(0, faltam2));
      questoes.push(...escolhidas);
      porGrupo.push({
        tipos: grupo.tipos,
        alvo: grupo.qtd,
        oficiais: Math.min(oficiais.length, grupo.qtd),
        digitadas: digUsadas.length,
        geradas: Math.max(0, Math.min(geradas.length, faltam2)),
      });
    }
    return { questoes, porGrupo, lacunas: porGrupo.filter((g) => g.oficiais < g.alvo) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [fase, setFase] = useState<"pre" | "prova" | "resumo">(composicao ? "pre" : "resumo");
  const [indice, setIndice] = useState(0);
  const [escolhas, setEscolhas] = useState<Record<string, number>>({});
  const [restanteSeg, setRestanteSeg] = useState(composicao?.minutos ? composicao.minutos * 60 : 0);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  // Relógio regressivo: roda SÓ na prova; zero → finaliza (auto).
  const finalizarRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (fase !== "prova") return;
    const id = setInterval(() => {
      setRestanteSeg((s) => {
        if (s <= 1) {
          clearInterval(id);
          finalizarRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [fase]);

  const minutosConsumidos = composicao
    ? Math.max(1, Math.round((composicao.minutos * 60 - restanteSeg) / 60))
    : 0;

  const finalizar = useCallback(() => {
    setFase("resumo");
  }, []);
  finalizarRef.current = finalizar;

  const gravar = useCallback(async () => {
    if (!montado || salvo) return;
    setSalvando(true);
    setErroSalvar(null);
    const itens: ItemSessaoPost[] = [];
    for (const q of montado.questoes) {
      const escolha = escolhas[q.id];
      if (escolha === undefined) continue;
      const gabarito = q.gabaritoOficial ?? q.gabaritoIA;
      itens.push({
        questaoId: q.id,
        resultado:
          gabarito === undefined || gabarito === null ? "nulo" : escolha === gabarito ? "certo" : "errado",
        origem: q.origem,
        tipo: q.tipo,
      });
    }
    try {
      await postarSessao(token, pin, {
        id: crypto.randomUUID(),
        cursoId: dados.curso.id ?? `${dados.curso.cert}`,
        inicioEm: new Date(inicioRef.current).toISOString(),
        fimEm: new Date().toISOString(),
        minutos: minutosConsumidos,
        competenciaEm: hojeISO(),
        itens,
      });
      setSalvo(true);
    } catch {
      setErroSalvar("Não consegui gravar o resultado — tente de novo (as respostas seguem na tela).");
    } finally {
      setSalvando(false);
    }
  }, [montado, escolhas, token, pin, dados.curso, minutosConsumidos, salvo]);

  // ── Sem composição (CFP: F3) ───────────────────────────────────────────
  if (!composicao || !montado) {
    return (
      <div className="rounded-2xl border bg-est-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-est-primary-ink">Simulado ainda não disponível</h2>
        <p className="mt-2 text-sm text-est-fg-soft">
          A composição oficial desta certificação entra na fase F3 (CFP: edital FPSB).
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

  // ── Pré: composição + lacunas + fonte (parcial declarado, nunca oculto) ─
  if (fase === "pre") {
    return (
      <div className="rounded-2xl border bg-est-card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-est-primary-ink">
          Simulado {dados.curso.rotulo} · {composicao.total} questões · {composicao.minutos} min
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-est-fg-soft">
          {montado.porGrupo.map((g, i) => (
            <li key={i}>
              {g.tipos.map((t) => RÓTULOS_TIPO[t]).join(" ou ")}: {g.oficiais + g.digitadas + g.geradas}/{g.alvo}
              {(g.digitadas > 0 || g.geradas > 0) && (
                <span className="ml-1 font-medium text-est-primary-ink">
                  ({g.oficiais} oficial · {g.digitadas} cursinho · {g.geradas} gerada)
                </span>
              )}
            </li>
          ))}
        </ul>
        {montado.lacunas.length > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-est-warning/40 bg-est-warning-soft p-3 text-xs font-medium text-est-warning">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            Banco com {montado.questoes.length} de {composicao.total} questões — simulado PARCIAL
            declarado (oficial em falta nas linhas acima).
          </p>
        )}
        <p className="mt-3 text-xs text-est-fg-soft">Fonte da composição: {composicao.fonte}</p>
        <button
          type="button"
          onClick={() => {
            inicioRef.current = Date.now();
            setFase("prova");
          }}
          disabled={montado.questoes.length === 0}
          className="mt-5 w-full rounded-xl bg-est-primary px-4 py-3 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90 disabled:opacity-50"
        >
          {montado.questoes.length === 0 ? "Banco vazio — ingira questões primeiro" : "Começar (relógio corre)"}
        </button>
        <button
          type="button"
          onClick={() => aoFechar(false)}
          className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm font-bold text-est-fg-soft hover:bg-est-sunken"
        >
          Voltar
        </button>
      </div>
    );
  }

  // ── Resumo: por origem COM margem, nunca somadas (Carta 3) ─────────────
  if (fase === "resumo") {
    const porOrigem = (origem: "simulado-oficial" | "digitada" | "gerada") => {
      const respondidas = montado.questoes.filter(
        (q) => q.origem === origem && escolhas[q.id] !== undefined
      );
      const n = respondidas.length;
      const acertos = respondidas.filter((q) => {
        const gabarito = q.gabaritoOficial ?? q.gabaritoIA;
        return gabarito !== undefined && gabarito !== null && escolhas[q.id] === gabarito;
      }).length;
      return {
        n,
        acertos,
        texto: n > 0 ? `${fmt1((acertos / n) * 100)}% ± ${fmt1(margemBinomial(n) * 100)}pp` : null,
      };
    };
    const oficial = porOrigem("simulado-oficial");
    const gerada = porOrigem("gerada");
    const semResposta = montado.questoes.filter((q) => escolhas[q.id] === undefined).length;

    // Revisão das erradas: durante a prova NADA vaza (fidelidade de simulado);
    // a explicação vem aqui, no resumo — errar sem entender é só metade do estudo.
    const erradas = montado.questoes.filter((q) => {
      const gab = q.gabaritoOficial ?? q.gabaritoIA;
      const esc = escolhas[q.id];
      return gab !== undefined && gab !== null && esc !== undefined && esc !== gab;
    });

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-est-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-est-primary-ink">Resultado</h2>
          <p className="mt-1 text-xs text-est-fg-soft">
            {montado.questoes.length} questões · {minutosConsumidos} min de relógio
            {semResposta > 0 && ` · ${semResposta} sem resposta`}
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border bg-est-bg p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-est-fg-soft">Oficial</p>
              <p className="mt-1 text-lg font-bold text-est-fg">
                {oficial.texto ?? "—"}{" "}
                <span className="text-xs font-medium text-est-fg-soft">(n={oficial.n})</span>
              </p>
            </div>
            <div className="rounded-xl border bg-est-bg p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-est-fg-soft">
                Cursinho — contagem separada, nunca somada
              </p>
              <p className="mt-1 text-lg font-bold text-est-fg">
                {porOrigem("digitada").texto ?? "—"}{" "}
                <span className="text-xs font-medium text-est-fg-soft">(n={porOrigem("digitada").n})</span>
              </p>
            </div>
            <div className="rounded-xl border bg-est-bg p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-est-fg-soft">
                Gerada por IA — contagem separada, nunca somada
              </p>
              <p className="mt-1 text-lg font-bold text-est-fg">
                {gerada.texto ?? "—"}{" "}
                <span className="text-xs font-medium text-est-fg-soft">(n={gerada.n})</span>
              </p>
            </div>
          </div>
          {montado.lacunas.length > 0 && (
            <p className="mt-3 rounded-xl border border-est-warning/40 bg-est-warning-soft p-3 text-xs font-medium text-est-warning">
              Simulado PARCIAL: {montado.questoes.length}/{composicao.total} questões da composição
              oficial. Fonte: {composicao.fonte}
            </p>
          )}
        </div>
        {erradas.length > 0 && (
          <div className="rounded-2xl border bg-est-card p-5 shadow-sm">
            <h3 className="text-sm font-bold text-est-primary-ink">
              Revisão das erradas ({erradas.length})
            </h3>
            <p className="mt-0.5 text-xs text-est-fg-soft">
              Toque para abrir: gabarito + explicação de cada erro.
            </p>
            <div className="mt-3 space-y-2">
              {erradas.map((q, i) => {
                const gab = q.gabaritoOficial ?? q.gabaritoIA ?? 0;
                const esc = escolhas[q.id] ?? 0;
                return (
                  <details
                    key={q.id}
                    className="rounded-xl border bg-est-bg open:border-est-primary/60"
                  >
                    <summary className="cursor-pointer list-none p-3 text-sm font-semibold text-est-fg marker:hidden">
                      <span className="mr-1.5 font-mono text-xs font-bold text-est-primary-ink">
                        {i + 1}.
                      </span>
                      {q.enunciado.length > 110
                        ? `${q.enunciado.slice(0, 110).trimEnd()}…`
                        : q.enunciado}
                    </summary>
                    <div className="space-y-2 border-t p-3 pt-3">
                      <p className="text-sm">
                        <span className="font-bold text-est-negative">
                          Sua resposta: {letra(esc)}
                        </span>
                        <span className="ml-2 text-est-fg-soft">
                          {q.alternativas[esc]}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-bold text-est-positive">
                          {q.gabaritoOficial !== undefined && q.gabaritoOficial !== null
                            ? "Gabarito oficial: "
                            : "Gabarito IA — sem oficial: "}
                          {letra(gab)}
                        </span>
                        <span className="ml-2 text-est-fg-soft">
                          {q.alternativas[gab]}
                        </span>
                      </p>
                      {q.explicacao ? (
                        <div className="rounded-lg bg-est-sunken p-3 text-sm leading-relaxed text-est-fg">
                          {q.explicacao}
                        </div>
                      ) : (
                        <p className="text-xs text-est-fg-soft">
                          Sem explicação disponível para esta questão.
                        </p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
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
            <RotateCcw size={15} /> {salvo ? "Gravado" : salvando ? "Gravando…" : "Gravar sessão"}
          </button>
        </div>
      </div>
    );
  }

  // ── Prova ───────────────────────────────────────────────────────────────
  const q = montado.questoes[indice];
  const mm = String(Math.floor(restanteSeg / 60)).padStart(2, "0");
  const ss = String(restanteSeg % 60).padStart(2, "0");
  const terminou = indice >= montado.questoes.length;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-2 border-b bg-est-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="text-sm font-bold text-est-primary-ink">
          {Math.min(indice + 1, montado.questoes.length)}/{montado.questoes.length}
        </p>
        <p
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-sm font-bold",
            restanteSeg < 300 ? "bg-est-negative-soft text-est-negative" : "bg-est-sunken text-est-fg"
          )}
          suppressHydrationWarning
        >
          <Clock size={14} /> {mm}:{ss}
        </p>
      </div>

      {!terminou && q && (
        <article className="rounded-2xl border bg-est-card p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-est-primary/10 px-2 py-0.5 text-est-primary-ink">
              {RÓTULOS_ORIGEM[q.origem]}
            </span>
            <span className="rounded-full bg-est-sunken px-2 py-0.5 text-est-fg-soft">
              {RÓTULOS_TIPO[q.tipo]}
            </span>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-est-fg">{q.enunciado}</p>
          <div className="mt-3 space-y-2">
            {q.alternativas.map((alt, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={escolhas[q.id] === i}
                onClick={() => setEscolhas((e) => ({ ...e, [q.id]: i }))}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm",
                  escolhas[q.id] === i
                    ? "border-est-primary bg-est-primary/5 font-semibold"
                    : "border-est-border bg-est-bg hover:border-est-primary/50"
                )}
              >
                <span className="font-mono text-xs font-bold text-est-primary-ink">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-est-fg">{alt}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            {indice > 0 && (
              <button
                type="button"
                onClick={() => setIndice((i) => i - 1)}
                className="rounded-xl border px-4 py-2.5 text-sm font-bold text-est-fg-soft hover:bg-est-sunken"
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              onClick={() => (indice + 1 >= montado.questoes.length ? finalizar() : setIndice((i) => i + 1))}
              className="flex-1 rounded-xl bg-est-primary px-4 py-2.5 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90"
            >
              {indice + 1 >= montado.questoes.length ? "Finalizar" : "Próxima"}
            </button>
          </div>
        </article>
      )}

      {terminou && (
        <button
          type="button"
          onClick={finalizar}
          className="w-full rounded-xl bg-est-primary px-4 py-3 text-sm font-bold text-est-primary-fg hover:bg-est-primary/90"
        >
          Ver resultado
        </button>
      )}
    </div>
  );
}
