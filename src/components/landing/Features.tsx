const features = [
  {
    icon: "📅",
    title: "Agendamento online",
    desc: "Escolha data e horário diretamente no site, com disponibilidade em tempo real. Sem ligações, sem espera.",
  },
  {
    icon: "💳",
    title: "Pagamento facilitado",
    desc: "PIX, boleto ou cartão de crédito. Após a confirmação do pagamento, seu acesso é liberado automaticamente.",
  },
  {
    icon: "🔐",
    title: "Acesso por facial",
    desc: "Cadastro da sua foto feito pelo próprio celular. Na hora de entrar, só aproximar o rosto — sem chave, sem código.",
  },
  {
    icon: "⏱️",
    title: "Acesso temporário",
    desc: "Seu acesso é válido exatamente no período reservado. Ao encerrar, é revogado automaticamente.",
  },
  {
    icon: "🎟️",
    title: "Vouchers e promoções",
    desc: "Receba cupons de desconto para inaugurações, parcerias ou primeiras visitas. Aplicado direto no checkout.",
  },
  {
    icon: "📊",
    title: "Sem burocracia",
    desc: "Tudo digital, tudo automático. Confirmação por email, lembrete antes da reserva e recibo após o pagamento.",
  },
];

export function Features() {
  return (
    <section id="sobre" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
            Por que escolher
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
            Tudo o que você precisa,{" "}
            <span className="text-emerald-600">sem complicação</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Do agendamento ao acesso, tudo automatizado para você focar no que realmente importa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
