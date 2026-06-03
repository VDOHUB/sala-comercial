"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Acceptance = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  acceptedAt: string;
};

export default function TermosAceitesPage() {
  const [items, setItems]       = useState<Acceptance[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    fetch("/api/admin/terms-acceptances")
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
  }, []);

  const filtered = items.filter((a) =>
    a.clientName.toLowerCase().includes(search.toLowerCase()) ||
    a.clientEmail.toLowerCase().includes(search.toLowerCase())
  );

  function exportCsv() {
    window.open("/api/admin/terms-acceptances/export", "_blank");
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Aceites dos Termos de Uso</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
            Registro de todos os clientes que aceitaram os termos · {items.length} registros
          </p>
        </div>
        <button onClick={exportCsv}
          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
          style={{ background: "#1a0e05", color: "#f5f0e8" }}>
          ⬇ Exportar CSV
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full max-w-sm rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
        />
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: "rgba(26,14,5,0.4)" }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm py-8 text-center" style={{ color: "rgba(26,14,5,0.35)" }}>
          {search ? "Nenhum resultado encontrado." : "Nenhum aceite registrado ainda."}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(26,14,5,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f5f0e8" }}>
                {["Nome", "E-mail", "Telefone", "IP", "Data/Hora", "Dispositivo"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wide"
                    style={{ color: "rgba(26,14,5,0.4)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#faf7f2", borderTop: "1px solid rgba(26,14,5,0.05)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#1a0e05" }}>{a.clientName}</td>
                  <td className="px-4 py-3" style={{ color: "rgba(26,14,5,0.65)" }}>{a.clientEmail}</td>
                  <td className="px-4 py-3" style={{ color: "rgba(26,14,5,0.5)" }}>{a.clientPhone ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(26,14,5,0.45)" }}>{a.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "rgba(26,14,5,0.65)" }}>
                    {format(new Date(a.acceptedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-xs" style={{ color: "rgba(26,14,5,0.35)" }}
                    title={a.userAgent ?? ""}>
                    {a.userAgent
                      ? a.userAgent.includes("Mobile") ? "📱 Mobile" : "🖥 Desktop"
                      : "—"}
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
