"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AccessLog = {
  id: string;
  action: string;
  createdAt: string;
  booking: {
    client: { name: string; email: string };
    startAt: string;
    endAt: string;
  } | null;
};

export default function AcessosPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/acessos")
      .then((r) => r.json())
      .then((data) => { setLogs(data); setLoading(false); });
  }, []);

  function actionBadge(action: string) {
    const map: Record<string, { label: string; color: string }> = {
      GRANTED:  { label: "Liberado",  color: "bg-emerald-500/10 text-emerald-400" },
      DENIED:   { label: "Negado",    color: "bg-red-500/10 text-red-400" },
      REVOKED:  { label: "Revogado",  color: "bg-orange-500/10 text-orange-400" },
    };
    const s = map[action] ?? { label: action, color: "bg-gray-600/20 text-gray-400" };
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
        {s.label}
      </span>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Acessos</h1>
        <p className="text-gray-400 text-sm mt-1">Histórico de entradas e saídas via reconhecimento facial</p>
      </div>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-center py-16">Carregando acessos...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🔐</div>
          <p className="font-medium text-gray-300 mb-1">Nenhum acesso registrado ainda</p>
          <p className="text-sm">Os acessos aparecem aqui após o primeiro pagamento confirmado.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Período reservado</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ação</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    {log.booking ? (
                      <div>
                        <p className="text-white font-medium text-sm">{log.booking.client.name}</p>
                        <p className="text-gray-500 text-xs">{log.booking.client.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.booking ? (
                      <p className="text-gray-300 text-sm">
                        {format(new Date(log.booking.startAt), "dd/MM/yyyy", { locale: ptBR })}
                        {" · "}
                        {format(new Date(log.booking.startAt), "HH:mm")}–{format(new Date(log.booking.endAt), "HH:mm")}
                      </p>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{actionBadge(log.action)}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
