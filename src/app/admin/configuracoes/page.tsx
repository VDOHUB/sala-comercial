"use client";
import { useEffect, useRef, useState } from "react";

type FaqItem = { id: string; question: string; answer: string; order: number };
type TermsAttachment = { id: string; name: string; data: string };

export default function ConfiguracoesPage() {
  const [terms, setTerms]               = useState("");
  const [termsSaved, setTermsSaved]     = useState(false);
  const [termsSaving, setTermsSaving]   = useState(false);
  const [attachments, setAttachments]   = useState<TermsAttachment[]>([]);
  const attachRef                       = useRef<HTMLInputElement>(null);

  // FAQ
  const [faq, setFaq]               = useState<FaqItem[]>([]);
  const [faqSaved, setFaqSaved]     = useState(false);
  const [faqSaving, setFaqSaving]   = useState(false);
  const [newQ, setNewQ]             = useState("");
  const [newA, setNewA]             = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.terms) setTerms(data.terms);
        if (data.terms_attachments) {
          try { setAttachments(JSON.parse(data.terms_attachments)); } catch { setAttachments([]); }
        }
      });
    fetch("/api/admin/faq")
      .then((r) => r.json())
      .then((data: FaqItem[]) => { if (Array.isArray(data)) setFaq(data); });
  }, []);

  async function saveTerms() {
    setTermsSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms, terms_attachments: JSON.stringify(attachments) }),
    });
    setTermsSaving(false);
    setTermsSaved(true);
    setTimeout(() => setTermsSaved(false), 3000);
  }

  function handleAttachFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          { id: Date.now().toString() + Math.random(), name: file.name, data },
        ]);
      };
      reader.readAsDataURL(file);
    });
    // reset input so same file can be added again if needed
    e.target.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  // FAQ helpers
  function addFaqItem() {
    if (!newQ.trim() || !newA.trim()) return;
    const item: FaqItem = {
      id:       Date.now().toString(),
      question: newQ.trim(),
      answer:   newA.trim(),
      order:    faq.length,
    };
    setFaq((prev) => [...prev, item]);
    setNewQ(""); setNewA("");
    setFaqSaved(false);
  }

  function removeFaqItem(id: string) {
    setFaq((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));
    setFaqSaved(false);
  }

  function moveFaqItem(id: string, dir: -1 | 1) {
    setFaq((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx + dir < 0 || idx + dir >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next.map((f, i) => ({ ...f, order: i }));
    });
    setFaqSaved(false);
  }

  async function saveFaq() {
    setFaqSaving(true);
    await fetch("/api/admin/faq", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(faq),
    });
    setFaqSaving(false);
    setFaqSaved(true);
    setTimeout(() => setFaqSaved(false), 3000);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>Configurações gerais do sistema</p>
      </div>

      <div className="space-y-6 max-w-2xl">

        {/* Informações da sala */}
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <h2 className="font-semibold mb-1" style={{ color: "#1a0e05" }}>Informações da sala</h2>
          <p className="text-sm mb-5" style={{ color: "rgba(26,14,5,0.4)" }}>Dados exibidos no site e nos e-mails</p>
          <div className="space-y-4">
            {[
              { label: "Nome comercial", value: "VDO HUB" },
              { label: "Endereço", value: "Galeria Nazir — Av. São Francisco de Assis, 181, 2º piso, sala 03" },
              { label: "Cidade", value: "Jundiaí, Anápolis - GO" },
              { label: "E-mail de contato", value: "viverdeobrahub@gmail.com" },
              { label: "WhatsApp", value: "(62) 99633-2257" },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 py-3" style={{ borderBottom: "1px solid rgba(26,14,5,0.06)" }}>
                <span className="text-sm" style={{ color: "rgba(26,14,5,0.45)" }}>{item.label}</span>
                <span className="text-sm font-medium text-right" style={{ color: "#1a0e05" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Horários */}
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <h2 className="font-semibold mb-1" style={{ color: "#1a0e05" }}>Horários de funcionamento</h2>
          <p className="text-sm mb-5" style={{ color: "rgba(26,14,5,0.4)" }}>Segunda a sexta-feira</p>
          <div className="space-y-3">
            {[
              { label: "Período Matutino",  value: "08h00 às 13h00" },
              { label: "Período Vespertino", value: "14h00 às 19h00" },
              { label: "Intervalo",          value: "13h00 às 14h00 (manutenção)" },
              { label: "Tolerância",         value: "15 min após o encerramento" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(26,14,5,0.06)" }}>
                <span className="text-sm" style={{ color: "rgba(26,14,5,0.45)" }}>{item.label}</span>
                <span className="text-sm font-medium" style={{ color: "#1a0e05" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Termos de uso */}
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-semibold" style={{ color: "#1a0e05" }}>Termos de uso</h2>
            <div className="flex items-center gap-3">
              <a href="/admin/termos-aceites" className="text-xs font-medium hover:underline"
                style={{ color: "rgba(26,14,5,0.45)" }}>
                📋 Ver aceites →
              </a>
              <a href="/termos" target="_blank" className="text-xs font-medium hover:underline"
                style={{ color: "rgba(26,14,5,0.45)" }}>
                Ver página pública →
              </a>
            </div>
          </div>
          <p className="text-sm mb-4" style={{ color: "rgba(26,14,5,0.4)" }}>
            Texto exibido na página /termos e exigido na finalização do pedido.
            Use **texto** para negrito e linhas em branco para separar parágrafos.
          </p>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={14}
            placeholder="**TERMOS DE USO — VDO HUB**&#10;&#10;1. Objeto&#10;..."
            className="w-full rounded-xl px-4 py-3 text-sm font-mono resize-y focus:outline-none"
            style={{
              background: "rgba(26,14,5,0.04)",
              border: "1px solid rgba(26,14,5,0.12)",
              color: "#1a0e05",
            }}
          />

          {/* Anexos */}
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(26,14,5,0.08)" }}>
            <p className="text-sm font-medium mb-1" style={{ color: "#1a0e05" }}>Anexos dos termos</p>
            <p className="text-xs mb-3" style={{ color: "rgba(26,14,5,0.4)" }}>
              PDFs ou imagens exibidos como links de download no rodapé da página de termos. Pode adicionar vários.
            </p>

            {/* Lista de arquivos já adicionados */}
            {attachments.length > 0 && (
              <div className="space-y-2 mb-3">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.08)" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">
                        {a.data.startsWith("data:application/pdf") ? "📄" : "🖼"}
                      </span>
                      <span className="text-xs font-medium truncate" style={{ color: "#1a0e05" }}>{a.name}</span>
                    </div>
                    <button type="button" onClick={() => removeAttachment(a.id)}
                      className="text-xs flex-shrink-0 px-2 py-1 rounded-lg"
                      style={{ background: "rgba(220,38,38,0.07)", color: "#dc2626" }}>
                      ✕ Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => attachRef.current?.click()}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "rgba(26,14,5,0.07)", color: "#1a0e05", border: "1px solid rgba(26,14,5,0.12)" }}>
              📎 Adicionar arquivo(s)
            </button>
            <input ref={attachRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={handleAttachFiles} />
          </div>

          <div className="flex items-center justify-between mt-4">
            {termsSaved ? (
              <span className="text-xs font-medium" style={{ color: "#166534" }}>✓ Termos salvos</span>
            ) : <span />}
            <button
              onClick={saveTerms}
              disabled={termsSaving}
              className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{ background: "#1a0e05", color: "#f5f0e8" }}>
              {termsSaving ? "Salvando..." : "Salvar termos"}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-semibold" style={{ color: "#1a0e05" }}>Dúvidas Frequentes (FAQ)</h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "rgba(26,14,5,0.07)", color: "rgba(26,14,5,0.5)" }}>
              {faq.length} perguntas
            </span>
          </div>
          <p className="text-sm mb-5" style={{ color: "rgba(26,14,5,0.4)" }}>
            Exibidas na seção "Dúvidas Frequentes" do site, após o Como Funciona.
          </p>

          {/* Lista atual */}
          <div className="space-y-2 mb-5">
            {faq.map((item, idx) => (
              <div key={item.id} className="rounded-xl p-4" style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.06)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button type="button" onClick={() => moveFaqItem(item.id, -1)} disabled={idx === 0}
                      className="text-xs disabled:opacity-30" style={{ color: "rgba(26,14,5,0.5)" }}>▲</button>
                    <button type="button" onClick={() => moveFaqItem(item.id, 1)} disabled={idx === faq.length - 1}
                      className="text-xs disabled:opacity-30" style={{ color: "rgba(26,14,5,0.5)" }}>▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-0.5" style={{ color: "#1a0e05" }}>{item.question}</p>
                    <p className="text-xs" style={{ color: "rgba(26,14,5,0.5)" }}>{item.answer}</p>
                  </div>
                  <button type="button" onClick={() => removeFaqItem(item.id)}
                    className="text-sm px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {faq.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "rgba(26,14,5,0.3)" }}>
                Nenhuma pergunta adicionada ainda.
              </p>
            )}
          </div>

          {/* Adicionar nova */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(26,14,5,0.04)", border: "1px solid rgba(26,14,5,0.08)" }}>
            <p className="text-xs font-semibold" style={{ color: "rgba(26,14,5,0.5)" }}>ADICIONAR PERGUNTA</p>
            <input
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              placeholder="Qual a pergunta?"
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "#fff", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
            />
            <textarea
              value={newA}
              onChange={(e) => setNewA(e.target.value)}
              placeholder="Qual é a resposta?"
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
              style={{ background: "#fff", border: "1px solid rgba(26,14,5,0.12)", color: "#1a0e05" }}
            />
            <button type="button" onClick={addFaqItem}
              disabled={!newQ.trim() || !newA.trim()}
              className="w-full py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: "rgba(26,14,5,0.08)", color: "#1a0e05" }}>
              + Adicionar pergunta
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            {faqSaved ? (
              <span className="text-xs font-medium" style={{ color: "#166534" }}>✓ FAQ salvo</span>
            ) : <span />}
            <button onClick={saveFaq} disabled={faqSaving}
              className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{ background: "#1a0e05", color: "#f5f0e8" }}>
              {faqSaving ? "Salvando..." : "Salvar FAQ"}
            </button>
          </div>
        </div>

        {/* Integrações */}
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <h2 className="font-semibold mb-1" style={{ color: "#1a0e05" }}>Integrações</h2>
          <p className="text-sm mb-5" style={{ color: "rgba(26,14,5,0.4)" }}>Status dos serviços conectados</p>
          <div className="space-y-3">
            {[
              { label: "ASAAS (pagamentos)",       status: true },
              { label: "Resend (e-mails)",          status: true },
              { label: "Control iD (acesso facial)", status: false, obs: "Aguardando configuração da rede local" },
              { label: "Supabase (banco de dados)", status: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(26,14,5,0.06)" }}>
                <div>
                  <span className="text-sm" style={{ color: "#1a0e05" }}>{item.label}</span>
                  {item.obs && <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.38)" }}>{item.obs}</p>}
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={item.status
                    ? { background: "rgba(22,163,74,0.1)", color: "#166534" }
                    : { background: "rgba(26,14,5,0.07)", color: "rgba(26,14,5,0.45)" }
                  }>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.status ? "#16a34a" : "rgba(26,14,5,0.3)" }} />
                  {item.status ? "Conectado" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Segurança */}
        <div className="rounded-2xl p-6" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <h2 className="font-semibold mb-1" style={{ color: "#1a0e05" }}>Segurança</h2>
          <p className="text-sm mb-4" style={{ color: "rgba(26,14,5,0.4)" }}>Para alterar a senha do admin, use o terminal:</p>
          <div className="rounded-xl px-4 py-3 font-mono text-xs" style={{ background: "rgba(26,14,5,0.05)", border: "1px solid rgba(26,14,5,0.08)", color: "rgba(26,14,5,0.6)" }}>
            npx tsx scripts/create-admin.ts
          </div>
          <p className="text-xs mt-2" style={{ color: "rgba(26,14,5,0.35)" }}>Edite o script com a nova senha antes de rodar.</p>
        </div>

      </div>
    </div>
  );
}
