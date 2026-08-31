"use client";

/**
 * Vitrine dos cursos de estudo (`/est/<token>` quando o token é o do HUB).
 *
 * Um link, um PIN, todos os cursos: os cards de CPA / C-Pro I / C-Pro R / CFP
 * aparecem ANTES do PIN (só identidade e contagens — Carta 6/7 continua valendo,
 * nenhum enunciado sai sem PIN), e o PIN destrava a entrada. Escolhido um curso,
 * a vitrine busca o banco daquele curso com o MESMO PIN e monta o
 * `EstudosClient` já destravado — a URL não muda e o PIN não é pedido de novo.
 *
 * Visual: escopo `.estudos` (Zeno Concept). Sem dourado — ver o cabeçalho do
 * EstudosClient.
 */

import { useCallback, useState } from "react";
import { ArrowRight, BookOpen, Calendar, Layers, Lock } from "lucide-react";
import {
  diasCorridosAteProva,
  formatarDataProva,
  type CursoNoHub,
  type Estudo,
  type Hub,
} from "@/lib/estudos";
import EmblemaCert from "./EmblemaCert";
import EstudosClient from "./EstudosClient";

type Fase = "bloqueado" | "verificando" | "vitrine" | "abrindo" | "curso" | "erro";

interface Props {
  token: string;
  /** SSR sem PIN: cards bloqueados (identidade + contagens). */
  inicial: Hub;
}

/** Curso escolhido, já carregado — o par (token do curso, banco completo). */
interface CursoAberto {
  token: string;
  dados: Estudo;
}

export default function HubEstudos({ token, inicial }: Props) {
  const [hub, setHub] = useState<Hub>(inicial);
  const [fase, setFase] = useState<Fase>(inicial.bloqueado ? "bloqueado" : "vitrine");
  /** PIN só em memória (nada de localStorage) — vale para todos os cursos. */
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<CursoAberto | null>(null);
  const [abrindoId, setAbrindoId] = useState<string | null>(null);

  const desbloquear = useCallback(async () => {
    if (!/^\d{6}$/.test(pin)) {
      setErro("O PIN tem 6 dígitos.");
      return;
    }
    setFase("verificando");
    setErro(null);
    try {
      const resp = await fetch(`/api/estudos/hub/${encodeURIComponent(token)}`, {
        cache: "no-store",
        headers: { "x-pin-leitura": pin },
      });
      if (resp.ok) {
        const data = (await resp.json()) as Hub;
        if (!data.bloqueado) {
          setHub(data);
          setFase("vitrine");
          return;
        }
      }
      setFase("bloqueado");
      setErro(
        resp.status === 429
          ? "Muitas tentativas — aguarde alguns minutos."
          : "PIN incorreto — confira e tente de novo."
      );
    } catch {
      setFase("erro");
      setErro("Sem conexão — tente novamente.");
    }
  }, [token, pin]);

  /** Abre um curso: busca o banco dele com o mesmo PIN e entrega ao cliente. */
  const abrirCurso = useCallback(
    async (curso: CursoNoHub, chave: string) => {
      if (!curso.publicToken) return;
      setAbrindoId(chave);
      setFase("abrindo");
      setErro(null);
      try {
        const resp = await fetch(`/api/estudos/${encodeURIComponent(curso.publicToken)}`, {
          cache: "no-store",
          headers: { "x-pin-leitura": pin },
        });
        const data = (await resp.json().catch(() => null)) as Estudo | null;
        if (resp.ok && data && data.bloqueado === false) {
          setAberto({ token: curso.publicToken, dados: data });
          setFase("curso");
          return;
        }
        setFase("vitrine");
        setErro(`Não deu para abrir ${curso.rotulo} — tente de novo.`);
      } catch {
        setFase("vitrine");
        setErro("Sem conexão — tente novamente.");
      } finally {
        setAbrindoId(null);
      }
    },
    [pin]
  );

  const voltarAVitrine = useCallback(() => {
    setAberto(null);
    setFase("vitrine");
  }, []);

  // ── Curso aberto: o banco de questões assume a tela ─────────────────────
  if (fase === "curso" && aberto) {
    return (
      <EstudosClient
        token={aberto.token}
        inicial={aberto.dados}
        pinInicial={pin}
        aoVoltar={voltarAVitrine}
      />
    );
  }

  const bloqueado = fase === "bloqueado" || fase === "verificando";

  return (
    <section className="estudos min-h-[70vh] px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-est-primary-ink sm:text-3xl">
            Certificações
          </h1>
          <p className="mt-1 text-sm text-est-fg-soft">
            {bloqueado
              ? "Digite o PIN de leitura para abrir os bancos de questões."
              : "Escolha a certificação para estudar."}
          </p>
        </header>

        {/* PIN: um só para todos os cursos. Os cards já aparecem atrás dele —
            sem enunciado nenhum, só identidade e contagens. */}
        {bloqueado && (
          <div className="mx-auto mt-6 w-full max-w-sm rounded-2xl border border-est-border bg-est-card p-6 text-center shadow-sm">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-est-primary/10 text-est-primary-ink">
              <Lock size={22} />
            </span>
            <label htmlFor="pin-hub" className="sr-only">
              PIN de leitura
            </label>
            <input
              id="pin-hub"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") desbloquear();
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="••••••"
              aria-invalid={erro ? true : undefined}
              className="mt-4 w-full rounded-xl border border-est-border bg-est-bg px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-est-fg placeholder:tracking-[0.4em] placeholder:text-est-fg-faint focus:border-est-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-est-primary focus-visible:ring-offset-2 focus-visible:ring-offset-est-bg"
            />
            {erro && (
              <p role="alert" className="mt-2 text-sm font-medium text-est-negative">
                {erro}
              </p>
            )}
            <button
              type="button"
              onClick={desbloquear}
              disabled={fase === "verificando"}
              className="mt-4 w-full rounded-xl bg-est-primary px-4 py-3 text-sm font-bold text-est-primary-fg transition-colors hover:bg-est-primary/90 disabled:opacity-60"
            >
              {fase === "verificando" ? "Verificando…" : "Desbloquear"}
            </button>
          </div>
        )}

        {!bloqueado && erro && (
          <p
            role="alert"
            className="mx-auto mt-4 max-w-sm rounded-xl border border-est-negative/40 bg-est-negative-soft px-3 py-2 text-center text-sm font-medium text-est-negative"
          >
            {erro}
          </p>
        )}

        {hub.cursos.length === 0 ? (
          <p className="mt-8 text-center text-sm text-est-fg-soft">
            Nenhum curso cadastrado ainda.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {hub.cursos.map((curso, i) => {
              // SEM PIN o card não traz `id` nem `fonteCurso` (Carta 6/7), e
              // dois cursos da MESMA certificação — CPA anbima-edu e CPA
              // top-invest — colidiriam em qualquer chave montada com o
              // conteúdo. Posição é o único identificador estável do lote
              // bloqueado; com PIN, o id de verdade assume.
              const chave = curso.id ?? `pos-${i}`;
              return (
                <li key={chave} className="h-full">
                  <CardCurso
                    curso={curso}
                    travado={bloqueado}
                    carregando={abrindoId === chave}
                    onAbrir={() => abrirCurso(curso, chave)}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-10 text-center text-xs text-est-fg-faint">
          Acesso pessoal e intransferível · William Leonel
        </p>
      </div>
    </section>
  );
}

/**
 * Card de uma certificação. Travado é um `div` (não botão morto: afordância
 * falsa) e mostra só o que já era público; destravado vira botão.
 */
function CardCurso({
  curso,
  travado,
  carregando,
  onAbrir,
}: {
  curso: CursoNoHub;
  travado: boolean;
  carregando: boolean;
  onAbrir: () => void;
}) {
  const vazio = curso.contagens.questoes === 0 && curso.cards === 0;
  const dias = curso.dataProva ? diasCorridosAteProva(curso.dataProva) : null;

  const miolo = (
    <>
      <div className="flex items-start gap-4">
        <EmblemaCert cert={curso.cert} size={56} className="shrink-0" />
        <div className="min-w-0 flex-1 text-left">
          <h2 className="truncate text-lg font-bold text-est-fg">{curso.rotulo}</h2>
          {curso.fonteCurso && (
            <p className="truncate text-xs text-est-fg-faint">{curso.fonteCurso}</p>
          )}
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-est-fg-soft">
            <div className="inline-flex items-center gap-1.5">
              <BookOpen size={14} className="shrink-0 text-est-primary-ink" aria-hidden />
              <dt className="sr-only">Questões</dt>
              <dd>
                <strong className="font-bold tabular-nums text-est-fg">{curso.contagens.questoes}</strong>{" "}
                {curso.contagens.questoes === 1 ? "questão" : "questões"}
              </dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Layers size={14} className="shrink-0 text-est-primary-ink" aria-hidden />
              <dt className="sr-only">Cards</dt>
              <dd>
                <strong className="font-bold tabular-nums text-est-fg">{curso.cards}</strong> cards
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {curso.dataProva && (
        // Dias corridos dependem do relógio local × servidor: diferença de fuso
        // não deve virar erro de hidratação.
        <p
          suppressHydrationWarning
          className="mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-est-sunken px-2.5 py-1.5 text-xs font-medium text-est-fg-soft"
        >
          <Calendar size={13} className="shrink-0 text-est-primary-ink" aria-hidden />
          Prova {formatarDataProva(curso.dataProva)}
          {dias !== null && ` · ${dias} ${dias === 1 ? "dia corrido" : "dias corridos"}`}
        </p>
      )}

      {vazio && (
        <p className="mt-3 text-xs font-medium text-est-warning">
          Sem material ingerido ainda.
        </p>
      )}
    </>
  );

  // `flex-col` + `mt-auto` no rodapé: cards da mesma linha do grid terminam
  // alinhados mesmo quando só um deles tem data de prova.
  const base =
    "flex h-full w-full flex-col rounded-2xl border border-est-border bg-est-card p-5 shadow-sm transition-colors";

  if (travado) {
    return (
      <div className={`${base} opacity-70`} aria-disabled="true">
        {miolo}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAbrir}
      disabled={carregando || vazio}
      className={`${base} text-left hover:border-est-primary/50 hover:bg-est-primary/5 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {miolo}
      <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-bold text-est-primary-ink">
        {carregando ? "Abrindo…" : "Estudar"}
        {!carregando && <ArrowRight size={15} aria-hidden />}
      </span>
    </button>
  );
}
