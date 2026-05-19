import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Remetente com nome exibido: "VDO HUB <noreply@...>"
const FROM = `VDO HUB <${process.env.EMAIL_FROM}>`;

// ── Template base ─────────────────────────────────────────────────
function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ebe2;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe2;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo / Header -->
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;
            width:52px;height:52px;border-radius:14px;background:#1a0e05;margin-bottom:12px;">
            <span style="font-size:14px;font-weight:800;color:#f5f0e8;letter-spacing:1px;">VDO</span>
          </div>
          <div style="font-size:22px;font-weight:800;color:#1a0e05;letter-spacing:-0.5px;">VDO HUB</div>
          <div style="font-size:12px;color:rgba(26,14,5,0.4);margin-top:4px;">Sala Comercial · Anápolis, GO</div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#faf7f2;border-radius:20px;padding:32px;
          border:1px solid rgba(26,14,5,0.08);box-shadow:0 4px 24px rgba(26,14,5,0.06);">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="font-size:11px;color:rgba(26,14,5,0.3);margin:0;">
            VDO HUB · Galeria Nazir, Av. São Francisco de Assis, 181, 2º piso, sala 03 · Anápolis, GO
          </p>
          <p style="font-size:11px;color:rgba(26,14,5,0.25);margin:6px 0 0;">
            Dúvidas? WhatsApp (62) 99633-2257
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Confirmação de reserva ────────────────────────────────────────
export async function sendBookingConfirmation(data: {
  to: string;
  clientName: string;
  startAt: Date;
  endAt: Date;
  totalAmount: number;
  paymentUrl?: string;
}) {
  const start = data.startAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });
  const end   = data.endAt.toLocaleString("pt-BR",   { timeZone: "America/Sao_Paulo", timeStyle: "short" });
  const isFree = data.totalAmount === 0;

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a0e05;">
      Reserva confirmada ✓
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(26,14,5,0.5);">
      Olá, <strong style="color:#1a0e05;">${data.clientName}</strong>! Sua reserva foi registrada com sucesso.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:rgba(26,14,5,0.04);border-radius:12px;padding:16px;border:1px solid rgba(26,14,5,0.07);">
      <tr>
        <td style="font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);">
          📅 Data e horário
        </td>
        <td align="right" style="font-size:13px;font-weight:600;color:#1a0e05;padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);">
          ${start} — ${end}
        </td>
      </tr>
      <tr>
        <td style="font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;">
          💳 Total cobrado
        </td>
        <td align="right" style="font-size:13px;font-weight:700;padding:8px 0;"
          style="color:${isFree ? "#16a34a" : "#1a0e05"};">
          ${isFree ? "Gratuito" : `R$ ${data.totalAmount.toFixed(2)}`}
        </td>
      </tr>
    </table>

    ${data.paymentUrl ? `
    <div style="margin-top:24px;">
      <a href="${data.paymentUrl}"
        style="display:block;text-align:center;background:#1a0e05;color:#f5f0e8;
        padding:14px 24px;border-radius:12px;font-size:14px;font-weight:700;
        text-decoration:none;">
        Realizar pagamento →
      </a>
    </div>` : `
    <div style="margin-top:24px;padding:14px;background:rgba(22,163,74,0.08);
      border:1px solid rgba(22,163,74,0.2);border-radius:12px;text-align:center;">
      <span style="font-size:13px;font-weight:600;color:#166534;">
        ✓ Acesso liberado — apresente seu rosto à fechadura
      </span>
    </div>`}

    <p style="margin:24px 0 0;font-size:12px;color:rgba(26,14,5,0.35);text-align:center;">
      Seu acesso facial já está cadastrado no sistema.
    </p>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: "VDO HUB — Reserva confirmada",
    html:    emailWrapper(content),
  });
}

// ── Acesso liberado (webhook pós-pagamento) ───────────────────────
export async function sendAccessGranted(data: {
  to: string;
  clientName: string;
  startAt: Date;
  endAt: Date;
}) {
  const start = data.startAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });
  const end   = data.endAt.toLocaleString("pt-BR",   { timeZone: "America/Sao_Paulo", timeStyle: "short" });

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a0e05;">
      Acesso liberado ✓
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(26,14,5,0.5);">
      Olá, <strong style="color:#1a0e05;">${data.clientName}</strong>! Pagamento confirmado.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:rgba(26,14,5,0.04);border-radius:12px;padding:16px;border:1px solid rgba(26,14,5,0.07);">
      <tr>
        <td style="font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;">📅 Horário</td>
        <td align="right" style="font-size:13px;font-weight:600;color:#1a0e05;padding:8px 0;">
          ${start} — ${end}
        </td>
      </tr>
    </table>
    <div style="margin-top:24px;padding:14px;background:rgba(22,163,74,0.08);
      border:1px solid rgba(22,163,74,0.2);border-radius:12px;text-align:center;">
      <span style="font-size:13px;font-weight:600;color:#166534;">
        Aproxime seu rosto à fechadura para entrar. Bom trabalho!
      </span>
    </div>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: "VDO HUB — Seu acesso está liberado",
    html:    emailWrapper(content),
  });
}

// ── Lembrete 24h antes ────────────────────────────────────────────
export async function sendReminder(data: {
  to: string;
  clientName: string;
  startAt: Date;
}) {
  const start = data.startAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a0e05;">
      Lembrete de reserva 🗓
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:rgba(26,14,5,0.5);">
      Olá, <strong style="color:#1a0e05;">${data.clientName}</strong>!
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(26,14,5,0.6);">
      Sua reserva na VDO HUB está marcada para <strong style="color:#1a0e05;">${start}</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:rgba(26,14,5,0.4);">Até lá! 👋</p>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: "VDO HUB — Lembrete: sua reserva é amanhã",
    html:    emailWrapper(content),
  });
}
