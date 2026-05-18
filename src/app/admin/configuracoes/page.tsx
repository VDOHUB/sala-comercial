export default function ConfiguracoesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 text-sm mt-1">Configurações gerais do sistema</p>
      </div>

      <div className="space-y-6 max-w-2xl">

        {/* Informações da sala */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h2 className="text-white font-semibold mb-1">Informações da sala</h2>
          <p className="text-gray-400 text-sm mb-5">Dados exibidos no site e nos e-mails</p>
          <div className="space-y-4">
            {[
              { label: "Nome comercial", value: "VDO HUB" },
              { label: "Endereço", value: "Galeria Nazir — Av. São Francisco de Assis, 181, 2º piso, sala 03" },
              { label: "Cidade", value: "Jundiaí, Anápolis - GO" },
              { label: "E-mail de contato", value: "viverdeobrahub@gmail.com" },
              { label: "WhatsApp", value: "(62) 99633-2257" },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 py-3 border-b border-gray-700 last:border-0">
                <span className="text-gray-400 text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Horários */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h2 className="text-white font-semibold mb-1">Horários de funcionamento</h2>
          <p className="text-gray-400 text-sm mb-5">Segunda a sexta-feira</p>
          <div className="space-y-3">
            {[
              { label: "Período Matutino", value: "08h00 às 13h00" },
              { label: "Período Vespertino", value: "14h00 às 19h00" },
              { label: "Intervalo", value: "13h00 às 14h00 (manutenção)" },
              { label: "Tolerância", value: "15 min após o encerramento" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                <span className="text-gray-400 text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrações */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h2 className="text-white font-semibold mb-1">Integrações</h2>
          <p className="text-gray-400 text-sm mb-5">Status dos serviços conectados</p>
          <div className="space-y-3">
            {[
              { label: "ASAAS (pagamentos)", status: true },
              { label: "Resend (e-mails)", status: true },
              { label: "Control iD (acesso facial)", status: false, obs: "Aguardando configuração da rede local" },
              { label: "Supabase (banco de dados)", status: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                <div>
                  <span className="text-gray-300 text-sm">{item.label}</span>
                  {item.obs && <p className="text-gray-500 text-xs mt-0.5">{item.obs}</p>}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  item.status
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-gray-600/20 text-gray-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status ? "bg-emerald-400" : "bg-gray-500"}`} />
                  {item.status ? "Conectado" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alterar senha */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h2 className="text-white font-semibold mb-1">Segurança</h2>
          <p className="text-gray-400 text-sm mb-4">Para alterar a senha do admin, use o terminal:</p>
          <div className="bg-gray-900 rounded-xl px-4 py-3 font-mono text-xs text-gray-400 border border-gray-700">
            npx tsx scripts/create-admin.ts
          </div>
          <p className="text-gray-500 text-xs mt-2">Edite o script com a nova senha antes de rodar.</p>
        </div>
      </div>
    </div>
  );
}
