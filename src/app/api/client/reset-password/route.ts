import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signClientToken } from "@/lib/clientAuth";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password)
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const client = await prisma.client.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });
  if (!client)
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  await prisma.client.update({
    where: { id: client.id },
    data: { password: hash, passwordResetToken: null, passwordResetExpiresAt: null },
  });

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
