import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAsaasCustomer, createAsaasCharge } from "@/lib/asaas/client";
import { sendBookingConfirmation } from "@/lib/resend/emails";
import { z } from "zod";
import { format, addDays } from "date-fns";

const schema = z.object({
  name:         z.string().min(2),
  email:        z.string().email(),
  phone:        z.string().optional(),
  cpf:          z.string().optional(),
  startAt:      z.string().datetime(),
  endAt:        z.string().datetime(),
  billingType:  z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
  voucherCode:  z.string().optional(),
  photoBase64:  z.string().optional(), // foto para facial
});

// ── POST /api/bookings — criar reserva ────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt   = new Date(data.endAt);

  // Verificar conflito de horário
  const conflict = await prisma.booking.findFirst({
    where: {
      status: { in: ["PENDING", "PAID", "ACTIVE"] },
      OR: [
        { startAt: { lt: endAt }, endAt: { gt: startAt } },
      ],
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "Horário indisponível. Por favor escolha outro período." },
      { status: 409 }
    );
  }

  // Buscar/criar cliente
  let client = await prisma.client.findUnique({ where: { email: data.email } });
  if (!client) {
    client = await prisma.client.create({
      data: { name: data.name, email: data.email, phone: data.phone, cpf: data.cpf },
    });
  }

  // Calcular valor (regra: R$/hora — ajustar conforme cliente)
  const PRICE_PER_HOUR = 50; // R$ por hora
  const hours = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
  let totalAmount = hours * PRICE_PER_HOUR;
  let discountAmount = 0;
  let voucherId: string | undefined;

  // Aplicar voucher
  if (data.voucherCode) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: data.voucherCode.toUpperCase() },
    });

    const valid =
      voucher &&
      voucher.active &&
      (!voucher.expiresAt || voucher.expiresAt > new Date()) &&
      (!voucher.maxUses || voucher.usedCount < voucher.maxUses);

    if (valid && voucher) {
      discountAmount =
        voucher.discountType === "PERCENTAGE"
          ? totalAmount * (voucher.discountValue / 100)
          : Math.min(voucher.discountValue, totalAmount);

      totalAmount = Math.max(0, totalAmount - discountAmount);
      voucherId = voucher.id;
    }
  }

  // Criar cobrança no ASAAS
  const asaasCustomer = await createAsaasCustomer({
    name: client.name,
    email: client.email,
    cpfCnpj: client.cpf ?? undefined,
    phone: client.phone ?? undefined,
  });

  const charge = await createAsaasCharge({
    customer: asaasCustomer.id,
    billingType: data.billingType,
    value: totalAmount,
    dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    description: `Reserva sala comercial — ${format(startAt, "dd/MM/yyyy HH:mm")} a ${format(endAt, "HH:mm")}`,
  });

  // Criar booking
  const booking = await prisma.booking.create({
    data: {
      clientId:      client.id,
      startAt,
      endAt,
      totalAmount,
      discountAmount,
      voucherId,
      asaasChargeId: charge.id,
      asaasPaymentUrl: charge.invoiceUrl,
      status: "PENDING",
    },
  });

  // Incrementar uso do voucher
  if (voucherId) {
    await prisma.voucher.update({
      where: { id: voucherId },
      data: { usedCount: { increment: 1 } },
    });
  }

  // Enviar email de confirmação
  await sendBookingConfirmation({
    to: client.email,
    clientName: client.name,
    startAt,
    endAt,
    totalAmount,
    paymentUrl: charge.invoiceUrl,
  });

  return NextResponse.json({
    bookingId: booking.id,
    paymentUrl: charge.invoiceUrl,
    totalAmount,
    discountAmount,
  });
}

// ── GET /api/bookings?month=YYYY-MM — slots ocupados ─────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // ex: "2026-05"

  const activeStatuses = ["PENDING", "PAID", "ACTIVE"] as ("PENDING" | "PAID" | "ACTIVE")[];

  const where = month
    ? {
        startAt: {
          gte: new Date(`${month}-01`),
          lt:  new Date(
            new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)
          ),
        },
        status: { in: activeStatuses },
      }
    : { status: { in: activeStatuses } };

  const bookings = await prisma.booking.findMany({
    where,
    select: { startAt: true, endAt: true, status: true },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(bookings);
}
