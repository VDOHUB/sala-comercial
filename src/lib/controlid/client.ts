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

// ── Buscar usuário por registration (clientId) ────────────────────
export async function findControlIdUserByRegistration(
  session: string,
  registration: string
): Promise<number | null> {
  try {
    const data = await fcgi<{ users?: { id: number; registration: string }[] }>(
      session, "load_objects.fcgi", {
        object: "users",
        where:  { users: { registration } },
      }
    );
    // Pega o ID mais alto (mais recente) caso haja duplicatas
    const users = data.users ?? [];
    if (users.length === 0) return null;
    return users.sort((a, b) => b.id - a.id)[0].id;
  } catch {
    return null;
  }
}

// ── Criar usuário ─────────────────────────────────────────────────
export async function createControlIdUser(
  session: string,
  opts: { name: string; registration: string }
): Promise<{ userId: number }> {
  // Evita duplicatas: verifica se já existe antes de criar
  const existing = await findControlIdUserByRegistration(session, opts.registration);
  if (existing) {
    console.log(`[controlid] reusing existing user ${existing} for registration ${opts.registration}`);
    return { userId: existing };
  }

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
  const data = await fcgi<{ results?: { user_id: number; success: boolean; errors: unknown }[] }>(
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
  console.log(`[controlid] setPhoto result for user ${userId}:`, JSON.stringify(data));
  if (!result?.success) {
    const errDetail = result?.errors
      ? (typeof result.errors === "string" ? result.errors : JSON.stringify(result.errors))
      : "unknown error";
    throw new Error(`ControlID face upload failed for user ${userId}: ${errDetail}`);
  }
}

// ── Adicionar usuário ao grupo de acesso ─────────────────────────
// group_id 1 = "Padrão" — grupo que tem a regra de acesso ao portal
export async function addControlIdUserToGroup(
  session: string,
  userId: number,
  groupId = 1
): Promise<void> {
  try {
    await fcgi(session, "create_objects.fcgi", {
      object: "user_groups",
      values: [{ user_id: userId, group_id: groupId }],
    });
    console.log(`[controlid] user ${userId} added to group ${groupId}`);
  } catch (err) {
    // Ignora se já estiver no grupo (duplicate key)
    console.warn(`[controlid] addToGroup warning (may already be in group):`, err);
  }
}

// ── Vincular horário ao usuário ───────────────────────────────────
// time_zone_id 1 = "Sempre Liberado" — obrigatório para a fechadura liberar acesso
async function addControlIdUserTimeZone(
  session: string,
  userId: number,
  timeZoneId = 1
): Promise<void> {
  try {
    await fcgi(session, "create_objects.fcgi", {
      object: "user_time_zones",
      values: [{ user_id: userId, time_zone_id: timeZoneId }],
    });
    console.log(`[controlid] user ${userId} linked to time_zone ${timeZoneId}`);
  } catch (err) {
    // Ignora se já estiver vinculado (duplicate key)
    console.warn(`[controlid] addTimeZone warning (may already be linked):`, err);
  }
}

// ── Desvincular horário do usuário ────────────────────────────────
async function removeControlIdUserTimeZone(
  session: string,
  userId: number,
  timeZoneId = 1
): Promise<void> {
  try {
    await fcgi(session, "destroy_objects.fcgi", {
      object: "user_time_zones",
      where:  { user_time_zones: { user_id: userId, time_zone_id: timeZoneId } },
    });
    console.log(`[controlid] user ${userId} unlinked from time_zone ${timeZoneId}`);
  } catch (err) {
    console.warn(`[controlid] removeTimeZone warning:`, err);
  }
}

// ── Habilitar acesso: adiciona ao grupo + vincula horário "Sempre Liberado" ─
export async function enableControlIdUser(
  session: string,
  userId: number
): Promise<void> {
  // Adicionar ao grupo "Padrão" (id:1)
  await addControlIdUserToGroup(session, userId, 1);
  // Vincular horário "Sempre Liberado" (id:1) — sem isso a fechadura nega acesso
  await addControlIdUserTimeZone(session, userId, 1);
  // Garantir que não há restrição de tempo no cadastro do usuário
  await fcgi(session, "modify_objects.fcgi", {
    object: "users",
    values: { begin_time: 0, end_time: 0 },
    where:  { users: { id: userId } },
  });
}

// ── Desabilitar acesso: remove horário e seta janela impossível ───
export async function disableControlIdUser(
  session: string,
  userId: number
): Promise<void> {
  // Remove o vínculo com "Sempre Liberado"
  await removeControlIdUserTimeZone(session, userId, 1);
  // begin_time=1, end_time=1 → janela impossível → garantia extra de bloqueio
  await fcgi(session, "modify_objects.fcgi", {
    object: "users",
    values: { begin_time: 1, end_time: 1 },
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
