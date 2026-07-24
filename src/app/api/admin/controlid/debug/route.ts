import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loginControlId } from "@/lib/controlid/client";

const BASE_URL = process.env.CONTROLID_URL!;

async function fcgiGet(session: string, object: string) {
  const res = await fetch(`${BASE_URL}/load_objects.fcgi?session=${session}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ object }),
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
      "access_rules_groups",
      "access_rules_time_zones",
      "access_rules_portals",
      "access_rules_users",
      "group_access_rules",
      "portal_access_rules",
      "user_access_rules",
      "user_time_zones",
    ];

    const results = await Promise.all(objectNames.map((obj) => fcgiGet(session, obj)));
    const out: Record<string, unknown> = {};
    objectNames.forEach((name, i) => { out[name] = results[i]; });
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
