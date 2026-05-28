import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/admin/insumos/[id]/abastecer
// Body: { qty: number }
// Move `qty` unidades do depósito para o frigobar.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { qty } = await req.json() as { qty: number };

  if (!qty || qty <= 0) {
    return NextResponse.json({ error: "Informe uma quantidade válida." }, { status: 400 });
  }

  const item = await prisma.consumable.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });

  if (item.stockDeposito < qty) {
    return NextResponse.json({
      error: `Estoque no depósito insuficiente. Disponível: ${item.stockDeposito} un.`,
    }, { status: 422 });
  }

  const updated = await prisma.consumable.update({
    where: { id },
    data: {
      stockDeposito: { decrement: qty },
      stockFrigobar: { increment: qty },
    },
  });

  console.log(`[abastecer] ${qty}x "${item.name}" depositó→frigobar`);
  return NextResponse.json({
    ok: true,
    stockDeposito: updated.stockDeposito,
    stockFrigobar: updated.stockFrigobar,
  });
}
