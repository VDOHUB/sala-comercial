import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sessões ativas agora
  const activeSessions = await prisma.booking.findMany({
    where: { status: "ACTIVE" },
    orderBy: { startAt: "asc" },
    include: { client: true },
  });

  // Histórico de entradas (apenas GRANTED)
  const logs = await prisma.accessLog.findMany({
    where: { event: "GRANTED" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { booking: { include: { client: true } } },
  });

  return NextResponse.json({
    activeSessions: activeSessions.map((b) => ({
      id:           b.id,
      startAt:      b.startAt,
      endAt:        b.endAt,
      totalAmount:  b.totalAmount,
      client: {
        id:    b.client.id,
        name:  b.client.name,
        email: b.client.email,
        phone: b.client.phone,
        facePhoto:       b.client.facePhoto,
        asaasCardToken:  b.client.asaasCardToken,
        asaasCustomerId: b.client.asaasCustomerId,
      },
    })),
    logs: logs.map((log) => ({
      id:        log.id,
      createdAt: log.createdAt,
      booking:   log.booking ? {
        client:  { name: log.booking.client.name, email: log.booking.client.email },
        startAt: log.booking.startAt,
        endAt:   log.booking.endAt,
      } : null,
    })),
  });
}
