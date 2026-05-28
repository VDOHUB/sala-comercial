"use client";
import { useEffect, useState } from "react";

type ClientOption = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hasCard: boolean;
  facePhoto: string | null;
};

type Consumable = {
  id: string;
  name: string;
  price: number;
  photo: string | null;
};

type SelectedItem = { consumableId: string; qty: number };

function InputField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "rgba(26,14,5,0.4)" }}>{label}</label>
      <input
        {...props}
        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
        style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
      />
    </div>
  );
}

export default function CobrancasPage() {
  const [clients, setClients]       = useState<ClientOption[]>([]);
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [search, setSearch]         = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [extraDesc, setExtraDesc]   = useState("");
  const [card, setCard]             = useState({ holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "" });
  const [needsCard, setNeedsCard]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<{ ok?: boolean; error?: string; invoiceUrl?: string } | null>(null);
  const [history, setHistory]       = useState<Array<{ clientName: string; amount: number; description: string; invoiceUrl: string; at: string }>>([]);

  useEffect(() => {
    fetch("/api/admin/cobrancas").then((r) => r.json()).then((data) => { if (Array.isArray(data)) setClients(data); });
    fetch("/api/admin/insumos").then((r) => r.json()).then((data) => { if (Array.isArray(data)) setConsumables(data); });
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === selectedId);

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
    return selectedItems.reduce((sum, si) => {
      const c = consumables.find((c) => c.id === si.consumableId);
      return sum + (c ? c.price * si.qty : 0);
    }, 0);
  }

  function buildDescription() {
    const parts = selectedItems
      .map((si) => {
        const c = consumables.find((c) => c.id === si.consumableId);
        if (!c) return null;
        return `${si.qty}x ${c.name} (R$${(c.price * si.qty).toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`;
      })
      .filter(Boolean);
    if (extraDesc) parts.push(extraDesc);
    return parts.join(" + ") || "Cobrança manual";
  }

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = calcTotal();
    if (!selectedId || amount <= 0) return;
    setLoading(true); setResult(null);

    const description = buildDescription();
    const body: Record<string, unknown> = { clientId: selectedId, amount, description };
    if (needsCard) body.card = { ...card, number: card.number.replace(/\s/g, "") };

    const res  = await fetch("/api/admin/cobrancas", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();

    if (data.needsCard) {
      setNeedsCard(true);
      setResult({ error: data.error });
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setResult({ error: data.error });
    } else {
      setResult({ ok: true, invoiceUrl: data.invoiceUrl });
      setHistory((prev) => [{
        clientName:  selectedClient?.name ?? "",
        amount,
        description,
        invoiceUrl:  data.invoiceUrl,
        at:          new Date().toLocaleString("pt-BR"),
      }, ...prev]);
      setSelectedItems([]);
      setExtraDesc("");
      setNeedsCard(false);
      setCard({ holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "" });
    }
    setLoading(false);
  }

  const total = calcTotal();
  const canSubmit = selectedId && total > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Cobranças manuais</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
          Cobre itens consumíveis (frigobar, café, etc.) diretamente no cartão do cliente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-5 mb-8"
        style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>

        {/* Busca de cliente */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "rgba(26,14,5,0.4)" }}>Cliente</label>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedId(""); setNeedsCard(false); setResult(null); }}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none mb-2"
            style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
          />
          {search && !selectedId && filtered.length > 0 && (
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: "1px solid rgba(26,14,5,0.1)" }}>
              {filtered.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setSelectedId(c.id); setSearch(c.name); setNeedsCard(false); setResult(null); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ background: "#faf7f2", borderBottom: "1px solid rgba(26,14,5,0.05)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f0ebe2"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#faf7f2"}
                >
                  {c.facePhoto ? (
                    <img src={c.facePhoto} alt={c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      style={{ border: "1px solid rgba(26,14,5,0.1)" }} />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(26,14,5,0.08)", color: "#1a0e05" }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1a0e05" }}>{c.name}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(26,14,5,0.4)" }}>{c.email}</p>
                  </div>
                  {c.hasCard ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: "rgba(22,163,74,0.08)", color: "#166534", border: "1px solid rgba(22,163,74,0.15)" }}>
                      ✓ Cartão
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: "rgba(220,38,38,0.06)", color: "#991b1b", border: "1px solid rgba(220,38,38,0.12)" }}>
                      Sem cartão
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {selectedClient && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mt-1"
              style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.08)" }}>
              {selectedClient.facePhoto ? (
                <img src={selectedClient.facePhoto} alt={selectedClient.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "rgba(26,14,5,0.1)", color: "#1a0e05" }}>
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>{selectedClient.name}</p>
                <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>{selectedClient.email}</p>
              </div>
              {selectedClient.hasCard ? (
                <span className="text-xs font-medium" style={{ color: "#166534" }}>✓ Cartão salvo</span>
              ) : (
                <span className="text-xs font-medium" style={{ color: "#991b1b" }}>Sem cartão salvo</span>
              )}
            </div>
          )}
        </div>

        {/* Insumos */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "rgba(26,14,5,0.4)" }}>Itens consumidos</label>
          {consumables.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(26,14,5,0.4)" }}>
              Nenhum insumo cadastrado. <a href="/admin/insumos" className="underline">Cadastrar insumos</a>
            </p>
          ) : (
            <div className="space-y-2">
              {consumables.map((c) => {
                const qty = getQty(c.id);
                return (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{ background: qty > 0 ? "rgba(26,14,5,0.06)" : "#ede8df", border: "1px solid rgba(26,14,5,0.08)" }}>
                    {c.photo ? (
                      <img src={c.photo} alt={c.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: "rgba(26,14,5,0.06)" }}>🧃</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#1a0e05" }}>{c.name}</p>
                      <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>
                        R${c.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} cada
                        {qty > 0 && ` · subtotal R$${(c.price * qty).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button type="button"
                        onClick={() => setQty(c.id, qty - 1)}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center disabled:opacity-30"
                        style={{ background: "rgba(26,14,5,0.1)", color: "#1a0e05" }}>−</button>
                      <span className="w-5 text-center text-sm font-semibold" style={{ color: "#1a0e05" }}>{qty}</span>
                      <button type="button"
                        onClick={() => setQty(c.id, qty + 1)}
                        className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                        style={{ background: "rgba(26,14,5,0.1)", color: "#1a0e05" }}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Observação extra */}
          <div className="mt-3">
            <input
              value={extraDesc}
              onChange={(e) => setExtraDesc(e.target.value)}
              placeholder="Observação adicional (opcional)"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
            />
          </div>
        </div>

        {/* Total */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.08)" }}>
            <span className="text-sm font-semibold" style={{ color: "rgba(26,14,5,0.5)" }}>Total</span>
            <span className="text-lg font-bold" style={{ color: "#1a0e05" }}>
              R${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Dados de cartão (quando cliente não tem token salvo) */}
        {needsCard && (
          <div className="space-y-3 pt-2 border-t" style={{ borderColor: "rgba(26,14,5,0.08)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.4)" }}>
              Dados do cartão
            </p>
            <InputField label="Nome no cartão" value={card.holderName}
              onChange={(e) => setCard({ ...card, holderName: e.target.value })}
              placeholder="Como está no cartão" required={needsCard} />
            <InputField label="Número" value={card.number}
              onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
              placeholder="0000 0000 0000 0000" maxLength={19} inputMode="numeric" required={needsCard} />
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Mês" value={card.expiryMonth}
                onChange={(e) => setCard({ ...card, expiryMonth: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                placeholder="MM" maxLength={2} required={needsCard} />
              <InputField label="Ano" value={card.expiryYear}
                onChange={(e) => setCard({ ...card, expiryYear: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="AAAA" maxLength={4} required={needsCard} />
              <InputField label="CVV" value={card.ccv}
                onChange={(e) => setCard({ ...card, ccv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="123" maxLength={4} required={needsCard} />
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: result.ok ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)",
              border:     `1px solid ${result.ok ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
              color:      result.ok ? "#166534" : "#991b1b",
            }}>
            {result.ok ? (
              <>
                ✓ Cobrança realizada com sucesso!
                {result.invoiceUrl && (
                  <a href={result.invoiceUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-2 underline font-semibold">
                    Ver recibo
                  </a>
                )}
              </>
            ) : result.error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: canSubmit ? "#1a0e05" : "rgba(26,14,5,0.06)", color: canSubmit ? "#f5f0e8" : "rgba(26,14,5,0.25)" }}
        >
          {loading
            ? "Processando..."
            : total > 0
              ? `Cobrar R$${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no cartão`
              : "Selecione ao menos um item"}
        </button>
      </form>

      {/* Histórico desta sessão */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(26,14,5,0.35)" }}>
            Cobranças desta sessão
          </p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="rounded-xl p-4 flex items-start justify-between gap-4"
                style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.07)" }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>{h.clientName}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(26,14,5,0.5)" }}>{h.description}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(26,14,5,0.3)" }}>{h.at}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#1a0e05" }}>
                    R${h.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <a href={h.invoiceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs underline" style={{ color: "rgba(26,14,5,0.4)" }}>
                    Recibo
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
