"use client";

const plans = [
  {
    name: "HUB ONE",
    periods: 1,
    validity: "1 mês",
    price: 300,
    installments: "3x de R$ 100,00 sem juros",
    highlight: false,
  },
  {
    name: "HUB FIVE",
    periods: 5,
    validity: "6 meses",
    price: 1200,
    installments: "10x de R$ 120,00 sem juros",
    economy: "Economia de R$ 300,00 em relação ao plano base",
    highlight: false,
  },
  {
    name: "HUB TEN",
    periods: 10,
    validity: "8 meses",
    price: 2200,
    installments: "10x de R$ 220,00 sem juros",
    economy: "Economia de R$ 400,00 em relação ao plano base",
    highlight: true,
  },
  {
    name: "HUB PARTNER",
    periods: 15,
    validity: "12 meses",
    price: 3000,
    installments: "10x de R$ 300,00 sem juros",
    economy: "Economia de R$ 500,00 em relação ao plano base",
    highlight: false,
  },
];

export function Plans() {
  return (
    <section id="planos" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-4">
          <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: "#8b6a3e" }}>
            Planos de assinatura
          </span>
          <h2 className="text-4xl font-bold mt-2 mb-4" style={{ color: "#321e07" }}>
            Escolha o seu plano
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#6b5a45" }}>
            Cada período corresponde a <strong>5 horas</strong> de uso —
            período matutino (08h–13h) ou vespertino (14h–19h).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border-2 flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg ${
                plan.highlight ? "shadow-lg" : ""
              }`}
              style={{
                borderColor: plan.highlight ? "#321e07" : "#e8ddd0",
                backgroundColor: plan.highlight ? "#321e07" : "white",
              }}
            >
              {plan.highlight && (
                <span
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full self-start mb-4"
                  style={{ backgroundColor: "#d7cbb5", color: "#321e07" }}
                >
                  Mais popular
                </span>
              )}

              <h3
                className="text-lg font-bold mb-4"
                style={{ color: plan.highlight ? "#d7cbb5" : "#321e07" }}
              >
                {plan.name}
              </h3>

              <ul className="space-y-2 mb-6 text-sm" style={{ color: plan.highlight ? "rgba(215,203,181,0.8)" : "#6b5a45" }}>
                <li>• {plan.periods} período{plan.periods > 1 ? "s" : ""}</li>
                <li>• Validade: {plan.validity}</li>
              </ul>

              <div className="mt-auto">
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: plan.highlight ? "white" : "#321e07" }}
                >
                  R${plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs mb-3" style={{ color: plan.highlight ? "rgba(215,203,181,0.6)" : "#9b8570" }}>
                  ou {plan.installments}
                </p>

                {plan.economy && (
                  <p
                    className="text-xs italic"
                    style={{ color: plan.highlight ? "rgba(215,203,181,0.5)" : "#9b8570" }}
                  >
                    *{plan.economy}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm mt-8" style={{ color: "#9b8570" }}>
          Os benefícios são válidos durante o período de vigência do plano contratado. ♦ Pagamento via cartão de crédito.
        </p>

        <div className="mt-10 text-center">
          <button
            onClick={() => document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" })}
            className="px-10 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ backgroundColor: "#321e07", color: "#d7cbb5" }}
          >
            Quero reservar meu período
          </button>
        </div>
      </div>
    </section>
  );
}
