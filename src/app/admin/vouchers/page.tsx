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
    setSaving(true);
    setError("");
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
    setForm(empty);
    setShowForm(false);
    setSaving(false);
    load();
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
    if (!v.active) return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-600/30 text-gray-400">Inativo</span>;
    if (v.expiresAt && new Date(v.expiresAt) < new Date())
      return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">Expirado</span>;
    if (v.maxUses && v.usedCount >= v.maxUses)
      return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400">Esgotado</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">Ativo</span>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Vouchers</h1>
          <p className="text-gray-400 text-sm mt-1">Crie e gerencie cupons de desconto</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <span>+</span> Novo voucher
        </button>
      </div>

      {/* Modal de criação */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Novo voucher</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Código *</label>
                  <input
                    required maxLength={20}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="INAUGURA2026"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Tipo *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as typeof form.discountType })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PERCENTAGE">Percentual (%)</option>
                    <option value="FIXED">Valor fixo (R$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  {form.discountType === "PERCENTAGE" ? "Percentual de desconto *" : "Valor de desconto (R$) *"}
                </label>
                <input
                  required type="number" min={1} max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Descrição</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Voucher de inauguração da sala"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Limite de usos</label>
                  <input
                    type="number" min={1}
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="Ilimitado"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Expira em</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-600 text-gray-300 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {saving ? "Criando..." : "Criar voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-gray-400 animate-pulse text-center py-16">Carregando vouchers...</div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🎟️</div>
          <p className="font-medium text-gray-300 mb-1">Nenhum voucher criado ainda</p>
          <p className="text-sm">Clique em "Novo voucher" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map((v) => (
            <div key={v.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700 flex items-center gap-4">
              {/* Código */}
              <div className="bg-emerald-600/15 border border-emerald-600/20 rounded-xl px-4 py-3 text-center min-w-32">
                <p className="text-emerald-400 font-bold text-lg tracking-wider">{v.code}</p>
                <p className="text-emerald-300/60 text-xs mt-0.5">{discountLabel(v)}</p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium text-sm">{v.description || "Sem descrição"}</p>
                  {statusBadge(v)}
                </div>
                <div className="flex items-center gap-4 text-gray-400 text-xs">
                  <span>🎯 {v.usedCount}/{v.maxUses ?? "∞"} usos</span>
                  {v.expiresAt && (
                    <span>📅 Expira {format(new Date(v.expiresAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                  )}
                  <span>📅 Criado {format(new Date(v.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(v.id, !v.active)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    v.active
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                  }`}
                >
                  {v.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
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
