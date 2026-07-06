"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PLANS, type Plan } from "@/lib/plans";

type ClientData = {
  id: string; name: string; email: string; phone: string | null; cpf: string | null;
  hasCard: boolean;
};

const S = {
  page:   { minHeight: "100vh", background: "#f5f0e8", padding: "32px 16px" } as React.CSSProperties,
  wrap:   { maxWidth: 680, margin: "0 auto" } as React.CSSProperties,
  title:  { fontSize: 24, fontWeight: 700, color: "#1a0e05", marginBottom: 6 } as React.CSSProperties,
  sub:    { fontSize: 14, color: "rgba(26,14,5,0.5)", marginBottom: 32 } as React.CSSProperties,
  card:   { background: "#fff", borderRadius: 18, padding: "24px", border: "1px solid rgba(26,14,5,0.08)", marginBottom: 14, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 } as React.CSSProperties,
  label:  { display:"block", fontSize:11, fontWeight:700, color:"rgba(26,14,5,0.4)", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:8 },
  input:  { width:"100%", padding:"10px 14px", borderRadius:12, border:"1px solid rgba(26,14,5,0.12)", background:"#faf7f2", color:"#1a0e05", fontSize:14, outline:"none", boxSizing:"border-box" as const },
  btn:    { width:"100%", padding:"13px", borderRadius:12, fontWeight:700, fontSize:15, border:"none", cursor:"pointer", background:"#1a0e05", color:"#f5f0e8" } as React.CSSProperties,
  btnOut: { width:"100%", padding:"13px", borderRadius:12, fontWeight:600, fontSize:14, border:"1px solid rgba(26,14,5,0.15)", cursor:"pointer", background:"transparent", color:"#1a0e05" } as React.CSSProperties,
  err:    { fontSize:13, color:"#dc2626", background:"rgba(220,38,38,0.06)", padding:"10px 14px", borderRadius:10 } as React.CSSProperties,
};

const INSTALLMENT_OPTIONS = [1, 3, 6, 10];

export default function PortalPlanosPage() {
  const router = useRouter();
  const [client, setClient]     = useState<ClientData | null>(null);
  const [plans, setPlans]       = useState<Plan[]>(DEFAULT_PLANS);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [useSaved, setUseSaved] = useState(true);
  const [installments, setInst] = useState(1);
  const [card, setCard]         = useState({ holderName:"", cpf:"", number:"", expiryMonth:"", expiryYear:"", ccv:"" });
  const [submitting, setSub]    = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    fetch("/api/client/me").then(async (r) => {
      if (r.status === 401) { router.push("/portal/login"); return; }
      const d = await r.json();
      setClient({ id: d.id, name: d.name, email: d.email, phone: d.phone, cpf: d.cpf, hasCard: d.hasCard });
      setUseSaved(d.hasCard);
      setLoading(false);
    });
    fetch("/api/plans").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPlans(d); });
  }, [router]);

  function openPlan(plan: Plan) {
    if (plan.credits === 1) { router.push("/portal/reservar"); return; }
    setSelected(plan); setError(null); setInst(1);
    setCard({ holderName:"", cpf:"", number:"", expiryMonth:"", expiryYear:"", ccv:"" });
  }

  async function handleBuy() {
    if (!client || !selected) return;
    if (!useSaved && (!card.holderName || !card.number || !card.expiryMonth || !card.expiryYear || !card.ccv)) {
      setError("Preencha todos os dados do cartão."); return;
    }
    setSub(true); setError(null);

    const body: Record<string, unknown> = {
      name: client.name, email: client.email, phone: client.phone, cpf: client.cpf,
      planKey: selected.key,
      installmentCount: installments > 1 ? installments : undefined,
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

    const res  = await fetch("/api/bookings", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const data = await res.json();
    setSub(false);
    if (!res.ok) { setError(data.error ?? "Erro ao processar pagamento."); return; }
    setSuccess(true);
  }

  if (loading) return <div style={S.page}><p style={{ textAlign:"center", color:"rgba(26,14,5,0.4)", paddingTop:80 }}>Carregando...</p></div>;

  if (success && selected) return (
    <div style={S.page}>
      <div style={{ ...S.wrap, maxWidth:480 }}>
        <div style={{ background:"#fff", borderRadius:20, padding:40, textAlign:"center", border:"1px solid rgba(26,14,5,0.07)" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✓</div>
          <p style={{ fontSize:22, fontWeight:700, color:"#166534", marginBottom:8 }}>Plano ativado!</p>
          <p style={{ fontSize:15, color:"#1a0e05", fontWeight:600, marginBottom:4 }}>{selected.label}</p>
          <p style={{ fontSize:14, color:"rgba(26,14,5,0.5)", marginBottom:32 }}>
            Seus créditos já estão disponíveis. Agende seus períodos pelo portal.
          </p>
          <div style={{ display:"flex", gap:12, flexDirection:"column" }}>
            <button onClick={() => router.push("/portal")} style={S.btn}>Ver meus planos</button>
            <button onClick={() => { setSuccess(false); setSelected(null); }} style={S.btnOut}>Escolher outro plano</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <button onClick={() => router.push("/portal")} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(26,14,5,0.4)", fontSize:13, marginBottom:20, padding:0 }}>
          ← Voltar ao portal
        </button>
        <p style={S.title}>Planos VDO HUB</p>
        <p style={S.sub}>Escolha o plano ideal para sua rotina de trabalho.</p>

        {plans.map((plan) => (
          <div key={plan.key} style={S.card}>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:16, color:"#1a0e05", marginBottom:4 }}>
                {plan.label.split(" — ")[0]}
              </p>
              <p style={{ fontSize:13, color:"rgba(26,14,5,0.5)", marginBottom:4 }}>
                {plan.credits === 1 ? "1 período de 5h" : `${plan.credits} períodos de 5h`}
                {plan.validityMonths && ` · validade ${plan.validityMonths} meses`}
              </p>
              <p style={{ fontSize:13, color:"rgba(26,14,5,0.4)" }}>{plan.installments}</p>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <p style={{ fontSize:20, fontWeight:700, color:"#1a0e05" }}>
                R${plan.price.toLocaleString("pt-BR")}
              </p>
              <button onClick={() => openPlan(plan)}
                style={{ marginTop:10, padding:"8px 20px", borderRadius:10, border:"1px solid #1a0e05", background:"#1a0e05", color:"#f5f0e8", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {plan.credits === 1 ? "Reservar" : "Assinar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de pagamento */}
      {selected && !success && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) setSelected(null); }}>
          <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:440, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <p style={{ fontWeight:700, fontSize:17, color:"#1a0e05" }}>{selected.label.split(" — ")[0]}</p>
                <p style={{ fontSize:13, color:"rgba(26,14,5,0.5)" }}>R${selected.price.toLocaleString("pt-BR")}</p>
              </div>
              <button onClick={() => !submitting && setSelected(null)} style={{ background:"rgba(26,14,5,0.06)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16, color:"#1a0e05" }}>✕</button>
            </div>

            {/* Parcelas */}
            {selected.maxInstallments > 1 && (
              <div style={{ marginBottom:20 }}>
                <label style={S.label}>Parcelamento</label>
                <select value={installments} onChange={(e) => setInst(Number(e.target.value))} style={{ ...S.input }}>
                  {INSTALLMENT_OPTIONS.filter((n) => n <= selected.maxInstallments).map((n) => (
                    <option key={n} value={n}>
                      {n === 1
                        ? `À vista — R$${selected.price.toLocaleString("pt-BR")}`
                        : `${n}x de R$${(selected.price / n).toLocaleString("pt-BR", { minimumFractionDigits:2 })}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Pagamento */}
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Pagamento</label>
              {client?.hasCard && (
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <button onClick={() => setUseSaved(true)} style={{ flex:1, padding:"10px", borderRadius:10, border:`1px solid ${useSaved?"#1a0e05":"rgba(26,14,5,0.12)"}`, background:useSaved?"#1a0e05":"#faf7f2", color:useSaved?"#f5f0e8":"#1a0e05", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    Cartão salvo
                  </button>
                  <button onClick={() => setUseSaved(false)} style={{ flex:1, padding:"10px", borderRadius:10, border:`1px solid ${!useSaved?"#1a0e05":"rgba(26,14,5,0.12)"}`, background:!useSaved?"#1a0e05":"#faf7f2", color:!useSaved?"#f5f0e8":"#1a0e05", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    Outro cartão
                  </button>
                </div>
              )}

              {!useSaved && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <input value={card.holderName} onChange={(e) => setCard({...card, holderName:e.target.value})} placeholder="Nome no cartão" style={S.input} />
                  <input value={card.number} onChange={(e) => setCard({...card, number:e.target.value})} placeholder="Número do cartão" maxLength={19} style={S.input} />
                  <div style={{ display:"flex", gap:10 }}>
                    <input value={card.expiryMonth} onChange={(e) => setCard({...card, expiryMonth:e.target.value})} placeholder="MM" maxLength={2} style={{...S.input, flex:1}} />
                    <input value={card.expiryYear} onChange={(e) => setCard({...card, expiryYear:e.target.value})} placeholder="AAAA" maxLength={4} style={{...S.input, flex:1}} />
                    <input value={card.ccv} onChange={(e) => setCard({...card, ccv:e.target.value})} placeholder="CVV" maxLength={4} style={{...S.input, flex:1}} />
                  </div>
                  <input value={card.cpf} onChange={(e) => setCard({...card, cpf:e.target.value})} placeholder="CPF do titular" maxLength={14} style={S.input} />
                </div>
              )}
            </div>

            {error && <div style={{...S.err, marginBottom:16}}>{error}</div>}

            <button onClick={handleBuy} disabled={submitting} style={{...S.btn, opacity:submitting?0.6:1}}>
              {submitting ? "Processando..." : `Confirmar — R$${selected.price.toLocaleString("pt-BR")}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
