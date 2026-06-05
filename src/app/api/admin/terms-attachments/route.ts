import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Attachment = { id: string; name: string; data: string };

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

// GET — lista de anexos (sem o campo data para não sobrecarregar)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attachments = await getAttachments();
  // Retorna só id e name (sem base64) para listagem
  return NextResponse.json(attachments.map(({ id, name }) => ({ id, name })));
}

// POST — adiciona um anexo
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, data } = await req.json() as { name: string; data: string };
  if (!name || !data) return NextResponse.json({ error: "Campos obrigatórios: name, data" }, { status: 400 });

  const list = await getAttachments();
  const id   = Date.now().toString() + Math.random().toString(36).slice(2);
  list.push({ id, name, data });
  await saveAttachments(list);

  return NextResponse.json({ ok: true, id, name });
}

// DELETE — remove um anexo pelo id (via query param ?id=...)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const list = await getAttachments();
  const filtered = list.filter((a) => a.id !== id);
  await saveAttachments(filtered);

  return NextResponse.json({ ok: true });
}
