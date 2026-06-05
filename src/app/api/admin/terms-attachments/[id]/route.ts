import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Attachment = { id: string; name: string; data: string };

// GET /api/admin/terms-attachments/[id] — download público do anexo
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const setting = await prisma.setting.findUnique({ where: { key: "terms_attachments" } });
  if (!setting?.value) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let list: Attachment[] = [];
  try { list = JSON.parse(setting.value) as Attachment[]; } catch { /* noop */ }

  const attachment = list.find((a) => a.id === id);
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Extrair tipo MIME e dados binários do base64
  const matches = attachment.data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return NextResponse.json({ error: "Invalid data" }, { status: 500 });

  const mimeType = matches[1];
  const buffer   = Buffer.from(matches[2], "base64");

  const ext      = mimeType === "application/pdf" ? ".pdf"
    : mimeType.startsWith("image/") ? "." + mimeType.split("/")[1]
    : "";
  const filename = attachment.name || ("anexo" + ext);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
