import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = await getClientSession();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [bookings, subscriptions, consumables] = await Promise.all([
    prisma.booking.findMany({
      where: { clientId: client.id },
      orderBy: { startAt: "desc" },
      take: 20,
    }),
    prisma.subscription.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consumableSale.findMany({
      where: { clientId: client.id },
      include: { consumable: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    cpf: client.cpf,
    hasFace: !!client.facePhoto,
    hasCard: !!client.asaasCardToken,
    cardLast4: client.asaasCardLast4,
    cardBrand: client.asaasCardBrand,
    bookings,
    subscriptions,
    consumables,
  });
}
