import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/admin/assinaturas/[id]
// Body: { action: "freeze" | "unfreeze", reason?: string }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, reason } = await req.json() as { action: "freeze" | "unfreeze"; reason?: string };

  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 404 });

  if (action === "freeze") {
    await prisma.subscription.update({
      where: { id },
      data: { status: "FROZEN", frozenReason: reason ?? null },
    });
    return NextResponse.json({ ok: true, status: "FROZEN" });
  }

  if (action === "unfreeze") {
    await prisma.subscription.update({
      where: { id },
      data: { status: "ACTIVE", frozenReason: null },
    });
    return NextResponse.json({ ok: true, status: "ACTIVE" });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
