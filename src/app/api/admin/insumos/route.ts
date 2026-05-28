import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.consumable.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, price, description, photo } = await req.json();
  if (!name || !price) return NextResponse.json({ error: "Nome e preço são obrigatórios." }, { status: 400 });
  const item = await prisma.consumable.create({ data: { name, price: Number(price), description, photo } });
  return NextResponse.json(item, { status: 201 });
}
