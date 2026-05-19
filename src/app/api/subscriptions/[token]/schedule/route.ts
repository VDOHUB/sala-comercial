import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/subscriptions/[token]/schedule — usa 1 crédito e cria reserva
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token }          = await params;
  const { startAt, endAt } = await req.json();

  if (!startAt || !endAt) {
    return NextResponse.json({ error: "Data e horário obrigatórios." }, { status: 400 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { token },
    include: { client: true },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 404 });
  }

  if (subscription.status !== "ACTIVE") {
    return NextResponse.json({ error: "Assinatura inativa ou expirada." }, { status: 403 });
  }

  if (subscription.expiresAt < new Date()) {
    await prisma.subscription.update({ where: { token }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Assinatura expirada." }, { status: 403 });
  }

  if (subscription.usedCredits >= subscription.totalCredits) {
    return NextResponse.json({ error: "Todos os créditos já foram utilizados." }, { status: 403 });
  }

  const start = new Date(startAt);
  const end   = new Date(endAt);

  // Verificar conflito
  const conflict = await prisma.booking.findFirst({
    where: {
      status: { in: ["PENDING", "PAID", "ACTIVE"] },
      OR: [{ startAt: { lt: end }, endAt: { gt: start } }],
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "Horário indisponível. Escolha outro período." }, { status: 409 });
  }

  // Criar reserva e debitar crédito atomicamente
  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        clientId:       subscription.clientId,
        subscriptionId: subscription.id,
        startAt:        start,
        endAt:          end,
        totalAmount:    0,
        discountAmount: 0,
        status:         "PAID",
      },
    }),
    prisma.subscription.update({
      where: { id: subscription.id },
      data:  { usedCredits: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ bookingId: booking.id });
}
