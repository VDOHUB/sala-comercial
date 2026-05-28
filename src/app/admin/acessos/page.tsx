"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ActiveSession = {
  id: string;
  startAt: string;
  endAt: string;
  client: { name: string; email: string; facePhoto: string | null };
};

type AccessLog = {
  id: string;
  createdAt: string;
  booking: {
    client: { name: string; email: string };
    startAt: string;
    endAt: string;
  } | null;
};

type Consumable = {
  id: string;
  name: string;
  price: number;
  photo: string | null;
  description: string | null;
};

type SelectedItem = { consumableId: string; qty: number };

export default function AcessosPage() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [logs, setLogs]                     = useState<AccessLog[]>([]);
  const [loading, setLoading]               = useState(true);
  const [consumables, setConsumables]       = useState<Consumable[]>([]);

  // Modal de finalização
  const [finalizingId, setFinalizingId]     = useState<string | null>(null);
  const [selectedItems, setSelectedItems]   = useState<SelectedItem[]>([]);
  const [extraPeriod, setExtraPeriod]       = useState(false);
  const [finishing, setFinishing]           = useState(false);
  const [finishError, setFinishError]       = useState<string | null>(null);

  function load() {
    fetch("/api/admin/acessos")
      .then((r) => r.json())
      .then((data) => {
        setActiveSessions(data.activeSessions ?? []);
        setLogs(data.logs ?? []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
    fetch("/api/admin/insumos")
      .then((r) => r.json())
      .then((data) => setConsumables(Array.isArray(data) ? data.filter((c: Consumable) => c) : []));
  }, []);

  function openModal(sessionId: string) {
    setFinalizingId(sessionId);
    setSelectedItems([]);
    setExtraPeriod(false);
    setFinishError(null);
  }

  function closeModal() {
    if (finishing) return;
    setFinalizingId(null);
  }

  function setQty(consumableId: string, qty: number) {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.consumableId !== consumableId));
    } else {
      setSelectedItems((prev) => {
        const existing = prev.find((i) => i.consumableId === consumableId);
        if (existing) return prev.map((i) => i.consumableId === consumableId ? { ...i, qty } : i);
        return [...prev, { consumableId, qty }];
      });
    }
  }

  function getQty(consumableId: string) {
    return selectedItems.find((i) => i.consumableId === consumableId)?.qty ?? 0;
  }

  function calcTotal() {
    const itemsTotal = selectedItems.reduce((sum, si) => {
      const c = consumables.find((c) => c.id === si.consumableId);
      return sum + (c ? c.price * si.qty : 0);
    }, 0);
    return itemsTotal + (extraPeriod ? 300 : 0);
  }

  async function handleFinalize() {
    if (!finalizingId) return;
    setFinishing(true);
    setFinishError(null);
    const res = await fetch(`/api/admin/acessos/${finalizingId}/finalizar`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ items: selectedItems, extraPeriod }),
    });
    const data = await res.json();
    setFinishing(false);
    if (!res.ok) {
      setFinishError(data.error ?? "Erro ao finalizar sessão.");
      return;
    }
    setFinalizingId(null);
    load();
  }

  const finalizingSession = activeSessions.find((s) => s.id === finalizingId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Acessos</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
          Sessões ativas e histórico de entradas via reconhecimento facial
        </p>
      </div>

      {/* Sessões ativas */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(26,14,5,0.35)" }}>
          Sessões ativas agora
        </p>
        {loading ? (
          <div className="text-center py-8 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando...</div>
        ) : activeSessions.length === 0 ? (
          <div className="rounded-2xl p-6 text-center text-sm" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)", color: "rgba(26,14,5,0.38)" }}>
            Nenhuma sessão em andamento no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div key={session.id} className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "#f5f0e8", border: "1px solid rgba(22,163,74,0.25)" }}>
                {session.client.facePhoto ? (
                  <img src={session.client.facePhoto} alt={session.client.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    style={{ border: "1px solid rgba(26,14,5,0.1)" }} />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ background: "rgba(26,14,5,0.08)", color: "#1a0e05" }}>
                    {session.client.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm" style={{ color: "#1a0e05" }}>{session.client.name}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(22,163,74,0.1)", color: "#166534" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Ativo
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(26,14,5,0.45)" }}>{session.client.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.35)" }}>
                    {format(new Date(session.startAt), "HH:mm", { locale: ptBR })} –{" "}
                    {format(new Date(session.endAt), "HH:mm", { locale: ptBR })}
                    {" · "}
                    {format(new Date(session.startAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <button
                  onClick={() => openModal(session.id)}
                  className="px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-colors"
                  style={{ background: "#1a0e05", color: "#f5f0e8" }}>
                  Finalizar sessão
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de entradas */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(26,14,5,0.35)" }}>
          Histórico de entradas
        </p>
        {loading ? null : logs.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>
            Nenhuma entrada registrada ainda.
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Período</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Entrada</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderTop: "1px solid rgba(26,14,5,0.05)" }}>
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

      {/* Modal de finalização */}
      {finalizingId && finalizingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-md rounded-2xl overflow-y-auto max-h-[90vh]"
            style={{ background: "#faf7f2", border: "1px solid rgba(26,14,5,0.1)" }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(26,14,5,0.08)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-base" style={{ color: "#1a0e05" }}>Finalizar sessão</p>
                <button onClick={closeModal} disabled={finishing}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05" }}>✕</button>
              </div>
              <p className="text-sm" style={{ color: "rgba(26,14,5,0.5)" }}>{finalizingSession.client.name}</p>
            </div>

            {/* Insumos */}
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(26,14,5,0.4)" }}>
                Itens consumidos
              </p>
              {consumables.length === 0 ? (
                <p className="text-sm py-2" style={{ color: "rgba(26,14,5,0.4)" }}>Nenhum insumo cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {consumables.map((c) => {
                    const qty = getQty(c.id);
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: qty > 0 ? "rgba(26,14,5,0.06)" : "transparent", border: "1px solid rgba(26,14,5,0.07)", transition: "background 0.15s" }}>
                        {c.photo ? (
                          <img src={c.photo} alt={c.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: "rgba(26,14,5,0.06)" }}>🧃</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#1a0e05" }}>{c.name}</p>
                          <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>
                            R${c.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            {qty > 0 && ` · subtotal R${(c.price * qty).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                          </p>
                        </div>
                        {/* Qty stepper */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button type="button"
                            onClick={() => setQty(c.id, qty - 1)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center disabled:opacity-30 transition-opacity"
                            style={{ background: "rgba(26,14,5,0.1)", color: "#1a0e05" }}>−</button>
                          <span className="w-5 text-center text-sm font-semibold" style={{ color: "#1a0e05" }}>{qty}</span>
                          <button type="button"
                            onClick={() => setQty(c.id, qty + 1)}
                            className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center transition-opacity"
                            style={{ background: "rgba(26,14,5,0.1)", color: "#1a0e05" }}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Período extra */}
              <button
                type="button"
                onClick={() => setExtraPeriod(!extraPeriod)}
                className="w-full mt-3 flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                style={{
                  background: extraPeriod ? "rgba(26,14,5,0.06)" : "transparent",
                  border: "1px solid rgba(26,14,5,0.1)",
                }}>
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: extraPeriod ? "#1a0e05" : "rgba(26,14,5,0.08)", border: extraPeriod ? "none" : "1px solid rgba(26,14,5,0.2)" }}>
                  {extraPeriod && <span className="text-xs text-white font-bold">✓</span>}
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>+ 1 período extra</p>
                  <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>R$300,00</p>
                </div>
              </button>
            </div>

            {/* Total + ações */}
            <div className="px-6 pb-6 pt-2 space-y-3" style={{ borderTop: "1px solid rgba(26,14,5,0.08)" }}>
              <div className="flex items-center justify-between pt-3">
                <p className="text-sm font-semibold" style={{ color: "rgba(26,14,5,0.5)" }}>Total a cobrar</p>
                <p className="text-xl font-bold" style={{ color: "#1a0e05" }}>
                  {calcTotal() === 0
                    ? "Sem cobrança"
                    : `R$${calcTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </p>
              </div>

              {finishError && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", color: "#991b1b" }}>
                  {finishError}
                </div>
              )}

              <button
                onClick={handleFinalize}
                disabled={finishing}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: "#1a0e05", color: "#f5f0e8" }}>
                {finishing
                  ? "Finalizando..."
                  : calcTotal() > 0
                    ? `Cobrar R$${calcTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })} e finalizar`
                    : "Finalizar sem cobrança"}
              </button>
              <button
                onClick={closeModal}
                disabled={finishing}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ color: "rgba(26,14,5,0.4)" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
