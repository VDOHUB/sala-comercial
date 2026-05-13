import axios from "axios";

// Em desenvolvimento → acesso direto ao IP local
// Em produção → via Cloudflare Tunnel (CONTROL_ID_TUNNEL_URL)
const baseURL =
  process.env.NODE_ENV === "production"
    ? process.env.CONTROL_ID_TUNNEL_URL
    : process.env.CONTROL_ID_BASE_URL;

const controlId = axios.create({ baseURL, timeout: 8000 });

// ── Autenticação ──────────────────────────────────────────────────
async function getToken(): Promise<string> {
  const res = await controlId.post("/login.fcgi", {
    login: process.env.CONTROL_ID_USERNAME,
    password: process.env.CONTROL_ID_PASSWORD,
  });
  return res.data.session;
}

// ── Criar usuário temporário na fechadura ─────────────────────────
export async function createControlIdUser(data: {
  name: string;
  email: string;
  photoBase64: string;   // foto para cadastro facial
  startTime: Date;       // início do acesso
  endTime: Date;         // fim do acesso
}): Promise<string> {
  const token = await getToken();

  // 1. Criar usuário
  const userRes = await controlId.post(
    "/user.fcgi",
    {
      users: [{
        name: data.name,
        email: data.email,
        begin_time: Math.floor(data.startTime.getTime() / 1000),
        end_time: Math.floor(data.endTime.getTime() / 1000),
      }],
    },
    { params: { session: token } }
  );
  const userId: string = userRes.data.ids[0];

  // 2. Cadastrar facial
  await controlId.post(
    "/user_facial.fcgi",
    {
      user_facials: [{
        user_id: userId,
        image: data.photoBase64,
      }],
    },
    { params: { session: token } }
  );

  return userId;
}

// ── Deletar usuário da fechadura (revoga acesso) ──────────────────
export async function deleteControlIdUser(userId: string): Promise<void> {
  const token = await getToken();
  await controlId.post(
    "/destroy_objects.fcgi",
    { object: "users", ids: [userId] },
    { params: { session: token } }
  );
}

// ── Buscar logs de acesso ─────────────────────────────────────────
export async function getAccessLogs(userId?: string) {
  const token = await getToken();
  const params: Record<string, unknown> = { session: token };
  if (userId) params.user_id = userId;

  const res = await controlId.get("/access_logs.fcgi", { params });
  return res.data.access_logs ?? [];
}
