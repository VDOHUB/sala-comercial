import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/voucher-check?code=TESTE100&amount=300
export async function GET(req: NextRequest) {
  const code   = req.nextUrl.searchParams.get("code");
  const amount = parseFloat(req.nextUrl.searchParams.get("amount") || "0");

  if (!code) return NextResponse.json({ valid: false });

  const voucher = await prisma.voucher.findUnique({
    where: { code: code.toUpperCase() },
  });

  const valid =
    voucher &&
    voucher.active &&
    (!voucher.expiresAt || voucher.expiresAt > new Date()) &&
    (!voucher.maxUses   || voucher.usedCount < voucher.maxUses);

  if (!valid || !voucher) return NextResponse.json({ valid: false });

  const discountAmount =
    voucher.discountType === "PERCENTAGE"
      ? amount * (voucher.discountValue / 100)
      : Math.min(voucher.discountValue, amount);

  return NextResponse.json({
    valid: true,
    discountAmount,
    finalAmount: Math.max(0, amount - discountAmount),
  });
}
