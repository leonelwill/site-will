/**
 * Ponte server-side com a API pública de eventos do Zeno Cloud
 * (GET/POST /api/evento/<token>). O token de 32 hex é a própria autenticação
 * do link oculto; a marcação de status exige PIN, validado no Zeno.
 *
 * Toda chamada sai do SERVIDOR do site (proxy) — o browser nunca fala com o
 * Firebase direto e não há CORS para configurar.
 */

// Mesma env da página /cloud — trocar o backend não exige redeploy de código.
const ZENO_CLOUD_URL =
  process.env.NEXT_PUBLIC_ZENO_CLOUD_URL ??
  "https://zeno-gsuite--zeno-gsuite.us-east4.hosted.app";

export interface EventoInfo {
  nome: string;
  subtitulo: string;
  data: string; // 'YYYY-MM-DD'
  horario: string;
  local: string;
  endereco: string;
}

export interface ConvidadoPublico {
  id: string;
  nome: string;
  sobrenome: string;
  status: "pendente" | "confirmado" | "recusado";
}

export interface EventoResponse {
  evento: EventoInfo;
  convidados: ConvidadoPublico[];
  /** true = exige PIN de acesso (header x-pin-acesso) para ver os convidados. */
  bloqueado?: boolean;
  /** true = o organizador ainda não definiu o PIN de acesso (doc legado). */
  pinPendente?: boolean;
}

export type StatusConvite = ConvidadoPublico["status"];

/** Resultado da tentativa de desbloqueio com PIN de acesso. */
export type ResultadoDesbloqueio =
  | { ok: true; convidados: ConvidadoPublico[] }
  | { ok: false; motivo: "pin" | "limite" | "erro" };

export async function desbloquearEvento(
  token: string,
  pinAcesso: string
): Promise<ResultadoDesbloqueio> {
  try {
    const resp = await fetch(`${ZENO_CLOUD_URL}/api/evento/${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: { "x-pin-acesso": pinAcesso },
      signal: AbortSignal.timeout(10_000),
    });
    if (resp.ok) {
      const data = (await resp.json()) as EventoResponse;
      return { ok: true, convidados: data.convidados ?? [] };
    }
    if (resp.status === 401) return { ok: false, motivo: "pin" };
    if (resp.status === 429) return { ok: false, motivo: "limite" };
    return { ok: false, motivo: "erro" };
  } catch {
    return { ok: false, motivo: "erro" };
  }
}

/**
 * Busca a lista no Zeno. `null` = token não existe (404) — vira página 404 no site.
 * Com `pinAcesso`, envia o header `x-pin-acesso` (header, nunca query: query vaza
 * em log de acesso); sem PIN válido o Zeno devolve os convidados vazios.
 */
export async function buscarEvento(token: string, pinAcesso?: string): Promise<EventoResponse | null> {
  const resp = await fetch(`${ZENO_CLOUD_URL}/api/evento/${encodeURIComponent(token)}`, {
    cache: "no-store",
    headers: pinAcesso ? { "x-pin-acesso": pinAcesso } : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  if (resp.status === 404) return null;
  // PIN errado vem como 401 com o corpo da resposta bloqueada — trata igual ao
  // bloqueio (o site decide a mensagem a partir do corpo).
  const data = (await resp.json().catch(() => null)) as EventoResponse | null;
  if (!data) throw new Error(`Zeno respondeu ${resp.status}`);
  return data;
}

/** Repassa uma marcação de status (valida token + PIN + rate limit no Zeno). */
export async function marcarStatus(
  token: string,
  payload: { convidadoId: string; status: StatusConvite; pin: string }
): Promise<Response> {
  return fetch(`${ZENO_CLOUD_URL}/api/evento/${encodeURIComponent(token)}/status`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}

/** Data ISO ('YYYY-MM-DD') por extenso em pt-BR, sem passar por Date-UTC (fuso). */
export function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  const dias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const semana = dias[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return `${semana}, ${dia} de ${meses[mes - 1]} de ${ano}`;
}
