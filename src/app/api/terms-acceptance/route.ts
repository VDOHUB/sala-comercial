import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/terms-acceptance — público, registra aceite dos termos
export async function POST(req: NextRequest) {
  const { clientName, clientEmail, clientPhone } = await req.json() as {
    clientName: string; clientEmail: string; clientPhone?: string;
  };

  if (!clientName || !clientEmail) {
    return NextResponse.json({ error: "Dados insuficientes." }, { status: 400 });
  }

  const ip        = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  await prisma.termsAcceptance.create({
    data: { clientName, clientEmail, clientPhone, ipAddress: ip, userAgent },
  });

  return NextResponse.json({ ok: true });
}
