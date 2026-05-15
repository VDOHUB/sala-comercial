import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  code:          z.string().min(3).max(20).toUpperCase(),
  description:   z.string().optional(),
  discountType:  z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  maxUses:       z.number().int().positive().optional().nullable(),
  expiresAt:     z.string().optional().nullable(),
});

// GET — listar vouchers
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vouchers = await prisma.voucher.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vouchers);
}

// POST — criar voucher
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { code, description, discountType, discountValue, maxUses, expiresAt } = parsed.data;

  const exists = await prisma.voucher.findUnique({ where: { code } });
  if (exists) {
    return NextResponse.json({ error: "Código já existe." }, { status: 409 });
  }

  const voucher = await prisma.voucher.create({
    data: {
      code,
      description,
      discountType,
      discountValue,
      maxUses:   maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(voucher, { status: 201 });
}
