import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/subscriptions/[token] — dados da assinatura + bookings
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const subscription = await prisma.subscription.findUnique({
    where: { token },
    include: {
      client: { select: { name: true, email: true } },
      bookings: {
        orderBy: { startAt: "asc" },
        select: { id: true, startAt: true, endAt: true, status: true },
      },
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
  }

  // Verificar/atualizar expiração
  if (subscription.status === "ACTIVE" && subscription.expiresAt < new Date()) {
    await prisma.subscription.update({ where: { token }, data: { status: "EXPIRED" } });
    subscription.status = "EXPIRED";
  }

  return NextResponse.json(subscription);
}
