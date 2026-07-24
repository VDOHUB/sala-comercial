import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loginControlId } from "@/lib/controlid/client";

const BASE_URL = process.env.CONTROLID_URL!;

async function fcgiGet(session: string, object: string, where?: unknown) {
  const res = await fetch(`${BASE_URL}/load_objects.fcgi?session=${session}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ object, ...(where ? { where } : {}) }),
    cache: "no-store",
  });
  return res.json();
}

async function fcgiPost(session: string, path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}/${path}?session=${session}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return res.json();
}

// GET /api/admin/controlid/debug
// Lista access_rules, portals e portal_accessrules do dispositivo
// para descobrir quais IDs usar na associação de usuários.
export async function GET() {
  const session_auth = await auth();
  if (!session_auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const session = await loginControlId();
    const objectNames = [
      "access_rules",
      "portals",
      "groups",
      "user_groups",
      "time_zones",
      "time_zone_access_rules",
      "time_zones_access_rules",
      "access_rule_time_zones",
      "group_access_rules",
      "portal_access_rules",
      "user_access_rules",
    ];

    const results = await Promise.all(objectNames.map((obj) => fcgiGet(session, obj)));
    const out: Record<string, unknown> = {};
    objectNames.forEach((name, i) => { out[name] = results[i]; });

    // Detalhe completo da access_rule 1010 (criada automaticamente para o usuário 1000007)
    out["access_rule_1010_detail"] = await fcgiGet(session, "access_rules", { access_rules: { id: 1010 } });

    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/admin/controlid/debug
// Body: { object: string, values: object } — testa create_objects num objeto específico.
// Usado só para descobrir o nome correto da tabela de ligação access_rule <-> time_zone.
export async function POST(req: NextRequest) {
  const session_auth = await auth();
  if (!session_auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { object, values } = await req.json() as { object: string; values: unknown[] };
  if (!object || !values) return NextResponse.json({ error: "object e values são obrigatórios." }, { status: 400 });

  try {
    const session = await loginControlId();
    const result = await fcgiPost(session, "create_objects.fcgi", { object, values });
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
