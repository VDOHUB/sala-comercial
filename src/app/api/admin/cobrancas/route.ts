import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAsaasChargeWithToken, createAsaasCustomer, createAsaasCharge } from "@/lib/asaas/client";
import { format, addDays } from "date-fns";

// POST /api/admin/cobrancas
// Body: { clientId, amount, description, card? }
// Se o cliente tem asaasCardToken, cobra no token salvo.
// Se não tem, exige os dados do cartão no body.

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, amount, description, card } = body as {
    clientId: string;
    amount: number;
    description: string;
    card?: {
      holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string;
    };
  };

  if (!clientId || !amount || !description) {
    return NextResponse.json({ error: "clientId, amount e description são obrigatórios." }, { status: 400 });
  }
  if (amount <= 0) {
    return NextResponse.json({ error: "O valor deve ser maior que zero." }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const dueDate = format(addDays(new Date(), 1), "yyyy-MM-dd");

  try {
    let chargeId: string;
    let invoiceUrl: string;

    if (client.asaasCustomerId && client.asaasCardToken) {
      // Cobrança com token salvo
      const charge = await createAsaasChargeWithToken({
        customer:        client.asaasCustomerId,
        creditCardToken: client.asaasCardToken,
        value:           amount,
        dueDate,
        description,
        externalReference: `admin-manual-${clientId}`,
      });
      chargeId   = charge.id;
      invoiceUrl = charge.invoiceUrl;
    } else if (card) {
      // Sem token — usar dados do cartão fornecidos agora
      let customerId = client.asaasCustomerId;
      if (!customerId) {
        const asaasCustomer = await createAsaasCustomer({
          name:     client.name,
          email:    client.email,
          cpfCnpj: client.cpf ?? undefined,
          phone:    client.phone ?? undefined,
        });
        customerId = asaasCustomer.id;
        await prisma.client.update({ where: { id: clientId }, data: { asaasCustomerId: customerId } });
      }
      const charge = await createAsaasCharge({
        customer:    customerId,
        billingType: "CREDIT_CARD",
        value:       amount,
        dueDate,
        description,
        creditCard: {
          holderName:  card.holderName,
          number:      card.number.replace(/\s/g, ""),
          expiryMonth: card.expiryMonth,
          expiryYear:  card.expiryYear,
          ccv:         card.ccv,
        },
        creditCardHolderInfo: {
          name:     client.name,
          email:    client.email,
          cpfCnpj: client.cpf ?? "00000000000",
          phone:    client.phone ?? undefined,
        },
      });
      chargeId   = charge.id;
      invoiceUrl = charge.invoiceUrl;
    } else {
      return NextResponse.json(
        { error: "Este cliente não tem cartão salvo. Informe os dados do cartão.", needsCard: true },
        { status: 422 }
      );
    }

    console.log(`[admin/cobrancas] charged client ${clientId} R$${amount}: ${chargeId}`);
    return NextResponse.json({ ok: true, chargeId, invoiceUrl });
  } catch (err: unknown) {
    console.error("[admin/cobrancas] ASAAS error:", err);
    const msg =
      (err as { response?: { data?: { errors?: { description: string }[] } } })
        ?.response?.data?.errors?.[0]?.description ??
      "Cobrança recusada. Verifique os dados do cartão.";
    return NextResponse.json({ error: msg }, { status: 402 });
  }
}

// GET /api/admin/cobrancas — lista clientes com cartão salvo para o select
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, email: true, phone: true,
      asaasCustomerId: true, asaasCardToken: true, facePhoto: true,
    },
  });

  return NextResponse.json(
    clients.map((c) => ({
      ...c,
      hasCard: !!(c.asaasCustomerId && c.asaasCardToken),
    }))
  );
}
