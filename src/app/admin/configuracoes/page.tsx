"use client";
import { useEffect, useState } from "react";

export default function ConfiguracoesPage() {
  const [terms, setTerms] = useState("");
  const [termsSaved, setTermsSaved] = useState(false);
  const [termsSaving, setTermsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.terms) setTerms(data.terms);
      });
  }, []);

  async function saveTerms() {
    setTermsSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms }),
    });
    setTermsSaving(false);
    setTermsSaved(true);
    setTimeout(() => setTermsSaved(false), 3000);
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
            <a
              href="/termos"
              target="_blank"
              className="text-xs font-medium hover:underline"
              style={{ color: "rgba(26,14,5,0.45)" }}
            >
              Ver página pública →
            </a>
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
          <div className="flex items-center justify-between mt-3">
            {termsSaved ? (
              <span className="text-xs font-medium" style={{ color: "#166534" }}>✓ Termos salvos</span>
            ) : <span />}
            <button
              onClick={saveTerms}
              disabled={termsSaving}
              className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{ background: "#1a0e05", color: "#f5f0e8" }}
            >
              {termsSaving ? "Salvando..." : "Salvar termos"}
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
