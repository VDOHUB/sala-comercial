"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(26,14,5,0.04)",
    border: "1px solid rgba(26,14,5,0.12)",
    color: "#1a0e05",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#ede8df" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
            style={{ background: "#1a0e05" }}
          >
            <span className="text-xs font-bold tracking-wider" style={{ color: "#f5f0e8" }}>VDO</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>VDO HUB</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>Painel administrativo</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(26,14,5,0.6)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@vdohub.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(26,14,5,0.6)" }}>
                Senha
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.15)", color: "#991b1b" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
              style={{ background: "#1a0e05", color: "#f5f0e8", marginTop: "8px" }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
