import { NextResponse } from "next/server";

const resendApiUrl = "https://api.resend.com/emails";

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

async function sendLeadToWebhook(lead: LeadPayload) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) return { delivered: false, channel: "webhook" as const };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend respondeu com status ${response.status}: ${errorText}`);
  }

  return { delivered: true, channel: "resend" as const };
}

export async function POST(request: Request) {
  // Diagnóstico temporário — remover após confirmar envio funcionando
  console.log("[lead/route] env check:", {
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    resendKeyLength: process.env.RESEND_API_KEY?.length ?? 0,
    hasNotificationEmail: Boolean(process.env.LEAD_NOTIFICATION_EMAIL),
    hasFromEmail: Boolean(process.env.LEAD_FROM_EMAIL),
    hasWebhookUrl: Boolean(process.env.LEAD_WEBHOOK_URL),
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    const body = await request.json();
    const { name, email, phone, patrimonio, message, goal, contactPreference } = body;

    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: "Nome e ao menos um canal de contato são obrigatórios" },
        { status: 400 }
      );
    }

    const lead = {
      name,
      email,
      phone,
      patrimonio,
      message,
      goal,
      contactPreference,
      timestamp: new Date().toISOString(),
    } satisfies LeadPayload;

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
        .map((result) => String(result.reason));

      console.error("Falha na entrega do lead:", {
        lead,
        rejectedReasons,
      });

      if (!hasConfiguredDeliveryChannel && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            error:
              "Lead recebido, mas nenhum canal de entrega está configurado. Defina RESEND_API_KEY + LEAD_NOTIFICATION_EMAIL ou LEAD_WEBHOOK_URL.",
          },
          { status: 503 }
        );
      }

      const resendTestingRestriction = rejectedReasons.some((reason) =>
        reason.includes("You can only send testing emails to your own email address")
      );

      if (resendTestingRestriction) {
        return NextResponse.json(
          {
            error:
              "O formulário está pronto, mas o envio por e-mail depende da validação final do domínio na Resend. Enquanto essa etapa é concluída, o contato imediato pode ser feito pelo WhatsApp.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error:
            "No momento, não foi possível concluir o envio do formulário. Por favor, tente novamente em instantes ou utilize o WhatsApp.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
