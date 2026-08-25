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
}

export type StatusConvite = ConvidadoPublico["status"];

/** Busca a lista no Zeno. `null` = token não existe (404) — vira página 404 no site. */
export async function buscarEvento(token: string): Promise<EventoResponse | null> {
  const resp = await fetch(`${ZENO_CLOUD_URL}/api/evento/${encodeURIComponent(token)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Zeno respondeu ${resp.status}`);
  return (await resp.json()) as EventoResponse;
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
