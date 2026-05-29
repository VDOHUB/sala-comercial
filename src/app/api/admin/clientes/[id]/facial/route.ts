import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { loginControlId, createControlIdUser, setControlIdPhoto, enableControlIdUser } from "@/lib/controlid/client";
import { scheduleGrant, scheduleRevoke, scheduleEndingReminders } from "@/lib/qstash";
import sharp from "sharp";

// POST /api/admin/clientes/[id]/facial
// Body: { photoBase64: string }
// Salva a foto no cliente e registra no iDFace — usado pelo admin quando
// o cliente não tinha câmera no momento do checkout.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { photoBase64 } = await req.json() as { photoBase64: string };

  if (!photoBase64) {
    return NextResponse.json({ error: "Foto não enviada." }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  // Redimensionar para no máximo 1920×1080 (limite do iDFace)
  let processedPhoto = photoBase64;
  try {
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const resized = await sharp(buffer)
      .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    processedPhoto = `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch (e) {
    console.warn("[admin/facial] resize warning:", e);
    // continua com a foto original se falhar
  }

  // Salvar foto no banco
  await prisma.client.update({ where: { id }, data: { facePhoto: processedPhoto } });

  // Registrar no iDFace
  let idFaceOk = false;
  let idFaceError: string | null = null;
  let updatedUserId: number | null = client.controlidUserId;

  try {
    const ctrlSession = await loginControlId();

    if (!updatedUserId) {
      const created = await createControlIdUser(ctrlSession, {
        name:         client.name,
        registration: client.id,
      });
      updatedUserId = created.userId;
    }

    const base64 = processedPhoto.replace(/^data:image\/\w+;base64,/, "");
    await setControlIdPhoto(ctrlSession, updatedUserId, base64);

    await prisma.client.update({ where: { id }, data: { controlidUserId: updatedUserId } });
    console.log(`[admin/facial] iDFace user ${updatedUserId} registrado para cliente ${id}`);
    idFaceOk = true;
  } catch (err) {
    console.error("[admin/facial] iDFace error:", err);
    idFaceError = err instanceof Error ? err.message : "Erro ao conectar no iDFace.";
  }

  // ── Tratar reservas do cliente ────────────────────────────────────
  const qstashResults: { bookingId: string; action: string; ok: boolean; error?: string }[] = [];

  if (idFaceOk) {
    const now = new Date();

    // Busca reservas PAID/PENDING/ACTIVE
    const bookings = await prisma.booking.findMany({
      where: {
        clientId: id,
        status:   { in: ["PAID", "PENDING", "ACTIVE"] },
        endAt:    { gt: now }, // que ainda não terminaram
      },
    });

    for (const booking of bookings) {
      const isOngoing = booking.startAt <= now && booking.endAt > now;
      const isFuture  = booking.startAt > now;

      try {
        if (isOngoing) {
          // Reserva em andamento agora → habilitar acesso imediatamente no iDFace
          const ctrlSession2 = await loginControlId();
          await enableControlIdUser(ctrlSession2, updatedUserId!);
          await prisma.booking.update({ where: { id: booking.id }, data: { status: "ACTIVE" } });
          // Ainda agenda o revoke e reminders para quando terminar
          await scheduleRevoke(booking.id, booking.endAt);
          await scheduleEndingReminders(booking.id, booking.endAt);
          console.log(`[admin/facial] acesso habilitado imediatamente para booking ${booking.id}`);
          qstashResults.push({ bookingId: booking.id, action: "granted_now", ok: true });
        } else if (isFuture) {
          // Reserva futura → agenda via QStash
          await scheduleGrant(booking.id, booking.startAt);
          await scheduleRevoke(booking.id, booking.endAt);
          await scheduleEndingReminders(booking.id, booking.endAt);
          console.log(`[admin/facial] QStash agendado para booking ${booking.id}`);
          qstashResults.push({ bookingId: booking.id, action: "scheduled", ok: true });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[admin/facial] erro ao processar booking ${booking.id}:`, msg);
        qstashResults.push({ bookingId: booking.id, action: "error", ok: false, error: msg });
      }
    }
  }

  return NextResponse.json({ ok: true, idFaceOk, idFaceError, qstashResults });
}
