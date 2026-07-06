"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [forgot, setForgot]     = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/client/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) { router.replace("/portal"); }
    else { const d = await res.json(); setError(d.error ?? "Erro ao entrar"); }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/client/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setForgotSent(true);
  }

  return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <a href="/" style={{ fontWeight: 800, fontSize: 22, color: "#1a0e05", textDecoration: "none", marginBottom: 40 }}>VDO HUB</a>

      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(26,14,5,0.08)" }}>
        {!forgot ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0e05", marginBottom: 6 }}>Portal do Cliente</h1>
            <p style={{ fontSize: 14, color: "rgba(26,14,5,0.45)", marginBottom: 28 }}>Entre com seu e-mail e senha</p>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,14,5,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,14,5,0.15)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,14,5,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,14,5,0.15)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
              {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ background: "#1a0e05", color: "#f5f0e8", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <button onClick={() => setForgot(true)}
              style={{ marginTop: 20, background: "none", border: "none", color: "rgba(26,14,5,0.45)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Esqueci minha senha
            </button>
          </>
        ) : forgotSent ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a0e05", marginBottom: 12 }}>E-mail enviado!</h1>
            <p style={{ fontSize: 14, color: "rgba(26,14,5,0.55)", marginBottom: 24 }}>Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.</p>
            <button onClick={() => { setForgot(false); setForgotSent(false); }}
              style={{ background: "#1a0e05", color: "#f5f0e8", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Voltar ao login
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a0e05", marginBottom: 6 }}>Recuperar senha</h1>
            <p style={{ fontSize: 14, color: "rgba(26,14,5,0.45)", marginBottom: 24 }}>Digite seu e-mail para receber o link de redefinição</p>
            <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,14,5,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,14,5,0.15)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
              <button type="submit" disabled={loading}
                style={{ background: "#1a0e05", color: "#f5f0e8", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>
            <button onClick={() => setForgot(false)}
              style={{ marginTop: 16, background: "none", border: "none", color: "rgba(26,14,5,0.45)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Voltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
