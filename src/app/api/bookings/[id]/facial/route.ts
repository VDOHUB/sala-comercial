import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation } from "@/lib/resend/emails";

// PATCH /api/bookings/[id]/facial — salva foto e envia e-mail
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { photoBase64 } = await req.json();

  if (!photoBase64) {
    return NextResponse.json({ error: "Foto não enviada" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
  }

  // Salva foto no cadastro do cliente
  await prisma.client.update({
    where: { id: booking.clientId },
    data: { facePhoto: photoBase64 },
  });

  // Envia e-mail de confirmação
  try {
    await sendBookingConfirmation({
      to: booking.client.email,
      clientName: booking.client.name,
      startAt: booking.startAt,
      endAt: booking.endAt,
      totalAmount: booking.totalAmount,
      paymentUrl: booking.asaasPaymentUrl ?? undefined,
    });
  } catch (err) {
    console.error("[facial] email error:", err);
    // Não falha a requisição por erro de email
  }

  return NextResponse.json({ ok: true });
}
