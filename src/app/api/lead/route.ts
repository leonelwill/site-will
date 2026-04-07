import { NextResponse } from "next/server";

const resendApiUrl = "https://api.resend.com/emails";
const turnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const jsonHeaders = {
  "Cache-Control": "no-store",
} as const;

const MAX_CONTENT_LENGTH = 12_000;
const FETCH_TIMEOUT_MS = 8_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const allowedPatrimonioRanges = new Set([
  "Até R$ 100 mil",
  "R$ 100 mil a R$ 500 mil",
  "R$ 500 mil a R$ 1 milhão",
  "R$ 1 milhão a R$ 5 milhões",
  "Acima de R$ 5 milhões",
]);

const allowedGoals = new Set([
  "Organizar carteira atual",
  "Planejar aposentadoria",
  "Estruturar patrimônio familiar",
  "Avaliar oportunidades no BTG",
]);

const allowedContactPreferences = new Set(["whatsapp", "phone", "email"]);

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

type GlobalWithRateLimit = typeof globalThis & {
  __leadRateLimitStore?: RateLimitStore;
};

const globalForRateLimit = globalThis as GlobalWithRateLimit;
const rateLimitStore =
  globalForRateLimit.__leadRateLimitStore ??
  (globalForRateLimit.__leadRateLimitStore = new Map<string, RateLimitEntry>());

interface LeadPayload {
  name: string;
  email?: string;
  phone?: string;
  patrimonio?: string;
  message?: string;
  goal?: string;
  contactPreference?: string;
  timestamp: string;
}

interface LeadRequestBody {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  patrimonio?: unknown;
  message?: unknown;
  goal?: unknown;
  contactPreference?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
}

class ValidationError extends Error {}

interface TurnstileVerificationResponse {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatLeadHtml(lead: LeadPayload) {
  return `
    <h2>Novo lead do site</h2>
    <p><strong>Nome:</strong> ${escapeHtml(lead.name)}</p>
    <p><strong>Telefone:</strong> ${escapeHtml(lead.phone || "-")}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(lead.email || "-")}</p>
    <p><strong>Patrimônio:</strong> ${escapeHtml(lead.patrimonio || "-")}</p>
    <p><strong>Objetivo:</strong> ${escapeHtml(lead.goal || "-")}</p>
    <p><strong>Canal preferido:</strong> ${escapeHtml(lead.contactPreference || "-")}</p>
    <p><strong>Mensagem:</strong> ${escapeHtml(lead.message || "-")}</p>
    <p><strong>Recebido em:</strong> ${escapeHtml(lead.timestamp)}</p>
  `;
}

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: jsonHeaders,
  });
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeOptionalSingleLine(
  value: unknown,
  fieldName: string,
  maxLength: number
) {
  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} inválido`);
  }

  const normalized = normalizeWhitespace(value);
  if (!normalized) return undefined;

  if (normalized.length > maxLength) {
    throw new ValidationError(`${fieldName} excede o limite permitido`);
  }

  return normalized;
}

function sanitizeOptionalMultiline(
  value: unknown,
  fieldName: string,
  maxLength: number
) {
  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} inválido`);
  }

  const normalized = value.trim();
  if (!normalized) return undefined;

  if (normalized.length > maxLength) {
    throw new ValidationError(`${fieldName} excede o limite permitido`);
  }

  return normalized;
}

function parseClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) return firstIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  return `unknown:${userAgent.slice(0, 80)}`;
}

function checkRateLimit(key: string) {
  const now = Date.now();

  for (const [entryKey, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(entryKey);
    }
  }

  const currentEntry = rateLimitStore.get(key);

  if (!currentEntry || currentEntry.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt,
    };
  }

  if (currentEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: currentEntry.resetAt,
    };
  }

  currentEntry.count += 1;
  rateLimitStore.set(key, currentEntry);

  return {
    allowed: true,
    remaining: Math.max(RATE_LIMIT_MAX_REQUESTS - currentEntry.count, 0),
    resetAt: currentEntry.resetAt,
  };
}

function assertAllowedOrigin(request: Request) {
  if (process.env.NODE_ENV !== "production") return;

  const origin = request.headers.get("origin");
  if (!origin) {
    throw new ValidationError("Origem não autorizada");
  }

  const allowedOrigins = new Set<string>();
  allowedOrigins.add(new URL(request.url).origin);

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    allowedOrigins.add(new URL(configuredSiteUrl).origin);
  }

  if (!allowedOrigins.has(origin)) {
    throw new ValidationError("Origem não autorizada");
  }
}

function parseLeadPayload(body: unknown) {
  if (!isObjectRecord(body)) {
    throw new ValidationError("Payload inválido");
  }

  const leadBody = body as LeadRequestBody;
  const honeypot = sanitizeOptionalSingleLine(leadBody.website, "website", 200);

  const name = sanitizeOptionalSingleLine(leadBody.name, "nome", 120);
  if (!name || name.length < 2) {
    throw new ValidationError("Nome é obrigatório");
  }

  const email = sanitizeOptionalSingleLine(leadBody.email, "email", 160)?.toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("E-mail inválido");
  }

  const phone = sanitizeOptionalSingleLine(leadBody.phone, "telefone", 30);
  const phoneDigits = phone?.replace(/\D/g, "");
  if (phone && (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 15)) {
    throw new ValidationError("Telefone inválido");
  }

  if (!email && !phone) {
    throw new ValidationError("Nome e ao menos um canal de contato são obrigatórios");
  }

  const patrimonio = sanitizeOptionalSingleLine(leadBody.patrimonio, "patrimônio", 40);
  if (patrimonio && !allowedPatrimonioRanges.has(patrimonio)) {
    throw new ValidationError("Faixa de patrimônio inválida");
  }

  const goal = sanitizeOptionalSingleLine(leadBody.goal, "objetivo", 80);
  if (goal && !allowedGoals.has(goal)) {
    throw new ValidationError("Objetivo inválido");
  }

  const contactPreference = sanitizeOptionalSingleLine(
    leadBody.contactPreference,
    "canal preferido",
    20
  );
  if (contactPreference && !allowedContactPreferences.has(contactPreference)) {
    throw new ValidationError("Canal preferido inválido");
  }

  const message = sanitizeOptionalMultiline(leadBody.message, "mensagem", 1_500);

  return {
    honeypotTriggered: Boolean(honeypot),
    lead: {
      name,
      email,
      phone,
      patrimonio,
      message,
      goal,
      contactPreference,
      timestamp: new Date().toISOString(),
    } satisfies LeadPayload,
  };
}

async function sendLeadToWebhook(lead: LeadPayload) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) return { delivered: false, channel: "webhook" as const };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Webhook respondeu com status ${response.status}`);
  }

  return { delivered: true, channel: "webhook" as const };
}

async function sendLeadWithResend(lead: LeadPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  const from =
    process.env.LEAD_FROM_EMAIL || "Site William Leonel <onboarding@resend.dev>";

  if (!apiKey || !to) return { delivered: false, channel: "resend" as const };

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Novo lead: ${lead.name}`,
      html: formatLeadHtml(lead),
    }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend respondeu com status ${response.status}: ${errorText}`);
  }

  return { delivered: true, channel: "resend" as const };
}

async function validateTurnstileToken(token: string, remoteip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { enabled: false, success: true as const };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  formData.append("idempotency_key", crypto.randomUUID());

  if (remoteip) {
    formData.append("remoteip", remoteip);
  }

  const response = await fetch(turnstileVerifyUrl, {
    method: "POST",
    body: formData,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Turnstile respondeu com status ${response.status}`);
  }

  const result = (await response.json()) as TurnstileVerificationResponse;

  if (!result.success) {
    return {
      enabled: true,
      success: false as const,
      errors: result["error-codes"] ?? [],
    };
  }

  if (result.action && result.action !== "lead_form") {
    return {
      enabled: true,
      success: false as const,
      errors: ["action-mismatch"],
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const expectedHostname = siteUrl ? new URL(siteUrl).hostname : new URL("http://localhost").hostname;
  if (process.env.NODE_ENV === "production" && result.hostname && result.hostname !== expectedHostname) {
    return {
      enabled: true,
      success: false as const,
      errors: ["hostname-mismatch"],
    };
  }

  return {
    enabled: true,
    success: true as const,
  };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    assertAllowedOrigin(request);

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
    if (Number.isFinite(contentLength) && contentLength > MAX_CONTENT_LENGTH) {
      return jsonResponse(
        { error: "O formulário excede o tamanho permitido." },
        413
      );
    }

    const rateLimitKey = parseClientIp(request);
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      );

      return NextResponse.json(
        { error: "Muitas tentativas em sequência. Tente novamente em instantes." },
        {
          status: 429,
          headers: {
            ...jsonHeaders,
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Payload inválido" }, 400);
    }

    const { honeypotTriggered, lead } = parseLeadPayload(body);
    if (honeypotTriggered) {
      return jsonResponse({ success: true });
    }

    const turnstileSecretConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);
    const turnstileToken = sanitizeOptionalSingleLine(
      isObjectRecord(body) ? body.turnstileToken : undefined,
      "turnstile",
      2048
    );

    if (turnstileSecretConfigured && !turnstileToken) {
      return jsonResponse(
        { error: "Confirme a verificação anti-spam antes de enviar." },
        400
      );
    }

    if (turnstileToken) {
      const turnstileVerification = await validateTurnstileToken(
        turnstileToken,
        parseClientIp(request)
      );

      if (!turnstileVerification.success) {
        const expiredToken = turnstileVerification.errors.includes("timeout-or-duplicate");
        return jsonResponse(
          {
            error: expiredToken
              ? "A verificação anti-spam expirou. Confirme novamente para enviar."
              : "Não foi possível validar a verificação anti-spam. Tente novamente.",
          },
          400
        );
      }
    }

    const hasConfiguredDeliveryChannel = Boolean(
      process.env.LEAD_WEBHOOK_URL ||
        (process.env.RESEND_API_KEY && process.env.LEAD_NOTIFICATION_EMAIL)
    );

    const results = await Promise.allSettled([
      sendLeadToWebhook(lead),
      sendLeadWithResend(lead),
    ]);

    const delivered = results.some(
      (result) => result.status === "fulfilled" && result.value.delivered
    );

    if (!delivered) {
      const rejectedReasons = results
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) =>
          result.reason instanceof Error ? result.reason.message : String(result.reason)
        );

      console.error("Falha na entrega do lead:", {
        requestId,
        rejectedReasons,
      });

      if (!hasConfiguredDeliveryChannel && process.env.NODE_ENV === "production") {
        return jsonResponse(
          {
            error:
              "Lead recebido, mas nenhum canal de entrega está configurado. Defina RESEND_API_KEY + LEAD_NOTIFICATION_EMAIL ou LEAD_WEBHOOK_URL.",
          },
          503
        );
      }

      const resendTestingRestriction = rejectedReasons.some((reason) =>
        reason.includes("You can only send testing emails to your own email address")
      );

      if (resendTestingRestriction) {
        return jsonResponse(
          {
            error:
              "O formulário está pronto, mas o envio por e-mail depende da validação final do domínio na Resend. Enquanto essa etapa é concluída, o contato imediato pode ser feito pelo WhatsApp.",
          },
          503
        );
      }

      return jsonResponse(
        {
          error:
            "No momento, não foi possível concluir o envio do formulário. Por favor, tente novamente em instantes ou utilize o WhatsApp.",
        },
        502
      );
    }

    return jsonResponse({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }

    console.error("Erro ao processar lead:", error);
    return jsonResponse(
      { error: "Erro interno do servidor" },
      500
    );
  }
}
