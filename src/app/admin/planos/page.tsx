"use client";
import { useEffect, useState } from "react";
import type { Plan } from "@/lib/plans";

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/plans").then((r) => r.json()).then((data) => {
      setPlans(data);
      setLoading(false);
    });
  }, []);

  function update(key: string, field: keyof Plan, value: string | number | null) {
    setPlans((prev) =>
      prev.map((p) => p.key === key ? { ...p, [field]: value } : p)
    );
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans: JSON.stringify(plans) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>
        Carregando planos...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Planos</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
            Edite preços e créditos de cada plano. As alterações refletem imediatamente no site.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium" style={{ color: "#166534" }}>✓ Salvo</span>}
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: "#1a0e05", color: "#f5f0e8" }}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className="rounded-2xl p-6"
            style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ background: "rgba(26,14,5,0.08)", color: "#1a0e05" }}>
                {plan.key}
              </span>
              <p className="font-semibold" style={{ color: "#1a0e05" }}>{plan.label}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "rgba(26,14,5,0.4)" }}>Preço (R$)</label>
                <input
                  type="number"
                  min={0}
                  value={plan.price}
                  onChange={(e) => update(plan.key, "price", Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.1)", color: "#1a0e05" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "rgba(26,14,5,0.4)" }}>Períodos / Créditos</label>
                <input
                  type="number"
                  min={1}
                  value={plan.credits}
                  onChange={(e) => update(plan.key, "credits", Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.1)", color: "#1a0e05" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "rgba(26,14,5,0.4)" }}>Validade (meses)</label>
                <input
                  type="number"
                  min={1}
                  value={plan.validityMonths ?? ""}
                  placeholder={plan.credits === 1 ? "—" : ""}
                  disabled={plan.credits === 1}
                  onChange={(e) => update(plan.key, "validityMonths", e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none disabled:opacity-40"
                  style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.1)", color: "#1a0e05" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "rgba(26,14,5,0.4)" }}>Parcelamento</label>
                <input
                  type="text"
                  value={plan.installments}
                  onChange={(e) => update(plan.key, "installments", e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.1)", color: "#1a0e05" }}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(26,14,5,0.06)" }}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "rgba(26,14,5,0.4)" }}>Nome do plano (exibido no site)</label>
                <input
                  type="text"
                  value={plan.label}
                  onChange={(e) => update(plan.key, "label", e.target.value)}
                  className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ width: 320, background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.1)", color: "#1a0e05" }}
                />
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "rgba(26,14,5,0.35)" }}>Preço atual</p>
                <p className="text-2xl font-extrabold" style={{ color: "#1a0e05" }}>
                  R${plan.price.toLocaleString("pt-BR")}
                </p>
                {plan.validityMonths && (
                  <p className="text-xs" style={{ color: "rgba(26,14,5,0.4)" }}>
                    {plan.credits} créditos · {plan.validityMonths} meses
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
