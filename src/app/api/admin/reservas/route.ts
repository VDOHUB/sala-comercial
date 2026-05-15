import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 20;

  const where = status ? { status: status as never } : {};

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { client: true, voucher: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({ bookings, total, pages: Math.ceil(total / limit) });
}
