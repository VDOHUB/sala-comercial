import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type FaqItem = { id: string; question: string; answer: string; order: number };

async function getFaq(): Promise<FaqItem[]> {
  const setting = await prisma.setting.findUnique({ where: { key: "faq" } });
  if (!setting?.value) return [];
  try { return JSON.parse(setting.value) as FaqItem[]; } catch { return []; }
}

export async function GET() {
  // FAQ é público (exibido no landing)
  const items = await getFaq();
  return NextResponse.json(items);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await req.json() as FaqItem[];

  await prisma.setting.upsert({
    where: { key: "faq" },
    update: { value: JSON.stringify(items) },
    create: { key: "faq", value: JSON.stringify(items) },
  });

  return NextResponse.json({ ok: true });
}
