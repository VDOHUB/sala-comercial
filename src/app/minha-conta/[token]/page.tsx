"use client";
import { useEffect, useState } from "react";
import { format, addDays, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const PERIODS = [
  { id: "MORNING",   label: "Matutino",   hours: "08h00 — 13h00", startHour: 8,  endHour: 13 },
  { id: "AFTERNOON", label: "Vespertino", hours: "14h00 — 19h00", startHour: 14, endHour: 19 },
];

const MIN_DAYS_AHEAD = 0; // 0 = hoje, 1 = só amanhã
const DAYS = Array.from({ length: 90 }, (_, i) => addDays(new Date(), i + MIN_DAYS_AHEAD))
  .filter((d) => !isWeekend(d))
  .slice(0, 60);

type OccupiedSlot = { startAt: string; endAt: string };
type ScheduledBooking = { id: string; startAt: string; endAt: string; status: string };

type Subscription = {
  id: string; planKey: string; totalCredits: number; usedCredits: number;
  status: string; expiresAt: string; token: string;
  client: { name: string; email: string };
  bookings: ScheduledBooking[];
};

function isPeriodOccupied(date: Date, period: typeof PERIODS[0], slots: OccupiedSlot[]) {
  const start = new Date(date); start.setHours(period.startHour, 0, 0, 0);
  const end   = new Date(date); end.setHours(period.endHour,   0, 0, 0);
  return slots.some((s) => new Date(s.startAt) < end && new Date(s.endAt) > start);
}

const STATUS_LABEL: Record<string, string> = {
  PAID: "Confirmado", ACTIVE: "Em uso", COMPLETED: "Concluído",
  CANCELLED: "Cancelado", PENDING: "Pendente",
};

export default function MinhaContaPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken]               = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [notFound, setNotFound]         = useState(false);
  const [occupied, setOccupied]         = useState<OccupiedSlot[]>([]);

  const [selectedDate, setSelectedDate]     = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [scheduling, setScheduling]         = useState(false);
  const [scheduleError, setScheduleError]   = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");
  const [showPicker, setShowPicker]         = useState(false);

  // Cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]       = useState("");
  const [cancelLoading, setCancelLoading]     = useState(false);
  const [cancelDone, setCancelDone]           = useState(false);
  const [cancelError, setCancelError]         = useState("");

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/subscriptions/${token}`)
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((d) => d && setSubscription(d));
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setOccupied(d));
  }, [token]);

  async function handleCancelRequest() {
    if (!subscription) return;
    setCancelLoading(true); setCancelError("");
    try {
      const res = await fetch("/api/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName:  subscription.client.name,
          clientEmail: subscription.client.email,
          reason:      cancelReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCancelError(data.error ?? "Erro ao enviar."); return; }
      setCancelDone(true);
    } catch {
      setCancelError("Erro de conexão. Tente novamente.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleSchedule() {
    if (!selectedDate || !selectedPeriod || !token) return;
    const period = PERIODS.find((p) => p.id === selectedPeriod)!;
    const startAt = new Date(selectedDate); startAt.setHours(period.startHour, 0, 0, 0);
    const endAt   = new Date(selectedDate); endAt.setHours(period.endHour,   0, 0, 0);

    setScheduling(true); setScheduleError(""); setScheduleSuccess("");
    const res = await fetch(`/api/subscriptions/${token}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: startAt.toISOString(), endAt: endAt.toISOString() }),
    });
    const data = await res.json();
    setScheduling(false);

    if (!res.ok) { setScheduleError(data.error || "Erro ao agendar."); return; }

    setScheduleSuccess(`Período agendado: ${format(startAt, "dd/MM/yyyy")} — ${period.hours}`);
    setSelectedDate(null); setSelectedPeriod(null); setShowPicker(false);

    // Recarregar dados
    fetch(`/api/subscriptions/${token}`).then((r) => r.json()).then(setSubscription);
    fetch("/api/bookings").then((r) => r.json()).then((d) => Array.isArray(d) && setOccupied(d));
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f0e8" }}>
        <div className="text-center p-8">
          <p className="text-2xl font-bold mb-2" style={{ color: "#1a0e05" }}>Link inválido</p>
          <p className="text-sm" style={{ color: "rgba(26,14,5,0.45)" }}>
            Este link não existe ou foi revogado.
          </p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f0e8" }}>
        <div className="animate-pulse text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando...</div>
      </div>
    );
  }

  const remainingCredits = subscription.totalCredits - subscription.usedCredits;
  const isActive         = subscription.status === "ACTIVE";
  const expiresAt        = new Date(subscription.expiresAt);

  const PLAN_LABELS: Record<string, string> = {
    HUB_FIVE: "HUB FIVE", HUB_TEN: "HUB TEN", HUB_PARTNER: "HUB PARTNER",
  };

  return (
    <div className="min-h-screen" style={{ background: "#f5f0e8" }}>
      {/* Header */}
      <div className="border-b" style={{ background: "#faf7f2", borderColor: "rgba(26,14,5,0.08)" }}>
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#1a0e05" }}>
            <span className="text-xs font-bold" style={{ color: "#f5f0e8", letterSpacing: 1 }}>VDO</span>
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "#1a0e05" }}>VDO HUB</p>
            <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>Minha Conta</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* Card da assinatura */}
        <div className="rounded-2xl p-6" style={{ background: "#faf7f2", border: "1px solid rgba(26,14,5,0.08)" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-1"
                style={{ color: "rgba(26,14,5,0.35)" }}>Plano ativo</p>
              <p className="text-xl font-bold" style={{ color: "#1a0e05" }}>
                {PLAN_LABELS[subscription.planKey] ?? subscription.planKey}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(26,14,5,0.45)" }}>
                Olá, {subscription.client.name}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={isActive
                ? { background: "rgba(22,163,74,0.1)", color: "#166534" }
                : { background: "rgba(220,38,38,0.08)", color: "#991b1b" }}>
              {isActive ? "Ativo" : subscription.status === "EXPIRED" ? "Expirado" : "Cancelado"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Créditos restantes", value: remainingCredits, accent: remainingCredits === 0 },
              { label: "Utilizados",          value: subscription.usedCredits },
              { label: "Total",               value: subscription.totalCredits },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3 text-center"
                style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.06)" }}>
                <p className="text-2xl font-bold" style={{ color: item.accent ? "#991b1b" : "#1a0e05" }}>
                  {item.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.4)" }}>{item.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs mt-4" style={{ color: "rgba(26,14,5,0.38)" }}>
            Válido até {format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Botão agendar */}
        {isActive && remainingCredits > 0 && (
          <div>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{ background: "#1a0e05", color: "#f5f0e8" }}>
              {showPicker ? "Fechar" : `+ Agendar período (${remainingCredits} disponíve${remainingCredits === 1 ? "l" : "is"})`}
            </button>

            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                  className="mt-4 rounded-2xl p-5"
                  style={{ background: "#faf7f2", border: "1px solid rgba(26,14,5,0.08)" }}>

                  <p className="text-xs font-semibold tracking-widest uppercase mb-4"
                    style={{ color: "rgba(26,14,5,0.35)" }}>Selecione o dia</p>

                  {/* Seletor de dias */}
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                    {DAYS.map((day) => {
                      const sel     = selectedDate && format(day,"yyyy-MM-dd") === format(selectedDate,"yyyy-MM-dd");
                      const fullDay = PERIODS.every((p) => isPeriodOccupied(day, p, occupied));
                      return (
                        <button key={day.toISOString()} type="button"
                          disabled={fullDay}
                          onClick={() => { setSelectedDate(day); setSelectedPeriod(null); }}
                          className="flex-shrink-0 flex flex-col items-center py-3 px-2 rounded-xl w-12 transition-all"
                          style={{
                            background: fullDay ? "transparent" : sel ? "rgba(26,14,5,0.1)" : "rgba(26,14,5,0.04)",
                            border: `1px solid ${fullDay ? "rgba(26,14,5,0.04)" : sel ? "rgba(26,14,5,0.3)" : "rgba(26,14,5,0.08)"}`,
                            opacity: fullDay ? 0.35 : 1,
                            cursor:  fullDay ? "not-allowed" : "pointer",
                          }}>
                          <span className="text-xs" style={{ color: "rgba(26,14,5,0.35)" }}>
                            {format(day,"EEE",{locale:ptBR})}
                          </span>
                          <span className="text-base font-bold my-0.5"
                            style={{ color: sel ? "#1a0e05" : "rgba(26,14,5,0.6)" }}>
                            {format(day,"d")}
                          </span>
                          <span className="text-xs" style={{ color: "rgba(26,14,5,0.25)" }}>
                            {format(day,"MMM",{locale:ptBR})}
                          </span>
                          {fullDay && <span style={{ fontSize: 8, color: "rgba(26,14,5,0.3)" }}>Reservado</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Período */}
                  {selectedDate && (
                    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
                      <p className="text-xs font-semibold tracking-widest uppercase mb-3"
                        style={{ color: "rgba(26,14,5,0.35)" }}>Selecione o período</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {PERIODS.map((p) => {
                          const occ = isPeriodOccupied(selectedDate, p, occupied);
                          const sel = selectedPeriod === p.id;
                          return occ ? (
                            <div key={p.id} className="rounded-xl p-4"
                              style={{ background: "rgba(26,14,5,0.02)", border: "1px solid rgba(26,14,5,0.05)", opacity: 0.4 }}>
                              <p className="text-sm font-semibold" style={{ color: "rgba(26,14,5,0.4)" }}>{p.label}</p>
                              <p className="text-xs" style={{ color: "rgba(26,14,5,0.3)" }}>{p.hours}</p>
                              <p className="text-xs font-semibold mt-1" style={{ color: "rgba(220,80,80,0.7)" }}>Indisponível</p>
                            </div>
                          ) : (
                            <button key={p.id} type="button" onClick={() => setSelectedPeriod(p.id)}
                              className="rounded-xl p-4 text-left transition-all"
                              style={{
                                background: sel ? "rgba(26,14,5,0.08)" : "rgba(26,14,5,0.03)",
                                border: `1px solid ${sel ? "rgba(26,14,5,0.2)" : "rgba(26,14,5,0.07)"}`,
                              }}>
                              <p className="text-sm font-semibold" style={{ color: sel ? "#1a0e05" : "rgba(26,14,5,0.6)" }}>{p.label}</p>
                              <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>{p.hours}</p>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {scheduleError && (
                    <p className="text-sm mb-3 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b", border: "1px solid rgba(220,38,38,0.12)" }}>
                      {scheduleError}
                    </p>
                  )}

                  <button
                    onClick={handleSchedule}
                    disabled={!selectedDate || !selectedPeriod || scheduling}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: "#1a0e05", color: "#f5f0e8" }}>
                    {scheduling ? "Agendando..." : "Confirmar agendamento"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {scheduleSuccess && (
              <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                className="mt-3 px-4 py-3 rounded-xl text-sm font-medium text-center"
                style={{ background: "rgba(22,163,74,0.08)", color: "#166534", border: "1px solid rgba(22,163,74,0.15)" }}>
                ✓ {scheduleSuccess}
              </motion.div>
            )}
          </div>
        )}

        {remainingCredits === 0 && isActive && (
          <div className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.07)" }}>
            <p className="text-sm font-medium" style={{ color: "rgba(26,14,5,0.5)" }}>
              Todos os créditos foram utilizados.
            </p>
          </div>
        )}

        {/* Agendamentos */}
        {subscription.bookings.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "rgba(26,14,5,0.35)" }}>Meus agendamentos</p>
            <div className="space-y-2">
              {subscription.bookings.map((b) => {
                const start = new Date(b.startAt);
                const end   = new Date(b.endAt);
                const past  = end < new Date();
                return (
                  <div key={b.id} className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "#faf7f2", border: "1px solid rgba(26,14,5,0.07)", opacity: past ? 0.6 : 1 }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>
                        {format(start, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.45)" }}>
                        {format(start, "HH:mm")} — {format(end, "HH:mm")}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: "rgba(22,163,74,0.1)", color: "#166534" }}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botão de cancelamento */}
        <div className="pt-2 pb-8">
          <div className="rounded-2xl p-5" style={{ background: "#faf7f2", border: "1px solid rgba(26,14,5,0.08)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#1a0e05" }}>Precisa cancelar?</p>
            <p className="text-xs mb-4" style={{ color: "rgba(26,14,5,0.45)" }}>
              Solicite o cancelamento da sua assinatura e nossa equipe entrará em contato.
            </p>
            <button
              onClick={() => { setShowCancelModal(true); setCancelDone(false); setCancelReason(""); setCancelError(""); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b", border: "1px solid rgba(220,38,38,0.15)" }}>
              Solicitar cancelamento
            </button>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(26,14,5,0.3)" }}>
            Dúvidas? WhatsApp (62) 99633-2257
          </p>
        </div>
      </div>

      {/* Modal de cancelamento */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(26,14,5,0.5)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCancelModal(false); }}>
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#faf7f2", border: "1px solid rgba(26,14,5,0.08)" }}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              {cancelDone ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
                    <span className="text-xl">✓</span>
                  </div>
                  <p className="font-bold text-lg mb-2" style={{ color: "#1a0e05" }}>Solicitação enviada!</p>
                  <p className="text-sm mb-5" style={{ color: "rgba(26,14,5,0.5)" }}>
                    Nossa equipe entrará em contato pelo e-mail <strong>{subscription?.client.email}</strong> em breve.
                  </p>
                  <button onClick={() => setShowCancelModal(false)}
                    className="px-6 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: "#1a0e05", color: "#f5f0e8" }}>
                    Fechar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-lg" style={{ color: "#1a0e05" }}>Solicitar cancelamento</h3>
                    <button onClick={() => setShowCancelModal(false)}
                      className="text-lg w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ color: "rgba(26,14,5,0.4)", background: "rgba(26,14,5,0.05)" }}>×</button>
                  </div>
                  <p className="text-sm mb-4" style={{ color: "rgba(26,14,5,0.5)" }}>
                    Confirme a solicitação de cancelamento para <strong style={{ color: "#1a0e05" }}>{subscription?.client.name}</strong>.
                    Você receberá retorno pelo e-mail cadastrado.
                  </p>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(26,14,5,0.5)" }}>
                      Motivo (opcional)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                      placeholder="Conte um pouco sobre o motivo..."
                      className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                      style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
                    />
                  </div>
                  {cancelError && (
                    <p className="text-sm px-3 py-2 rounded-xl mb-3"
                      style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b", border: "1px solid rgba(220,38,38,0.12)" }}>
                      {cancelError}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setShowCancelModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(26,14,5,0.06)", color: "rgba(26,14,5,0.55)" }}>
                      Voltar
                    </button>
                    <button onClick={handleCancelRequest} disabled={cancelLoading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                      style={{ background: "rgba(220,38,38,0.08)", color: "#991b1b", border: "1px solid rgba(220,38,38,0.15)" }}>
                      {cancelLoading ? "Enviando..." : "Confirmar solicitação"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
