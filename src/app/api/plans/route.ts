import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PLANS } from "@/lib/plans";

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: "plans" } });
  if (setting) {
    try {
      return NextResponse.json(JSON.parse(setting.value));
    } catch {
      // fall through to default
    }
  }
  return NextResponse.json(DEFAULT_PLANS);
}
