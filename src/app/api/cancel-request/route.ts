import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCancellationRequestAdmin } from "@/lib/resend/notifications";

// POST /api/cancel-request — público, cliente solicita cancelamento
export async function POST(req: NextRequest) {
  const { clientName, clientEmail, clientPhone, reason } = await req.json() as {
    clientName: string; clientEmail: string; clientPhone?: string; reason?: string;
  };

  if (!clientName || !clientEmail) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 });
  }

  const record = await prisma.cancellationRequest.create({
    data: { clientName, clientEmail, clientPhone, reason, status: "PENDING" },
  });

  // Notifica admin por e-mail
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? "";
  if (adminEmail) {
    sendCancellationRequestAdmin({
      adminEmail,
      clientName,
      clientEmail,
      clientPhone,
      reason,
    }).catch((e) => console.warn("[cancel-request] e-mail admin falhou:", e));
  }

  return NextResponse.json({ ok: true, id: record.id });
}
