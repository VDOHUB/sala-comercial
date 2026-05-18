"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Booking = {
  id: string; startAt: string; endAt: string; totalAmount: number;
  discountAmount: number; status: string; paidAt: string | null;
  asaasPaymentUrl: string | null;
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
  const [data, setData] = useState<{ bookings: Booking[]; total: number; pages: number } | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const url = `/api/admin/reservas${status ? `?status=${status}` : ""}`;
    fetch(url).then((r) => r.json()).then(setData);
  }, [status]);

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
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{
            background: "#f5f0e8",
            border: "1px solid rgba(26,14,5,0.12)",
            color: "#1a0e05",
          }}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([v, s]) => (
            <option key={v} value={v}>{s.label}</option>
          ))}
        </select>
      </div>

      {!data ? (
        <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando reservas...</div>
      ) : data.bookings.length === 0 ? (
        <div className="text-center py-20" style={{ color: "rgba(26,14,5,0.38)" }}>
          <p className="font-medium text-lg mb-1" style={{ color: "#1a0e05" }}>Nenhuma reserva encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.bookings.map((b) => {
            const s = STATUS[b.status];
            return (
              <div key={b.id} className="rounded-2xl p-5" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <p className="font-semibold" style={{ color: "#1a0e05" }}>{b.client.name}</p>
                      {s && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      )}
                      {b.voucher && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(124,58,237,0.08)", color: "#5b21b6" }}>
                          {b.voucher.code}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: "rgba(26,14,5,0.45)" }}>
                      <span>{b.client.email}</span>
                      {b.client.phone && <span>{b.client.phone}</span>}
                      <span>{format(new Date(b.startAt), "dd/MM/yyyy · HH:mm", { locale: ptBR })} às {format(new Date(b.endAt), "HH:mm")}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold" style={{ color: "#1a0e05" }}>
                      R$ {b.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    {b.discountAmount > 0 && (
                      <p className="text-xs" style={{ color: "#166534" }}>
                        -{b.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} desconto
                      </p>
                    )}
                    {b.asaasPaymentUrl && b.status === "PENDING" && (
                      <a
                        href={b.asaasPaymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline mt-1 inline-block"
                        style={{ color: "#1a0e05" }}
                      >
                        Ver link de pagamento →
                      </a>
                    )}
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
