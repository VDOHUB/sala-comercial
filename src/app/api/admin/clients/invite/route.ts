import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getResend, getFrom, emailWrapper } from "@/lib/resend/emails";

// POST — cria cliente e envia convite
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, email, phone, cpf, clientId } = await req.json();

    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 72); // 72h

    let client;
    if (clientId) {
      // Reenviar convite para cliente existente
      client = await prisma.client.update({
        where: { id: clientId },
        data: { inviteToken: token, inviteExpiresAt: expires },
      });
    } else {
      // Criar novo cliente
      if (!name || !email)
        return NextResponse.json({ error: "Nome e e-mail obrigatórios" }, { status: 400 });

      const existing = await prisma.client.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (existing)
        return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });

      client = await prisma.client.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          phone: phone || null,
          cpf:   cpf   || null,
          inviteToken: token,
          inviteExpiresAt: expires,
        },
      });
    }

    const base      = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vdohub.viverdeobra.com";
    const inviteUrl = `${base}/portal/ativar?token=${token}`;

    let emailFailed = false;
    try {
      const resend = getResend();
      await resend.emails.send({
        from: getFrom(),
        to: client.email,
        subject: "Finalize seu cadastro — VDO HUB",
        html: emailWrapper(`
          <p>Olá, ${client.name}!</p>
          <p>Seu cadastro foi criado no <strong>VDO HUB</strong>. Para acessar o portal do cliente e fazer reservas, clique no botão abaixo para finalizar seu cadastro:</p>
          <p><a href="${inviteUrl}" style="background:#1a0e05;color:#f5f0e8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Finalizar cadastro</a></p>
          <p style="color:#666;font-size:12px;">Link válido por 72 horas.</p>
        `),
      });
    } catch (emailErr) {
      console.error("[invite] email send failed:", emailErr);
      emailFailed = true;
    }

    return NextResponse.json({ ok: true, clientId: client.id, emailFailed });
  } catch (err) {
    console.error("[invite] unexpected error:", err);
    return NextResponse.json(
      { error: "Erro interno ao criar cliente. Tente novamente." },
      { status: 500 }
    );
  }
}
