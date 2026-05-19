import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/admin/reservas/[id] — alterar status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(booking);
}

// DELETE /api/admin/reservas/[id] — excluir reserva
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Apaga logs de acesso vinculados antes de apagar a reserva
  await prisma.accessLog.deleteMany({ where: { bookingId: id } });
  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
