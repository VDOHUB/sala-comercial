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

// ── Helper ────────────────────────────────────────────────────────
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
    object: "user",
    values: [{ name: opts.name, registration: opts.registration, password: "", active: 1 }],
  });
  const id = data.ids?.[0];
  if (!id) throw new Error("ControlID createUser: no id returned");
  return { userId: id };
}

// ── Definir foto do usuário ───────────────────────────────────────
export async function setControlIdPhoto(
  session: string,
  userId: number,
  photoBase64: string   // base64 sem prefixo data:image/...
): Promise<void> {
  await fcgi(session, "create_objects.fcgi", {
    object: "user_image",
    values: [{ user_id: userId, image: photoBase64 }],
  });
}

// ── Habilitar / Desabilitar acesso ────────────────────────────────
export async function setControlIdUserActive(
  session: string,
  userId: number,
  active: boolean
): Promise<void> {
  await fcgi(session, "modify_objects.fcgi", {
    object: "user",
    values: [{ id: userId, active: active ? 1 : 0 }],
  });
}

// ── Buscar usuário por registration ──────────────────────────────
export async function findControlIdUser(
  session: string,
  registration: string
): Promise<number | null> {
  const data = await fcgi<{ users?: { id: number }[] }>(session, "load_objects.fcgi", {
    object: "user",
    where: { registration: { "=": registration } },
  });
  return data.users?.[0]?.id ?? null;
}

// ── Deletar usuário ───────────────────────────────────────────────
export async function deleteControlIdUser(
  session: string,
  userId: number
): Promise<void> {
  await fcgi(session, "destroy_objects.fcgi", {
    object: "user",
    where: { id: { "=": userId } },
  });
}
