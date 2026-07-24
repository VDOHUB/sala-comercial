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
      // match:false — não rejeita a foto por baixa confiança de detecção facial na API;
      // selfies tiradas pelo celular (ângulo/luz variável) eram descartadas com match:true
      match: false,
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

// ── Regra de acesso compartilhada do sistema ──────────────────────
// O iDFace só libera a porta para um usuário quando existe uma cadeia:
// usuário → access_rule → (portal E time_zone) via as tabelas
// user_access_rules, portal_access_rules e access_rule_time_zones.
// Só pertencer ao grupo "Padrão" NÃO é suficiente — descoberto via
// /api/admin/controlid/debug comparando um usuário funcional (regra
// vinculada manualmente no painel) com um usuário sem acesso.
const ACCESS_RULE_NAME  = "VDO_HUB_ACCESS";
const ALWAYS_TIME_ZONE  = "Sempre Liberado";
let cachedAccessRuleId: number | null = null;

async function getOrCreateAccessRule(session: string): Promise<number> {
  if (cachedAccessRuleId) return cachedAccessRuleId;

  // 1. Buscar regra existente pelo nome
  const existing = await fcgi<{ access_rules?: { id: number; name: string }[] }>(
    session, "load_objects.fcgi", { object: "access_rules", where: { access_rules: { name: ACCESS_RULE_NAME } } }
  );
  let ruleId = existing.access_rules?.[0]?.id;

  if (!ruleId) {
    const created = await fcgi<{ ids?: number[] }>(session, "create_objects.fcgi", {
      object: "access_rules",
      values: [{ name: ACCESS_RULE_NAME, type: 1, priority: 0 }],
    });
    ruleId = created.ids?.[0];
    if (!ruleId) throw new Error("ControlID: falha ao criar access_rule do sistema");
    console.log(`[controlid] access_rule ${ACCESS_RULE_NAME} criada com id ${ruleId}`);

    // 2. Vincular ao portal
    const portals = await fcgi<{ portals?: { id: number }[] }>(session, "load_objects.fcgi", { object: "portals" });
    const portalId = portals.portals?.[0]?.id;
    if (portalId) {
      await fcgi(session, "create_objects.fcgi", {
        object: "portal_access_rules",
        values: [{ portal_id: portalId, access_rule_id: ruleId }],
      });
    }

    // 3. Vincular ao horário "Sempre Liberado"
    const timeZones = await fcgi<{ time_zones?: { id: number; name: string }[] }>(session, "load_objects.fcgi", { object: "time_zones" });
    const timeZoneId = timeZones.time_zones?.find((t) => t.name === ALWAYS_TIME_ZONE)?.id;
    if (timeZoneId) {
      await fcgi(session, "create_objects.fcgi", {
        object: "access_rule_time_zones",
        values: [{ access_rule_id: ruleId, time_zone_id: timeZoneId }],
      });
    }
  }

  cachedAccessRuleId = ruleId;
  return ruleId;
}

// ── Habilitar acesso: grupo + vínculo direto à regra de acesso ────
export async function enableControlIdUser(
  session: string,
  userId: number
): Promise<void> {
  await addControlIdUserToGroup(session, userId, 1);

  const ruleId = await getOrCreateAccessRule(session);
  try {
    await fcgi(session, "create_objects.fcgi", {
      object: "user_access_rules",
      values: [{ user_id: userId, access_rule_id: ruleId }],
    });
    console.log(`[controlid] user ${userId} linked to access_rule ${ruleId}`);
  } catch (err) {
    console.warn(`[controlid] linking user to access_rule warning (may already be linked):`, err);
  }

  // Garantir que não há restrição de tempo no cadastro do usuário
  await fcgi(session, "modify_objects.fcgi", {
    object: "users",
    values: { begin_time: 0, end_time: 0 },
    where:  { users: { id: userId } },
  });
}

// ── Desabilitar acesso: remove vínculo da regra e bloqueia usuário ─
export async function disableControlIdUser(
  session: string,
  userId: number
): Promise<void> {
  try {
    const ruleId = await getOrCreateAccessRule(session);
    await fcgi(session, "destroy_objects.fcgi", {
      object: "user_access_rules",
      where:  { user_access_rules: { user_id: userId, access_rule_id: ruleId } },
    });
    console.log(`[controlid] user ${userId} unlinked from access_rule ${ruleId}`);
  } catch (err) {
    console.warn(`[controlid] unlinking user from access_rule warning:`, err);
  }

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
