"use client";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Consumable = {
  id: string; code: string | null; name: string; unit: string | null;
  price: number; costPrice: number | null; description: string | null;
  photo: string | null; active: boolean;
  stockDeposito: number; stockFrigobar: number; minStock: number;
  totalSold: number; totalRevenue: number;
  totalCostSold: number | null; lucro: number | null; roi: number | null;
  margin: number | null; lowStock: boolean; createdAt: string;
};

const EMPTY_FORM = {
  name: "", code: "", unit: "", price: "", costPrice: "", description: "",
  photo: "", stockDeposito: "", stockFrigobar: "", minStock: "2",
};

const UNITS = ["LATA", "GARRAFA", "SACHÊ", "UN", "KG", "L", "PCT"];

export default function InsumosPage() {
  const [items, setItems]       = useState<Consumable[]>([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState<string | null>(null);
  const [tab, setTab]           = useState<"itens" | "vendas">("itens");
  const [abastecerId, setAbastecerId] = useState<string | null>(null);
  const [abastecerQty, setAbastecerQty] = useState("");
  const [abastecerLoading, setAbastecerLoading] = useState(false);
  const [abastecerError, setAbastecerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/insumos").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  }
  useEffect(load, []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      name:          form.name,
      code:          form.code || null,
      unit:          form.unit || null,
      price:         Number(form.price),
      costPrice:     form.costPrice !== "" ? form.costPrice : undefined,
      description:   form.description || null,
      photo:         form.photo || null,
      stockDeposito: form.stockDeposito !== "" ? Number(form.stockDeposito) : 0,
      stockFrigobar: form.stockFrigobar !== "" ? Number(form.stockFrigobar) : 0,
      minStock:      form.minStock !== "" ? Number(form.minStock) : 2,
    };
    if (editing) {
      await fetch(`/api/admin/insumos/${editing}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/insumos", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
    }
    setForm(EMPTY_FORM);
    setSaving(false);
    load();
  }

  async function toggleActive(item: Consumable) {
    await fetch(`/api/admin/insumos/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Isso também removerá o histórico de vendas.`)) return;
    await fetch(`/api/admin/insumos/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(item: Consumable) {
    setEditing(item.id);
    setForm({
      name: item.name, code: item.code ?? "", unit: item.unit ?? "",
      price: String(item.price), costPrice: item.costPrice !== null ? String(item.costPrice) : "",
      description: item.description ?? "", photo: item.photo ?? "",
      stockDeposito: String(item.stockDeposito), stockFrigobar: String(item.stockFrigobar),
      minStock: String(item.minStock),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAbastecer() {
    if (!abastecerId || !abastecerQty) return;
    setAbastecerLoading(true);
    setAbastecerError(null);
    const res  = await fetch(`/api/admin/insumos/${abastecerId}/abastecer`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: Number(abastecerQty) }),
    });
    const data = await res.json();
    setAbastecerLoading(false);
    if (!res.ok) { setAbastecerError(data.error); return; }
    setAbastecerId(null);
    setAbastecerQty("");
    load();
  }

  const abastecerItem = items.find((i) => i.id === abastecerId);
  const inputStyle = { background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" };

  // Totais para o painel resumo (aba itens)
  const totalProdutos     = items.filter((i) => i.active).length;
  const totalDeposito     = items.reduce((s, i) => s + i.stockDeposito * (i.costPrice ?? i.price), 0);
  const totalFrigobar     = items.reduce((s, i) => s + i.stockFrigobar * (i.costPrice ?? i.price), 0);
  const totalVenda        = items.reduce((s, i) => s + i.totalRevenue, 0);
  const totalCusto        = items.reduce((s, i) => s + (i.totalCostSold ?? 0), 0);
  const lucroTotal        = totalVenda - totalCusto;
  const roiTotal          = totalCusto > 0 ? (lucroTotal / totalCusto) * 100 : null;
  const lowStockCount     = items.filter((i) => i.active && i.lowStock).length;

  const salesByItem = items.filter((i) => i.totalSold > 0).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Insumos</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
          Controle de estoque do frigobar, café e consumíveis.
        </p>
      </div>

      {/* Painel resumo — estilo planilha */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Produtos", value: String(totalProdutos), sub: "cadastrados" },
            { label: "Valor depósito", value: `R$${totalDeposito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: "em estoque" },
            { label: "Valor frigobar", value: `R$${totalFrigobar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: "exposto" },
            { label: "Total de vendas", value: `R$${totalVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: "acumulado" },
            { label: "Lucro apurado", value: `R$${lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: totalCusto > 0 ? "sobre custo" : "s/ custo cadastrado", positive: lucroTotal >= 0 },
            { label: "ROI", value: roiTotal !== null ? `${roiTotal.toFixed(1)}%` : "—", sub: "retorno s/ investimento", positive: roiTotal !== null ? roiTotal >= 0 : undefined },
          ].map((card) => (
            <div key={card.label} className="rounded-xl p-4" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(26,14,5,0.38)" }}>{card.label}</p>
              <p className="text-lg font-bold leading-tight"
                style={{ color: card.positive === undefined ? "#1a0e05" : card.positive ? "#166534" : "#991b1b" }}>
                {card.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.35)" }}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "rgba(26,14,5,0.06)" }}>
        {(["itens", "vendas"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t ? { background: "#1a0e05", color: "#f5f0e8" } : { color: "rgba(26,14,5,0.5)" }}>
            {t === "itens" ? "Itens" : "Histórico de vendas"}
          </button>
        ))}
      </div>

      {/* ══ ABA ITENS ══════════════════════════════════════════════════ */}
      {tab === "itens" && (
        <>
          {/* Formulário */}
          <form onSubmit={handleSave} className="rounded-2xl p-6 mb-6 space-y-4"
            style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
            <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>
              {editing ? "Editar item" : "Adicionar item"}
            </p>

            {/* Nome + Código + Unidade */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Código</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="P001" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Nome *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required placeholder="Ex: Coca-Cola 350ml"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>

            {/* Unidade + Preço venda + Preço custo */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Unidade</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle}>
                  <option value="">—</option>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Preço de venda *</label>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required type="number" step="0.01" min="0" placeholder="0,00"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Preço de custo</label>
                <input value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  type="number" step="0.01" min="0" placeholder="0,00"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>

            {/* Margem preview */}
            {form.price && form.costPrice && (
              <div className="px-4 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.07)" }}>
                {(() => {
                  const m   = ((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100;
                  const roi = Number(form.costPrice) > 0
                    ? ((Number(form.price) - Number(form.costPrice)) / Number(form.costPrice)) * 100
                    : null;
                  return (
                    <span style={{ color: m >= 0 ? "#166534" : "#991b1b" }}>
                      Margem: <strong>{m.toFixed(1)}%</strong>
                      {roi !== null && <> · ROI unitário: <strong>{roi.toFixed(1)}%</strong></>}
                      {" · "}Lucro por unidade: <strong>R${(Number(form.price) - Number(form.costPrice)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Estoques + Mínimo */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Estoque depósito</label>
                <input value={form.stockDeposito} onChange={(e) => setForm({ ...form, stockDeposito: e.target.value })}
                  type="number" min="0" step="1" placeholder="0"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Estoque frigobar</label>
                <input value={form.stockFrigobar} onChange={(e) => setForm({ ...form, stockFrigobar: e.target.value })}
                  type="number" min="0" step="1" placeholder="0"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Mínimo frigobar (alerta)</label>
                <input value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  type="number" min="0" step="1" placeholder="2"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Descrição</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Informação adicional (opcional)"
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>

            {/* Foto */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Foto</label>
              <div className="flex items-center gap-4">
                {form.photo && (
                  <img src={form.photo} alt="preview" className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    style={{ border: "1px solid rgba(26,14,5,0.1)" }} />
                )}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05", border: "1px solid rgba(26,14,5,0.1)" }}>
                  {form.photo ? "Trocar foto" : "Escolher foto"}
                </button>
                {form.photo && (
                  <button type="button" onClick={() => setForm({ ...form, photo: "" })}
                    className="text-xs" style={{ color: "rgba(26,14,5,0.35)" }}>Remover</button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(26,14,5,0.05)", color: "rgba(26,14,5,0.5)", border: "1px solid rgba(26,14,5,0.08)" }}>
                  Cancelar
                </button>
              )}
              <button type="submit" disabled={saving || !form.name || !form.price}
                className="px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                style={{ background: "#1a0e05", color: "#f5f0e8" }}>
                {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar item"}
              </button>
            </div>
          </form>

          {/* Alerta de estoque baixo */}
          {!loading && lowStockCount > 0 && (
            <div className="mb-4 rounded-2xl px-5 py-4 flex items-center gap-3"
              style={{ background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.2)" }}>
              <span>⚠️</span>
              <p className="text-sm font-semibold" style={{ color: "#9a3412" }}>
                {lowStockCount} {lowStockCount === 1 ? "item precisa" : "itens precisam"} de reposição no frigobar
              </p>
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div className="text-center py-12 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12" style={{ color: "rgba(26,14,5,0.38)" }}>
              <p className="font-medium mb-1" style={{ color: "#1a0e05" }}>Nenhum item cadastrado</p>
              <p className="text-sm">Adicione itens acima para usar nas cobranças.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl p-4"
                  style={{
                    background: "#f5f0e8",
                    border: item.lowStock && item.active ? "1px solid rgba(234,88,12,0.35)" : "1px solid rgba(26,14,5,0.08)",
                    opacity: item.active ? 1 : 0.55,
                  }}>
                  <div className="flex items-center gap-4">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        style={{ border: "1px solid rgba(26,14,5,0.1)" }} />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                        style={{ background: "rgba(26,14,5,0.06)" }}>🧃</div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.code && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(26,14,5,0.07)", color: "rgba(26,14,5,0.5)" }}>{item.code}</span>
                        )}
                        <p className="font-semibold text-sm" style={{ color: "#1a0e05" }}>{item.name}</p>
                        {item.unit && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(26,14,5,0.06)", color: "rgba(26,14,5,0.45)" }}>{item.unit}</span>
                        )}
                        {!item.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(26,14,5,0.06)", color: "rgba(26,14,5,0.4)" }}>Inativo</span>
                        )}
                        {item.active && item.stockFrigobar === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(220,38,38,0.1)", color: "#991b1b" }}>Frigobar zerado</span>
                        )}
                        {item.active && item.stockFrigobar > 0 && item.lowStock && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(234,88,12,0.1)", color: "#9a3412" }}>⚠ Reposição</span>
                        )}
                      </div>

                      {/* Estoques */}
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: "rgba(26,14,5,0.35)" }}>Depósito:</span>
                          <span className="text-xs font-bold" style={{ color: "#1a0e05" }}>{item.stockDeposito} un.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: "rgba(26,14,5,0.35)" }}>Frigobar:</span>
                          <span className="text-xs font-bold"
                            style={{ color: item.stockFrigobar === 0 ? "#991b1b" : item.lowStock ? "#9a3412" : "#166534" }}>
                            {item.stockFrigobar} un.
                          </span>
                          <span className="text-xs" style={{ color: "rgba(26,14,5,0.3)" }}>(mín. {item.minStock})</span>
                        </div>
                        {item.totalSold > 0 && (
                          <span className="text-xs font-medium" style={{ color: "#166534" }}>
                            ✓ {item.totalSold} vendido{item.totalSold !== 1 ? "s" : ""} · R${item.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(26,14,5,0.45)" }}>{item.description}</p>
                      )}
                    </div>

                    {/* Preços */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-bold" style={{ color: "#1a0e05" }}>
                        R${item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {item.costPrice !== null && (
                        <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>
                          Custo: R${item.costPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      {item.margin !== null && (
                        <p className="text-xs font-semibold" style={{ color: item.margin >= 0 ? "#166534" : "#991b1b" }}>
                          {item.margin.toFixed(1)}% margem
                        </p>
                      )}
                      {item.roi !== null && (
                        <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>
                          ROI: {item.roi.toFixed(1)}%
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: item.active ? "rgba(22,163,74,0.08)" : "rgba(26,14,5,0.06)", color: item.active ? "#166534" : "rgba(26,14,5,0.45)" }}>
                          {item.active ? "Ativo" : "Inativo"}
                        </button>
                        <button onClick={() => startEdit(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05" }}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b" }}>
                          Excluir
                        </button>
                      </div>
                      {/* Botão de abastecer */}
                      <button
                        onClick={() => { setAbastecerId(item.id); setAbastecerQty(""); setAbastecerError(null); }}
                        disabled={item.stockDeposito === 0}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-opacity"
                        style={{ background: "rgba(37,99,235,0.08)", color: "#1e40af", border: "1px solid rgba(37,99,235,0.15)" }}>
                        🔃 Abastecer frigobar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ ABA VENDAS ════════════════════════════════════════════════ */}
      {tab === "vendas" && (
        <div>
          {salesByItem.length === 0 ? (
            <div className="text-center py-16" style={{ color: "rgba(26,14,5,0.38)" }}>
              <p className="font-medium mb-1" style={{ color: "#1a0e05" }}>Nenhuma venda registrada ainda</p>
              <p className="text-sm">As vendas aparecem aqui após a primeira cobrança de insumos.</p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Receita total", value: `R$${totalVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
                  { label: "Custo total", value: totalCusto > 0 ? `R$${totalCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—" },
                  { label: "Lucro apurado", value: `R$${lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: lucroTotal >= 0 ? "#166534" : "#991b1b" },
                  { label: "ROI", value: roiTotal !== null ? `${roiTotal.toFixed(1)}%` : "—", color: roiTotal !== null ? (roiTotal >= 0 ? "#166534" : "#991b1b") : undefined },
                ].map((c) => (
                  <div key={c.label} className="rounded-2xl p-5" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(26,14,5,0.4)" }}>{c.label}</p>
                    <p className="text-2xl font-bold" style={{ color: c.color ?? "#1a0e05" }}>{c.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
                      {["Código", "Produto", "Unidade", "Qtd vendida", "Preço custo", "Preço venda", "Valor custo", "Valor venda", "Lucro", "ROI", "Estoque"].map((h) => (
                        <th key={h} className="text-right first:text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                          style={{ color: "rgba(26,14,5,0.35)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salesByItem.map((item) => {
                      const custo   = item.totalCostSold ?? null;
                      const lucro   = custo !== null ? item.totalRevenue - custo : null;
                      const roi     = custo && custo > 0 ? ((lucro! / custo) * 100) : null;
                      return (
                        <tr key={item.id} style={{ borderTop: "1px solid rgba(26,14,5,0.05)" }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {item.photo ? (
                                <img src={item.photo} alt={item.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                                  style={{ background: "rgba(26,14,5,0.06)" }}>🧃</div>
                              )}
                              <div>
                                {item.code && <p className="text-xs font-mono" style={{ color: "rgba(26,14,5,0.4)" }}>{item.code}</p>}
                                <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>{item.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-xs" style={{ color: "rgba(26,14,5,0.5)" }}>{item.unit ?? "—"}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "#1a0e05" }}>{item.totalSold}</td>
                          <td className="px-4 py-3 text-right text-xs" style={{ color: "rgba(26,14,5,0.5)" }}>
                            {item.costPrice !== null ? `R$${item.costPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-xs" style={{ color: "rgba(26,14,5,0.5)" }}>
                            R${item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-sm" style={{ color: "rgba(26,14,5,0.55)" }}>
                            {custo !== null ? `R$${custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold" style={{ color: "#1a0e05" }}>
                            R${item.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold"
                            style={{ color: lucro === null ? "rgba(26,14,5,0.3)" : lucro >= 0 ? "#166534" : "#991b1b" }}>
                            {lucro !== null ? `R$${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold"
                            style={{ color: roi === null ? "rgba(26,14,5,0.3)" : roi >= 0 ? "#166534" : "#991b1b" }}>
                            {roi !== null ? `${roi.toFixed(1)}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>Dep: {item.stockDeposito}</span>
                              <span className="text-xs font-semibold"
                                style={{ color: item.stockFrigobar === 0 ? "#991b1b" : item.lowStock ? "#9a3412" : "#166534" }}>
                                Frig: {item.stockFrigobar}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ MODAL ABASTECER FRIGOBAR ══════════════════════════════════ */}
      {abastecerId && abastecerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !abastecerLoading) setAbastecerId(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: "#faf7f2", border: "1px solid rgba(26,14,5,0.1)" }}>
            <div className="flex items-center justify-between">
              <p className="font-bold" style={{ color: "#1a0e05" }}>Abastecer frigobar</p>
              <button onClick={() => setAbastecerId(null)} disabled={abastecerLoading}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05" }}>✕</button>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.07)" }}>
              {abastecerItem.photo ? (
                <img src={abastecerItem.photo} alt={abastecerItem.name} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ background: "rgba(26,14,5,0.06)" }}>🧃</div>
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>{abastecerItem.name}</p>
                <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>
                  Depósito: <strong>{abastecerItem.stockDeposito} un.</strong>
                  {" · "}Frigobar: <strong>{abastecerItem.stockFrigobar} un.</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "rgba(26,14,5,0.4)" }}>Quantas unidades transferir para o frigobar?</label>
              <input
                type="number" min="1" max={abastecerItem.stockDeposito} value={abastecerQty}
                onChange={(e) => setAbastecerQty(e.target.value)}
                placeholder={`1 a ${abastecerItem.stockDeposito}`}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
                autoFocus
              />
            </div>

            {abastecerQty && Number(abastecerQty) > 0 && (
              <div className="px-4 py-2.5 rounded-xl text-xs" style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", color: "#1e40af" }}>
                Depósito: {abastecerItem.stockDeposito} → <strong>{abastecerItem.stockDeposito - Number(abastecerQty)}</strong>
                {" · "}Frigobar: {abastecerItem.stockFrigobar} → <strong>{abastecerItem.stockFrigobar + Number(abastecerQty)}</strong>
              </div>
            )}

            {abastecerError && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", color: "#991b1b" }}>
                {abastecerError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setAbastecerId(null)} disabled={abastecerLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(26,14,5,0.05)", color: "rgba(26,14,5,0.5)" }}>
                Cancelar
              </button>
              <button
                onClick={handleAbastecer}
                disabled={abastecerLoading || !abastecerQty || Number(abastecerQty) <= 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                style={{ background: "rgba(37,99,235,0.1)", color: "#1e40af", border: "1px solid rgba(37,99,235,0.2)" }}>
                {abastecerLoading ? "Transferindo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
