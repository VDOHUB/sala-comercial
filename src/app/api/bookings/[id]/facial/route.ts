import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendSubscriptionConfirmation } from "@/lib/resend/emails";

// PATCH /api/bookings/[id]/facial — salva foto e envia e-mail
// [id] pode ser bookingId (HUB ONE) ou subscriptionId (multi-período)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body   = await req.json();
  const { photoBase64, isSubscription, portalUrl, planLabel, credits, expiresAt } = body;

  if (!photoBase64) {
    return NextResponse.json({ error: "Foto não enviada" }, { status: 400 });
  }

  // ── Assinatura multi-período ──────────────────────────────────────
  if (isSubscription) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!subscription) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

    await prisma.client.update({
      where: { id: subscription.clientId },
      data:  { facePhoto: photoBase64 },
    });

    try {
      await sendSubscriptionConfirmation({
        to:           subscription.client.email,
        clientName:   subscription.client.name,
        planLabel:    planLabel ?? subscription.planKey,
        totalCredits: credits   ?? subscription.totalCredits,
        expiresAt:    expiresAt ? new Date(expiresAt) : subscription.expiresAt,
        portalUrl:    portalUrl ?? `https://vdohub.viverdeobra.com/minha-conta/${subscription.token}`,
      });
    } catch (err) {
      console.error("[facial/subscription] email error:", err);
    }

    return NextResponse.json({ ok: true });
  }

  // ── Reserva única (HUB ONE) ───────────────────────────────────────
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!booking) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });

  await prisma.client.update({
    where: { id: booking.clientId },
    data:  { facePhoto: photoBase64 },
  });

  try {
    await sendBookingConfirmation({
      to:          booking.client.email,
      clientName:  booking.client.name,
      startAt:     booking.startAt,
      endAt:       booking.endAt,
      totalAmount: booking.totalAmount,
      paymentUrl:  booking.asaasPaymentUrl ?? undefined,
    });
  } catch (err) {
    console.error("[facial/booking] email error:", err);
  }

  return NextResponse.json({ ok: true });
}
