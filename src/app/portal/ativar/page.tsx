"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AtivarForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const token        = params.get("token") ?? "";
  const [info, setInfo]       = useState<{ name: string; email: string } | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!token) { setInvalid(true); return; }
    fetch(`/api/client/activate?token=${token}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!d) setInvalid(true); else setInfo(d); })
      .catch(() => setInvalid(true));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("As senhas não coincidem"); return; }
    if (password.length < 6)  { setError("A senha deve ter pelo menos 6 caracteres"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/client/activate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) router.replace("/portal");
    else { const d = await res.json(); setError(d.error ?? "Erro ao ativar conta"); }
  }

  if (invalid) return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 20, fontWeight: 700, color: "#dc2626", marginBottom: 12 }}>Link inválido ou expirado</p>
      <p style={{ color: "rgba(26,14,5,0.5)", fontSize: 14 }}>Solicite um novo convite ao VDO HUB.</p>
    </div>
  );

  if (!info) return <p style={{ color: "rgba(26,14,5,0.4)", textAlign: "center" }}>Verificando...</p>;

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0e05", marginBottom: 6 }}>Finalize seu cadastro</h1>
      <p style={{ fontSize: 14, color: "rgba(26,14,5,0.45)", marginBottom: 4 }}>Olá, <strong>{info.name}</strong>!</p>
      <p style={{ fontSize: 14, color: "rgba(26,14,5,0.45)", marginBottom: 28 }}>Defina uma senha para acessar o Portal do Cliente.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,14,5,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>E-mail</label>
          <input type="email" value={info.email} disabled
            style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(26,14,5,0.1)", fontSize: 15, background: "rgba(26,14,5,0.03)", color: "rgba(26,14,5,0.5)", boxSizing: "border-box" }} />
        </div>
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
          {loading ? "Ativando..." : "Ativar conta e entrar"}
        </button>
      </form>
    </>
  );
}

export default function AtivarPage() {
  return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <a href="/" style={{ fontWeight: 800, fontSize: 22, color: "#1a0e05", textDecoration: "none", marginBottom: 40 }}>VDO HUB</a>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(26,14,5,0.08)" }}>
        <Suspense fallback={<p style={{ color: "rgba(26,14,5,0.4)" }}>Verificando...</p>}>
          <AtivarForm />
        </Suspense>
      </div>
    </div>
  );
}
