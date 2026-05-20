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
    console.error(`[access/grant] booking ${bookingId} not found`);
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    console.log(`[access/grant] booking ${bookingId} cancelled — skipping`);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const userId = booking.client.controlidUserId;
  if (!userId) {
    console.warn(`[access/grant] client ${booking.client.id} has no controlidUserId`);
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const session = await loginControlId();
    await setControlIdUserActive(session, userId, true);
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "ACTIVE" } });
    console.log(`[access/grant] user ${userId} activated for booking ${bookingId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[access/grant] error:`, err);
    return NextResponse.json({ error: "iDFace error" }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
