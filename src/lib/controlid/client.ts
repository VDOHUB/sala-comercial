const BASE_URL = process.env.CONTROLID_URL!;
const LOGIN    = process.env.CONTROLID_LOGIN!;
const PASSWORD = process.env.CONTROLID_PASSWORD!;

// ── Auth ──────────────────────────────────────────────────────────
export async function loginControlId(): Promise<string> {
  const res = await fetch(`${BASE_URL}/login.fcgi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: LOGIN, password: PASSWORD }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ControlID login failed: ${res.status}`);
  const data = await res.json() as { session?: string };
  if (!data.session) throw new Error("ControlID login: no session returned");
  return data.session;
}

// ── Helper POST ───────────────────────────────────────────────────
async function fcgi<T>(session: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}?session=${session}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`ControlID ${path} failed (${res.status}): ${txt}`);
  }
  return res.json() as Promise<T>;
}

// ── Criar usuário ─────────────────────────────────────────────────
export async function createControlIdUser(
  session: string,
  opts: { name: string; registration: string }
): Promise<{ userId: number }> {
  const data = await fcgi<{ ids?: number[] }>(session, "create_objects.fcgi", {
    object: "users",
    values: [{ name: opts.name, registration: opts.registration, password: "" }],
  });
  const id = data.ids?.[0];
  if (!id) throw new Error("ControlID createUser: no id returned");
  return { userId: id };
}

// ── Definir foto do usuário (base64) ─────────────────────────────
export async function setControlIdPhoto(
  session: string,
  userId: number,
  photoBase64: string  // base64 sem prefixo data:image/...
): Promise<void> {
  const data = await fcgi<{ results?: { user_id: number; success: boolean; errors: string }[] }>(
    session, "user_set_image_list.fcgi", {
      match: true,
      user_images: [{
        user_id:   userId,
        timestamp: Math.floor(Date.now() / 1000),
        image:     photoBase64,
      }],
    }
  );
  const result = data.results?.[0];
  if (!result?.success) {
    throw new Error(`ControlID face upload failed for user ${userId}: ${result?.errors || "unknown error"}`);
  }
}

// ── Habilitar acesso (begin_time agora, end_time daqui 10 anos) ──
export async function enableControlIdUser(
  session: string,
  userId: number
): Promise<void> {
  const now     = Math.floor(Date.now() / 1000);
  const farFuture = now + 10 * 365 * 24 * 3600; // ~10 anos
  await fcgi(session, "modify_objects.fcgi", {
    object: "users",
    values: { begin_time: now, end_time: farFuture },
    where:  { users: { id: userId } },
  });
}

// ── Desabilitar acesso (end_time no passado) ──────────────────────
export async function disableControlIdUser(
  session: string,
  userId: number
): Promise<void> {
  const past = Math.floor(Date.now() / 1000) - 1;
  await fcgi(session, "modify_objects.fcgi", {
    object: "users",
    values: { end_time: past },
    where:  { users: { id: userId } },
  });
}

// ── Deletar usuário ───────────────────────────────────────────────
export async function deleteControlIdUser(
  session: string,
  userId: number
): Promise<void> {
  await fcgi(session, "destroy_objects.fcgi", {
    object: "users",
    where:  { users: { id: userId } },
  });
}
