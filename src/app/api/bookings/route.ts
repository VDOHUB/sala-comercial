import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAsaasCustomer, createAsaasCharge } from "@/lib/asaas/client";
import { z } from "zod";
import { format, addDays } from "date-fns";

const cardSchema = z.object({
  holderName:  z.string().min(2),
  number:      z.string().min(13),
  expiryMonth: z.string().length(2),
  expiryYear:  z.string().min(4),
  ccv:         z.string().min(3),
});

const schema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  phone:       z.string().optional(),
  cpf:         z.string().optional(),
  startAt:     z.string().datetime(),
  endAt:       z.string().datetime(),
  voucherCode: z.string().optional(),
  card:        cardSchema.optional(), // presente se totalAmount > 0
});

// ── POST /api/bookings — criar reserva ────────────────────────────
export async function POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data    = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt   = new Date(data.endAt);

  // Verificar conflito de horário
  const conflict = await prisma.booking.findFirst({
    where: {
      status: { in: ["PENDING", "PAID", "ACTIVE"] },
      OR: [{ startAt: { lt: endAt }, endAt: { gt: startAt } }],
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
      data: {
        name:  data.name,
        email: data.email,
        phone: data.phone,
        cpf:   data.cpf || null,
      },
    });
  } else if (data.cpf && !client.cpf) {
    // Atualiza CPF se ainda não tinha
    client = await prisma.client.update({
      where: { id: client.id },
      data:  { cpf: data.cpf },
    });
  }

  // Calcular valor base (plano)
  const hours        = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
  const PRICE_PER_HOUR = 60; // R$/hora — ajuste conforme plano
  let totalAmount    = hours * PRICE_PER_HOUR;
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
      (!voucher.maxUses   || voucher.usedCount < voucher.maxUses);

    if (valid && voucher) {
      discountAmount =
        voucher.discountType === "PERCENTAGE"
          ? totalAmount * (voucher.discountValue / 100)
          : Math.min(voucher.discountValue, totalAmount);

      totalAmount = Math.max(0, totalAmount - discountAmount);
      voucherId   = voucher.id;
    }
  }

  // ── Cobrança ASAAS ────────────────────────────────────────────────
  let chargeId: string | null = null;
  let paymentUrl: string | null = null;
  let bookingStatus: "PENDING" | "PAID" = totalAmount === 0 ? "PAID" : "PENDING";

  if (totalAmount > 0) {
    if (!data.card) {
      return NextResponse.json(
        { error: "Dados do cartão obrigatórios para reservas pagas." },
        { status: 400 }
      );
    }

    try {
      const asaasCustomer = await createAsaasCustomer({
        name:     client.name,
        email:    client.email,
        cpfCnpj: client.cpf ?? undefined,
        phone:    client.phone ?? undefined,
      });

      const charge = await createAsaasCharge({
        customer:    asaasCustomer.id,
        billingType: "CREDIT_CARD",
        value:       totalAmount,
        dueDate:     format(addDays(new Date(), 1), "yyyy-MM-dd"),
        description: `Reserva sala comercial — ${format(startAt, "dd/MM/yyyy HH:mm")} a ${format(endAt, "HH:mm")}`,
        creditCard: {
          holderName:  data.card.holderName,
          number:      data.card.number.replace(/\s/g, ""),
          expiryMonth: data.card.expiryMonth,
          expiryYear:  data.card.expiryYear,
          ccv:         data.card.ccv,
        },
        creditCardHolderInfo: {
          name:     client.name,
          email:    client.email,
          cpfCnpj: client.cpf ?? "00000000000",
          phone:    client.phone ?? undefined,
        },
      });

      chargeId      = charge.id;
      paymentUrl    = charge.invoiceUrl;
      bookingStatus = "PAID";
    } catch (err: unknown) {
      console.error("[bookings] ASAAS error:", err);
      const msg =
        (err as { response?: { data?: { errors?: { description: string }[] } } })
          ?.response?.data?.errors?.[0]?.description ??
        "Pagamento recusado. Verifique os dados do cartão.";
      return NextResponse.json({ error: msg }, { status: 402 });
    }
  }

  // Criar booking
  const booking = await prisma.booking.create({
    data: {
      clientId:        client.id,
      startAt,
      endAt,
      totalAmount,
      discountAmount,
      voucherId,
      asaasChargeId:   chargeId,
      asaasPaymentUrl: paymentUrl,
      status:          bookingStatus,
    },
  });

  // Incrementar uso do voucher
  if (voucherId) {
    await prisma.voucher.update({
      where: { id: voucherId },
      data:  { usedCount: { increment: 1 } },
    });
  }

  // E-mail é enviado APÓS o cadastro facial (PATCH /api/bookings/[id]/facial)
  return NextResponse.json({
    bookingId:     booking.id,
    totalAmount,
    discountAmount,
    free:          totalAmount === 0,
  });
}

// ── GET /api/bookings?month=YYYY-MM — slots ocupados ─────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

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
