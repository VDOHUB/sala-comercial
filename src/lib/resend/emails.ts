import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM!;

// ── Confirmação de reserva ────────────────────────────────────────
export async function sendBookingConfirmation(data: {
  to: string;
  clientName: string;
  startAt: Date;
  endAt: Date;
  totalAmount: number;
  paymentUrl: string;
}) {
  const start = data.startAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const end   = data.endAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: "Reserva confirmada — Sala Comercial",
    html: `
      <h2>Olá, ${data.clientName}!</h2>
      <p>Sua reserva foi registrada com sucesso.</p>
      <ul>
        <li><strong>Entrada:</strong> ${start}</li>
        <li><strong>Saída:</strong> ${end}</li>
        <li><strong>Total:</strong> R$ ${data.totalAmount.toFixed(2)}</li>
      </ul>
      <p><a href="${data.paymentUrl}">Clique aqui para realizar o pagamento</a></p>
    `,
  });
}

// ── Acesso liberado ───────────────────────────────────────────────
export async function sendAccessGranted(data: {
  to: string;
  clientName: string;
  startAt: Date;
  endAt: Date;
}) {
  const start = data.startAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const end   = data.endAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: "Seu acesso está liberado!",
    html: `
      <h2>Olá, ${data.clientName}!</h2>
      <p>Pagamento confirmado! Seu acesso à sala está liberado.</p>
      <ul>
        <li><strong>Entrada:</strong> ${start}</li>
        <li><strong>Saída:</strong> ${end}</li>
      </ul>
      <p>Aproxime seu rosto à fechadura para entrar. Bom trabalho!</p>
    `,
  });
}

// ── Lembrete 24h antes ────────────────────────────────────────────
export async function sendReminder(data: {
  to: string;
  clientName: string;
  startAt: Date;
}) {
  const start = data.startAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: "Lembrete: sua reserva é amanhã",
    html: `
      <h2>Olá, ${data.clientName}!</h2>
      <p>Lembrando que sua reserva está marcada para <strong>${start}</strong>.</p>
      <p>Até lá!</p>
    `,
  });
}
