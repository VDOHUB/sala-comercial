const features = [
  {
    icon: "📅",
    title: "Agendamento por período",
    desc: "Escolha o período matutino (08h–13h) ou vespertino (14h–19h) diretamente no site. Disponibilidade em tempo real.",
  },
  {
    icon: "💳",
    title: "Cartão em até 10x",
    desc: "Parcele em até 10x sem burocracia. Após confirmação do pagamento, seu acesso é liberado automaticamente.",
  },
  {
    icon: "🔐",
    title: "Acesso por reconhecimento facial",
    desc: "Cadastre sua foto pelo celular após o pagamento. Na hora de entrar, apenas aproxime o rosto — sem chave, sem código.",
  },
  {
    icon: "⏱️",
    title: "Acesso temporário e seguro",
    desc: "Seu acesso é válido exatamente no período reservado. Ao encerrar, é revogado automaticamente pelo sistema.",
  },
  {
    icon: "🎟️",
    title: "Vouchers de desconto",
    desc: "Receba cupons exclusivos para parceiros e primeiras visitas. Aplicado diretamente no checkout.",
  },
  {
    icon: "📩",
    title: "Notificações automáticas",
    desc: "Confirmação por email, lembrete 30 min antes do término e recibo após o pagamento. Tudo automático.",
  },
];

export function Features() {
  return (
    <section id="sobre" className="py-24" style={{ backgroundColor: "#f5f0e8" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: "#321e07" }}>
            Por que escolher o VDO HUB
          </span>
          <h2 className="text-4xl font-bold mt-2 mb-4" style={{ color: "#321e07" }}>
            Tudo o que você precisa,{" "}
            <span style={{ color: "#8b6a3e" }}>sem complicação</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#6b5a45" }}>
            Do agendamento ao acesso, tudo automatizado para você focar no que realmente importa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              style={{ borderColor: "#e8ddd0" }}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#321e07" }}>{f.title}</h3>
              <p className="leading-relaxed text-sm" style={{ color: "#6b5a45" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
