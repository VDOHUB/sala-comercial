import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";
import { loginControlId, disableControlIdUser } from "@/lib/controlid/client";

export async function POST(req: NextRequest) {
  // Verificar assinatura do QStash em runtime (não no build)
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey:    process.env.QSTASH_NEXT_SIGNING_KEY!,
  });

  const body = await req.text();
  const signature = req.headers.get("upstash-signature") ?? "";

  const valid = await receiver.verify({ signature, body }).catch(() => false);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = JSON.parse(body) as { bookingId: string };

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

    // Verificar se o cliente tem outra reserva ativa antes de desativar
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
      await disableControlIdUser(session, userId);
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
