"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedefinirForm() {
  const router   = useRouter();
  const params   = useSearchParams();
  const token    = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("As senhas não coincidem"); return; }
    if (password.length < 6)  { setError("A senha deve ter pelo menos 6 caracteres"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/client/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) router.replace("/portal");
    else { const d = await res.json(); setError(d.error ?? "Erro ao redefinir senha"); }
  }

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0e05", marginBottom: 6 }}>Redefinir senha</h1>
      <p style={{ fontSize: 14, color: "rgba(26,14,5,0.45)", marginBottom: 28 }}>Digite sua nova senha abaixo.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,14,5,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Nova senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,14,5,0.15)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,14,5,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Confirmar senha</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,14,5,0.15)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>
        {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ background: "#1a0e05", color: "#f5f0e8", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <a href="/" style={{ fontWeight: 800, fontSize: 22, color: "#1a0e05", textDecoration: "none", marginBottom: 40 }}>VDO HUB</a>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(26,14,5,0.08)" }}>
        <Suspense fallback={<p style={{ color: "rgba(26,14,5,0.4)" }}>Carregando...</p>}>
          <RedefinirForm />
        </Suspense>
      </div>
    </div>
  );
}
