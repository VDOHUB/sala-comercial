"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Request = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  reason: string | null;
  status: string;
  handledAt: string | null;
  createdAt: string;
};

export default function CancelamentosPage() {
  const [items, setItems]     = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"ALL" | "PENDING" | "HANDLED">("ALL");

  function load() {
    fetch("/api/admin/cancelamentos")
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
  }

  useEffect(load, []);

  async function toggleStatus(item: Request) {
    const newStatus = item.status === "PENDING" ? "HANDLED" : "PENDING";
    await fetch(`/api/admin/cancelamentos/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Excluir esta solicitação?")) return;
    await fetch(`/api/admin/cancelamentos/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = items.filter((i) => filter === "ALL" || i.status === filter);
  const pending  = items.filter((i) => i.status === "PENDING").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Solicitações de Cancelamento</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
          {pending > 0
            ? `${pending} solicitação(ões) pendente(s) de tratamento`
            : "Todas tratadas"}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "PENDING", "HANDLED"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filter === f
              ? { background: "#1a0e05", color: "#f5f0e8" }
              : { background: "rgba(26,14,5,0.07)", color: "rgba(26,14,5,0.55)" }}>
            {f === "ALL" ? "Todas" : f === "PENDING" ? "Pendentes" : "Tratadas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: "rgba(26,14,5,0.4)" }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm py-8 text-center" style={{ color: "rgba(26,14,5,0.35)" }}>
          Nenhuma solicitação encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl p-5"
              style={{ background: "#f5f0e8", border: `1px solid ${item.status === "PENDING" ? "rgba(220,38,38,0.2)" : "rgba(26,14,5,0.08)"}` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-sm" style={{ color: "#1a0e05" }}>{item.clientName}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={item.status === "PENDING"
                        ? { background: "rgba(220,38,38,0.08)", color: "#dc2626" }
                        : { background: "rgba(22,163,74,0.1)", color: "#166534" }}>
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ background: item.status === "PENDING" ? "#dc2626" : "#16a34a" }} />
                      {item.status === "PENDING" ? "Pendente" : "Tratada"}
                    </span>
                  </div>
                  <p className="text-xs mb-0.5" style={{ color: "rgba(26,14,5,0.5)" }}>
                    ✉️ {item.clientEmail}
                    {item.clientPhone && <> · 📱 {item.clientPhone}</>}
                  </p>
                  {item.reason && (
                    <p className="text-sm mt-2 p-3 rounded-xl" style={{ background: "rgba(26,14,5,0.04)", color: "rgba(26,14,5,0.65)" }}>
                      💬 {item.reason}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: "rgba(26,14,5,0.35)" }}>
                    Recebida em {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {item.handledAt && ` · Tratada em ${format(new Date(item.handledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => toggleStatus(item)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={item.status === "PENDING"
                      ? { background: "rgba(22,163,74,0.1)", color: "#166534" }
                      : { background: "rgba(26,14,5,0.07)", color: "rgba(26,14,5,0.55)" }}>
                    {item.status === "PENDING" ? "✓ Marcar como tratada" : "↩ Reabrir"}
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
                    🗑 Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
