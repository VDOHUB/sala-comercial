import { NextResponse } from "next/server";
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
