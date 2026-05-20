import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { prisma } from "@/lib/prisma";
import { loginControlId, setControlIdUserActive } from "@/lib/controlid/client";

async function handler(req: NextRequest) {
  const { bookingId } = await req.json() as { bookingId: string };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { client: true },
  });

  if (!booking) {
    console.error(`[access/revoke] booking ${bookingId} not found`);
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const userId = booking.client.controlidUserId;
  if (!userId) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const session = await loginControlId();

    // Verificar se o cliente tem outra reserva ativa agora antes de desativar
    const otherActive = await prisma.booking.findFirst({
      where: {
        clientId: booking.clientId,
        id:       { not: bookingId },
        status:   "ACTIVE",
        startAt:  { lte: new Date() },
        endAt:    { gt: new Date() },
      },
    });

    if (!otherActive) {
      await setControlIdUserActive(session, userId, false);
      console.log(`[access/revoke] user ${userId} deactivated for booking ${bookingId}`);
    } else {
      console.log(`[access/revoke] user ${userId} has another active booking — kept active`);
    }

    await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[access/revoke] error:`, err);
    return NextResponse.json({ error: "iDFace error" }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
