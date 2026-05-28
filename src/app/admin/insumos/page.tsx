"use client";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Consumable = {
  id: string; name: string; price: number; costPrice: number | null;
  description: string | null; photo: string | null; active: boolean;
  stock: number; minStock: number;
  totalSold: number; totalRevenue: number; margin: number | null;
  lowStock: boolean; createdAt: string;
};

const EMPTY_FORM = { name: "", price: "", costPrice: "", description: "", photo: "", stock: "", minStock: "2" };

export default function InsumosPage() {
  const [items, setItems]     = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [tab, setTab]         = useState<"itens" | "vendas">("itens");
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
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
      name:        form.name,
      price:       Number(form.price),
      costPrice:   form.costPrice !== "" ? form.costPrice : undefined,
      description: form.description,
      photo:       form.photo,
      stock:       form.stock !== "" ? Number(form.stock) : 0,
      minStock:    form.minStock !== "" ? Number(form.minStock) : 2,
    };
    if (editing) {
      await fetch(`/api/admin/insumos/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/insumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setForm(EMPTY_FORM);
    setSaving(false);
    load();
  }

  async function toggleActive(item: Consumable) {
    await fetch(`/api/admin/insumos/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
      name:        item.name,
      price:       String(item.price),
      costPrice:   item.costPrice !== null ? String(item.costPrice) : "",
      description: item.description ?? "",
      photo:       item.photo ?? "",
      stock:       String(item.stock),
      minStock:    String(item.minStock),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const inputStyle = { background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" };

  const lowStockCount = items.filter((i) => i.active && i.lowStock).length;

  // Histórico de vendas agregado por item
  const salesByItem = items
    .filter((i) => i.totalSold > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Insumos</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
          Itens do frigobar, café e outros consumíveis cobrados ao final da sessão.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "rgba(26,14,5,0.06)" }}>
        {(["itens", "vendas"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
            style={tab === t
              ? { background: "#1a0e05", color: "#f5f0e8" }
              : { color: "rgba(26,14,5,0.5)" }}>
            {t === "itens" ? "Itens" : "Histórico de vendas"}
          </button>
        ))}
      </div>

      {tab === "itens" && (
        <>
          {/* Formulário */}
          <form onSubmit={handleSave} className="rounded-2xl p-6 mb-8 space-y-4"
            style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
            <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>
              {editing ? "Editar item" : "Adicionar item"}
            </p>

            {/* Nome + Preço venda */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Nome *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required placeholder="Ex: Coca-Cola 350ml"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Preço de venda (R$) *</label>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required type="number" step="0.01" min="0" placeholder="0,00"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>

            {/* Custo + Margem preview */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Preço de custo (R$)</label>
                <input value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  type="number" step="0.01" min="0" placeholder="0,00 (opcional)"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Margem</label>
                <div className="w-full rounded-xl px-4 py-2.5 text-sm flex items-center"
                  style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.08)", color: "#1a0e05", minHeight: "42px" }}>
                  {form.price && form.costPrice
                    ? (() => {
                        const m = ((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100;
                        return (
                          <span style={{ color: m >= 0 ? "#166534" : "#991b1b" }}>
                            {m.toFixed(1)}% {m >= 0 ? "de lucro" : "de prejuízo"}
                          </span>
                        );
                      })()
                    : <span style={{ color: "rgba(26,14,5,0.3)" }}>—</span>
                  }
                </div>
              </div>
            </div>

            {/* Estoque + Mínimo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Estoque atual (un.)</label>
                <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  type="number" min="0" step="1" placeholder="0"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Estoque mínimo (alerta)</label>
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
                {lowStockCount} {lowStockCount === 1 ? "item precisa" : "itens precisam"} de reposição
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
                  style={{ background: "#f5f0e8", border: item.lowStock && item.active ? "1px solid rgba(234,88,12,0.35)" : "1px solid rgba(26,14,5,0.08)", opacity: item.active ? 1 : 0.55 }}>
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
                        <p className="font-semibold text-sm" style={{ color: "#1a0e05" }}>{item.name}</p>
                        {!item.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(26,14,5,0.06)", color: "rgba(26,14,5,0.4)" }}>Inativo</span>
                        )}
                        {item.active && item.stock === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(220,38,38,0.1)", color: "#991b1b" }}>Zerado</span>
                        )}
                        {item.active && item.stock > 0 && item.lowStock && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(234,88,12,0.1)", color: "#9a3412" }}>⚠ Estoque baixo</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(26,14,5,0.45)" }}>{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <p className="text-xs" style={{ color: "rgba(26,14,5,0.35)" }}>
                          Adicionado em {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        {item.totalSold > 0 && (
                          <p className="text-xs font-medium" style={{ color: "#166534" }}>
                            ✓ {item.totalSold} vendido{item.totalSold !== 1 ? "s" : ""} · R${item.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Preço + estoque */}
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
                      <p className="text-xs mt-1 font-semibold"
                        style={{ color: item.stock === 0 ? "#991b1b" : item.lowStock ? "#9a3412" : "rgba(26,14,5,0.5)" }}>
                        {item.stock} un. em estoque
                      </p>
                      <p className="text-xs" style={{ color: "rgba(26,14,5,0.3)" }}>mín. {item.minStock}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "vendas" && (
        <div>
          {salesByItem.length === 0 ? (
            <div className="text-center py-16" style={{ color: "rgba(26,14,5,0.38)" }}>
              <p className="font-medium mb-1" style={{ color: "#1a0e05" }}>Nenhuma venda registrada ainda</p>
              <p className="text-sm">As vendas aparecem aqui após a primeira cobrança de insumos.</p>
            </div>
          ) : (
            <>
              {/* Totais */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl p-5" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(26,14,5,0.4)" }}>Receita total</p>
                  <p className="text-2xl font-bold" style={{ color: "#1a0e05" }}>
                    R${items.reduce((s, i) => s + i.totalRevenue, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-2xl p-5" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(26,14,5,0.4)" }}>Itens vendidos</p>
                  <p className="text-2xl font-bold" style={{ color: "#1a0e05" }}>
                    {items.reduce((s, i) => s + i.totalSold, 0)}
                  </p>
                </div>
                <div className="rounded-2xl p-5" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(26,14,5,0.4)" }}>Itens com venda</p>
                  <p className="text-2xl font-bold" style={{ color: "#1a0e05" }}>{salesByItem.length}</p>
                </div>
              </div>

              {/* Tabela por item */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Item</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Qtd vendida</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Receita</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Estoque</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByItem.map((item) => (
                      <tr key={item.id} style={{ borderTop: "1px solid rgba(26,14,5,0.05)" }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.photo ? (
                              <img src={item.photo} alt={item.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                                style={{ background: "rgba(26,14,5,0.06)" }}>🧃</div>
                            )}
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>{item.name}</p>
                              <p className="text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>
                                R${item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / un.
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold" style={{ color: "#1a0e05" }}>
                          {item.totalSold}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold" style={{ color: "#1a0e05" }}>
                          R${item.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                            style={{
                              background: item.stock === 0 ? "rgba(220,38,38,0.1)" : item.lowStock ? "rgba(234,88,12,0.1)" : "rgba(22,163,74,0.08)",
                              color:      item.stock === 0 ? "#991b1b" : item.lowStock ? "#9a3412" : "#166534",
                            }}>
                            {item.stock} un.
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold"
                          style={{ color: item.margin === null ? "rgba(26,14,5,0.3)" : item.margin >= 0 ? "#166534" : "#991b1b" }}>
                          {item.margin !== null ? `${item.margin.toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
