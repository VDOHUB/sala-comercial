const steps = [
  {
    number: "01",
    title: "Escolha o período",
    desc: "Selecione o dia e o período — matutino (08h–13h) ou vespertino (14h–19h). Disponibilidade em tempo real.",
    icon: "📅",
  },
  {
    number: "02",
    title: "Pague no cartão",
    desc: "Parcelamento em até 10x sem juros conforme o plano. A confirmação é automática.",
    icon: "💳",
  },
  {
    number: "03",
    title: "Cadastre seu rosto",
    desc: "Você recebe um link por email para cadastrar sua foto pelo celular. Simples e rápido.",
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
    <section id="como-funciona" className="py-24" style={{ backgroundColor: "#321e07" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: "rgba(215,203,181,0.6)" }}>
            Processo simples
          </span>
          <h2 className="text-4xl font-bold mt-2 mb-4" style={{ color: "#d7cbb5" }}>
            Como funciona
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(215,203,181,0.6)" }}>
            Do agendamento ao acesso em 4 passos simples.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {i < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-7 left-full h-px z-0"
                  style={{ width: "calc(100% - 3rem)", backgroundColor: "rgba(215,203,181,0.15)" }}
                />
              )}

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                    style={{ backgroundColor: "rgba(215,203,181,0.12)", border: "1px solid rgba(215,203,181,0.2)" }}
                  >
                    {step.icon}
                  </div>
                  <span className="text-3xl font-bold" style={{ color: "rgba(215,203,181,0.25)" }}>
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#d7cbb5" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(215,203,181,0.55)" }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Horários */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-6 border"
            style={{ backgroundColor: "rgba(215,203,181,0.06)", borderColor: "rgba(215,203,181,0.12)" }}
          >
            <h4 className="font-bold mb-3 text-lg" style={{ color: "#d7cbb5" }}>🌅 Período Matutino</h4>
            <p className="font-bold text-2xl mb-1" style={{ color: "white" }}>08h00 às 13h00</p>
            <p className="text-sm" style={{ color: "rgba(215,203,181,0.55)" }}>
              Tolerância de 15 min após o encerramento. Ultrapassando, consome outro período.
            </p>
          </div>
          <div
            className="rounded-2xl p-6 border"
            style={{ backgroundColor: "rgba(215,203,181,0.06)", borderColor: "rgba(215,203,181,0.12)" }}
          >
            <h4 className="font-bold mb-3 text-lg" style={{ color: "#d7cbb5" }}>🌇 Período Vespertino</h4>
            <p className="font-bold text-2xl mb-1" style={{ color: "white" }}>14h00 às 19h00</p>
            <p className="text-sm" style={{ color: "rgba(215,203,181,0.55)" }}>
              Intervalo de 13h às 14h para manutenção e preparo da sala.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
