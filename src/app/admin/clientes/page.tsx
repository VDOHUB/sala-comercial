"use client";
import { useEffect, useRef, useState } from "react";
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

const inputStyle = {
  background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)",
  color: "#1a0e05", borderRadius: "0.75rem", padding: "0.5rem 0.875rem",
  fontSize: "0.875rem", width: "100%", outline: "none",
};

export default function ClientesPage() {
  const [clients, setClients]         = useState<Client[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edição
  const [editing, setEditing]         = useState(false);
  const [editForm, setEditForm]       = useState({ name: "", email: "", phone: "", cpf: "" });
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

  // Exclusão
  const [deleting, setDeleting]       = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Foto facial (upload pelo admin)
  const [faceModal, setFaceModal]     = useState(false);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [faceUploading, setFaceUploading] = useState(false);
  const [faceResult, setFaceResult]   = useState<{ ok?: boolean; idFaceOk?: boolean; idFaceError?: string | null; error?: string; qstashResults?: { bookingId: string; ok: boolean; error?: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  function loadList() {
    fetch("/api/admin/clientes")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); });
  }

  useEffect(() => { loadList(); }, []);

  async function openClient(id: string) {
    setDetailLoading(true);
    setEditing(false);
    setSaveError(null);
    setDeleteError(null);
    const data = await fetch(`/api/admin/clientes/${id}`).then((r) => r.json());
    setSelected(data);
    setDetailLoading(false);
  }

  function startEdit() {
    if (!selected) return;
    setEditForm({
      name:  selected.name,
      email: selected.email,
      phone: selected.phone ?? "",
      cpf:   selected.cpf   ?? "",
    });
    setEditing(true);
    setSaveError(null);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    const res = await fetch(`/api/admin/clientes/${selected.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(editForm),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveError(data.error ?? "Erro ao salvar."); return; }
    // Atualiza o painel e a lista
    setSelected((prev) => prev ? { ...prev, ...data } : prev);
    setClients((prev) => prev.map((c) => c.id === selected.id ? { ...c, ...data } : c));
    setEditing(false);
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`Excluir "${selected.name}" permanentemente?\n\nTodos os dados deste cliente serão removidos.`)) return;
    setDeleting(true);
    setDeleteError(null);
    const res  = await fetch(`/api/admin/clientes/${selected.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) { setDeleteError(data.error ?? "Erro ao excluir."); return; }
    setSelected(null);
    loadList();
  }

  function openFaceModal() {
    setFacePreview(null);
    setFaceResult(null);
    setFaceModal(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFacePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleFaceUpload() {
    if (!selected || !facePreview) return;
    setFaceUploading(true);
    setFaceResult(null);
    const res  = await fetch(`/api/admin/clientes/${selected.id}/facial`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ photoBase64: facePreview }),
    });
    const data = await res.json();
    setFaceUploading(false);
    setFaceResult(data);
    if (res.ok) {
      // Atualiza a foto no painel e na lista
      setSelected((prev) => prev ? { ...prev, facePhoto: facePreview } : prev);
      setClients((prev) => prev.map((c) => c.id === selected.id ? { ...c, facePhoto: facePreview } : c));
    }
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-6 h-full">
      {/* ── Lista ── */}
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
                          <img src={c.facePhoto} alt={c.name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            style={{ border: "1px solid rgba(26,14,5,0.1)" }} />
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

      {/* ── Painel de detalhe ── */}
      {(selected || detailLoading) && (
        <div className="w-96 flex-shrink-0 rounded-2xl overflow-y-auto max-h-[calc(100vh-8rem)]"
          style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>

          {/* Header */}
          <div className="sticky top-0 z-10 px-5 py-4"
            style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm" style={{ color: "#1a0e05" }}>
                {selected ? selected.name : "Carregando..."}
              </p>
              <button onClick={() => { setSelected(null); setEditing(false); }}
                className="text-lg leading-none px-1" style={{ color: "rgba(26,14,5,0.35)" }}>×</button>
            </div>
            {/* Botões editar / excluir */}
            {selected && !editing && (
              <div className="space-y-2 mt-3">
                <div className="flex gap-2">
                  <button onClick={startEdit}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: "rgba(26,14,5,0.07)", color: "#1a0e05" }}>
                    ✏️ Editar dados
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                    style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b" }}>
                    {deleting ? "Excluindo..." : "🗑 Excluir"}
                  </button>
                </div>
                <button onClick={openFaceModal}
                  className="w-full py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: "rgba(37,99,235,0.08)", color: "#1e40af", border: "1px solid rgba(37,99,235,0.15)" }}>
                  📷 {selected.facePhoto ? "Substituir foto facial" : "Cadastrar foto facial"}
                </button>
              </div>
            )}
            {deleteError && (
              <p className="mt-2 text-xs px-3 py-2 rounded-xl"
                style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b" }}>
                {deleteError}
              </p>
            )}
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
                    <img src={selected.facePhoto} alt={selected.name}
                      className="w-24 h-24 rounded-2xl object-cover"
                      style={{ border: "1px solid rgba(26,14,5,0.1)" }} />
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

              {/* ── Formulário de edição ── */}
              {editing ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.4)" }}>
                    Editar dados do cliente
                  </p>
                  {[
                    { label: "Nome",     key: "name",  placeholder: "Nome completo" },
                    { label: "E-mail",   key: "email", placeholder: "email@exemplo.com" },
                    { label: "WhatsApp", key: "phone", placeholder: "(62) 99999-9999" },
                    { label: "CPF",      key: "cpf",   placeholder: "00000000000" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: "rgba(26,14,5,0.4)" }}>{label}</label>
                      <input
                        value={editForm[key as keyof typeof editForm]}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        placeholder={placeholder}
                        style={inputStyle}
                      />
                    </div>
                  ))}

                  {saveError && (
                    <p className="text-xs px-3 py-2 rounded-xl"
                      style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b" }}>
                      {saveError}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setEditing(false); setSaveError(null); }} disabled={saving}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: "rgba(26,14,5,0.06)", color: "rgba(26,14,5,0.5)" }}>
                      Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving || !editForm.name || !editForm.email}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
                      style={{ background: "#1a0e05", color: "#f5f0e8" }}>
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Info básica (modo leitura) ── */
                <div className="space-y-2">
                  {[
                    { label: "E-mail",   value: selected.email },
                    { label: "WhatsApp", value: selected.phone },
                    { label: "CPF",      value: selected.cpf },
                    { label: "Cadastro", value: format(new Date(selected.createdAt), "dd/MM/yyyy", { locale: ptBR }) },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="flex justify-between text-sm">
                      <span style={{ color: "rgba(26,14,5,0.45)" }}>{label}</span>
                      {label === "WhatsApp" ? (
                        <a href={`https://wa.me/55${value.replace(/\D/g,"")}`} target="_blank"
                          className="font-medium hover:underline" style={{ color: "#1a0e05" }}>{value}</a>
                      ) : (
                        <span style={{ color: "#1a0e05" }}>{value}</span>
                      )}
                    </div>
                  ) : null)}
                </div>
              )}

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
      {/* ── Modal: cadastro de foto facial ── */}
      {faceModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !faceUploading) setFaceModal(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#faf7f2", border: "1px solid rgba(26,14,5,0.1)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(26,14,5,0.08)" }}>
              <div>
                <p className="font-bold text-sm" style={{ color: "#1a0e05" }}>Cadastrar foto facial</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.45)" }}>{selected.name}</p>
              </div>
              <button onClick={() => setFaceModal(false)} disabled={faceUploading}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05" }}>✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Preview / placeholder */}
              <div className="flex justify-center">
                {facePreview ? (
                  <img src={facePreview} alt="preview"
                    className="w-40 h-40 rounded-2xl object-cover"
                    style={{ border: "2px solid rgba(26,14,5,0.1)" }} />
                ) : (
                  <div className="w-40 h-40 rounded-2xl flex flex-col items-center justify-center gap-2"
                    style={{ background: "rgba(26,14,5,0.04)", border: "2px dashed rgba(26,14,5,0.15)" }}>
                    <span className="text-4xl">📷</span>
                    <p className="text-xs text-center px-4" style={{ color: "rgba(26,14,5,0.4)" }}>
                      Selecione uma foto do rosto do cliente
                    </p>
                  </div>
                )}
              </div>

              {/* Botão de selecionar arquivo */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05", border: "1px solid rgba(26,14,5,0.1)" }}>
                {facePreview ? "Trocar foto" : "Escolher arquivo"}
              </button>

              {/* Resultado */}
              {faceResult && (
                <div className="rounded-xl px-4 py-3 text-sm space-y-1"
                  style={{
                    background: faceResult.ok ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)",
                    border: `1px solid ${faceResult.ok ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                  }}>
                  {faceResult.ok ? (
                    <>
                      <p className="font-semibold" style={{ color: "#166534" }}>✓ Foto salva com sucesso!</p>
                      {faceResult.idFaceOk ? (
                        <p className="text-xs" style={{ color: "#166534" }}>✓ Registrado no iDFace</p>
                      ) : (
                        <p className="text-xs" style={{ color: "#854d0e" }}>
                          ⚠ Falhou no iDFace: {faceResult.idFaceError}
                        </p>
                      )}
                      {faceResult.qstashResults && faceResult.qstashResults.length > 0 && (
                        faceResult.qstashResults.every((r) => r.ok) ? (
                          <p className="text-xs" style={{ color: "#166534" }}>
                            ✓ Acesso agendado para {faceResult.qstashResults.length} reserva{faceResult.qstashResults.length > 1 ? "s" : ""}
                          </p>
                        ) : (
                          <p className="text-xs" style={{ color: "#854d0e" }}>
                            ⚠ Falha ao agendar acesso — contate o suporte
                          </p>
                        )
                      )}
                      {faceResult.qstashResults?.length === 0 && faceResult.idFaceOk && (
                        <p className="text-xs" style={{ color: "rgba(26,14,5,0.45)" }}>
                          ℹ Nenhuma reserva futura encontrada para agendar acesso
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "#991b1b" }}>{faceResult.error}</p>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3">
                <button onClick={() => setFaceModal(false)} disabled={faceUploading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(26,14,5,0.05)", color: "rgba(26,14,5,0.5)" }}>
                  {faceResult?.ok ? "Fechar" : "Cancelar"}
                </button>
                {!faceResult?.ok && (
                  <button onClick={handleFaceUpload}
                    disabled={faceUploading || !facePreview}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                    style={{ background: "#1a0e05", color: "#f5f0e8" }}>
                    {faceUploading ? "Enviando..." : "Cadastrar no iDFace"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
