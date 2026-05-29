import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginControlId } from "@/lib/controlid/client";

const BASE_URL = process.env.CONTROLID_URL!;

async function fcgi(session: string, path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}/${path}?session=${session}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return res.json();
}

// POST /api/admin/controlid/cleanup
// Remove usuários duplicados do iDFace (mesma registration, mantém o mais recente)
// e atualiza o controlidUserId no banco para o ID correto.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  // Permite passar um clientId específico ou limpar todos
  const { clientId } = body as { clientId?: string };

  try {
    const ctrlSession = await loginControlId();

    // Carregar todos os usuários do iDFace
    const data = await fcgi(ctrlSession, "load_objects.fcgi", { object: "users" }) as {
      users?: { id: number; registration: string; name: string }[]
    };

    const users = data.users ?? [];

    // Agrupar por registration (ignorar registration vazia — cadastros manuais)
    const byRegistration = new Map<string, typeof users>();
    for (const u of users) {
      if (!u.registration) continue;
      if (clientId && u.registration !== clientId) continue;
      const list = byRegistration.get(u.registration) ?? [];
      list.push(u);
      byRegistration.set(u.registration, list);
    }

    const results: { registration: string; kept: number; deleted: number[] }[] = [];

    for (const [registration, group] of byRegistration.entries()) {
      if (group.length <= 1) continue; // sem duplicatas

      // Mantém o ID mais alto (último criado, provavelmente com foto)
      group.sort((a, b) => b.id - a.id);
      const keep    = group[0];
      const toDelete = group.slice(1).map((u) => u.id);

      // Deletar duplicatas no iDFace
      for (const dupId of toDelete) {
        await fcgi(ctrlSession, "destroy_objects.fcgi", {
          object: "users",
          where:  { users: { id: dupId } },
        });
        console.log(`[cleanup] deleted iDFace user ${dupId} (duplicate of ${keep.id}, registration=${registration})`);
      }

      // Atualizar controlidUserId no banco para o ID correto
      await prisma.client.updateMany({
        where: { id: registration },
        data:  { controlidUserId: keep.id },
      });

      results.push({ registration, kept: keep.id, deleted: toDelete });
    }

    return NextResponse.json({
      ok: true,
      cleaned: results.length,
      results,
      message: results.length === 0
        ? "Nenhum duplicado encontrado."
        : `${results.length} cliente(s) com duplicatas removidas.`,
    });

  } catch (err) {
    console.error("[cleanup] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
