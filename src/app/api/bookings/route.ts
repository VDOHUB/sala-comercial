import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAsaasCustomer, createAsaasCharge, tokenizeAsaasCard } from "@/lib/asaas/client";
import { sendBookingConfirmation, sendSubscriptionConfirmation } from "@/lib/resend/emails";
import { z } from "zod";
import { format, addDays, addMonths } from "date-fns";

// Configuração de planos
const PLANS: Record<string, { label: string; price: number; credits: number; validityMonths: number | null }> = {
  HUB_ONE:     { label: "HUB ONE — 1 período",       price: 300,  credits: 1,  validityMonths: null },
  HUB_FIVE:    { label: "HUB FIVE — 5 períodos",     price: 1200, credits: 5,  validityMonths: 6  },
  HUB_TEN:     { label: "HUB TEN — 10 períodos",     price: 2200, credits: 10, validityMonths: 8  },
  HUB_PARTNER: { label: "HUB PARTNER — 15 períodos", price: 3000, credits: 15, validityMonths: 12 },
};

const cardSchema = z.object({
  holderName:         z.string().min(2),
  number:             z.string().min(13),
  expiryMonth:        z.string().length(2),
  expiryYear:         z.string().min(4),
  ccv:                z.string().min(3),
  postalCode:         z.string().min(8).max(8).optional(),
  addressNumber:      z.string().optional(),
  addressComplement:  z.string().optional(),
  address:            z.string().optional(),
});

const schema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  phone:       z.string().optional(),
  cpf:         z.string().optional(),
  planKey:     z.string(),
  // HUB ONE only
  startAt:     z.string().datetime().optional(),
  endAt:       z.string().datetime().optional(),
  voucherCode:       z.string().optional(),
  installmentCount:  z.number().int().min(1).max(12).optional(),
  card:              cardSchema.optional(),
});

// ── POST /api/bookings ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const plan = PLANS[data.planKey];
  if (!plan) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });

  const isMultiPeriod = plan.credits > 1;

  // HUB ONE precisa de datas
  if (!isMultiPeriod && (!data.startAt || !data.endAt)) {
    return NextResponse.json({ error: "Data e horário obrigatórios para HUB ONE." }, { status: 400 });
  }

  // Verificar conflito (HUB ONE)
  if (!isMultiPeriod && data.startAt && data.endAt) {
    const startAt = new Date(data.startAt);
    const endAt   = new Date(data.endAt);
    const conflict = await prisma.booking.findFirst({
      where: {
        status: { in: ["PENDING", "PAID", "ACTIVE"] },
        OR: [{ startAt: { lt: endAt }, endAt: { gt: startAt } }],
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "Horário indisponível. Por favor escolha outro período." }, { status: 409 });
    }
  }

  // Buscar/criar cliente
  let client = await prisma.client.findUnique({ where: { email: data.email } });
  if (!client) {
    client = await prisma.client.create({
      data: { name: data.name, email: data.email, phone: data.phone, cpf: data.cpf || null },
    });
  } else if (data.cpf && !client.cpf) {
    client = await prisma.client.update({ where: { id: client.id }, data: { cpf: data.cpf } });
  }

  // Calcular valor e desconto (voucher válido para qualquer plano)
  let totalAmount    = plan.price;
  let discountAmount = 0;
  let voucherId: string | undefined;

  if (data.voucherCode) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: data.voucherCode.toUpperCase() },
    });
    const valid = voucher && voucher.active &&
      (!voucher.expiresAt || voucher.expiresAt > new Date()) &&
      (!voucher.maxUses   || voucher.usedCount < voucher.maxUses);

    if (valid && voucher) {
      discountAmount = voucher.discountType === "PERCENTAGE"
        ? totalAmount * (voucher.discountValue / 100)
        : Math.min(voucher.discountValue, totalAmount);
      totalAmount = Math.max(0, totalAmount - discountAmount);
      voucherId   = voucher.id;
    }
  }

  // ── Processar pagamento / tokenização ASAAS (cartão sempre obrigatório) ──
  if (!data.card) {
    return NextResponse.json({ error: "Dados do cartão obrigatórios." }, { status: 400 });
  }

  let chargeId: string | null = null;
  let paymentUrl: string | null = null;

  try {
    // Criar (ou reusar) cliente no ASAAS
    let asaasCustomerId = client.asaasCustomerId;
    if (!asaasCustomerId) {
      const asaasCustomer = await createAsaasCustomer({
        name:     client.name,
        email:    client.email,
        cpfCnpj: client.cpf ?? undefined,
        phone:    client.phone ?? undefined,
      });
      asaasCustomerId = asaasCustomer.id;
      await prisma.client.update({
        where: { id: client.id },
        data:  { asaasCustomerId },
      });
      client = { ...client, asaasCustomerId };
    }

    const cardData = {
      holderName:  data.card.holderName,
      number:      data.card.number.replace(/\s/g, ""),
      expiryMonth: data.card.expiryMonth,
      expiryYear:  data.card.expiryYear,
      ccv:         data.card.ccv,
    };
    const holderInfo = {
      name:              client.name,
      email:             client.email,
      cpfCnpj:          client.cpf ?? "00000000000",
      phone:             client.phone ?? undefined,
      postalCode:        data.card.postalCode ?? undefined,
      addressNumber:     data.card.addressNumber ?? undefined,
      addressComplement: data.card.addressComplement ?? undefined,
      address:           data.card.address ?? undefined,
    };

    if (totalAmount > 0) {
      const installments = (data.installmentCount ?? 1) > 1 ? data.installmentCount : undefined;
      const charge = await createAsaasCharge({
        customer:    asaasCustomerId,
        billingType: "CREDIT_CARD",
        value:       totalAmount,
        dueDate:     format(addDays(new Date(), 1), "yyyy-MM-dd"),
        description: isMultiPeriod
          ? plan.label
          : `Reserva VDO HUB — ${format(new Date(data.startAt!), "dd/MM/yyyy HH:mm")}`,
        installmentCount: installments,
        installmentValue: installments ? Math.ceil((totalAmount / installments) * 100) / 100 : undefined,
        creditCard:           cardData,
        creditCardHolderInfo: holderInfo,
      });
      chargeId   = charge.id;
      paymentUrl = charge.invoiceUrl;
    } else {
      // Valor zero (cupom 100%) — apenas tokenizar o cartão para cobranças futuras
      const tokenResult = await tokenizeAsaasCard({
        customer:             asaasCustomerId,
        creditCard:           cardData,
        creditCardHolderInfo: holderInfo,
      });
      await prisma.client.update({
        where: { id: client.id },
        data:  { asaasCardToken: tokenResult.creditCardToken },
      });
      console.log(`[bookings] card tokenized for client ${client.id}: ${tokenResult.creditCardBrand} ****${tokenResult.creditCardNumber}`);
    }
  } catch (err: unknown) {
    const asaasErrors = (err as { response?: { data?: { errors?: { code: string; description: string }[] } } })
      ?.response?.data?.errors;
    console.error("[bookings] ASAAS error details:", JSON.stringify(asaasErrors ?? err));
    const msg = asaasErrors?.[0]?.description ?? "Cartão recusado. Verifique os dados e tente novamente.";
    return NextResponse.json({ error: msg }, { status: 402 });
  }

  // ── FLUXO MULTI-PERÍODO: cria Subscription ───────────────────────
  if (isMultiPeriod) {
    const expiresAt = addMonths(new Date(), plan.validityMonths!);
    const subscription = await prisma.subscription.create({
      data: {
        clientId:     client.id,
        planKey:      data.planKey,
        totalCredits: plan.credits,
        expiresAt,
        totalAmount,
        asaasChargeId: chargeId,
        status:        "ACTIVE",
      },
    });

    const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vdohub.viverdeobra.com";
    const portalUrl = `${baseUrl}/minha-conta/${subscription.token}`;

    // E-mail enviado APÓS cadastro facial (PATCH /api/bookings/[id]/facial)
    // Retorna token para o frontend finalizar o facial e depois enviar o e-mail
    return NextResponse.json({
      subscriptionId: subscription.id,
      subscriptionToken: subscription.token,
      planLabel:   plan.label,
      credits:     plan.credits,
      expiresAt:   expiresAt.toISOString(),
      portalUrl,
      isMultiPeriod: true,
      free: totalAmount === 0,
    });
  }

  // ── FLUXO HUB ONE: cria Booking ──────────────────────────────────
  const startAt = new Date(data.startAt!);
  const endAt   = new Date(data.endAt!);
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
      status:          "PAID",
      paidAt:          new Date(),
    },
  });

  if (voucherId) {
    await prisma.voucher.update({ where: { id: voucherId }, data: { usedCount: { increment: 1 } } });
  }

  return NextResponse.json({
    bookingId:     booking.id,
    totalAmount,
    discountAmount,
    free:          totalAmount === 0,
    isMultiPeriod: false,
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
          lt:  new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
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
