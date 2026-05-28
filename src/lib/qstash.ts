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

// Agenda lembretes de fim de sessão (1h e 30min antes)
export async function scheduleEndingReminders(bookingId: string, endAt: Date) {
  const now = Date.now();

  const delay60 = Math.floor((endAt.getTime() - 60 * 60 * 1000 - now) / 1000);
  const delay30 = Math.floor((endAt.getTime() - 30 * 60 * 1000 - now) / 1000);

  const promises = [];
  if (delay60 > 30) { // só agenda se faltam mais de 30s
    promises.push(qstash.publishJSON({
      url:   `${BASE_URL}/api/notifications/session-ending`,
      delay: delay60,
      body:  { bookingId, minutesLeft: 60 },
    }));
  }
  if (delay30 > 30) {
    promises.push(qstash.publishJSON({
      url:   `${BASE_URL}/api/notifications/session-ending`,
      delay: delay30,
      body:  { bookingId, minutesLeft: 30 },
    }));
  }
  await Promise.allSettled(promises);
}
