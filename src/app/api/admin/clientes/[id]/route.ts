import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { startAt: "desc" },
        include: { voucher: { select: { code: true } } },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { bookings: true } } },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(body.name  !== undefined && { name:  body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.cpf   !== undefined && { cpf:   body.cpf   || null }),
    },
  });
  return NextResponse.json(client);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verifica se tem reservas ativas ou pagas antes de excluir
  const active = await prisma.booking.findFirst({
    where: { clientId: id, status: { in: ["PENDING", "PAID", "ACTIVE"] } },
  });
  if (active) {
    return NextResponse.json(
      { error: "Este cliente tem reservas ativas. Cancele-as antes de excluir." },
      { status: 422 }
    );
  }

  // Exclui em cascata: accessLogs → consumableSales → bookings → subscriptions → client
  await prisma.accessLog.deleteMany({ where: { booking: { clientId: id } } });
  await prisma.consumableSale.deleteMany({ where: { clientId: id } });
  await prisma.booking.deleteMany({ where: { clientId: id } });
  await prisma.subscription.deleteMany({ where: { clientId: id } });
  await prisma.client.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
