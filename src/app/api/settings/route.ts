import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — only exposes non-sensitive settings like terms
export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: "terms" } });
  return NextResponse.json({ terms: setting?.value ?? "" });
}
