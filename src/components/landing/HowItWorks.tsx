const steps = [
  {
    number: "01",
    title: "Escolha o horário",
    desc: "Veja a disponibilidade em tempo real e selecione a data e horário que preferir.",
    icon: "📅",
  },
  {
    number: "02",
    title: "Faça o pagamento",
    desc: "Pague via PIX, boleto ou cartão. A confirmação é automática e instantânea.",
    icon: "💳",
  },
  {
    number: "03",
    title: "Cadastre seu rosto",
    desc: "Após o pagamento, você recebe um link para cadastrar sua foto pelo celular.",
    icon: "🤳",
  },
  {
    number: "04",
    title: "Acesse a sala",
    desc: "No horário reservado, aproxime o rosto da fechadura e a porta abre automaticamente.",
    icon: "🚪",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-emerald-950 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
            Processo simples
          </span>
          <h2 className="text-4xl font-bold text-white mt-2 mb-4">
            Como funciona
          </h2>
          <p className="text-emerald-200/70 text-lg max-w-xl mx-auto">
            Do agendamento ao acesso em 4 passos simples.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Linha conectora */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-emerald-700 -translate-y-1/2 z-0" style={{ width: "calc(100% - 3rem)" }} />
              )}

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-600/30">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-bold text-emerald-700">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-emerald-200/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
