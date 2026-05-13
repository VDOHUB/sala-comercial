import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createControlIdUser } from "@/lib/control-id/client";
import { sendAccessGranted } from "@/lib/resend/emails";

export async function POST(req: NextRequest) {
  // Valida token secreto do webhook
  const token = req.headers.get("asaas-access-token");
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { event, payment } = body;

  // Só nos interessa pagamento confirmado
  if (event !== "PAYMENT_RECEIVED" && event !== "PAYMENT_CONFIRMED") {
    return NextResponse.json({ ok: true });
  }

  const booking = await prisma.booking.findUnique({
    where: { asaasChargeId: payment.id },
    include: { client: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== "PENDING") {
    return NextResponse.json({ ok: true }); // idempotência
  }

  try {
    // 1. Criar usuário na fechadura Control iD
    const controlIdUserId = await createControlIdUser({
      name: booking.client.name,
      email: booking.client.email,
      photoBase64: "", // será preenchido com a foto do cliente
      startTime: booking.startAt,
      endTime: booking.endAt,
    });

    // 2. Atualizar booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        controlIdUserId,
        accessGrantedAt: new Date(),
      },
    });

    // 3. Registrar log
    await prisma.accessLog.create({
      data: {
        bookingId: booking.id,
        event: "GRANTED",
        details: `Usuário Control iD criado: ${controlIdUserId}`,
      },
    });

    // 4. Enviar email de acesso liberado
    await sendAccessGranted({
      to: booking.client.email,
      clientName: booking.client.name,
      startAt: booking.startAt,
      endAt: booking.endAt,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ASAAS WEBHOOK ERROR]", err);

    await prisma.accessLog.create({
      data: {
        bookingId: booking.id,
        event: "ERROR",
        details: String(err),
      },
    });

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
