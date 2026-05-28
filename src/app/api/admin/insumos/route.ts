import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.consumable.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sales: true } },
      sales: {
        select: { qty: true, totalPrice: true },
      },
    },
  });

  const result = items.map((item) => {
    const totalSold   = item.sales.reduce((s, v) => s + v.qty, 0);
    const totalRevenue = item.sales.reduce((s, v) => s + v.totalPrice, 0);
    const margin = item.costPrice
      ? ((item.price - item.costPrice) / item.price) * 100
      : null;
    return {
      id: item.id, name: item.name, photo: item.photo, price: item.price,
      costPrice: item.costPrice, description: item.description, active: item.active,
      stock: item.stock, minStock: item.minStock,
      totalSold, totalRevenue, margin,
      lowStock: item.stock <= item.minStock,
      createdAt: item.createdAt,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, price, costPrice, description, photo, stock, minStock } = await req.json();
  if (!name || price === undefined) {
    return NextResponse.json({ error: "Nome e preço são obrigatórios." }, { status: 400 });
  }

  const item = await prisma.consumable.create({
    data: {
      name,
      price:     Number(price),
      costPrice: costPrice !== undefined && costPrice !== "" ? Number(costPrice) : null,
      description: description || null,
      photo:     photo || null,
      stock:     stock !== undefined ? Number(stock) : 0,
      minStock:  minStock !== undefined ? Number(minStock) : 2,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
