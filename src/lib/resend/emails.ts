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
          <img src="https://vdohub.viverdeobra.com/logo.png"
            alt="VDO HUB" width="100" height="100"
            style="display:block;margin:0 auto 8px;border-radius:12px;" />
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

// ── Aviso de fim de sessão (1h e 30min antes) ────────────────────
export async function sendSessionEndingReminder(data: {
  to: string;
  clientName: string;
  endAt: Date;
  minutesLeft: number;
}) {
  const endTime = data.endAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", timeStyle: "short" });
  const label   = data.minutesLeft >= 60 ? "1 hora" : "30 minutos";

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a0e05;">
      Sua sessão termina em ${label} ⏱
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:rgba(26,14,5,0.5);">
      Olá, <strong style="color:#1a0e05;">${data.clientName}</strong>!
    </p>

    <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:12px;
      padding:16px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:22px;font-weight:800;color:#92400e;">🕐 Encerramento às ${endTime}</p>
      <p style="margin:6px 0 0;font-size:13px;color:rgba(26,14,5,0.5);">
        Faltam aproximadamente <strong>${label}</strong> para o fim do seu período.
      </p>
    </div>

    <p style="margin:0;font-size:13px;color:rgba(26,14,5,0.5);text-align:center;">
      Por favor, organize seus pertences e finalize suas atividades com antecedência.<br>
      Obrigado por usar o VDO HUB! 🙏
    </p>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: `VDO HUB — Sua sessão termina em ${label}`,
    html:    emailWrapper(content),
  });
}

// ── Alerta de falha no cadastro facial ───────────────────────────
export async function sendFacePhotoRetryEmail(data: {
  to: string;
  clientName: string;
  retryUrl: string;
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a0e05;">
      Atenção: foto não reconhecida ⚠️
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:rgba(26,14,5,0.5);">
      Olá, <strong style="color:#1a0e05;">${data.clientName}</strong>!
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(26,14,5,0.65);">
      Não conseguimos validar sua foto no sistema de acesso facial.
      Para garantir sua entrada na sala, precisamos que você tire uma nova foto seguindo as instruções abaixo:
    </p>

    <div style="background:rgba(26,14,5,0.04);border-radius:12px;padding:16px;border:1px solid rgba(26,14,5,0.07);margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a0e05;">📋 Dicas para uma boa foto:</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:rgba(26,14,5,0.6);line-height:1.8;">
        <li>Olhe diretamente para a câmera</li>
        <li>Mantenha o rosto centralizado e bem iluminado</li>
        <li>Não use óculos escuros ou chapéu</li>
        <li>Evite ambientes muito escuros ou com luz atrás de você</li>
      </ul>
    </div>

    <div style="margin-top:8px;">
      <a href="${data.retryUrl}"
        style="display:block;text-align:center;background:#1a0e05;color:#f5f0e8;
        padding:14px 24px;border-radius:12px;font-size:14px;font-weight:700;
        text-decoration:none;">
        Refazer cadastro facial →
      </a>
    </div>

    <p style="margin:16px 0 0;font-size:11px;color:rgba(26,14,5,0.3);text-align:center;">
      Este link é pessoal. Não compartilhe com terceiros.
    </p>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: "VDO HUB — Atualize seu cadastro facial",
    html:    emailWrapper(content),
  });
}

// ── Confirmação de assinatura (planos multi-período) ──────────────
export async function sendSubscriptionConfirmation(data: {
  to: string;
  clientName: string;
  planLabel: string;
  totalCredits: number;
  expiresAt: Date;
  portalUrl: string;
}) {
  const expiry = data.expiresAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "long" });

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a0e05;">
      Assinatura ativada ✓
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(26,14,5,0.5);">
      Olá, <strong style="color:#1a0e05;">${data.clientName}</strong>! Seu plano foi ativado com sucesso.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:rgba(26,14,5,0.04);border-radius:12px;padding:16px;border:1px solid rgba(26,14,5,0.07);">
      <tr>
        <td style="font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);">
          📋 Plano
        </td>
        <td align="right" style="font-size:13px;font-weight:600;color:#1a0e05;padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);">
          ${data.planLabel}
        </td>
      </tr>
      <tr>
        <td style="font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);">
          🎯 Períodos disponíveis
        </td>
        <td align="right" style="font-size:13px;font-weight:700;color:#1a0e05;padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);">
          ${data.totalCredits} períodos
        </td>
      </tr>
      <tr>
        <td style="font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;">
          📅 Válido até
        </td>
        <td align="right" style="font-size:13px;font-weight:600;color:#1a0e05;padding:8px 0;">
          ${expiry}
        </td>
      </tr>
    </table>

    <div style="margin-top:24px;">
      <a href="${data.portalUrl}"
        style="display:block;text-align:center;background:#1a0e05;color:#f5f0e8;
        padding:14px 24px;border-radius:12px;font-size:14px;font-weight:700;
        text-decoration:none;">
        Agendar meus períodos →
      </a>
    </div>

    <p style="margin:16px 0 0;font-size:12px;color:rgba(26,14,5,0.35);text-align:center;">
      Use este link sempre que quiser agendar um novo período. Guarde-o com segurança.
    </p>
  `;

  return resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: `VDO HUB — ${data.planLabel} ativado · ${data.totalCredits} períodos disponíveis`,
    html:    emailWrapper(content),
  });
}
