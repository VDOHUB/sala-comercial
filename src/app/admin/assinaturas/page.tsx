"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLAN_LABELS: Record<string, string> = {
  HUB_FIVE:    "HUB FIVE — 5 períodos",
  HUB_TEN:     "HUB TEN — 10 períodos",
  HUB_PARTNER: "HUB PARTNER — 15 períodos",
};

type Subscription = {
  id: string; planKey: string; totalCredits: number; usedCredits: number;
  status: string; expiresAt: string; totalAmount: number; token: string;
  asaasChargeId: string | null; createdAt: string;
  client: { name: string; email: string; phone: string | null };
  _count: { bookings: number };
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: "rgba(22,163,74,0.1)",  color: "#166534", label: "Ativo"     },
  EXPIRED:   { bg: "rgba(220,38,38,0.08)", color: "#991b1b", label: "Expirado"  },
  CANCELLED: { bg: "rgba(26,14,5,0.07)",   color: "rgba(26,14,5,0.45)", label: "Cancelado" },
};

export default function AssinaturasPage() {
  const [subs, setSubs]         = useState<Subscription[] | null>(null);
  const [filter, setFilter]     = useState("");
  const [refunding, setRefunding] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/assinaturas").then((r) => r.json()).then(setSubs);
  }

  async function handleRefund(sub: Subscription) {
    const label = sub.totalAmount > 0
      ? `R$ ${sub.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      : "gratuita";
    const periodos = sub.usedCredits > 0
      ? `\n\nAtenção: ${sub.usedCredits} período(s) já foram utilizados.`
      : "";
    if (!confirm(`Estornar assinatura de ${sub.client.name} (${label})?${periodos}\n\nA assinatura será cancelada e o valor devolvido ao cartão em até 7 dias úteis.`)) return;
    setRefunding(sub.id);
    const res  = await fetch(`/api/admin/assinaturas/${sub.id}/estorno`, { method: "POST" });
    const json = await res.json();
    setRefunding(null);
    if (!res.ok) { alert(`Erro ao estornar: ${json.error}`); return; }
    load();
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = subs?.filter((s) =>
    !filter || s.status === filter
  );

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://vdohub.viverdeobra.com";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Assinaturas</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
            {subs?.length ?? "–"} assinaturas no total
          </p>
        </div>

        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_STYLE).map(([v, s]) => (
            <option key={v} value={v}>{s.label}</option>
          ))}
        </select>
      </div>

      {!subs ? (
        <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>
          Carregando assinaturas...
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-medium text-lg mb-1" style={{ color: "#1a0e05" }}>Nenhuma assinatura encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((s) => {
            const st        = STATUS_STYLE[s.status] ?? STATUS_STYLE.CANCELLED;
            const remaining = s.totalCredits - s.usedCredits;
            const pct       = (s.usedCredits / s.totalCredits) * 100;
            const portalUrl = `${baseUrl}/minha-conta/${s.token}`;

            return (
              <div key={s.id} className="rounded-2xl p-5"
                style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-semibold" style={{ color: "#1a0e05" }}>{s.client.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "rgba(26,14,5,0.06)", color: "rgba(26,14,5,0.5)" }}>
                        {PLAN_LABELS[s.planKey] ?? s.planKey}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "rgba(26,14,5,0.45)" }}>{s.client.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold" style={{ color: "#1a0e05" }}>
                      R$ {s.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.38)" }}>
                      desde {format(new Date(s.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Progresso de créditos */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(26,14,5,0.45)" }}>
                    <span>{s.usedCredits} de {s.totalCredits} períodos usados</span>
                    <span style={{ color: remaining === 0 ? "#991b1b" : "#166534" }}>
                      {remaining} restante{remaining !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(26,14,5,0.08)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 100 ? "#991b1b" : "#1a0e05" }} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>
                    Expira em {format(new Date(s.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-3">
                    {s.status === "ACTIVE" && (
                      <button
                        onClick={() => handleRefund(s)}
                        disabled={refunding === s.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
                        style={{ background: "rgba(124,58,237,0.08)", color: "#5b21b6", border: "1px solid rgba(124,58,237,0.15)" }}
                      >
                        {refunding === s.id ? "Estornando..." : "Estornar"}
                      </button>
                    )}
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "rgba(26,14,5,0.5)" }}>
                      Abrir portal do cliente →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
