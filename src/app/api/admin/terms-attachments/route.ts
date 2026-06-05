import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

type Attachment = { id: string; name: string; url: string };

async function getAttachments(): Promise<Attachment[]> {
  const setting = await prisma.setting.findUnique({ where: { key: "terms_attachments" } });
  if (!setting?.value) return [];
  try { return JSON.parse(setting.value) as Attachment[]; } catch { return []; }
}

async function saveAttachments(list: Attachment[]) {
  await prisma.setting.upsert({
    where:  { key: "terms_attachments" },
    update: { value: JSON.stringify(list) },
    create: { key: "terms_attachments", value: JSON.stringify(list) },
  });
}

// GET — lista de anexos (id, name, url)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attachments = await getAttachments();
  return NextResponse.json(attachments);
}

// DELETE — remove um anexo pelo id (?id=...)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const list = await getAttachments();
  const item = list.find((a) => a.id === id);

  // Remove do Vercel Blob também
  if (item?.url) {
    try { await del(item.url); } catch (e) { console.warn("[terms-attachments] del blob error:", e); }
  }

  await saveAttachments(list.filter((a) => a.id !== id));
  return NextResponse.json({ ok: true });
}
