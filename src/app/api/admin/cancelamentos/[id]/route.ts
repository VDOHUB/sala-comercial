import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/cancelamentos/[id] — marcar como tratado/pendente
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json() as { status: "PENDING" | "HANDLED" };

  const updated = await prisma.cancellationRequest.update({
    where: { id },
    data: {
      status,
      handledAt: status === "HANDLED" ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/cancelamentos/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.cancellationRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
