"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type DashData = {
  receita:      { atual: number; anterior: number; variacao: number };
  reservas:     { mes: number; mesAnterior: number };
  clientes:     { total: number; novos: number };
  taxaOcupacao: number;
  ticketMedio:  number;
  proximasReservas: Array<{
    id: string; startAt: string; endAt: string; totalAmount: number; status: string;
    client: { name: string; email: string };
  }>;
  receitaUltimos6Meses: Array<{ mes: string; receita: number }>;
  lowStockItems: Array<{ id: string; name: string; stock: number; minStock: number; photo: string | null }>;
  consumableSalesMes: { revenue: number; qty: number };
};

function StatCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean;
}) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
      <p className="text-sm font-medium mb-3" style={{ color: "rgba(26,14,5,0.45)" }}>{label}</p>
      <p className="text-3xl font-bold mb-1" style={{ color: "#1a0e05" }}>{value}</p>
      {sub && (
        <p className="text-sm" style={{ color: positive !== undefined ? (positive ? "#16a34a" : "#dc2626") : "rgba(26,14,5,0.38)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: "Pendente",  bg: "rgba(234,179,8,0.1)",   color: "#854d0e" },
  PAID:      { label: "Pago",      bg: "rgba(22,163,74,0.1)",   color: "#166534" },
  ACTIVE:    { label: "Em uso",    bg: "rgba(37,99,235,0.1)",   color: "#1e40af" },
  COMPLETED: { label: "Concluído", bg: "rgba(26,14,5,0.07)",    color: "rgba(26,14,5,0.45)" },
  CANCELLED: { label: "Cancelado", bg: "rgba(220,38,38,0.08)",  color: "#991b1b" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando dashboard...</div>
      </div>
    );
  }

  const maxReceita = Math.max(...data.receitaUltimos6Meses.map((m) => m.receita), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
          {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Alerta de estoque baixo */}
      {data.lowStockItems.length > 0 && (
        <div className="mb-6 rounded-2xl p-4"
          style={{ background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⚠️</span>
            <p className="text-sm font-bold" style={{ color: "#9a3412" }}>
              {data.lowStockItems.length === 1
                ? "1 item com estoque baixo"
                : `${data.lowStockItems.length} itens com estoque baixo`}
            </p>
            <a href="/admin/insumos" className="ml-auto text-xs font-semibold underline" style={{ color: "#9a3412" }}>
              Gerenciar →
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.15)" }}>
                {item.photo ? (
                  <img src={item.photo} alt={item.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                ) : (
                  <span className="text-sm">🧃</span>
                )}
                <span className="text-xs font-semibold" style={{ color: "#9a3412" }}>{item.name}</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                  style={{ background: item.stock === 0 ? "rgba(220,38,38,0.15)" : "rgba(234,88,12,0.15)", color: item.stock === 0 ? "#991b1b" : "#9a3412" }}>
                  {item.stock === 0 ? "Zerado" : `${item.stock} un.`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Receita do mês"
          value={`R$ ${data.receita.atual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub={`${data.receita.variacao >= 0 ? "▲" : "▼"} ${Math.abs(data.receita.variacao).toFixed(1)}% vs mês anterior`}
          positive={data.receita.variacao >= 0}
        />
        <StatCard
          label="Reservas no mês"
          value={String(data.reservas.mes)}
          sub={`${data.reservas.mesAnterior} no mês anterior`}
        />
        <StatCard
          label="Taxa de ocupação"
          value={`${data.taxaOcupacao}%`}
          sub="Períodos reservados este mês"
        />
        <StatCard
          label="Ticket médio"
          value={`R$ ${data.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub={`${data.clientes.novos} novos clientes`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <h2 className="font-semibold mb-6" style={{ color: "#1a0e05" }}>Receita — últimos 6 meses</h2>
          <div className="flex items-end gap-3 h-40">
            {data.receitaUltimos6Meses.map((m) => {
              const height = maxReceita > 0 ? (m.receita / maxReceita) * 100 : 0;
              return (
                <div key={m.mes} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>
                    R$ {(m.receita / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full rounded-t-lg relative" style={{ height: "120px", background: "rgba(26,14,5,0.06)" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700"
                      style={{ height: `${height}%`, background: "#1a0e05" }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: "rgba(26,14,5,0.35)" }}>{m.mes.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximas reservas */}
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "#1a0e05" }}>Próximas reservas</h2>
          {data.proximasReservas.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(26,14,5,0.35)" }}>Nenhuma reserva futura.</p>
          ) : (
            <div className="space-y-3">
              {data.proximasReservas.map((r) => {
                const s = STATUS_LABELS[r.status];
                return (
                  <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(26,14,5,0.04)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1a0e05" }}>{r.client.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.4)" }}>
                        {format(new Date(r.startAt), "dd/MM · HH:mm")} às {format(new Date(r.endAt), "HH:mm")}
                      </p>
                    </div>
                    {s && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stats adicionais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <p className="text-sm mb-1" style={{ color: "rgba(26,14,5,0.45)" }}>Total de clientes</p>
          <p className="text-3xl font-bold" style={{ color: "#1a0e05" }}>{data.clientes.total}</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <p className="text-sm mb-1" style={{ color: "rgba(26,14,5,0.45)" }}>Novos este mês</p>
          <p className="text-3xl font-bold" style={{ color: "#1a0e05" }}>{data.clientes.novos}</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <p className="text-sm mb-1" style={{ color: "rgba(26,14,5,0.45)" }}>Frigobar/café este mês</p>
          <p className="text-3xl font-bold" style={{ color: "#1a0e05" }}>
            R$ {data.consumableSalesMes.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(26,14,5,0.38)" }}>
            {data.consumableSalesMes.qty} itens vendidos
          </p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <p className="text-sm mb-1" style={{ color: "rgba(26,14,5,0.45)" }}>Alertas de estoque</p>
          <p className="text-3xl font-bold" style={{ color: data.lowStockItems.length > 0 ? "#ea580c" : "#1a0e05" }}>
            {data.lowStockItems.length}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(26,14,5,0.38)" }}>
            {data.lowStockItems.length === 0 ? "Estoque OK" : "iten(s) abaixo do mínimo"}
          </p>
        </div>
      </div>
    </div>
  );
}
