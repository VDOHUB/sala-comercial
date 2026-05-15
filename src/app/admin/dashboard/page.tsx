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
};

function StatCard({ label, value, sub, icon, positive }: {
  label: string; value: string; sub?: string; icon: string; positive?: boolean;
}) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {sub && (
        <p className={`text-sm ${positive !== undefined ? (positive ? "text-emerald-400" : "text-red-400") : "text-gray-400"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Pendente",   color: "bg-yellow-500/20 text-yellow-400" },
  PAID:      { label: "Pago",       color: "bg-emerald-500/20 text-emerald-400" },
  ACTIVE:    { label: "Em uso",     color: "bg-blue-500/20 text-blue-400" },
  COMPLETED: { label: "Concluído",  color: "bg-gray-500/20 text-gray-400" },
  CANCELLED: { label: "Cancelado",  color: "bg-red-500/20 text-red-400" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 animate-pulse">Carregando dashboard...</div>
      </div>
    );
  }

  const maxReceita = Math.max(...data.receitaUltimos6Meses.map((m) => m.receita), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Receita do mês"
          value={`R$ ${data.receita.atual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub={`${data.receita.variacao >= 0 ? "▲" : "▼"} ${Math.abs(data.receita.variacao).toFixed(1)}% vs mês anterior`}
          icon="💰"
          positive={data.receita.variacao >= 0}
        />
        <StatCard
          label="Reservas no mês"
          value={String(data.reservas.mes)}
          sub={`${data.reservas.mesAnterior} no mês anterior`}
          icon="📅"
        />
        <StatCard
          label="Taxa de ocupação"
          value={`${data.taxaOcupacao}%`}
          sub="Horas reservadas este mês"
          icon="⏱️"
        />
        <StatCard
          label="Ticket médio"
          value={`R$ ${data.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub={`${data.clientes.novos} novos clientes este mês`}
          icon="🎯"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de receita */}
        <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-6">Receita — últimos 6 meses</h2>
          <div className="flex items-end gap-3 h-40">
            {data.receitaUltimos6Meses.map((m) => {
              const height = maxReceita > 0 ? (m.receita / maxReceita) * 100 : 0;
              return (
                <div key={m.mes} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-gray-400 text-xs">
                    R$ {(m.receita / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full rounded-t-lg bg-emerald-600/20 relative" style={{ height: "120px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-emerald-600 rounded-t-lg transition-all duration-700"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs">{m.mes.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximas reservas */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Próximas reservas</h2>
          {data.proximasReservas.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma reserva futura.</p>
          ) : (
            <div className="space-y-3">
              {data.proximasReservas.map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-xl">
                  <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    📅
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.client.name}</p>
                    <p className="text-gray-400 text-xs">
                      {format(new Date(r.startAt), "dd/MM · HH:mm")} às{" "}
                      {format(new Date(r.endAt), "HH:mm")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_LABELS[r.status]?.color}`}>
                    {STATUS_LABELS[r.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats adicionais */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total de clientes</p>
            <p className="text-3xl font-bold text-white">{data.clientes.total}</p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-2xl">
            ✨
          </div>
          <div>
            <p className="text-gray-400 text-sm">Novos este mês</p>
            <p className="text-3xl font-bold text-white">{data.clientes.novos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
