"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isWeekend, isSameDay, parseISO, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";

type ClientData = {
  id: string; name: string; email: string; phone: string | null; cpf: string | null;
  hasCard: boolean; hasFace: boolean;
};

type Slot = { startAt: string; endAt: string };

const PERIODS = [
  { key: "M", label: "Matutino",    desc: "08:00 – 13:00", hour: 8,  endHour: 13 },
  { key: "V", label: "Vespertino",  desc: "14:00 – 19:00", hour: 14, endHour: 19 },
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
  page:    { minHeight: "100vh", background: "#f5f0e8", padding: "32px 16px" } as React.CSSProperties,
  card:    { maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 2px 24px rgba(26,14,5,0.08)", border: "1px solid rgba(26,14,5,0.07)" } as React.CSSProperties,
  title:   { fontSize: 22, fontWeight: 700, color: "#1a0e05", marginBottom: 4 } as React.CSSProperties,
  sub:     { fontSize: 14, color: "rgba(26,14,5,0.5)", marginBottom: 28 } as React.CSSProperties,
  label:   { display: "block", fontSize: 11, fontWeight: 700, color: "rgba(26,14,5,0.4)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8 },
  input:   { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(26,14,5,0.12)", background: "#faf7f2", color: "#1a0e05", fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  btn:     { width: "100%", padding: "13px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", background: "#1a0e05", color: "#f5f0e8" } as React.CSSProperties,
  btnOut:  { width: "100%", padding: "13px", borderRadius: 12, fontWeight: 600, fontSize: 14, border: "1px solid rgba(26,14,5,0.15)", cursor: "pointer", background: "transparent", color: "#1a0e05" } as React.CSSProperties,
  err:     { fontSize: 13, color: "#dc2626", background: "rgba(220,38,38,0.06)", padding: "10px 14px", borderRadius: 10 } as React.CSSProperties,
  sec:     { marginBottom: 24 } as React.CSSProperties,
};

export default function PortalReservarPage() {
  const router = useRouter();
  const [client, setClient]         = useState<ClientData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [slots, setSlots]           = useState<Slot[]>([]);
  const [days]                      = useState<Date[]>(buildDays);
  const [selectedDay, setDay]       = useState<Date | null>(null);
  const [selectedPeriod, setPeriod] = useState<string | null>(null);
  const [voucher, setVoucher]       = useState("");
  const [useSaved, setUseSaved]     = useState(true);
  const [card, setCard]             = useState({ holderName:"", cpf:"", number:"", expiryMonth:"", expiryYear:"", ccv:"" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  // Load client session
  useEffect(() => {
    fetch("/api/client/me").then(async (r) => {
      if (r.status === 401) { router.push("/portal/login"); return; }
      const d = await r.json();
      setClient({ id: d.id, name: d.name, email: d.email, phone: d.phone, cpf: d.cpf, hasCard: d.hasCard, hasFace: !!d.facePhoto });
      setLoading(false);
    });
  }, [router]);

  // Load occupied slots for visible months
  useEffect(() => {
    const months = [...new Set(days.map((d) => format(d, "yyyy-MM")))];
    Promise.all(months.map((m) => fetch(`/api/bookings?month=${m}`).then((r) => r.json()))).then((results) => {
      setSlots(results.flat());
    });
  }, [days]);

  // Auto-select useSaved based on hasCard
  useEffect(() => {
    if (client) setUseSaved(client.hasCard);
  }, [client]);

  async function handleSubmit() {
    if (!client || !selectedDay || !selectedPeriod) { setError("Selecione uma data e período."); return; }
    if (!useSaved && (!card.holderName || !card.number || !card.expiryMonth || !card.expiryYear || !card.ccv)) {
      setError("Preencha todos os dados do cartão."); return;
    }
    setSubmitting(true); setError(null);

    const period = PERIODS.find((p) => p.key === selectedPeriod)!;
    const startAt = new Date(selectedDay);
    startAt.setHours(period.hour, 0, 0, 0);
    const endAt = new Date(selectedDay);
    endAt.setHours(period.endHour, 0, 0, 0);

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
    setSuccess(true);
  }

  if (loading) return <div style={S.page}><p style={{ textAlign:"center", color:"rgba(26,14,5,0.4)", paddingTop:80 }}>Carregando...</p></div>;

  if (success) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign:"center", padding:"16px 0" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✓</div>
          <p style={{ fontSize:22, fontWeight:700, color:"#166534", marginBottom:8 }}>Reserva confirmada!</p>
          <p style={{ fontSize:14, color:"rgba(26,14,5,0.5)", marginBottom:8 }}>
            {selectedDay && format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}<br/>
            {PERIODS.find((p) => p.key === selectedPeriod)?.desc}
          </p>
          <p style={{ fontSize:13, color:"rgba(26,14,5,0.4)", marginBottom:32 }}>Você receberá um e-mail de confirmação.</p>
          <div style={{ display:"flex", gap:12, flexDirection:"column" }}>
            <button onClick={() => router.push("/portal")} style={S.btn}>Voltar ao portal</button>
            <button onClick={() => { setSuccess(false); setDay(null); setPeriod(null); setVoucher(""); }} style={S.btnOut}>
              Fazer outra reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Back */}
        <button onClick={() => router.push("/portal")} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(26,14,5,0.4)", fontSize:13, marginBottom:20, padding:0 }}>
          ← Voltar ao portal
        </button>

        <p style={S.title}>Nova Reserva</p>
        <p style={S.sub}>HUB ONE — 1 período (5h)</p>

        {/* Date picker */}
        <div style={S.sec}>
          <span style={S.label}>Selecione a data</span>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:6 }}>
            {days.slice(0, 20).map((d) => {
              const bothOccupied = PERIODS.every((p) => isSlotOccupied(d, p.hour, slots));
              const selected = selectedDay && isSameDay(d, selectedDay);
              return (
                <button key={d.toISOString()} onClick={() => { if (!bothOccupied) { setDay(d); setPeriod(null); } }}
                  disabled={bothOccupied}
                  style={{
                    padding:"8px 4px", borderRadius:10, border:"1px solid",
                    borderColor: selected ? "#1a0e05" : "rgba(26,14,5,0.12)",
                    background: selected ? "#1a0e05" : bothOccupied ? "rgba(26,14,5,0.03)" : "#faf7f2",
                    color: selected ? "#f5f0e8" : bothOccupied ? "rgba(26,14,5,0.2)" : "#1a0e05",
                    cursor: bothOccupied ? "not-allowed" : "pointer",
                    fontSize:12, fontWeight:600, textAlign:"center",
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
            <div style={{ display:"flex", gap:10 }}>
              {PERIODS.map((p) => {
                const occ = isSlotOccupied(selectedDay, p.hour, slots);
                const sel = selectedPeriod === p.key;
                return (
                  <button key={p.key} onClick={() => { if (!occ) setPeriod(p.key); }}
                    disabled={occ}
                    style={{
                      flex:1, padding:"12px 8px", borderRadius:12, border:"1px solid",
                      borderColor: sel ? "#1a0e05" : "rgba(26,14,5,0.12)",
                      background: sel ? "#1a0e05" : occ ? "rgba(26,14,5,0.03)" : "#faf7f2",
                      color: sel ? "#f5f0e8" : occ ? "rgba(26,14,5,0.2)" : "#1a0e05",
                      cursor: occ ? "not-allowed" : "pointer",
                      fontSize:13, fontWeight:600,
                    }}>
                    <div>{p.label}</div>
                    <div style={{ fontSize:11, fontWeight:400, marginTop:2, opacity:0.7 }}>{p.desc}</div>
                    {occ && <div style={{ fontSize:10, marginTop:2 }}>Ocupado</div>}
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
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <button onClick={() => setUseSaved(true)} style={{ flex:1, padding:"10px", borderRadius:10, border:`1px solid ${useSaved ? "#1a0e05" : "rgba(26,14,5,0.12)"}`, background: useSaved ? "#1a0e05" : "#faf7f2", color: useSaved ? "#f5f0e8" : "#1a0e05", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Cartão salvo
              </button>
              <button onClick={() => setUseSaved(false)} style={{ flex:1, padding:"10px", borderRadius:10, border:`1px solid ${!useSaved ? "#1a0e05" : "rgba(26,14,5,0.12)"}`, background: !useSaved ? "#1a0e05" : "#faf7f2", color: !useSaved ? "#f5f0e8" : "#1a0e05", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Outro cartão
              </button>
            </div>
          )}

          {!useSaved && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <input value={card.holderName} onChange={(e) => setCard({ ...card, holderName: e.target.value })} placeholder="Nome no cartão" style={S.input} />
              <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="Número do cartão" maxLength={19} style={S.input} />
              <div style={{ display:"flex", gap:10 }}>
                <input value={card.expiryMonth} onChange={(e) => setCard({ ...card, expiryMonth: e.target.value })} placeholder="MM" maxLength={2} style={{ ...S.input, flex:1 }} />
                <input value={card.expiryYear} onChange={(e) => setCard({ ...card, expiryYear: e.target.value })} placeholder="AAAA" maxLength={4} style={{ ...S.input, flex:1 }} />
                <input value={card.ccv} onChange={(e) => setCard({ ...card, ccv: e.target.value })} placeholder="CVV" maxLength={4} style={{ ...S.input, flex:1 }} />
              </div>
              <input value={card.cpf} onChange={(e) => setCard({ ...card, cpf: e.target.value })} placeholder="CPF do titular" maxLength={14} style={S.input} />
            </div>
          )}
        </div>

        {error && <div style={{ ...S.err, marginBottom:16 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={submitting || !selectedDay || !selectedPeriod} style={{ ...S.btn, opacity: submitting || !selectedDay || !selectedPeriod ? 0.5 : 1 }}>
          {submitting ? "Processando..." : "Confirmar reserva"}
        </button>
      </div>
    </div>
  );
}
