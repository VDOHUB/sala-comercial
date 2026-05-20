import { Client } from "@upstash/qstash";

export const qstash = new Client({
  token:   process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL ?? "https://qstash.upstash.io",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vdohub.viverdeobra.com";

// Agenda liberação de acesso no horário exato da reserva
export async function scheduleGrant(bookingId: string, at: Date) {
  const delaySeconds = Math.max(0, Math.floor((at.getTime() - Date.now()) / 1000));
  await qstash.publishJSON({
    url:   `${BASE_URL}/api/access/grant`,
    delay: delaySeconds,
    body:  { bookingId },
  });
}

// Agenda revogação de acesso no horário exato do fim da reserva
export async function scheduleRevoke(bookingId: string, at: Date) {
  const delaySeconds = Math.max(0, Math.floor((at.getTime() - Date.now()) / 1000));
  await qstash.publishJSON({
    url:   `${BASE_URL}/api/access/revoke`,
    delay: delaySeconds,
    body:  { bookingId },
  });
}
