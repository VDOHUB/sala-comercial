import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";
import { sendSessionEndingReminder } from "@/lib/resend/emails";

export async function POST(req: NextRequest) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey:    process.env.QSTASH_NEXT_SIGNING_KEY!,
  });
  const body      = await req.text();
  const signature = req.headers.get("upstash-signature") ?? "";
  const valid     = await receiver.verify({ signature, body }).catch(() => false);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId, minutesLeft } = JSON.parse(body) as { bookingId: string; minutesLeft: number };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { client: true },
  });

  if (!booking || booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await sendSessionEndingReminder({
      to:          booking.client.email,
      clientName:  booking.client.name,
      endAt:       booking.endAt,
      minutesLeft,
    });
    console.log(`[session-ending] sent ${minutesLeft}min reminder for booking ${bookingId}`);
  } catch (err) {
    console.error(`[session-ending] email error:`, err);
  }

  return NextResponse.json({ ok: true });
}
