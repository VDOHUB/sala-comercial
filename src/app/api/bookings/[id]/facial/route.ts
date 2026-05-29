import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendSubscriptionConfirmation, sendFacePhotoRetryEmail } from "@/lib/resend/emails";
import {
  loginControlId,
  createControlIdUser,
  setControlIdPhoto,
} from "@/lib/controlid/client";
import { scheduleGrant, scheduleRevoke, scheduleEndingReminders } from "@/lib/qstash";
import sharp from "sharp";

// Redimensiona para no máximo 1080×1080 e converte para JPEG (limite iDFace: 1920×1080)
async function resizeForIdFace(photoBase64: string): Promise<string> {
  try {
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const resized = await sharp(buffer)
      .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch {
    return photoBase64; // fallback: foto original
  }
}

// ── Registrar usuário no iDFace ───────────────────────────────────
async function registerFaceOnDevice(client: {
  id: string;
  name: string;
  controlidUserId: number | null;
}, photoBase64: string): Promise<number | null> {
  try {
    const session = await loginControlId();

    // registration = clientId (garante unicidade)
    let userId = client.controlidUserId;

    if (!userId) {
      const created = await createControlIdUser(session, {
        name:         client.name,
        registration: client.id,
      });
      userId = created.userId;
    }

    // Remover prefixo data:image/...;base64, se presente
    const base64 = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    await setControlIdPhoto(session, userId, base64);

    // Salvar userId no banco
    await prisma.client.update({
      where: { id: client.id },
      data:  { controlidUserId: userId },
    });

    console.log(`[facial] iDFace user ${userId} registered for client ${client.id}`);
    return userId;
  } catch (err) {
    // Não falhar o fluxo de reserva por erro no iDFace
    console.error("[facial] iDFace registration error:", err);
    return null;
  }
}

// PATCH /api/bookings/[id]/facial — salva foto e envia e-mail
// [id] pode ser bookingId (HUB ONE) ou subscriptionId (multi-período)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body   = await req.json();
  const { photoBase64, isSubscription, portalUrl, planLabel, credits, expiresAt } = body;

  if (!photoBase64) {
    return NextResponse.json({ error: "Foto não enviada" }, { status: 400 });
  }

  // Redimensionar antes de salvar e enviar ao iDFace
  const photo = await resizeForIdFace(photoBase64);

  // ── Assinatura multi-período ──────────────────────────────────────
  if (isSubscription) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!subscription) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

    await prisma.client.update({
      where: { id: subscription.clientId },
      data:  { facePhoto: photo },
    });

    // Registrar no iDFace (não bloqueia se falhar)
    const faceUserId = await registerFaceOnDevice(subscription.client, photo);
    if (!faceUserId) {
      const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vdohub.viverdeobra.com";
      const retryUrl = `${baseUrl}/refazer-foto/${id}?type=subscription`;
      sendFacePhotoRetryEmail({
        to:         subscription.client.email,
        clientName: subscription.client.name,
        retryUrl,
      }).catch((e) => console.warn("[facial/subscription] retry email error:", e));
    }

    try {
      await sendSubscriptionConfirmation({
        to:           subscription.client.email,
        clientName:   subscription.client.name,
        planLabel:    planLabel ?? subscription.planKey,
        totalCredits: credits   ?? subscription.totalCredits,
        expiresAt:    expiresAt ? new Date(expiresAt) : subscription.expiresAt,
        portalUrl:    portalUrl ?? `https://vdohub.viverdeobra.com/minha-conta/${subscription.token}`,
      });
    } catch (err) {
      console.error("[facial/subscription] email error:", err);
    }

    return NextResponse.json({ ok: true });
  }

  // ── Reserva única (HUB ONE) ───────────────────────────────────────
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!booking) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });

  await prisma.client.update({
    where: { id: booking.clientId },
    data:  { facePhoto: photo },
  });

  // Registrar no iDFace (não bloqueia se falhar)
  const faceUserId2 = await registerFaceOnDevice(booking.client, photo);
  if (!faceUserId2) {
    const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vdohub.viverdeobra.com";
    const retryUrl = `${baseUrl}/refazer-foto/${id}`;
    sendFacePhotoRetryEmail({
      to:         booking.client.email,
      clientName: booking.client.name,
      retryUrl,
    }).catch((e) => console.warn("[facial/booking] retry email error:", e));
  }

  // Agendar liberação e revogação de acesso via QStash
  try {
    await scheduleGrant(booking.id, booking.startAt);
    await scheduleRevoke(booking.id, booking.endAt);
    await scheduleEndingReminders(booking.id, booking.endAt);
    console.log(`[facial/booking] access scheduled: grant@${booking.startAt.toISOString()} revoke@${booking.endAt.toISOString()}`);
  } catch (err) {
    console.error("[facial/booking] QStash schedule error:", err);
  }

  try {
    await sendBookingConfirmation({
      to:          booking.client.email,
      clientName:  booking.client.name,
      startAt:     booking.startAt,
      endAt:       booking.endAt,
      totalAmount: booking.totalAmount,
      paymentUrl:  booking.asaasPaymentUrl ?? undefined,
    });
  } catch (err) {
    console.error("[facial/booking] email error:", err);
  }

  return NextResponse.json({ ok: true });
}
