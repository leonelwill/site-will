"use client";

/**
 * Página pública da lista de convidados (link oculto /e/<token>).
 *
 * Identidade visual do evento "Diversificação Global" (azul-profundo #0A2342,
 * bege #F0E6D2, azul-claro #A8C6E5) sobre a tipografia Montserrat do site.
 * Cores pontuais do tema em arbitrary values de propósito: são do FLYER, não
 * da marca recorrente — tokens novos no globals.css seriam para um único uso.
 *
 * Privacidade: aqui só existem nome + sobrenome + status (o proxy server-side
 * já recebe essa projeção do Zeno — nada de contato/CPF/PL chega ao browser).
 * Modo controle: PIN em memória (nunca persistido), validado no servidor a
 * cada marcação.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  Users,
  Check,
  X,
} from "lucide-react";
import {
  dataPorExtenso,
  type ConvidadoPublico,
  type EventoInfo,
  type StatusConvite,
} from "@/lib/evento";

const STATUS: { valor: StatusConvite | "todos"; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "confirmado", label: "Confirmados" },
  { valor: "pendente", label: "Pendentes" },
  { valor: "recusado", label: "Recusados" },
];

const CHIP_STATUS: Record<StatusConvite, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  confirmado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  recusado: "bg-rose-100 text-rose-700 border-rose-200",
};

function fold(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function iniciais(c: ConvidadoPublico): string {
  return `${c.nome.charAt(0)}${c.sobrenome.charAt(0) ?? ""}`.toUpperCase();
}

function nomeCompleto(c: ConvidadoPublico): string {
  return `${c.nome} ${c.sobrenome}`.trim();
}

interface Props {
  token: string;
  evento: EventoInfo;
  convidadosIniciais: ConvidadoPublico[];
}

export default function EventoClient({ token, evento, convidadosIniciais }: Props) {
  const [convidados, setConvidados] = useState<ConvidadoPublico[]>(convidadosIniciais);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<StatusConvite | "todos">("todos");
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [pinDialog, setPinDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErro, setPinErro] = useState("");
  const [modoControle, setModoControle] = useState(false);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const inputPinRef = useRef<HTMLInputElement>(null);

  const contagem = useMemo(() => {
    const base = { todos: convidados.length, confirmado: 0, pendente: 0, recusado: 0 };
    for (const c of convidados) base[c.status]++;
    return base;
  }, [convidados]);

  const listaFiltrada = useMemo(() => {
    const q = fold(busca.trim());
    return convidados.filter((c) => {
      if (filtro !== "todos" && c.status !== filtro) return false;
      if (!q) return true;
      return fold(nomeCompleto(c)).includes(q);
    });
  }, [convidados, busca, filtro]);

  const atualizar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await fetch(`/api/evento/${encodeURIComponent(token)}`, { cache: "no-store" });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data?.convidados) setConvidados(data.convidados as ConvidadoPublico[]);
    } catch {
      /* silencioso: próximo ciclo tenta de novo */
    } finally {
      setCarregando(false);
    }
  }, [token]);

  // Atualização periódica (confirmações feitas por outra pessoa aparecem sozinhas).
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") atualizar();
    }, 60_000);
    return () => clearInterval(id);
  }, [atualizar]);

  const marcar = useCallback(
    async (convidado: ConvidadoPublico, status: StatusConvite) => {
      if (!pin) {
        setPinErro("");
        setPinDialog(true);
        return;
      }
      const anterior = convidados;
      setConvidados((atual) =>
        atual.map((c) => (c.id === convidado.id ? { ...c, status } : c))
      );
      setSalvandoId(convidado.id);
      try {
        const resp = await fetch(`/api/evento/${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ convidadoId: convidado.id, status, pin }),
        });
        if (resp.ok) {
          setAviso(null);
          return;
        }
        setConvidados(anterior);
        if (resp.status === 401) {
          setModoControle(false);
          setPin("");
          setPinErro("PIN incorreto — digite novamente.");
          setPinDialog(true);
        } else if (resp.status === 429) {
          setAviso("Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.");
        } else {
          setAviso("Não foi possível salvar agora — tente novamente.");
        }
      } catch {
        setConvidados(anterior);
        setAviso("Sem conexão com o servidor — tente novamente.");
      } finally {
        setSalvandoId(null);
      }
    },
    [pin, convidados, token]
  );

  const entrarControle = () => {
    if (!/^\d{4,8}$/.test(pin)) {
      setPinErro("O PIN tem de 4 a 8 dígitos.");
      return;
    }
    setPinErro("");
    setPinDialog(false);
    setModoControle(true);
  };

  const pctConfirmado =
    contagem.todos > 0 ? Math.round((contagem.confirmado / contagem.todos) * 100) : 0;

  return (
    <>
      {/* ── Hero (azul-profundo do flyer) ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0A2342]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 0%, rgba(168,198,229,0.25), transparent), radial-gradient(50% 40% at 90% 100%, rgba(26,58,95,0.9), transparent)",
          }}
        />
        <div className="pattern-overlay absolute inset-0 opacity-30" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C9A84C]">
              Ethimos Sorocaba · BTG Pactual
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              {evento.nome}
            </h1>
            {evento.subtitulo && (
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-[#A8C6E5]">
                {evento.subtitulo}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <span className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-[#F0E6D2] backdrop-blur-sm">
                <Calendar size={18} className="shrink-0 text-[#C9A84C]" />
                {dataPorExtenso(evento.data)}
              </span>
              <div className="flex flex-col gap-3 sm:flex-row">
                <span className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-[#F0E6D2] backdrop-blur-sm">
                  <Clock size={18} className="shrink-0 text-[#C9A84C]" />
                  {evento.horario}
                </span>
                <span className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-[#F0E6D2] backdrop-blur-sm">
                  <MapPin size={18} className="shrink-0 text-[#C9A84C]" />
                  <span>
                    {evento.local}
                    {evento.endereco ? ` — ${evento.endereco}` : ""}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/20 shadow-2xl shadow-black/40">
              <Image
                src="/images/evento-diversificacao-global.jpg"
                alt={`Divulgação — ${evento.nome}`}
                width={480}
                height={600}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Lista de convidados ───────────────────────────────────────────── */}
      <section className="bg-[#F7F1E6] pb-24 pt-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#0A2342]/60">
                <Users size={14} /> Lista de convidados
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0A2342] sm:text-3xl">
                {contagem.confirmado} confirmado{contagem.confirmado === 1 ? "" : "s"} de{" "}
                {contagem.todos} convidado{contagem.todos === 1 ? "" : "s"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={atualizar}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0A2342]/15 bg-white px-3 py-2 text-sm font-semibold text-[#0A2342] transition-colors hover:bg-[#F0E6D2]"
                title="Atualizar lista"
              >
                <RefreshCw size={16} className={carregando ? "animate-spin" : ""} />
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (modoControle) {
                    setModoControle(false);
                    setPin("");
                  } else {
                    setPinErro("");
                    setPinDialog(true);
                    setTimeout(() => inputPinRef.current?.focus(), 50);
                  }
                }}
                className={
                  modoControle
                    ? "inline-flex items-center gap-2 rounded-lg bg-[#C9A84C] px-3 py-2 text-sm font-bold text-[#0A2342] shadow-sm transition-colors hover:bg-[#b8933f]"
                    : "inline-flex items-center gap-2 rounded-lg bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#132f56]"
                }
                title={modoControle ? "Sair do modo controle" : "Entrar no modo controle (marcar confirmações)"}
              >
                {modoControle ? <Unlock size={16} /> : <Lock size={16} />}
                {modoControle ? "Controle ativo" : "Modo controle"}
              </button>
            </div>
          </div>

          {/* Progresso de confirmações */}
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#0A2342]/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#0A2342] transition-all duration-500"
              style={{ width: `${pctConfirmado}%` }}
            />
          </div>

          {aviso && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {aviso}
            </p>
          )}

          {/* Busca + filtros */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A2342]/40"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar convidado por nome…"
                className="w-full rounded-xl border border-[#0A2342]/15 bg-white py-2.5 pl-9 pr-3 text-sm text-[#172033] placeholder:text-[#0A2342]/40 focus:border-[#0A2342]/40 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS.map((s) => (
                <button
                  key={s.valor}
                  type="button"
                  onClick={() => setFiltro(s.valor)}
                  className={
                    filtro === s.valor
                      ? "rounded-full bg-[#0A2342] px-3 py-1.5 text-xs font-bold text-white"
                      : "rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0A2342]/70 transition-colors hover:bg-[#F0E6D2]"
                  }
                >
                  {s.label}
                  {s.valor === "todos" ? ` · ${contagem.todos}` : ` · ${contagem[s.valor as StatusConvite]}`}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          {listaFiltrada.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {listaFiltrada.map((c) => (
                <div
                  key={c.id}
                  className={
                    salvandoId === c.id
                      ? "animate-pulse rounded-2xl border border-[#0A2342]/10 bg-white p-4 shadow-sm"
                      : "rounded-2xl border border-[#0A2342]/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F0E6D2] text-sm font-bold text-[#0A2342]">
                      {iniciais(c)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#172033]">{nomeCompleto(c)}</p>
                      <span
                        className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${CHIP_STATUS[c.status]}`}
                      >
                        {c.status === "confirmado"
                          ? "Confirmado"
                          : c.status === "pendente"
                            ? "Pendente"
                            : "Recusado"}
                      </span>
                    </div>
                  </div>

                  {modoControle && (
                    <div className="mt-3 flex items-center gap-1.5 border-t border-[#0A2342]/10 pt-3">
                      <span className="mr-auto text-[0.68rem] font-semibold uppercase tracking-wide text-[#0A2342]/40">
                        Marcar:
                      </span>
                      <button
                        type="button"
                        onClick={() => marcar(c, "confirmado")}
                        disabled={c.status === "confirmado"}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-30"
                      >
                        <Check size={13} /> Vai
                      </button>
                      <button
                        type="button"
                        onClick={() => marcar(c, "pendente")}
                        disabled={c.status === "pendente"}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-30"
                      >
                        <Clock size={13} /> Talvez
                      </button>
                      <button
                        type="button"
                        onClick={() => marcar(c, "recusado")}
                        disabled={c.status === "recusado"}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-600 disabled:opacity-30"
                      >
                        <X size={13} /> Não vai
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#0A2342]/20 bg-white/60 px-6 py-14 text-center">
              <p className="font-semibold text-[#0A2342]">
                {convidados.length === 0
                  ? "A lista ainda está vazia"
                  : "Nenhum convidado encontrado com essa busca"}
              </p>
              <p className="mt-1 text-sm text-[#0A2342]/60">
                {convidados.length === 0
                  ? "Os convidados aparecem aqui assim que forem adicionados."
                  : "Tente outro nome ou limpe o filtro."}
              </p>
            </div>
          )}

          <p className="mt-10 text-center text-xs text-[#0A2342]/50">
            Lista privada — acesso somente por link · Convite pessoal e intransferível ·
            Ethimos Investimentos
          </p>
        </div>
      </section>

      {/* ── Dialog do PIN ─────────────────────────────────────────────────── */}
      {pinDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2342]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPinDialog(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-[#F0E6D2] text-[#0A2342]">
                <Lock size={20} />
              </span>
              <div>
                <h3 className="font-bold text-[#0A2342]">Modo controle</h3>
                <p className="text-xs text-[#0A2342]/60">
                  Digite o PIN para marcar confirmações
                </p>
              </div>
            </div>
            <input
              ref={inputPinRef}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              onKeyDown={(e) => {
                if (e.key === "Enter") entrarControle();
                if (e.key === "Escape") setPinDialog(false);
              }}
              inputMode="numeric"
              autoFocus
              placeholder="••••••"
              className="mt-5 w-full rounded-xl border border-[#0A2342]/20 bg-[#F7F1E6] px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.4em] text-[#0A2342] focus:border-[#0A2342]/50 focus:outline-none"
            />
            {pinErro && <p className="mt-2 text-sm font-medium text-rose-600">{pinErro}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPinDialog(false)}
                className="flex-1 rounded-xl border border-[#0A2342]/15 px-4 py-2.5 text-sm font-semibold text-[#0A2342]/70 transition-colors hover:bg-[#F7F1E6]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={entrarControle}
                className="flex-1 rounded-xl bg-[#0A2342] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#132f56]"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
