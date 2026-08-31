"use client";

/**
 * Menu de macrotemas e microtemas do Programa Detalhado.
 *
 * Serve à pergunta "quero ver mais sobre Previdência": busca por texto ou pela
 * numeração oficial ("2.2.3", que é como a apostila indexa), navega módulo →
 * grupo → microtema, e leva ao banco já filtrado por aquele tema.
 *
 * A árvore chega PRONTA do Zeno (`arvoreTemas`) — o agrupamento pela numeração
 * do título é decisão do backend e não se reimplementa aqui.
 *
 * Honestidade (Carta 5): microtema SEM derivado nenhum não some da lista — é
 * exatamente o que falta estudar, e esconder viraria uma cobertura que parece
 * completa. Ele aparece marcado como lacuna e não é clicável, porque não há o
 * que abrir.
 */

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Layers, Search, TriangleAlert } from "lucide-react";
import type { ModuloDeTemas } from "@/lib/estudos";

/** Busca sem acento/caixa (mesma régua do banco). */
function fold(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

interface Props {
  modulos: ModuloDeTemas[];
  /** Abre o banco filtrado por estes microtemas (o grupo inteiro ou um só). */
  aoEscolher: (microtemaIds: string[], rotulo: string) => void;
}

export default function MenuTemas({ modulos, aoEscolher }: Props) {
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const termo = fold(busca.trim());

  /** Filtra a árvore pelo termo, mantendo só o que casa (título ou numeração). */
  const filtrada = useMemo(() => {
    if (!termo) return modulos;
    return modulos
      .map((mod) => ({
        ...mod,
        grupos: mod.grupos
          .map((g) => ({
            ...g,
            microtemas: g.microtemas.filter(
              (m) => fold(m.titulo).includes(termo) || m.numero.startsWith(termo)
            ),
          }))
          .filter((g) => g.microtemas.length > 0 || fold(g.titulo).includes(termo)),
      }))
      .filter((mod) => mod.grupos.length > 0);
  }, [modulos, termo]);

  const achados = useMemo(
    () => filtrada.reduce((s, m) => s + m.grupos.reduce((t, g) => t + g.microtemas.length, 0), 0),
    [filtrada]
  );

  const alternar = (chave: string) => setAbertos((a) => ({ ...a, [chave]: !a[chave] }));

  return (
    <section aria-labelledby="temas-titulo">
      <h2 id="temas-titulo" className="sr-only">
        Temas do programa
      </h2>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-est-fg-soft"
          aria-hidden
        />
        <label htmlFor="busca-tema" className="sr-only">
          Buscar tema por nome ou número do programa
        </label>
        <input
          id="busca-tema"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Previdência, tributação, 2.1…"
          className="min-h-11 w-full rounded-xl border border-est-border bg-est-card py-3 pl-9 pr-3 text-sm text-est-fg placeholder:text-est-fg-soft focus:border-est-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-est-primary focus-visible:ring-offset-2 focus-visible:ring-offset-est-bg"
        />
      </div>

      {termo && (
        <p className="mt-2 text-xs text-est-fg-soft">
          {achados === 0
            ? "Nenhum tema com esse nome ou número."
            : `${achados} ${achados === 1 ? "microtema" : "microtemas"} encontrados`}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {filtrada.map((mod) => (
          <article key={mod.id} className="rounded-2xl border border-est-border bg-est-card p-4">
            <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="text-sm font-bold text-est-fg">{mod.titulo}</h3>
              <p className="text-xs text-est-fg-soft">
                <span className="font-bold tabular-nums text-est-primary-ink">
                  {mod.cobertos}/{mod.total}
                </span>{" "}
                microtemas com material
              </p>
            </header>

            <ul className="mt-3 space-y-1.5">
              {mod.grupos.map((g) => {
                const chave = `${mod.id}:${g.numero}`;
                // Com busca ativa, tudo já vem aberto: esconder o resultado
                // atrás de mais um clique é o oposto de buscar.
                const aberto = termo ? true : !!abertos[chave];
                const rotuloGrupo = g.numero ? `${g.numero} ${g.titulo}` : g.titulo;
                const temMaterial = g.questoes > 0;
                return (
                  <li key={chave} className="rounded-xl border border-est-border">
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => alternar(chave)}
                        aria-expanded={aberto}
                        disabled={!!termo}
                        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-l-xl px-3 py-2 text-left transition-colors hover:bg-est-sunken disabled:hover:bg-transparent"
                      >
                        {termo ? (
                          <span className="w-4" />
                        ) : aberto ? (
                          <ChevronDown size={16} className="shrink-0 text-est-fg-soft" aria-hidden />
                        ) : (
                          <ChevronRight size={16} className="shrink-0 text-est-fg-soft" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-est-fg">
                            {rotuloGrupo}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.7rem] text-est-fg-soft">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen size={11} aria-hidden />
                              <span className="tabular-nums">{g.questoes}</span> questões
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Layers size={11} aria-hidden />
                              <span className="tabular-nums">{g.cards}</span> cards
                            </span>
                            {g.cobertos < g.microtemas.length && (
                              <span className="inline-flex items-center gap-1 text-est-warning">
                                <TriangleAlert size={11} aria-hidden />
                                <span className="tabular-nums">
                                  {g.microtemas.length - g.cobertos}
                                </span>{" "}
                                sem material
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                      {temMaterial && (
                        <button
                          type="button"
                          onClick={() =>
                            aoEscolher(
                              g.microtemas.map((m) => m.id),
                              rotuloGrupo
                            )
                          }
                          className="min-h-11 shrink-0 rounded-r-xl border-l border-est-border px-3 text-xs font-bold text-est-primary-ink transition-colors hover:bg-est-primary/10"
                        >
                          Estudar
                        </button>
                      )}
                    </div>

                    {aberto && (
                      <ul className="border-t border-est-border p-1.5">
                        {g.microtemas.map((m) => {
                          const vazio = m.questoes + m.cards === 0;
                          const conteudo = (
                            <>
                              <span className="min-w-0 flex-1">
                                <span className="block break-words text-[0.8rem] leading-snug text-est-fg">
                                  {m.titulo}
                                </span>
                              </span>
                              <span className="shrink-0 whitespace-nowrap text-[0.7rem] tabular-nums text-est-fg-soft">
                                {vazio ? (
                                  <span className="text-est-warning">sem material</span>
                                ) : (
                                  `${m.questoes}q · ${m.cards}c`
                                )}
                              </span>
                            </>
                          );
                          return (
                            <li key={m.id}>
                              {vazio ? (
                                // Não é botão: sem material não há o que abrir, e
                                // botão morto é afordância falsa.
                                <div className="flex min-h-11 w-full items-center gap-3 px-2.5 py-2 opacity-70">
                                  {conteudo}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => aoEscolher([m.id], m.titulo)}
                                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-est-primary/10"
                                >
                                  {conteudo}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
