import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signClientToken } from "@/lib/clientAuth";
import { getResend, getFrom, emailWrapper } from "@/lib/resend/emails";

// GET — valida token de convite
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

  const client = await prisma.client.findFirst({
    where: {
      inviteToken: token,
      inviteExpiresAt: { gt: new Date() },
    },
  });
  if (!client) return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });

  return NextResponse.json({ ok: true, name: client.name, email: client.email });
}

// POST — ativa conta (define senha)
export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password)
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const client = await prisma.client.findFirst({
    where: {
      inviteToken: token,
      inviteExpiresAt: { gt: new Date() },
    },
  });
  if (!client) return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  await prisma.client.update({
    where: { id: client.id },
    data: { password: hash, inviteToken: null, inviteExpiresAt: null },
  });

  // Enviar email com credenciais
  const resend = getResend();
  if (resend) {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vdohub.viverdeobra.com";
    await resend.emails.send({
      from: getFrom(),
      to: client.email,
      subject: "Cadastro concluído — VDO HUB",
      html: emailWrapper(`
        <p>Olá, ${client.name}!</p>
        <p>Seu cadastro no <strong>VDO HUB</strong> foi concluído com sucesso!</p>
        <p><strong>Seus dados de acesso:</strong></p>
        <ul>
          <li><strong>E-mail:</strong> ${client.email}</li>
          <li><strong>Senha:</strong> a que você definiu agora</li>
        </ul>
        <p><a href="${base}/portal" style="background:#1a0e05;color:#f5f0e8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Acessar Portal do Cliente</a></p>
      `),
    });
  }

  const sessionToken = signClientToken(client.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("client_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
