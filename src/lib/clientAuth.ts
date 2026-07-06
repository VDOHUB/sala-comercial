import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.CLIENT_JWT_SECRET ?? "client-secret-vdohub";
const COOKIE  = "client_session";

export function signClientToken(clientId: string) {
  return jwt.sign({ clientId }, SECRET, { expiresIn: "30d" });
}

export function verifyClientToken(token: string): { clientId: string } | null {
  try {
    return jwt.verify(token, SECRET) as { clientId: string };
  } catch {
    return null;
  }
}

export async function getClientSession() {
  const jar  = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const payload = verifyClientToken(token);
  if (!payload) return null;
  return prisma.client.findUnique({ where: { id: payload.clientId } });
}
