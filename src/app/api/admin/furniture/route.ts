import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.furnitureItem.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, code, name, value, description } = await req.json() as {
    id?: string; code?: string; name: string; value: number; description?: string;
  };

  if (!name) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });

  if (id) {
    const item = await prisma.furnitureItem.update({
      where: { id },
      data: { code, name, value: Number(value), description },
    });
    return NextResponse.json(item);
  }

  const item = await prisma.furnitureItem.create({
    data: { code, name, value: Number(value), description },
  });
  return NextResponse.json(item);
}
