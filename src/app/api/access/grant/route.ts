import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";
import {
  loginControlId,
  createControlIdUser,
  setControlIdPhoto,
  setControlIdUserActive,
} from "@/lib/controlid/client";

export async function POST(req: NextRequest) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey:    process.env.QSTASH_NEXT_SIGNING_KEY!,
  });

  const body      = await req.text();
  const signature = req.headers.get("upstash-signature") ?? "";

  const valid = await receiver.verify({ signature, body }).catch(() => false);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = JSON.parse(body) as { bookingId: string };

  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { client: true },
  });

  if (!booking) {
    console.error(`[access/grant] booking ${bookingId} not found`);
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    console.log(`[access/grant] booking ${bookingId} cancelled — skipping`);
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const session = await loginControlId();
    const client  = booking.client;

    let userId = client.controlidUserId;

    // Se ainda não foi registrado no iDFace (ex: PC estava desligado na compra),
    // registra agora antes de liberar o acesso
    if (!userId) {
      if (!client.facePhoto) {
        console.warn(`[access/grant] client ${client.id} has no facePhoto — cannot register`);
        return NextResponse.json({ ok: true, skipped: true });
      }

      console.log(`[access/grant] registering client ${client.id} on iDFace now`);
      const created = await createControlIdUser(session, {
        name:         client.name,
        registration: client.id,
      });
      userId = created.userId;

      const base64 = client.facePhoto.replace(/^data:image\/\w+;base64,/, "");
      await setControlIdPhoto(session, userId, base64);

      await prisma.client.update({
        where: { id: client.id },
        data:  { controlidUserId: userId },
      });

      console.log(`[access/grant] client ${client.id} registered as iDFace user ${userId}`);
    }

    await setControlIdUserActive(session, userId, true);
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "ACTIVE" } });
    console.log(`[access/grant] user ${userId} activated for booking ${bookingId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[access/grant] error:`, err);
    // Retorna 500 para o QStash tentar novamente automaticamente
    return NextResponse.json({ error: "iDFace error" }, { status: 500 });
  }
}
