"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLAN_LABELS: Record<string, string> = {
  HUB_ONE:     "HUB ONE — 1 período",
  HUB_FIVE:    "HUB FIVE — 5 períodos",
  HUB_TEN:     "HUB TEN — 10 períodos",
  HUB_PARTNER: "HUB PARTNER — 15 períodos",
};

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  planKey: string;
  createdAt: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/leads").then((r) => r.json()).then(setLeads);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Leads</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
          Contatos que preencheram dados mas não concluíram o pagamento
          {leads ? ` — ${leads.length} lead${leads.length !== 1 ? "s" : ""}` : ""}
        </p>
      </div>

      {!leads ? (
        <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>
          Carregando leads...
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-medium text-lg mb-1" style={{ color: "#1a0e05" }}>Nenhum lead ainda</p>
          <p className="text-sm" style={{ color: "rgba(26,14,5,0.4)" }}>Leads aparecem quando alguém preenche os dados mas não finaliza o pagamento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl p-5 flex items-center justify-between gap-4"
              style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <p className="font-semibold" style={{ color: "#1a0e05" }}>{lead.name}</p>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "rgba(26,14,5,0.06)", color: "rgba(26,14,5,0.5)" }}
                  >
                    {PLAN_LABELS[lead.planKey] ?? lead.planKey}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "rgba(26,14,5,0.55)" }}>{lead.email}</p>
                {lead.phone && (
                  <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.4)" }}>{lead.phone}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>
                  {format(new Date(lead.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <a
                  href={`https://wa.me/55${lead.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.name}, vimos que você demonstrou interesse no ${PLAN_LABELS[lead.planKey] ?? lead.planKey} no VDO HUB! Podemos te ajudar?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold hover:underline mt-1 inline-block"
                  style={{ color: "rgba(26,14,5,0.5)" }}
                >
                  {lead.phone ? "WhatsApp →" : "—"}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
