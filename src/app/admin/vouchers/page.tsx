"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Voucher = {
  id: string; code: string; description: string | null;
  discountType: "PERCENTAGE" | "FIXED"; discountValue: number;
  maxUses: number | null; usedCount: number;
  expiresAt: string | null; active: boolean; createdAt: string;
  _count: { bookings: number };
};

const inputStyle = {
  background: "rgba(26,14,5,0.04)",
  border: "1px solid rgba(26,14,5,0.12)",
  color: "#1a0e05",
  borderRadius: "12px",
  padding: "10px 16px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

const empty = {
  code: "", description: "", discountType: "PERCENTAGE" as const,
  discountValue: 10, maxUses: "", expiresAt: "",
};

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/admin/vouchers");
    setVouchers(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/admin/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        code: form.code.toUpperCase(),
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erro ao criar voucher"); setSaving(false); return; }
    setForm(empty); setShowForm(false); setSaving(false); load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/vouchers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este voucher?")) return;
    await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
    load();
  }

  function discountLabel(v: Voucher) {
    return v.discountType === "PERCENTAGE"
      ? `${v.discountValue}% de desconto`
      : `R$ ${v.discountValue.toFixed(2)} de desconto`;
  }

  function statusBadge(v: Voucher) {
    if (!v.active) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(26,14,5,0.07)", color: "rgba(26,14,5,0.45)" }}>Inativo</span>;
    if (v.expiresAt && new Date(v.expiresAt) < new Date())
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(220,38,38,0.08)", color: "#991b1b" }}>Expirado</span>;
    if (v.maxUses && v.usedCount >= v.maxUses)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(234,88,12,0.08)", color: "#9a3412" }}>Esgotado</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(22,163,74,0.1)", color: "#166534" }}>Ativo</span>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Vouchers</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>Crie e gerencie cupons de desconto</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          style={{ background: "#1a0e05", color: "#f5f0e8" }}
        >
          + Novo voucher
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: "rgba(26,14,5,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.1)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "#1a0e05" }}>Novo voucher</h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: "rgba(26,14,5,0.4)" }}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1.5 font-medium" style={{ color: "rgba(26,14,5,0.6)" }}>Código *</label>
                  <input required maxLength={20} value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="INAUGURA2026" style={inputStyle} className="uppercase" />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 font-medium" style={{ color: "rgba(26,14,5,0.6)" }}>Tipo *</label>
                  <select value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as typeof form.discountType })}
                    style={inputStyle}>
                    <option value="PERCENTAGE">Percentual (%)</option>
                    <option value="FIXED">Valor fixo (R$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: "rgba(26,14,5,0.6)" }}>
                  {form.discountType === "PERCENTAGE" ? "Percentual *" : "Valor (R$) *"}
                </label>
                <input required type="number" min={1} max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: "rgba(26,14,5,0.6)" }}>Descrição</label>
                <input value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Voucher de inauguração" style={inputStyle} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1.5 font-medium" style={{ color: "rgba(26,14,5,0.6)" }}>Limite de usos</label>
                  <input type="number" min={1} value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="Ilimitado" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 font-medium" style={{ color: "rgba(26,14,5,0.6)" }}>Expira em</label>
                  <input type="date" value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    style={inputStyle} />
                </div>
              </div>

              {error && (
                <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(220,38,38,0.08)", color: "#991b1b", border: "1px solid rgba(220,38,38,0.15)" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ border: "1px solid rgba(26,14,5,0.12)", color: "rgba(26,14,5,0.55)" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: "#1a0e05", color: "#f5f0e8" }}>
                  {saving ? "Criando..." : "Criar voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando vouchers...</div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-20" style={{ color: "rgba(26,14,5,0.38)" }}>
          <p className="font-medium text-lg mb-1" style={{ color: "#1a0e05" }}>Nenhum voucher criado ainda</p>
          <p className="text-sm">Clique em "Novo voucher" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map((v) => (
            <div key={v.id} className="rounded-2xl p-5 flex items-center gap-5" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
              {/* Código */}
              <div className="rounded-xl px-4 py-3 text-center min-w-32 flex-shrink-0" style={{ background: "rgba(26,14,5,0.07)", border: "1px solid rgba(26,14,5,0.1)" }}>
                <p className="font-bold text-lg tracking-wider" style={{ color: "#1a0e05" }}>{v.code}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.45)" }}>{discountLabel(v)}</p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-medium text-sm" style={{ color: "#1a0e05" }}>{v.description || "Sem descrição"}</p>
                  {statusBadge(v)}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>
                  <span>{v.usedCount}/{v.maxUses ?? "∞"} usos</span>
                  {v.expiresAt && <span>Expira {format(new Date(v.expiresAt), "dd/MM/yyyy", { locale: ptBR })}</span>}
                  <span>Criado {format(new Date(v.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(v.id, !v.active)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={v.active
                    ? { background: "rgba(26,14,5,0.07)", color: "rgba(26,14,5,0.55)" }
                    : { background: "rgba(22,163,74,0.08)", color: "#166534" }}>
                  {v.active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => handleDelete(v.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b" }}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
