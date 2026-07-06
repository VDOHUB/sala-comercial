import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getResend, getFrom, emailWrapper } from "@/lib/resend/emails";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true }); // silencioso por segurança

  const client = await prisma.client.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!client || !client.password) return NextResponse.json({ ok: true });

  const token   = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h

  await prisma.client.update({
    where: { id: client.id },
    data: { passwordResetToken: token, passwordResetExpiresAt: expires },
  });

  const base    = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vdohub.viverdeobra.com";
  const resetUrl = `${base}/portal/redefinir-senha?token=${token}`;

  const resend = getResend();
  if (resend) {
    await resend.emails.send({
      from: getFrom(),
      to: client.email,
      subject: "Redefinição de senha — VDO HUB",
      html: emailWrapper(`
        <p>Olá, ${client.name}!</p>
        <p>Recebemos uma solicitação para redefinir sua senha do Portal VDO HUB.</p>
        <p><a href="${resetUrl}" style="background:#1a0e05;color:#f5f0e8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Redefinir senha</a></p>
        <p style="color:#666;font-size:12px;">Link válido por 1 hora. Se não foi você, ignore este e-mail.</p>
      `),
    });
  }

  return NextResponse.json({ ok: true });
}
