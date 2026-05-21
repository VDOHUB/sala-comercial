"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Booking = {
  id: string; startAt: string; endAt: string; totalAmount: number;
  discountAmount: number; status: string; paidAt: string | null;
  asaasPaymentUrl: string | null; asaasChargeId: string | null;
  client: { name: string; email: string; phone: string | null };
  voucher: { code: string } | null;
};

const STATUS = {
  PENDING:   { label: "Pendente",  bg: "rgba(234,179,8,0.1)",  color: "#854d0e" },
  PAID:      { label: "Pago",      bg: "rgba(22,163,74,0.1)",  color: "#166534" },
  ACTIVE:    { label: "Em uso",    bg: "rgba(37,99,235,0.1)",  color: "#1e40af" },
  COMPLETED: { label: "Concluído", bg: "rgba(26,14,5,0.07)",   color: "rgba(26,14,5,0.45)" },
  CANCELLED: { label: "Cancelado", bg: "rgba(220,38,38,0.08)", color: "#991b1b" },
  REFUNDED:  { label: "Reembolso", bg: "rgba(124,58,237,0.1)", color: "#5b21b6" },
} as Record<string, { label: string; bg: string; color: string }>;

export default function ReservasPage() {
  const [data, setData]       = useState<{ bookings: Booking[]; total: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);

  function load() {
    const url = `/api/admin/reservas${statusFilter ? `?status=${statusFilter}` : ""}`;
    fetch(url).then((r) => r.json()).then(setData);
  }

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  async function handleDelete(id: string, clientName: string) {
    if (!confirm(`Excluir reserva de ${clientName}? Esta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/reservas/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  async function handleRefund(id: string, clientName: string, amount: number) {
    const label = amount > 0 ? `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "gratuita";
    if (!confirm(`Estornar reserva de ${clientName} (${label})?\n\nO valor será devolvido ao cartão do cliente em até 7 dias úteis. Esta ação não pode ser desfeita.`)) return;
    setRefunding(id);
    const res  = await fetch(`/api/admin/reservas/${id}/estorno`, { method: "POST" });
    const json = await res.json();
    setRefunding(null);
    if (!res.ok) { alert(`Erro ao estornar: ${json.error}`); return; }
    load();
  }

  async function handleStatus(id: string, newStatus: string) {
    await fetch(`/api/admin/reservas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Reservas</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
            {data?.total ?? "–"} reservas no total
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([v, s]) => (
            <option key={v} value={v}>{s.label}</option>
          ))}
        </select>
      </div>

      {!data ? (
        <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>
          Carregando reservas...
        </div>
      ) : data.bookings.length === 0 ? (
        <div className="text-center py-20" style={{ color: "rgba(26,14,5,0.38)" }}>
          <p className="font-medium text-lg mb-1" style={{ color: "#1a0e05" }}>Nenhuma reserva encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.bookings.map((b) => {
            const s = STATUS[b.status];
            return (
              <div key={b.id} className="rounded-2xl p-5"
                style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                <div className="flex items-start justify-between gap-4">

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <p className="font-semibold" style={{ color: "#1a0e05" }}>{b.client.name}</p>
                      {s && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      )}
                      {b.voucher && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: "rgba(124,58,237,0.08)", color: "#5b21b6" }}>
                          {b.voucher.code}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm"
                      style={{ color: "rgba(26,14,5,0.45)" }}>
                      <span>{b.client.email}</span>
                      {b.client.phone && <span>{b.client.phone}</span>}
                      <span>
                        {format(new Date(b.startAt), "dd/MM/yyyy · HH:mm", { locale: ptBR })} às {format(new Date(b.endAt), "HH:mm")}
                      </span>
                    </div>
                  </div>

                  {/* Valor + ações */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: "#1a0e05" }}>
                        R$ {b.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {b.discountAmount > 0 && (
                        <p className="text-xs" style={{ color: "#166534" }}>
                          −{b.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} desconto
                        </p>
                      )}
                      {b.asaasPaymentUrl && b.status === "PENDING" && (
                        <a href={b.asaasPaymentUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs hover:underline mt-1 inline-block" style={{ color: "#1a0e05" }}>
                          Ver link de pagamento →
                        </a>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex items-center gap-2">
                      {/* Alterar status */}
                      <select
                        value={b.status}
                        onChange={(e) => handleStatus(b.id, e.target.value)}
                        className="rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        style={{ background: "rgba(26,14,5,0.05)", border: "1px solid rgba(26,14,5,0.1)", color: "#1a0e05" }}
                      >
                        {Object.entries(STATUS).map(([v, st]) => (
                          <option key={v} value={v}>{st.label}</option>
                        ))}
                      </select>

                      {/* Estornar — visível para PAID e ACTIVE com cobrança (ou gratuitas) */}
                      {(b.status === "PAID" || b.status === "ACTIVE") && (
                        <button
                          onClick={() => handleRefund(b.id, b.client.name, b.totalAmount)}
                          disabled={refunding === b.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                          style={{ background: "rgba(124,58,237,0.08)", color: "#5b21b6", border: "1px solid rgba(124,58,237,0.15)" }}
                        >
                          {refunding === b.id ? "Estornando..." : "Estornar"}
                        </button>
                      )}

                      {/* Excluir */}
                      <button
                        onClick={() => handleDelete(b.id, b.client.name)}
                        disabled={deleting === b.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                        style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b" }}
                      >
                        {deleting === b.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
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
