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
    const map: Record<string, { label: string; bg: string; color: string }> = {
      GRANTED: { label: "Liberado", bg: "rgba(22,163,74,0.1)",  color: "#166534" },
      DENIED:  { label: "Negado",   bg: "rgba(220,38,38,0.08)", color: "#991b1b" },
      REVOKED: { label: "Revogado", bg: "rgba(234,88,12,0.08)", color: "#9a3412" },
    };
    const s = map[action] ?? { label: action, bg: "rgba(26,14,5,0.07)", color: "rgba(26,14,5,0.45)" };
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Acessos</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>Histórico de entradas e saídas via reconhecimento facial</p>
      </div>

      {loading ? (
        <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando acessos...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20" style={{ color: "rgba(26,14,5,0.38)" }}>
          <p className="font-medium text-lg mb-1" style={{ color: "#1a0e05" }}>Nenhum acesso registrado ainda</p>
          <p className="text-sm">Os acessos aparecem aqui após o primeiro pagamento confirmado.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Período reservado</th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Ação</th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="transition-colors" style={{ borderTop: "1px solid rgba(26,14,5,0.05)" }}>
                  <td className="px-6 py-4">
                    {log.booking ? (
                      <div>
                        <p className="font-medium text-sm" style={{ color: "#1a0e05" }}>{log.booking.client.name}</p>
                        <p className="text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>{log.booking.client.email}</p>
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: "rgba(26,14,5,0.35)" }}>—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.booking ? (
                      <p className="text-sm" style={{ color: "rgba(26,14,5,0.65)" }}>
                        {format(new Date(log.booking.startAt), "dd/MM/yyyy", { locale: ptBR })}
                        {" · "}
                        {format(new Date(log.booking.startAt), "HH:mm")}–{format(new Date(log.booking.endAt), "HH:mm")}
                      </p>
                    ) : (
                      <span className="text-sm" style={{ color: "rgba(26,14,5,0.35)" }}>—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{actionBadge(log.action)}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: "rgba(26,14,5,0.45)" }}>
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
