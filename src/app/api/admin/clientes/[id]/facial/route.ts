import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { loginControlId, createControlIdUser, setControlIdPhoto } from "@/lib/controlid/client";

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

  // Salvar foto no banco
  await prisma.client.update({ where: { id }, data: { facePhoto: photoBase64 } });

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

    const base64 = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    await setControlIdPhoto(ctrlSession, userId, base64);

    await prisma.client.update({ where: { id }, data: { controlidUserId: userId } });
    console.log(`[admin/facial] iDFace user ${userId} registrado para cliente ${id}`);
    idFaceOk = true;
  } catch (err) {
    console.error("[admin/facial] iDFace error:", err);
    idFaceError = err instanceof Error ? err.message : "Erro ao conectar no iDFace.";
  }

  return NextResponse.json({ ok: true, idFaceOk, idFaceError });
}
