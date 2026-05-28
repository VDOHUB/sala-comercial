import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { loginControlId, disableControlIdUser } from "@/lib/controlid/client";
import { createAsaasChargeWithToken } from "@/lib/asaas/client";
import { format, addDays } from "date-fns";

// POST /api/admin/acessos/[bookingId]/finalizar
// Body: { items?: { consumableId, qty }[], extraPeriod?: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId } = await params;
  const body = await req.json() as {
    items?: { consumableId: string; qty: number }[];
    extraPeriod?: boolean;
  };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { client: true },
  });
  if (!booking) return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });

  const charges: { description: string; amount: number }[] = [];

  // ── Cobrar insumos ────────────────────────────────────────────────
  if (body.items && body.items.length > 0) {
    const consumables = await prisma.consumable.findMany({
      where: { id: { in: body.items.map((i) => i.consumableId) } },
    });

    for (const item of body.items) {
      const c = consumables.find((x) => x.id === item.consumableId);
      if (!c) continue;
      charges.push({ description: `${c.name} x${item.qty}`, amount: c.price * item.qty });
    }
  }

  // ── Cobrar período extra ──────────────────────────────────────────
  if (body.extraPeriod) {
    const planPrice = 300; // HUB ONE avulso
    charges.push({ description: "Período extra", amount: planPrice });
  }

  // ── Processar cobrança no ASAAS ───────────────────────────────────
  const totalCharge = charges.reduce((s, c) => s + c.amount, 0);
  let chargeId: string | undefined;

  if (totalCharge > 0) {
    const client = booking.client;
    if (!client.asaasCustomerId || !client.asaasCardToken) {
      return NextResponse.json({
        error: "Cliente não possui cartão salvo. Registre a cobrança manualmente.",
        needsManual: true,
      }, { status: 422 });
    }

    try {
      const description = charges.map((c) => c.description).join(" + ");
      const charge = await createAsaasChargeWithToken({
        customer:        client.asaasCustomerId,
        creditCardToken: client.asaasCardToken,
        value:           totalCharge,
        dueDate:         format(addDays(new Date(), 1), "yyyy-MM-dd"),
        description:     `VDO HUB — ${description}`,
        externalReference: bookingId,
      });
      chargeId = charge.id;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { errors?: { description: string }[] } } })
          ?.response?.data?.errors?.[0]?.description ??
        "Cobrança de insumos falhou.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // ── Marcar reserva como COMPLETED ────────────────────────────────
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });

  // ── Revogar acesso no iDFace se não tem outra reserva ativa ───────
  if (booking.client.controlidUserId) {
    try {
      const otherActive = await prisma.booking.findFirst({
        where: { clientId: booking.clientId, id: { not: bookingId }, status: "ACTIVE" },
      });
      if (!otherActive) {
        const ctrlSession = await loginControlId();
        await disableControlIdUser(ctrlSession, booking.client.controlidUserId);
      }
    } catch (e) {
      console.warn(`[finalizar] iDFace disable warning for booking ${bookingId}:`, e);
    }
  }

  console.log(`[finalizar] booking ${bookingId} completed. Charges: R$${totalCharge} (${chargeId ?? "none"})`);
  return NextResponse.json({ ok: true, totalCharge, chargeId, charges });
}
