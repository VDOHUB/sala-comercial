import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/terms-acceptances/export — exporta CSV
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const acceptances = await prisma.termsAcceptance.findMany({
    orderBy: { acceptedAt: "desc" },
  });

  const header = ["Nome", "E-mail", "Telefone", "IP", "Data/Hora", "User-Agent"].join(";");
  const rows = acceptances.map((a) => [
    `"${a.clientName}"`,
    `"${a.clientEmail}"`,
    `"${a.clientPhone ?? ""}"`,
    `"${a.ipAddress ?? ""}"`,
    `"${new Date(a.acceptedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}"`,
    `"${(a.userAgent ?? "").replace(/"/g, "'")}"`,
  ].join(";"));

  const csv = [header, ...rows].join("\n");
  const filename = `termos-aceites-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
