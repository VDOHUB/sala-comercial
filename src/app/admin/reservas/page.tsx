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
  PENDING:   { label: "Pendente",  color: "bg-yellow-500/20 text-yellow-400" },
  PAID:      { label: "Pago",      color: "bg-emerald-500/20 text-emerald-400" },
  ACTIVE:    { label: "Em uso",    color: "bg-blue-500/20 text-blue-400" },
  COMPLETED: { label: "Concluído", color: "bg-gray-500/20 text-gray-400" },
  CANCELLED: { label: "Cancelado", color: "bg-red-500/20 text-red-400" },
  REFUNDED:  { label: "Reembolso", color: "bg-purple-500/20 text-purple-400" },
} as Record<string, { label: string; color: string }>;

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
          <h1 className="text-2xl font-bold text-white">Reservas</h1>
          <p className="text-gray-400 text-sm mt-1">
            {data?.total ?? "–"} reservas no total
          </p>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([v, s]) => (
            <option key={v} value={v}>{s.label}</option>
          ))}
        </select>
      </div>

      {!data ? (
        <div className="text-gray-400 animate-pulse text-center py-16">Carregando reservas...</div>
      ) : data.bookings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-gray-300 font-medium">Nenhuma reserva encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.bookings.map((b) => (
            <div key={b.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-white font-semibold">{b.client.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[b.status]?.color}`}>
                      {STATUS[b.status]?.label}
                    </span>
                    {b.voucher && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                        🎟️ {b.voucher.code}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
                    <span>📧 {b.client.email}</span>
                    {b.client.phone && <span>📱 {b.client.phone}</span>}
                    <span>📅 {format(new Date(b.startAt), "dd/MM/yyyy · HH:mm", { locale: ptBR })} às {format(new Date(b.endAt), "HH:mm")}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-white">
                    R$ {b.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  {b.discountAmount > 0 && (
                    <p className="text-emerald-400 text-xs">
                      -{b.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} desconto
                    </p>
                  )}
                  {b.asaasPaymentUrl && b.status === "PENDING" && (
                    <a
                      href={b.asaasPaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline mt-1 inline-block"
                    >
                      Ver link de pagamento →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
