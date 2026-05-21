"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLAN_LABELS: Record<string, string> = {
  HUB_ONE:     "HUB ONE",
  HUB_FIVE:    "HUB FIVE",
  HUB_TEN:     "HUB TEN",
  HUB_PARTNER: "HUB PARTNER",
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "rgba(234,179,8,0.1)",   color: "#854d0e",           label: "Pendente"  },
  PAID:      { bg: "rgba(22,163,74,0.1)",    color: "#166534",           label: "Pago"      },
  ACTIVE:    { bg: "rgba(37,99,235,0.1)",    color: "#1e40af",           label: "Em uso"    },
  COMPLETED: { bg: "rgba(26,14,5,0.07)",     color: "rgba(26,14,5,0.5)", label: "Concluído" },
  CANCELLED: { bg: "rgba(220,38,38,0.08)",   color: "#991b1b",           label: "Cancelado" },
  ACTIVE_S:  { bg: "rgba(22,163,74,0.1)",    color: "#166534",           label: "Ativa"     },
  EXPIRED:   { bg: "rgba(220,38,38,0.08)",   color: "#991b1b",           label: "Expirada"  },
};

type Client = {
  id: string; name: string; email: string; phone: string | null; cpf: string | null;
  facePhoto: string | null; createdAt: string; _count: { bookings: number };
};

type ClientDetail = Client & {
  bookings: Array<{
    id: string; startAt: string; endAt: string; totalAmount: number; status: string;
    voucher: { code: string } | null;
  }>;
  subscriptions: Array<{
    id: string; planKey: string; totalCredits: number; usedCredits: number;
    status: string; expiresAt: string; totalAmount: number; token: string;
    _count: { bookings: number };
  }>;
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    fetch("/api/admin/clientes")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); });
  }, []);

  async function openClient(id: string) {
    setDetailLoading(true);
    const data = await fetch(`/api/admin/clientes/${id}`).then((r) => r.json());
    setSelected(data);
    setDetailLoading(false);
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-6 h-full">
      {/* Lista */}
      <div className={selected ? "flex-1 min-w-0" : "w-full"}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Clientes</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
              {clients.length} cliente{clients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full max-w-sm rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
          />
        </div>

        {loading ? (
          <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "rgba(26,14,5,0.38)" }}>
            <p className="font-medium text-lg mb-1" style={{ color: "#1a0e05" }}>
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
            </p>
            <p className="text-sm">Os clientes aparecem automaticamente após a primeira reserva.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Cliente</th>
                  {!selected && <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Contato</th>}
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Reservas</th>
                  {!selected && <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Cadastro</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}
                    onClick={() => openClient(c.id)}
                    className="transition-colors cursor-pointer"
                    style={{
                      borderTop: "1px solid rgba(26,14,5,0.05)",
                      background: selected?.id === c.id ? "rgba(26,14,5,0.04)" : undefined,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(26,14,5,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = selected?.id === c.id ? "rgba(26,14,5,0.04)" : ""}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {c.facePhoto ? (
                          <img
                            src={c.facePhoto}
                            alt={c.name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            style={{ border: "1px solid rgba(26,14,5,0.1)" }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: "rgba(26,14,5,0.08)", color: "#1a0e05" }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm" style={{ color: "#1a0e05" }}>{c.name}</p>
                          {c.cpf && !selected && <p className="text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>CPF: {c.cpf}</p>}
                        </div>
                      </div>
                    </td>
                    {!selected && (
                      <td className="px-6 py-4">
                        <p className="text-sm" style={{ color: "rgba(26,14,5,0.65)" }}>{c.email}</p>
                        {c.phone && <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.38)" }}>{c.phone}</p>}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(26,14,5,0.07)", color: "#1a0e05" }}>
                        {c._count.bookings}
                      </span>
                    </td>
                    {!selected && (
                      <td className="px-6 py-4 text-sm" style={{ color: "rgba(26,14,5,0.45)" }}>
                        {format(new Date(c.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel de detalhe */}
      {(selected || detailLoading) && (
        <div className="w-96 flex-shrink-0 rounded-2xl overflow-y-auto max-h-[calc(100vh-8rem)]"
          style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
            style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
            <p className="font-semibold text-sm" style={{ color: "#1a0e05" }}>
              {selected ? selected.name : "Carregando..."}
            </p>
            <button onClick={() => setSelected(null)}
              className="text-lg leading-none px-1"
              style={{ color: "rgba(26,14,5,0.35)" }}>×</button>
          </div>

          {detailLoading ? (
            <div className="animate-pulse text-center py-12 text-sm" style={{ color: "rgba(26,14,5,0.35)" }}>
              Carregando...
            </div>
          ) : selected && (
            <div className="p-5 space-y-5">
              {/* Foto facial */}
              {selected.facePhoto ? (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={selected.facePhoto}
                      alt={selected.name}
                      className="w-24 h-24 rounded-2xl object-cover"
                      style={{ border: "1px solid rgba(26,14,5,0.1)" }}
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(22,163,74,0.1)", color: "#166534", border: "1px solid rgba(22,163,74,0.2)" }}>
                      ✓ Facial
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-1"
                    style={{ background: "rgba(26,14,5,0.05)", border: "1px dashed rgba(26,14,5,0.15)" }}>
                    <span className="text-2xl font-bold" style={{ color: "rgba(26,14,5,0.2)" }}>
                      {selected.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs" style={{ color: "rgba(26,14,5,0.3)" }}>Sem foto</span>
                  </div>
                </div>
              )}

              {/* Info básica */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "rgba(26,14,5,0.45)" }}>E-mail</span>
                  <span style={{ color: "#1a0e05" }}>{selected.email}</span>
                </div>
                {selected.phone && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(26,14,5,0.45)" }}>WhatsApp</span>
                    <a href={`https://wa.me/55${selected.phone.replace(/\D/g,"")}`} target="_blank"
                      className="font-medium hover:underline" style={{ color: "#1a0e05" }}>
                      {selected.phone}
                    </a>
                  </div>
                )}
                {selected.cpf && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(26,14,5,0.45)" }}>CPF</span>
                    <span style={{ color: "#1a0e05" }}>{selected.cpf}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span style={{ color: "rgba(26,14,5,0.45)" }}>Cadastro</span>
                  <span style={{ color: "#1a0e05" }}>{format(new Date(selected.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              </div>

              {/* Assinaturas */}
              {selected.subscriptions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(26,14,5,0.35)" }}>
                    Assinaturas
                  </p>
                  <div className="space-y-2">
                    {selected.subscriptions.map((sub) => {
                      const st = STATUS_STYLE[sub.status] ?? STATUS_STYLE.EXPIRED;
                      const remaining = sub.totalCredits - sub.usedCredits;
                      const pct = (sub.usedCredits / sub.totalCredits) * 100;
                      return (
                        <div key={sub.id} className="rounded-xl p-3"
                          style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.07)" }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>
                              {PLAN_LABELS[sub.planKey] ?? sub.planKey}
                            </p>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          </div>
                          <div className="text-xs mb-2 flex justify-between" style={{ color: "rgba(26,14,5,0.5)" }}>
                            <span>{sub.usedCredits}/{sub.totalCredits} períodos</span>
                            <span style={{ color: remaining === 0 ? "#991b1b" : "#166534" }}>
                              {remaining} restante{remaining !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="h-1 rounded-full mb-2" style={{ background: "rgba(26,14,5,0.08)" }}>
                            <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "#991b1b" : "#1a0e05" }} />
                          </div>
                          <div className="flex justify-between text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>
                            <span>Expira {format(new Date(sub.expiresAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                            <a href={`${baseUrl}/minha-conta/${sub.token}`} target="_blank"
                              className="font-semibold hover:underline" style={{ color: "rgba(26,14,5,0.5)" }}>
                              Portal →
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reservas */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(26,14,5,0.35)" }}>
                  Reservas ({selected.bookings.length})
                </p>
                {selected.bookings.length === 0 ? (
                  <p className="text-sm" style={{ color: "rgba(26,14,5,0.35)" }}>Nenhuma reserva avulsa.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.bookings.map((b) => {
                      const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.CANCELLED;
                      return (
                        <div key={b.id} className="rounded-xl p-3 flex items-start justify-between gap-2"
                          style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.07)" }}>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: "#1a0e05" }}>
                              {format(new Date(b.startAt), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.45)" }}>
                              {format(new Date(b.startAt), "HH:mm")} — {format(new Date(b.endAt), "HH:mm")}
                            </p>
                            {b.voucher && (
                              <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.35)" }}>
                                Cupom: {b.voucher.code}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            <p className="text-xs mt-1.5 font-semibold" style={{ color: "#1a0e05" }}>
                              R${b.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
