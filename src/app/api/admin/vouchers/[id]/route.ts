import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH — ativar/desativar
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { active } = await req.json();

  const voucher = await prisma.voucher.update({
    where: { id },
    data:  { active },
  });

  return NextResponse.json(voucher);
}

// DELETE — remover voucher
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.voucher.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
