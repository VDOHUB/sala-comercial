import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const item = await prisma.consumable.update({
    where: { id },
    data: {
      ...(body.name          !== undefined && { name:          body.name }),
      ...(body.code          !== undefined && { code:          body.code || null }),
      ...(body.unit          !== undefined && { unit:          body.unit || null }),
      ...(body.price         !== undefined && { price:         Number(body.price) }),
      ...(body.costPrice     !== undefined && { costPrice:     body.costPrice !== "" ? Number(body.costPrice) : null }),
      ...(body.description   !== undefined && { description:   body.description || null }),
      ...(body.photo         !== undefined && { photo:         body.photo || null }),
      ...(body.active        !== undefined && { active:        body.active }),
      ...(body.stockDeposito !== undefined && { stockDeposito: Number(body.stockDeposito) }),
      ...(body.stockFrigobar !== undefined && { stockFrigobar: Number(body.stockFrigobar) }),
      ...(body.minStock      !== undefined && { minStock:      Number(body.minStock) }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.consumableSale.deleteMany({ where: { consumableId: id } });
  await prisma.consumable.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
