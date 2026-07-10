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
  asaasCustomerId: string | null;
  asaasCardToken:  string | null;
  password:        string | null;
  inviteToken:     string | null;
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

  // Novo cliente
  const [newModal, setNewModal]       = useState(false);
  const [newForm, setNewForm]         = useState({ name: "", email: "", phone: "", cpf: "" });
  const [newSaving, setNewSaving]     = useState(false);
  const [newError, setNewError]           = useState<string | null>(null);
  const [newSuccess, setNewSuccess]       = useState(false);
  const [newEmailFailed, setNewEmailFailed] = useState(false);

  // Reenvio de convite
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMsg, setInviteMsg]         = useState<string | null>(null);

  // Cadastro/recuperação de token do cartão
  const [tokenRecovering, setTokenRecovering] = useState(false);
  const [tokenMsg, setTokenMsg]               = useState<string | null>(null);
  const [tokenCardForm, setTokenCardForm]     = useState(false);
  const [tokenCard, setTokenCard]             = useState({ holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "" });

  async function handleRecoverToken() {
    if (!selected) return;
    setTokenRecovering(true); setTokenMsg(null);
    const res  = await fetch(`/api/admin/clientes/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recover-card-token" }),
    });
    const data = await res.json();
    setTokenRecovering(false);
    if (res.ok) {
      setTokenMsg("Token recuperado! Cobrança já disponível.");
      loadList();
    } else if (data.needsCard) {
      setTokenCardForm(true);
      setTokenMsg(null);
    } else {
      setTokenMsg(data.error ?? "Não foi possível recuperar o token.");
    }
  }

  async function handleTokenizeCard() {
    if (!selected) return;
    setTokenRecovering(true); setTokenMsg(null);
    const res  = await fetch(`/api/admin/clientes/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "tokenize-card", card: { ...tokenCard, number: tokenCard.number.replace(/\s/g, "") } }),
    });
    const data = await res.json();
    setTokenRecovering(false);
    if (res.ok) {
      setTokenMsg("Cartão cadastrado! Cobranças já disponíveis.");
      setTokenCardForm(false);
      setTokenCard({ holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "" });
      loadList();
    } else {
      setTokenMsg(data.error ?? "Erro ao cadastrar cartão.");
    }
  }

  async function handleResendInvite() {
    if (!selected) return;
    setInviteSending(true); setInviteMsg(null);
    const res = await fetch("/api/admin/clients/invite", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: selected.id }),
    });
    const data = await res.json();
    setInviteSending(false);
    setInviteMsg(res.ok ? "Convite enviado!" : (data.error ?? "Erro ao enviar"));
  }

  // Foto facial (upload pelo admin)
  const [faceModal, setFaceModal]     = useState(false);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [faceUploading, setFaceUploading] = useState(false);
  const [faceResult, setFaceResult]   = useState<{ ok?: boolean; idFaceOk?: boolean; idFaceError?: string | null; error?: string; qstashResults?: { bookingId: string; action: string; ok: boolean; error?: string }[] } | null>(null);
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

  async function handleNewClient() {
    if (!newForm.name || !newForm.email) { setNewError("Nome e e-mail são obrigatórios"); return; }
    setNewSaving(true); setNewError(null); setNewEmailFailed(false);
    const res = await fetch("/api/admin/clients/invite", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    const data = await res.json();
    setNewSaving(false);
    if (!res.ok) { setNewError(data.error ?? "Erro ao criar cliente"); return; }
    setNewEmailFailed(!!data.emailFailed);
    setNewSuccess(true);
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
          <button onClick={() => { setNewModal(true); setNewSuccess(false); setNewError(null); setNewForm({ name: "", email: "", phone: "", cpf: "" }); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#1a0e05", color: "#f5f0e8", border: "none", cursor: "pointer" }}>
            + Novo Cliente
          </button>
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

              {/* Pagamento e Portal */}
              <div className="rounded-xl p-3 space-y-2"
                style={{ background: "rgba(26,14,5,0.03)", border: "1px solid rgba(26,14,5,0.07)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>
                  Pagamento e Portal
                </p>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "rgba(26,14,5,0.45)" }}>Cartão salvo</span>
                  {selected.asaasCardToken ? (
                    <span className="font-semibold" style={{ color: "#166534" }}>✓ Sim</span>
                  ) : (
                    <span style={{ color: "rgba(26,14,5,0.35)" }}>Não</span>
                  )}
                </div>
                {!selected.asaasCardToken && (
                  <>
                    {!tokenCardForm ? (
                      <button onClick={handleRecoverToken} disabled={tokenRecovering}
                        className="w-full py-1.5 rounded-lg text-xs font-semibold mt-1 disabled:opacity-40"
                        style={{ background: "rgba(22,163,74,0.07)", color: "#166534", border: "1px solid rgba(22,163,74,0.2)" }}>
                        {tokenRecovering ? "Verificando..." : "Cadastrar cartão (sem cobrança)"}
                      </button>
                    ) : (
                      <div className="mt-1 space-y-2">
                        <p className="text-xs font-semibold" style={{ color: "rgba(26,14,5,0.5)" }}>Dados do cartão</p>
                        <input value={tokenCard.holderName} onChange={(e) => setTokenCard({...tokenCard, holderName: e.target.value})}
                          placeholder="Nome no cartão" className="w-full rounded-lg px-3 py-1.5 text-xs"
                          style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                        <input value={tokenCard.number} onChange={(e) => setTokenCard({...tokenCard, number: e.target.value.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim()})}
                          placeholder="0000 0000 0000 0000" maxLength={19} className="w-full rounded-lg px-3 py-1.5 text-xs"
                          style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                        <div className="flex gap-2">
                          <input value={tokenCard.expiryMonth} onChange={(e) => setTokenCard({...tokenCard, expiryMonth: e.target.value.replace(/\D/g,"").slice(0,2)})}
                            placeholder="MM" maxLength={2} className="flex-1 rounded-lg px-3 py-1.5 text-xs"
                            style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                          <input value={tokenCard.expiryYear} onChange={(e) => setTokenCard({...tokenCard, expiryYear: e.target.value.replace(/\D/g,"").slice(0,4)})}
                            placeholder="AAAA" maxLength={4} className="flex-1 rounded-lg px-3 py-1.5 text-xs"
                            style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                          <input value={tokenCard.ccv} onChange={(e) => setTokenCard({...tokenCard, ccv: e.target.value.replace(/\D/g,"").slice(0,4)})}
                            placeholder="CVV" maxLength={4} className="flex-1 rounded-lg px-3 py-1.5 text-xs"
                            style={{ background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleTokenizeCard} disabled={tokenRecovering}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                            style={{ background: "#1a0e05", color: "#f5f0e8", border: "none" }}>
                            {tokenRecovering ? "Salvando..." : "Salvar cartão"}
                          </button>
                          <button onClick={() => { setTokenCardForm(false); setTokenMsg(null); }}
                            className="py-1.5 px-3 rounded-lg text-xs"
                            style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05", border: "1px solid rgba(26,14,5,0.1)" }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                    {tokenMsg && (
                      <p className="text-xs text-center mt-1" style={{ color: tokenMsg.startsWith("Cartão") || tokenMsg.startsWith("Token recuperado") ? "#166534" : "#991b1b" }}>
                        {tokenMsg}
                      </p>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span style={{ color: "rgba(26,14,5,0.45)" }}>Acesso ao portal</span>
                  {selected.password ? (
                    <span className="font-semibold" style={{ color: "#166534" }}>✓ Ativo</span>
                  ) : selected.inviteToken ? (
                    <span style={{ color: "#854d0e" }}>Convite pendente</span>
                  ) : (
                    <span style={{ color: "rgba(26,14,5,0.35)" }}>Sem acesso</span>
                  )}
                </div>
                <button onClick={() => { setInviteMsg(null); handleResendInvite(); }}
                  disabled={inviteSending}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold mt-1 disabled:opacity-40"
                  style={{ background: "rgba(37,99,235,0.07)", color: "#1e40af", border: "1px solid rgba(37,99,235,0.15)" }}>
                  {inviteSending ? "Enviando..." : selected.password ? "Reenviar acesso" : "Enviar convite de acesso"}
                </button>
                {inviteMsg && (
                  <p className="text-xs text-center" style={{ color: inviteMsg === "Convite enviado!" ? "#166534" : "#991b1b" }}>
                    {inviteMsg}
                  </p>
                )}
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
                          ⚠ {faceResult.idFaceError?.includes("Face exists") ? "Foto já cadastrada" : `Falhou no iDFace: ${faceResult.idFaceError}`}
                        </p>
                      )}
                      {faceResult.qstashResults && faceResult.qstashResults.length > 0 && (
                        faceResult.qstashResults.map((r, i) => (
                          <p key={i} className="text-xs" style={{ color: r.ok ? "#166534" : "#854d0e" }}>
                            {r.ok
                              ? r.action === "granted_now"
                                ? "✓ Acesso liberado imediatamente na fechadura"
                                : "✓ Acesso agendado para o horário da reserva"
                              : `⚠ Erro: ${r.error}`}
                          </p>
                        ))
                      )}
                      {faceResult.qstashResults?.length === 0 && faceResult.idFaceOk && (
                        <p className="text-xs" style={{ color: "rgba(26,14,5,0.45)" }}>
                          ℹ Nenhuma reserva ativa ou futura encontrada
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

      {/* Modal — Novo Cliente */}
      {newModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#fff" }}>
            {newSuccess ? (
              <>
                <p className="text-lg font-bold mb-2" style={{ color: "#166534" }}>✓ Cliente criado!</p>
                {newEmailFailed ? (
                  <p className="text-sm mb-2 px-3 py-2 rounded-xl" style={{ background: "rgba(234,179,8,0.1)", color: "#854d0e" }}>
                    ⚠️ Cliente criado, mas o e-mail de convite não foi enviado. Verifique as configurações do Resend e reenvie pelo painel do cliente.
                  </p>
                ) : (
                  <p className="text-sm mb-2" style={{ color: "rgba(26,14,5,0.5)" }}>O cliente receberá um e-mail para finalizar o cadastro com login, senha e dados de pagamento.</p>
                )}
                <button onClick={() => setNewModal(false)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#1a0e05", color: "#f5f0e8", border: "none", cursor: "pointer" }}>Fechar</button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-1" style={{ color: "#1a0e05" }}>Novo Cliente</h2>
                <p className="text-sm mb-6" style={{ color: "rgba(26,14,5,0.45)" }}>Preencha os dados básicos. O cliente receberá um e-mail para finalizar o cadastro.</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.45)" }}>Nome *</label>
                    <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome completo"
                      className="mt-1 block w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.45)" }}>E-mail *</label>
                    <input type="email" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com"
                      className="mt-1 block w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.45)" }}>Telefone</label>
                    <input value={newForm.phone} onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(62) 99999-9999"
                      className="mt-1 block w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.45)" }}>CPF</label>
                    <input value={newForm.cpf} onChange={(e) => setNewForm((f) => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00"
                      className="mt-1 block w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }} />
                  </div>
                  {newError && <p className="text-sm" style={{ color: "#dc2626" }}>{newError}</p>}
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setNewModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(26,14,5,0.05)", color: "rgba(26,14,5,0.5)", border: "none", cursor: "pointer" }}>Cancelar</button>
                    <button onClick={handleNewClient} disabled={newSaving} className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: "#1a0e05", color: "#f5f0e8", border: "none", cursor: "pointer" }}>
                      {newSaving ? "Criando..." : "Criar e enviar convite"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
