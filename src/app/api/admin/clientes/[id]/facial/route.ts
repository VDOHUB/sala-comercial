import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { loginControlId, createControlIdUser, setControlIdPhoto } from "@/lib/controlid/client";
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

  try {
    const ctrlSession = await loginControlId();

    let userId = client.controlidUserId;
    if (!userId) {
      const created = await createControlIdUser(ctrlSession, {
        name:         client.name,
        registration: client.id,
      });
      userId = created.userId;
    }

    const base64 = processedPhoto.replace(/^data:image\/\w+;base64,/, "");
    await setControlIdPhoto(ctrlSession, userId, base64);

    await prisma.client.update({ where: { id }, data: { controlidUserId: userId } });
    console.log(`[admin/facial] iDFace user ${userId} registrado para cliente ${id}`);
    idFaceOk = true;
  } catch (err) {
    console.error("[admin/facial] iDFace error:", err);
    idFaceError = err instanceof Error ? err.message : "Erro ao conectar no iDFace.";
  }

  // ── Agendar acesso no QStash para reservas PAID/PENDING do cliente ──
  // (necessário quando o checkout foi feito sem câmera e o facial foi
  //  registrado depois pelo admin)
  const qstashResults: { bookingId: string; ok: boolean; error?: string }[] = [];

  if (idFaceOk) {
    const pendingBookings = await prisma.booking.findMany({
      where: {
        clientId: id,
        status:   { in: ["PAID", "PENDING"] },
        startAt:  { gt: new Date() }, // só reservas futuras
      },
    });

    for (const booking of pendingBookings) {
      try {
        await scheduleGrant(booking.id, booking.startAt);
        await scheduleRevoke(booking.id, booking.endAt);
        await scheduleEndingReminders(booking.id, booking.endAt);
        console.log(`[admin/facial] QStash agendado para booking ${booking.id}`);
        qstashResults.push({ bookingId: booking.id, ok: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[admin/facial] QStash error para booking ${booking.id}:`, msg);
        qstashResults.push({ bookingId: booking.id, ok: false, error: msg });
      }
    }
  }

  return NextResponse.json({ ok: true, idFaceOk, idFaceError, qstashResults });
}
