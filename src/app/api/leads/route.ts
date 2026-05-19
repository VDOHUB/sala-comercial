import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, cpf, planKey } = body;

    if (!name || !email || !planKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: { name, email, phone: phone || null, cpf: cpf || null, planKey },
    });

    return NextResponse.json({ id: lead.id });
  } catch {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
