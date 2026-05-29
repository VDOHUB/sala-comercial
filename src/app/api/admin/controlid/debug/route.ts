import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loginControlId } from "@/lib/controlid/client";

const BASE_URL = process.env.CONTROLID_URL!;

async function fcgiGet(session: string, object: string) {
  const res = await fetch(`${BASE_URL}/get_objects.fcgi?session=${session}`, {
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
    const [accessRules, portals, portalAccessRules, users] = await Promise.all([
      fcgiGet(session, "access_rules"),
      fcgiGet(session, "portals"),
      fcgiGet(session, "portal_accessrules"),
      fcgiGet(session, "users"),
    ]);

    return NextResponse.json({ accessRules, portals, portalAccessRules, users });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
