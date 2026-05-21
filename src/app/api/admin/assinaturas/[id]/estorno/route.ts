import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { refundAsaasPayment } from "@/lib/asaas/client";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!sub) return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 404 });

  if (sub.status === "CANCELLED") {
    return NextResponse.json({ error: "Esta assinatura já foi cancelada/estornada." }, { status: 409 });
  }

  // Estornar no ASAAS (se houver cobrança)
  if (sub.totalAmount > 0 && sub.asaasChargeId) {
    try {
      await refundAsaasPayment(sub.asaasChargeId);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { errors?: { description: string }[] } } })
          ?.response?.data?.errors?.[0]?.description ??
        "Erro ao processar estorno no ASAAS.";
      console.error(`[assinaturas/estorno] ASAAS error for sub ${id}:`, err);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // Cancelar assinatura e zerar créditos restantes
  await prisma.subscription.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  console.log(`[assinaturas/estorno] subscription ${id} cancelled/refunded`);
  return NextResponse.json({ ok: true, free: sub.totalAmount === 0 });
}
