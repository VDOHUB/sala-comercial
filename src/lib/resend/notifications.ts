import { Resend } from "resend";
import { getResend, getFrom, emailWrapper } from "./emails";

// -- Notificacao admin: solicitacao de cancelamento
export async function sendCancellationRequestAdmin(data: {
  adminEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  reason?: string;
}) {
  const phoneRow = data.clientPhone
    ? "<tr><td style=\"font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);\">Telefone</td>"
      + "<td align=\"right\" style=\"font-size:13px;color:#1a0e05;padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);\">" + data.clientPhone + "</td></tr>"
    : "";
  const reasonRow = data.reason
    ? "<tr><td style=\"font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;\">Motivo</td>"
      + "<td align=\"right\" style=\"font-size:13px;color:#1a0e05;padding:8px 0;\">" + data.reason + "</td></tr>"
    : "";

  const content = "<h2 style=\"margin:0 0 8px;font-size:20px;font-weight:800;color:#1a0e05;\">Solicitacao de cancelamento</h2>"
    + "<p style=\"margin:0 0 20px;font-size:14px;color:rgba(26,14,5,0.5);\">Um cliente solicitou o cancelamento de sua reserva/plano.</p>"
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:rgba(26,14,5,0.04);border-radius:12px;padding:16px;border:1px solid rgba(26,14,5,0.07);\">"
    + "<tr><td style=\"font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);\">Nome</td>"
    + "<td align=\"right\" style=\"font-size:13px;font-weight:600;color:#1a0e05;padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);\">" + data.clientName + "</td></tr>"
    + "<tr><td style=\"font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);\">E-mail</td>"
    + "<td align=\"right\" style=\"font-size:13px;color:#1a0e05;padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);\">" + data.clientEmail + "</td></tr>"
    + phoneRow + reasonRow
    + "</table>"
    + "<p style=\"margin:20px 0 0;font-size:12px;color:rgba(26,14,5,0.4);text-align:center;\">Acesse o painel admin para gerenciar esta solicitacao.</p>";

  return getResend().emails.send({
    from:    getFrom(),
    to:      data.adminEmail,
    subject: "VDO HUB - Cancelamento solicitado: " + data.clientName,
    html:    emailWrapper(content),
  });
}

// -- Confirmacao de reserva com foto da sala
export async function sendBookingConfirmationWithPhoto(data: {
  to: string;
  clientName: string;
  startAt: Date;
  endAt: Date;
  totalAmount: number;
  paymentUrl?: string;
  roomPhotoUrl?: string;
}) {
  const start  = data.startAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });
  const end    = data.endAt.toLocaleString("pt-BR",   { timeZone: "America/Sao_Paulo", timeStyle: "short" });
  const isFree = data.totalAmount === 0;
  const amount = isFree ? "Gratuito" : "R$ " + data.totalAmount.toFixed(2);
  const amtColor = isFree ? "#16a34a" : "#1a0e05";

  const photoHtml = data.roomPhotoUrl
    ? "<div style=\"margin-bottom:20px;border-radius:12px;overflow:hidden;\"><img src=\"" + data.roomPhotoUrl + "\" alt=\"VDO HUB\" style=\"width:100%;display:block;border-radius:12px;\" /></div>"
    : "";

  const paymentHtml = data.paymentUrl
    ? "<div style=\"margin-top:24px;\"><a href=\"" + data.paymentUrl + "\" style=\"display:block;text-align:center;background:#1a0e05;color:#f5f0e8;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;\">Realizar pagamento</a></div>"
    : "<div style=\"margin-top:24px;padding:14px;background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.2);border-radius:12px;text-align:center;\"><span style=\"font-size:13px;font-weight:600;color:#166534;\">Acesso liberado - apresente seu rosto a fechadura</span></div>";

  const content = "<h2 style=\"margin:0 0 8px;font-size:20px;font-weight:800;color:#1a0e05;\">Reserva confirmada</h2>"
    + "<p style=\"margin:0 0 20px;font-size:14px;color:rgba(26,14,5,0.5);\">Ola, <strong style=\"color:#1a0e05;\">" + data.clientName + "</strong>! Sua reserva foi registrada com sucesso.</p>"
    + photoHtml
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:rgba(26,14,5,0.04);border-radius:12px;padding:16px;border:1px solid rgba(26,14,5,0.07);\">"
    + "<tr><td style=\"font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);\">Data e horario</td>"
    + "<td align=\"right\" style=\"font-size:13px;font-weight:600;color:#1a0e05;padding:8px 0;border-bottom:1px solid rgba(26,14,5,0.06);\">" + start + " ate " + end + "</td></tr>"
    + "<tr><td style=\"font-size:12px;color:rgba(26,14,5,0.4);padding:8px 0;\">Total cobrado</td>"
    + "<td align=\"right\" style=\"font-size:13px;font-weight:700;color:" + amtColor + ";padding:8px 0;\">" + amount + "</td></tr>"
    + "</table>"
    + paymentHtml
    + "<p style=\"margin:20px 0 0;font-size:12px;color:rgba(26,14,5,0.35);text-align:center;\">Duvidas? WhatsApp (62) 99633-2257</p>";

  return getResend().emails.send({
    from:    getFrom(),
    to:      data.to,
    subject: "VDO HUB - Reserva confirmada",
    html:    emailWrapper(content),
  });
}
