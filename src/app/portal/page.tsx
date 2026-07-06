"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = { id: string; startAt: string; endAt: string; totalAmount: number; status: string };
type Subscription = { id: string; planKey: string; totalCredits: number; usedCredits: number; status: string; expiresAt: string };
type Consumable = { id: string; consumable: { name: string }; qty: number; totalPrice: number; createdAt: string };

type ClientData = {
  name: string; email: string; phone?: string;
  hasFace: boolean; hasCard: boolean;
  bookings: Booking[]; subscriptions: Subscription[]; consumables: Consumable[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente", PAID: "Pago", ACTIVE: "Ativo",
  COMPLETED: "Concluído", CANCELLED: "Cancelado", REFUNDED: "Reembolsado",
  EXPIRED: "Expirado", FROZEN: "Congelado",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function PortalPage() {
  const router = useRouter();
  const [data, setData]   = useState<ClientData | null>(null);
  const [tab, setTab]     = useState<"reservas" | "planos" | "consumos">("reservas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!d) router.replace("/portal/login"); else { setData(d); setLoading(false); } })
      .catch(() => router.replace("/portal/login"));
  }, [router]);

  async function logout() {
    await fetch("/api/client/logout", { method: "POST" });
    router.replace("/portal/login");
  }

  if (loading) return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(26,14,5,0.4)" }}>Carregando...</p>
    </div>
  );

  if (!data) return null;

  const tabs = [
    { key: "reservas", label: "Reservas" },
    { key: "planos",   label: "Planos" },
    { key: "consumos", label: "Consumos" },
  ] as const;

  return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#1a0e05", padding: "0 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <a href="/" style={{ color: "#f5f0e8", fontWeight: 800, fontSize: 18, textDecoration: "none" }}>VDO HUB</a>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "rgba(215,203,181,0.7)", fontSize: 14 }}>{data.name}</span>
            <button onClick={logout} style={{ color: "rgba(215,203,181,0.5)", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>Sair</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a0e05", marginBottom: 4 }}>Olá, {data.name.split(" ")[0]}!</h1>
        <p style={{ color: "rgba(26,14,5,0.45)", fontSize: 14, marginBottom: 32 }}>{data.email}</p>

        {/* Alertas */}
        {!data.hasFace && (
          <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#854d0e" }}>
            ⚠ Você ainda não cadastrou sua foto facial. Cadastre para ter acesso automático à sala.
          </div>
        )}
        {!data.hasCard && (
          <div style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 14, color: "#1e40af" }}>
            ℹ Nenhum cartão cadastrado. Você precisará cadastrar um cartão para fazer reservas.
          </div>
        )}

        {/* Ações rápidas */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          <a href="/portal/reservar" style={{ background: "#1a0e05", color: "#f5f0e8", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            + Nova reserva
          </a>
          <a href="/portal/planos" style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05", padding: "10px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid rgba(26,14,5,0.1)" }}>
            Ver planos
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(26,14,5,0.1)", paddingBottom: 0 }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: "10px 20px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                background: "none", borderBottom: tab === t.key ? "2px solid #1a0e05" : "2px solid transparent",
                color: tab === t.key ? "#1a0e05" : "rgba(26,14,5,0.4)",
                marginBottom: -1,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Reservas */}
        {tab === "reservas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.bookings.length === 0 && <p style={{ color: "rgba(26,14,5,0.4)", fontSize: 14 }}>Nenhuma reserva encontrada.</p>}
            {data.bookings.map((b) => (
              <div key={b.id} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(26,14,5,0.07)" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#1a0e05", margin: 0 }}>{fmt(b.startAt)} → {fmt(b.endAt)}</p>
                  <p style={{ fontSize: 13, color: "rgba(26,14,5,0.45)", margin: "2px 0 0" }}>{STATUS_LABEL[b.status] ?? b.status}</p>
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "#1a0e05", margin: 0 }}>
                  {b.totalAmount === 0 ? "Gratuito" : `R$ ${b.totalAmount.toFixed(2)}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Planos */}
        {tab === "planos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.subscriptions.length === 0 && <p style={{ color: "rgba(26,14,5,0.4)", fontSize: 14 }}>Nenhum plano contratado.</p>}
            {data.subscriptions.map((s) => (
              <div key={s.id} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid rgba(26,14,5,0.07)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#1a0e05", margin: 0 }}>{s.planKey}</p>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.status === "ACTIVE" ? "rgba(22,163,74,0.1)" : "rgba(26,14,5,0.06)", color: s.status === "ACTIVE" ? "#166534" : "rgba(26,14,5,0.5)" }}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(26,14,5,0.5)", margin: "6px 0 0" }}>
                  {s.usedCredits}/{s.totalCredits} créditos usados · Expira em {fmtDate(s.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Consumos */}
        {tab === "consumos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.consumables.length === 0 && <p style={{ color: "rgba(26,14,5,0.4)", fontSize: 14 }}>Nenhum consumo registrado.</p>}
            {data.consumables.map((c) => (
              <div key={c.id} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(26,14,5,0.07)" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#1a0e05", margin: 0 }}>{c.consumable.name}</p>
                  <p style={{ fontSize: 13, color: "rgba(26,14,5,0.45)", margin: "2px 0 0" }}>{fmtDate(c.createdAt)} · {c.qty} un.</p>
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "#1a0e05", margin: 0 }}>R$ {c.totalPrice.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
