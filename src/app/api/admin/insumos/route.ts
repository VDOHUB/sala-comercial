import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.consumable.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sales: { select: { qty: true, totalPrice: true, unitPrice: true } },
    },
  });

  const result = items.map((item) => {
    const totalSold     = item.sales.reduce((s, v) => s + v.qty, 0);
    const totalRevenue  = item.sales.reduce((s, v) => s + v.totalPrice, 0);
    const totalCostSold = item.costPrice ? totalSold * item.costPrice : null;
    const lucro         = totalCostSold !== null ? totalRevenue - totalCostSold : null;
    const roi           = totalCostSold ? (lucro! / totalCostSold) * 100 : null;
    const margin        = item.costPrice
      ? ((item.price - item.costPrice) / item.price) * 100
      : null;
    return {
      id: item.id, code: item.code, name: item.name, unit: item.unit,
      photo: item.photo, price: item.price, costPrice: item.costPrice,
      description: item.description, active: item.active,
      stockDeposito: item.stockDeposito, stockFrigobar: item.stockFrigobar,
      minStock: item.minStock,
      totalSold, totalRevenue, totalCostSold, lucro, roi, margin,
      lowStock: item.stockFrigobar <= item.minStock,
      createdAt: item.createdAt,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, code, unit, price, costPrice, description, photo, stockDeposito, stockFrigobar, minStock } = await req.json();
  if (!name || price === undefined) {
    return NextResponse.json({ error: "Nome e preço são obrigatórios." }, { status: 400 });
  }

  const item = await prisma.consumable.create({
    data: {
      name,
      code:          code || null,
      unit:          unit || null,
      price:         Number(price),
      costPrice:     costPrice !== undefined && costPrice !== "" ? Number(costPrice) : null,
      description:   description || null,
      photo:         photo || null,
      stockDeposito: stockDeposito !== undefined ? Number(stockDeposito) : 0,
      stockFrigobar: stockFrigobar !== undefined ? Number(stockFrigobar) : 0,
      minStock:      minStock !== undefined ? Number(minStock) : 2,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
