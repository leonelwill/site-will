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

function formatLeadHtml(lead: LeadPayload) {
  return `
    <h2>Novo lead do site</h2>
    <p><strong>Nome:</strong> ${lead.name}</p>
    <p><strong>Telefone:</strong> ${lead.phone || "-"}</p>
    <p><strong>E-mail:</strong> ${lead.email || "-"}</p>
    <p><strong>Patrimônio:</strong> ${lead.patrimonio || "-"}</p>
    <p><strong>Objetivo:</strong> ${lead.goal || "-"}</p>
    <p><strong>Canal preferido:</strong> ${lead.contactPreference || "-"}</p>
    <p><strong>Mensagem:</strong> ${lead.message || "-"}</p>
    <p><strong>Recebido em:</strong> ${lead.timestamp}</p>
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
    throw new Error(`Resend respondeu com status ${response.status}`);
  }

  return { delivered: true, channel: "resend" as const };
}

export async function POST(request: Request) {
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

    const results = await Promise.allSettled([
      sendLeadToWebhook(lead),
      sendLeadWithResend(lead),
    ]);

    const delivered = results.some(
      (result) => result.status === "fulfilled" && result.value.delivered
    );

    if (!delivered) {
      console.log("Lead recebido sem canal configurado:", lead);

      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            error:
              "Lead recebido, mas nenhum canal de entrega está configurado. Defina RESEND_API_KEY + LEAD_NOTIFICATION_EMAIL ou LEAD_WEBHOOK_URL.",
          },
          { status: 503 }
        );
      }
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
