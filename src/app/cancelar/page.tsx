"use client";
import { useState } from "react";
import Link from "next/link";

export default function CancelarPage() {
  const [form, setForm]   = useState({ clientName: "", clientEmail: "", clientPhone: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar."); return; }
      setDone(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16" style={{ background: "#0e0a06" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(215,203,181,0.08)", border: "1px solid rgba(215,203,181,0.1)" }}>
            <span className="text-[10px] font-black tracking-wider" style={{ color: "#d7cbb5" }}>VDO</span>
          </div>
          <span className="font-bold" style={{ color: "#d7cbb5" }}>VDO HUB</span>
        </div>

        {done ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(215,203,181,0.08)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold mb-3" style={{ color: "#d7cbb5" }}>Solicitação enviada</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(215,203,181,0.45)" }}>
              Recebemos sua solicitação de cancelamento. Entraremos em contato por e-mail em breve para concluir o processo.
            </p>
            <Link href="/" className="text-sm font-semibold" style={{ color: "rgba(215,203,181,0.55)" }}>
              ← Voltar ao site
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl p-8"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(215,203,181,0.08)" }}>
            <h1 className="text-2xl font-black mb-2" style={{ color: "#d7cbb5" }}>Solicitar cancelamento</h1>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: "rgba(215,203,181,0.4)" }}>
              Preencha os dados abaixo e nossa equipe entrará em contato para concluir o cancelamento.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-2"
                  style={{ color: "rgba(215,203,181,0.3)" }}>Nome completo *</label>
                <input required value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="Seu nome"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(215,203,181,0.08)", color: "#d7cbb5" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-2"
                  style={{ color: "rgba(215,203,181,0.3)" }}>E-mail *</label>
                <input required type="email" value={form.clientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(215,203,181,0.08)", color: "#d7cbb5" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-2"
                  style={{ color: "rgba(215,203,181,0.3)" }}>WhatsApp / Telefone</label>
                <input value={form.clientPhone}
                  onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
                  placeholder="(62) 9 9999-9999"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(215,203,181,0.08)", color: "#d7cbb5" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-2"
                  style={{ color: "rgba(215,203,181,0.3)" }}>Motivo do cancelamento</label>
                <textarea value={form.reason} rows={4}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Conte um pouco sobre o motivo..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(215,203,181,0.08)", color: "#d7cbb5" }}
                />
              </div>

              {error && (
                <div className="text-sm px-4 py-3 rounded-xl"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: "#d7cbb5", color: "#321e07" }}>
                {loading ? "Enviando..." : "Enviar solicitação"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-xs" style={{ color: "rgba(215,203,181,0.3)" }}>
                ← Voltar ao site
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
