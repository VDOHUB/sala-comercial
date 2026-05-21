import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { refundAsaasPayment } from "@/lib/asaas/client";
import { loginControlId, disableControlIdUser } from "@/lib/controlid/client";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!booking) return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });

  if (booking.status === "REFUNDED") {
    return NextResponse.json({ error: "Esta reserva já foi estornada." }, { status: 409 });
  }

  if (booking.totalAmount === 0) {
    // Reserva gratuita — só cancela, sem estorno no ASAAS
    await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true, free: true });
  }

  if (!booking.asaasChargeId) {
    return NextResponse.json({ error: "Esta reserva não possui cobrança registrada no ASAAS." }, { status: 422 });
  }

  // Estornar no ASAAS
  try {
    await refundAsaasPayment(booking.asaasChargeId);
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { errors?: { description: string }[] } } })
        ?.response?.data?.errors?.[0]?.description ??
      "Erro ao processar estorno no ASAAS.";
    console.error(`[estorno] ASAAS error for booking ${id}:`, err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Atualizar status no banco
  await prisma.booking.update({ where: { id }, data: { status: "REFUNDED" } });

  // Revogar acesso no iDFace se reserva estava ativa
  if (booking.status === "ACTIVE" && booking.client.controlidUserId) {
    try {
      const ctrlSession = await loginControlId();
      // Só desabilita se não houver outra reserva ativa
      const otherActive = await prisma.booking.findFirst({
        where: { clientId: booking.clientId, id: { not: id }, status: "ACTIVE" },
      });
      if (!otherActive) {
        await disableControlIdUser(ctrlSession, booking.client.controlidUserId);
      }
    } catch (e) {
      console.warn(`[estorno] iDFace disable warning for booking ${id}:`, e);
    }
  }

  console.log(`[estorno] booking ${id} refunded (ASAAS: ${booking.asaasChargeId})`);
  return NextResponse.json({ ok: true });
}
