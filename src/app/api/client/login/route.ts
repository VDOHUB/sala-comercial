import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signClientToken } from "@/lib/clientAuth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!client || !client.password)
    return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });

  const valid = await bcrypt.compare(password, client.password);
  if (!valid)
    return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });

  const token = signClientToken(client.id);
  const res   = NextResponse.json({ ok: true, name: client.name });
  res.cookies.set("client_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
