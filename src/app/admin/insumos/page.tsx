"use client";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Consumable = {
  id: string; name: string; price: number; description: string | null;
  photo: string | null; active: boolean; createdAt: string;
};

export default function InsumosPage() {
  const [items, setItems]   = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]     = useState({ name: "", price: "", description: "", photo: "" });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch("/api/admin/insumos").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  }
  useEffect(load, []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    if (editing) {
      await fetch(`/api/admin/insumos/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, price: Number(form.price), description: form.description, photo: form.photo }),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/insumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, price: Number(form.price), description: form.description, photo: form.photo }),
      });
    }
    setForm({ name: "", price: "", description: "", photo: "" });
    setSaving(false);
    load();
  }

  async function toggleActive(item: Consumable) {
    await fetch(`/api/admin/insumos/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"?`)) return;
    await fetch(`/api/admin/insumos/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(item: Consumable) {
    setEditing(item.id);
    setForm({ name: item.name, price: String(item.price), description: item.description ?? "", photo: item.photo ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const inputStyle = { background: "#ede8df", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Insumos</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
          Itens do frigobar, café e outros consumíveis cobrados ao final da sessão.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSave} className="rounded-2xl p-6 mb-8 space-y-4"
        style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
        <p className="text-sm font-semibold" style={{ color: "#1a0e05" }}>
          {editing ? "Editar item" : "Adicionar item"}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Nome *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              required placeholder="Ex: Coca-Cola 350ml"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Preço (R$) *</label>
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              required type="number" step="0.01" min="0" placeholder="0,00"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Descrição</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Informação adicional (opcional)"
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
        </div>

        {/* Foto */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(26,14,5,0.4)" }}>Foto</label>
          <div className="flex items-center gap-4">
            {form.photo && (
              <img src={form.photo} alt="preview" className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                style={{ border: "1px solid rgba(26,14,5,0.1)" }} />
            )}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05", border: "1px solid rgba(26,14,5,0.1)" }}>
              {form.photo ? "Trocar foto" : "Escolher foto"}
            </button>
            {form.photo && (
              <button type="button" onClick={() => setForm({ ...form, photo: "" })}
                className="text-xs" style={{ color: "rgba(26,14,5,0.35)" }}>Remover</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ name: "", price: "", description: "", photo: "" }); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(26,14,5,0.05)", color: "rgba(26,14,5,0.5)", border: "1px solid rgba(26,14,5,0.08)" }}>
              Cancelar
            </button>
          )}
          <button type="submit" disabled={saving || !form.name || !form.price}
            className="px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: "#1a0e05", color: "#f5f0e8" }}>
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar item"}
          </button>
        </div>
      </form>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12" style={{ color: "rgba(26,14,5,0.38)" }}>
          <p className="font-medium mb-1" style={{ color: "#1a0e05" }}>Nenhum item cadastrado</p>
          <p className="text-sm">Adicione itens acima para usar nas cobranças.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)", opacity: item.active ? 1 : 0.55 }}>
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  style={{ border: "1px solid rgba(26,14,5,0.1)" }} />
              ) : (
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                  style={{ background: "rgba(26,14,5,0.06)" }}>🧃</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm" style={{ color: "#1a0e05" }}>{item.name}</p>
                  {!item.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(26,14,5,0.06)", color: "rgba(26,14,5,0.4)" }}>Inativo</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(26,14,5,0.45)" }}>{item.description}</p>
                )}
                <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.35)" }}>
                  Adicionado em {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-lg font-bold" style={{ color: "#1a0e05" }}>
                  R${item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(item)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: item.active ? "rgba(22,163,74,0.08)" : "rgba(26,14,5,0.06)", color: item.active ? "#166534" : "rgba(26,14,5,0.45)" }}>
                  {item.active ? "Ativo" : "Inativo"}
                </button>
                <button onClick={() => startEdit(item)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(26,14,5,0.06)", color: "#1a0e05" }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(item.id, item.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(220,38,38,0.07)", color: "#991b1b" }}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
