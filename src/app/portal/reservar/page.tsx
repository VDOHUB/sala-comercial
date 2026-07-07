"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isWeekend, isSameDay, parseISO, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";

type ClientData = {
  id: string; name: string; email: string; phone: string | null; cpf: string | null;
  hasCard: boolean; hasFace: boolean;
};

type Slot = { startAt: string; endAt: string };

const PERIODS = [
  { key: "M", label: "Matutino",   desc: "08:00 – 13:00", hour: 8,  endHour: 13 },
  { key: "V", label: "Vespertino", desc: "14:00 – 19:00", hour: 14, endHour: 19 },
];

function buildDays(): Date[] {
  const days: Date[] = [];
  let d = addDays(new Date(), 1);
  while (days.length < 30) {
    if (!isWeekend(d)) days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}

function isSlotOccupied(date: Date, hour: number, slots: Slot[]): boolean {
  return slots.some((s) => {
    const st = parseISO(s.startAt);
    return isSameDay(st, date) && getHours(st) === hour;
  });
}

const S = {
  page:   { minHeight: "100vh", background: "#f5f0e8", padding: "32px 16px" } as React.CSSProperties,
  card:   { maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 2px 24px rgba(26,14,5,0.08)", border: "1px solid rgba(26,14,5,0.07)" } as React.CSSProperties,
  title:  { fontSize: 22, fontWeight: 700, color: "#1a0e05", marginBottom: 4 } as React.CSSProperties,
  sub:    { fontSize: 14, color: "rgba(26,14,5,0.5)", marginBottom: 28 } as React.CSSProperties,
  label:  { display: "block", fontSize: 11, fontWeight: 700, color: "rgba(26,14,5,0.4)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8 },
  input:  { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(26,14,5,0.12)", background: "#faf7f2", color: "#1a0e05", fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  btn:    { width: "100%", padding: "13px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", background: "#1a0e05", color: "#f5f0e8" } as React.CSSProperties,
  btnOut: { width: "100%", padding: "13px", borderRadius: 12, fontWeight: 600, fontSize: 14, border: "1px solid rgba(26,14,5,0.15)", cursor: "pointer", background: "transparent", color: "#1a0e05" } as React.CSSProperties,
  err:    { fontSize: 13, color: "#dc2626", background: "rgba(220,38,38,0.06)", padding: "10px 14px", borderRadius: 10 } as React.CSSProperties,
  sec:    { marginBottom: 24 } as React.CSSProperties,
};

// ── Step indicator ────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const labels = ["Reserva", "Foto facial"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
      {labels.map((l, i) => (
        <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < labels.length - 1 ? "none" : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
              background: i + 1 <= current ? "#1a0e05" : "rgba(26,14,5,0.08)",
              color: i + 1 <= current ? "#f5f0e8" : "rgba(26,14,5,0.3)",
            }}>
              {i + 1 < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: i + 1 === current ? "#1a0e05" : "rgba(26,14,5,0.35)" }}>{l}</span>
          </div>
          {i < labels.length - 1 && (
            <div style={{ flex: 1, height: 1, background: "rgba(26,14,5,0.1)", marginLeft: 4 }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function PortalReservarPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Session & availability
  const [client, setClient]         = useState<ClientData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [slots, setSlots]           = useState<Slot[]>([]);
  const [days]                      = useState<Date[]>(buildDays);

  // Step 1 — booking form
  const [selectedDay, setDay]       = useState<Date | null>(null);
  const [selectedPeriod, setPeriod] = useState<string | null>(null);
  const [voucher, setVoucher]       = useState("");
  const [useSaved, setUseSaved]     = useState(true);
  const [card, setCard]             = useState({ holderName: "", cpf: "", number: "", expiryMonth: "", expiryYear: "", ccv: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Step 2 — facial
  const [step, setStep]             = useState(1);
  const [bookingId, setBookingId]   = useState<string | null>(null);
  const [photo, setPhoto]           = useState<string | null>(null);
  const [facialSaving, setFacialSaving] = useState(false);
  const [facialError, setFacialError]   = useState<string | null>(null);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    fetch("/api/client/me").then(async (r) => {
      if (r.status === 401) { router.push("/portal/login"); return; }
      const d = await r.json();
      setClient({ id: d.id, name: d.name, email: d.email, phone: d.phone, cpf: d.cpf, hasCard: d.hasCard, hasFace: !!d.facePhoto });
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    const months = [...new Set(days.map((d) => format(d, "yyyy-MM")))];
    Promise.all(months.map((m) => fetch(`/api/bookings?month=${m}`).then((r) => r.json()))).then((results) => {
      setSlots(results.flat());
    });
  }, [days]);

  useEffect(() => { if (client) setUseSaved(client.hasCard); }, [client]);

  // ── Step 1: submit booking ──────────────────────────────────────
  async function handleSubmit() {
    if (!client || !selectedDay || !selectedPeriod) { setError("Selecione uma data e período."); return; }
    if (!useSaved && (!card.holderName || !card.number || !card.expiryMonth || !card.expiryYear || !card.ccv)) {
      setError("Preencha todos os dados do cartão."); return;
    }
    setSubmitting(true); setError(null);

    const period = PERIODS.find((p) => p.key === selectedPeriod)!;
    const startAt = new Date(selectedDay); startAt.setHours(period.hour, 0, 0, 0);
    const endAt   = new Date(selectedDay); endAt.setHours(period.endHour, 0, 0, 0);

    const body: Record<string, unknown> = {
      name: client.name, email: client.email, phone: client.phone, cpf: client.cpf,
      planKey: "HUB_ONE",
      startAt: startAt.toISOString(),
      endAt:   endAt.toISOString(),
      voucherCode: voucher || undefined,
    };

    if (useSaved) {
      body.useSavedCard = true;
    } else {
      body.card = {
        holderName:  card.holderName,
        number:      card.number.replace(/\s/g, ""),
        expiryMonth: card.expiryMonth.padStart(2, "0"),
        expiryYear:  card.expiryYear,
        ccv:         card.ccv,
        cpf:         card.cpf || undefined,
      };
    }

    const res  = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Erro ao criar reserva."); return; }

    setBookingId(data.bookingId);

    // Se já tem foto cadastrada, pula etapa facial
    if (client.hasFace) { setDone(true); return; }
    setStep(2);
  }

  // ── Step 2: file selected → preview ────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Step 2: send facial photo ───────────────────────────────────
  async function handleFacialSubmit() {
    if (!photo || !bookingId) return;
    setFacialSaving(true); setFacialError(null);
    const res = await fetch(`/api/bookings/${bookingId}/facial`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoBase64: photo, isSubscription: false }),
    });
    setFacialSaving(false);
    if (!res.ok) { setFacialError("Erro ao salvar foto. Tente novamente."); return; }
    setDone(true);
  }

  if (loading) return (
    <div style={S.page}>
      <p style={{ textAlign: "center", color: "rgba(26,14,5,0.4)", paddingTop: 80 }}>Carregando...</p>
    </div>
  );

  // ── Tela final ──────────────────────────────────────────────────
  if (done) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>✓</div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#166534", marginBottom: 8 }}>Tudo pronto!</p>
          <p style={{ fontSize: 14, color: "rgba(26,14,5,0.6)", marginBottom: 4, fontWeight: 600 }}>
            {selectedDay && format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
          <p style={{ fontSize: 14, color: "rgba(26,14,5,0.4)", marginBottom: 32 }}>
            {PERIODS.find((p) => p.key === selectedPeriod)?.desc} · Reserva confirmada
          </p>
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <button onClick={() => router.push("/portal")} style={S.btn}>Voltar ao portal</button>
            <button onClick={() => { setDone(false); setStep(1); setDay(null); setPeriod(null); setVoucher(""); setPhoto(null); setBookingId(null); }} style={S.btnOut}>
              Fazer outra reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 2: Cadastro facial ─────────────────────────────────────
  if (step === 2) return (
    <div style={S.page}>
      <div style={S.card}>
        <Steps current={2} />
        <p style={S.title}>Cadastro facial</p>
        <p style={S.sub}>Tire uma selfie ou envie uma foto do seu rosto para liberar o acesso à sala.</p>

        {/* Preview / placeholder */}
        <div style={{ ...S.sec, display: "flex", justifyContent: "center" }}>
          {photo ? (
            <div style={{ position: "relative" }}>
              <img src={photo} alt="Sua foto" style={{ width: 200, height: 200, borderRadius: 16, objectFit: "cover", border: "2px solid rgba(26,14,5,0.1)" }} />
              <button onClick={() => setPhoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          ) : (
            <div style={{ width: 200, height: 200, borderRadius: 16, background: "rgba(26,14,5,0.04)", border: "2px dashed rgba(26,14,5,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 40 }}>📷</span>
              <p style={{ fontSize: 12, color: "rgba(26,14,5,0.4)", textAlign: "center", padding: "0 16px" }}>Rosto centralizado e bem iluminado</p>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" style={{ display: "none" }} onChange={handleFileChange} />

        {!photo && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <button onClick={() => fileRef.current?.click()} style={{ ...S.btn }}>
              Tirar selfie / escolher foto
            </button>
          </div>
        )}

        {photo && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <button onClick={handleFacialSubmit} disabled={facialSaving} style={{ ...S.btn, opacity: facialSaving ? 0.6 : 1 }}>
              {facialSaving ? "Salvando..." : "Confirmar foto"}
            </button>
            <button onClick={() => { setPhoto(null); fileRef.current?.click(); }} disabled={facialSaving} style={S.btnOut}>
              Tirar outra foto
            </button>
          </div>
        )}

        {facialError && <div style={{ ...S.err, marginBottom: 12 }}>{facialError}</div>}

        <button onClick={() => setDone(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(26,14,5,0.35)", textDecoration: "underline", width: "100%", textAlign: "center", padding: "8px 0" }}>
          Pular por agora (cadastrar depois)
        </button>
      </div>
    </div>
  );

  // ── Step 1: Booking form ────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.card}>
        <button onClick={() => router.push("/portal")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(26,14,5,0.4)", fontSize: 13, marginBottom: 20, padding: 0 }}>
          ← Voltar ao portal
        </button>

        <Steps current={1} />
        <p style={S.title}>Nova Reserva</p>
        <p style={S.sub}>HUB ONE — 1 período (5h)</p>

        {/* Date picker */}
        <div style={S.sec}>
          <span style={S.label}>Selecione a data</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {days.slice(0, 20).map((d) => {
              const bothOccupied = PERIODS.every((p) => isSlotOccupied(d, p.hour, slots));
              const selected = selectedDay && isSameDay(d, selectedDay);
              return (
                <button key={d.toISOString()} onClick={() => { if (!bothOccupied) { setDay(d); setPeriod(null); } }}
                  disabled={bothOccupied}
                  style={{
                    padding: "8px 4px", borderRadius: 10, border: "1px solid",
                    borderColor: selected ? "#1a0e05" : "rgba(26,14,5,0.12)",
                    background: selected ? "#1a0e05" : bothOccupied ? "rgba(26,14,5,0.03)" : "#faf7f2",
                    color: selected ? "#f5f0e8" : bothOccupied ? "rgba(26,14,5,0.2)" : "#1a0e05",
                    cursor: bothOccupied ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 600, textAlign: "center",
                  }}>
                  <div>{format(d, "EEE", { locale: ptBR })}</div>
                  <div>{format(d, "dd/MM")}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Period picker */}
        {selectedDay && (
          <div style={S.sec}>
            <span style={S.label}>Selecione o período</span>
            <div style={{ display: "flex", gap: 10 }}>
              {PERIODS.map((p) => {
                const occ = isSlotOccupied(selectedDay, p.hour, slots);
                const sel = selectedPeriod === p.key;
                return (
                  <button key={p.key} onClick={() => { if (!occ) setPeriod(p.key); }}
                    disabled={occ}
                    style={{
                      flex: 1, padding: "12px 8px", borderRadius: 12, border: "1px solid",
                      borderColor: sel ? "#1a0e05" : "rgba(26,14,5,0.12)",
                      background: sel ? "#1a0e05" : occ ? "rgba(26,14,5,0.03)" : "#faf7f2",
                      color: sel ? "#f5f0e8" : occ ? "rgba(26,14,5,0.2)" : "#1a0e05",
                      cursor: occ ? "not-allowed" : "pointer",
                      fontSize: 13, fontWeight: 600,
                    }}>
                    <div>{p.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>{p.desc}</div>
                    {occ && <div style={{ fontSize: 10, marginTop: 2 }}>Ocupado</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Voucher */}
        <div style={S.sec}>
          <label style={S.label}>Cupom de desconto (opcional)</label>
          <input value={voucher} onChange={(e) => setVoucher(e.target.value.toUpperCase())}
            placeholder="CÓDIGO" style={S.input} />
        </div>

        {/* Payment */}
        <div style={S.sec}>
          <span style={S.label}>Pagamento</span>
          {client?.hasCard && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setUseSaved(true)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${useSaved ? "#1a0e05" : "rgba(26,14,5,0.12)"}`, background: useSaved ? "#1a0e05" : "#faf7f2", color: useSaved ? "#f5f0e8" : "#1a0e05", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cartão salvo
              </button>
              <button onClick={() => setUseSaved(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${!useSaved ? "#1a0e05" : "rgba(26,14,5,0.12)"}`, background: !useSaved ? "#1a0e05" : "#faf7f2", color: !useSaved ? "#f5f0e8" : "#1a0e05", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Outro cartão
              </button>
            </div>
          )}

          {!useSaved && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={card.holderName} onChange={(e) => setCard({ ...card, holderName: e.target.value })} placeholder="Nome no cartão" style={S.input} />
              <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="Número do cartão" maxLength={19} style={S.input} />
              <div style={{ display: "flex", gap: 10 }}>
                <input value={card.expiryMonth} onChange={(e) => setCard({ ...card, expiryMonth: e.target.value })} placeholder="MM" maxLength={2} style={{ ...S.input, flex: 1 }} />
                <input value={card.expiryYear} onChange={(e) => setCard({ ...card, expiryYear: e.target.value })} placeholder="AAAA" maxLength={4} style={{ ...S.input, flex: 1 }} />
                <input value={card.ccv} onChange={(e) => setCard({ ...card, ccv: e.target.value })} placeholder="CVV" maxLength={4} style={{ ...S.input, flex: 1 }} />
              </div>
              <input value={card.cpf} onChange={(e) => setCard({ ...card, cpf: e.target.value })} placeholder="CPF do titular" maxLength={14} style={S.input} />
            </div>
          )}
        </div>

        {error && <div style={{ ...S.err, marginBottom: 16 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={submitting || !selectedDay || !selectedPeriod}
          style={{ ...S.btn, opacity: submitting || !selectedDay || !selectedPeriod ? 0.5 : 1 }}>
          {submitting ? "Processando..." : "Confirmar e continuar →"}
        </button>
      </div>
    </div>
  );
}
