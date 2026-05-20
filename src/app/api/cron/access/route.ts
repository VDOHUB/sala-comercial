import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginControlId, setControlIdUserActive } from "@/lib/controlid/client";

// GET /api/cron/access
// Chamado a cada 5 minutos pelo Vercel Cron.
// Libera acesso para reservas que começam agora e revoga para as que terminaram.

export async function GET(req: NextRequest) {
  // Verificar secret para evitar chamadas não autorizadas
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  let session: string;
  try {
    session = await loginControlId();
  } catch (err) {
    console.error("[cron/access] login failed:", err);
    return NextResponse.json({ error: "iDFace login failed" }, { status: 500 });
  }

  const results = { granted: 0, revoked: 0, errors: 0 };

  // ── 1. Liberar: reservas que começaram e ainda não foram liberadas ──
  // window: startAt <= now < endAt AND status PAID
  const toGrant = await prisma.booking.findMany({
    where: {
      status:  "PAID",
      startAt: { lte: now },
      endAt:   { gt: now },
    },
    include: { client: true },
  });

  for (const booking of toGrant) {
    const userId = booking.client.controlidUserId;
    if (!userId) {
      console.warn(`[cron/access] client ${booking.client.id} has no controlidUserId — skipping grant`);
      continue;
    }
    try {
      await setControlIdUserActive(session, userId, true);
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "ACTIVE" } });
      results.granted++;
      console.log(`[cron/access] granted access to user ${userId} (booking ${booking.id})`);
    } catch (err) {
      console.error(`[cron/access] grant failed for booking ${booking.id}:`, err);
      results.errors++;
    }
  }

  // ── 2. Revogar: reservas que terminaram e ainda estão ACTIVE ─────
  const toRevoke = await prisma.booking.findMany({
    where: {
      status: "ACTIVE",
      endAt:  { lte: now },
    },
    include: { client: true },
  });

  for (const booking of toRevoke) {
    const userId = booking.client.controlidUserId;
    if (!userId) {
      // Mesmo sem userId, marcar como COMPLETED
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED" } });
      continue;
    }
    try {
      // Verificar se cliente tem outra reserva ativa antes de desativar
      const otherActive = await prisma.booking.findFirst({
        where: {
          clientId: booking.clientId,
          id:       { not: booking.id },
          status:   "ACTIVE",
        },
      });
      if (!otherActive) {
        await setControlIdUserActive(session, userId, false);
        console.log(`[cron/access] revoked access from user ${userId} (booking ${booking.id})`);
      }
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED" } });
      results.revoked++;
    } catch (err) {
      console.error(`[cron/access] revoke failed for booking ${booking.id}:`, err);
      results.errors++;
    }
  }

  console.log(`[cron/access] done:`, results);
  return NextResponse.json({ ok: true, ...results, at: now.toISOString() });
}
