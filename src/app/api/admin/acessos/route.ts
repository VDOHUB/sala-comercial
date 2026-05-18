import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.accessLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      booking: {
        include: { client: true },
      },
    },
  });

  // Normalize field names for the frontend
  const normalized = logs.map((log) => ({
    id: log.id,
    action: log.event,
    createdAt: log.createdAt,
    booking: log.booking
      ? {
          client: { name: log.booking.client.name, email: log.booking.client.email },
          startAt: log.booking.startAt,
          endAt: log.booking.endAt,
        }
      : null,
  }));

  return NextResponse.json(normalized);
}
