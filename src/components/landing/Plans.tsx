"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const plans = [
  {
    name: "HUB ONE",
    tag: null,
    periods: 1,
    validity: "1 mês",
    price: 300,
    installments: "3x de R$ 100,00",
    economy: null,
    highlight: false,
  },
  {
    name: "HUB FIVE",
    tag: null,
    periods: 5,
    validity: "6 meses",
    price: 1200,
    installments: "10x de R$ 120,00",
    economy: "Economia de R$ 300",
    highlight: false,
  },
  {
    name: "HUB TEN",
    tag: "Mais popular",
    periods: 10,
    validity: "8 meses",
    price: 2200,
    installments: "10x de R$ 220,00",
    economy: "Economia de R$ 400",
    highlight: true,
  },
  {
    name: "HUB PARTNER",
    tag: null,
    periods: 15,
    validity: "12 meses",
    price: 3000,
    installments: "10x de R$ 300,00",
    economy: "Economia de R$ 500",
    highlight: false,
  },
];

export function Plans() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="planos" className="py-24 sm:py-32 relative" style={{ background: "#0c0704" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.06), transparent)" }} />

      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(215,203,181,0.04) 0%, transparent 70%)", filter: "blur(40px)" }}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div ref={ref} className="text-center mb-14 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "rgba(215,203,181,0.3)" }}
          >
            Planos de assinatura
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "#d7cbb5" }}
          >
            Escolha seu plano.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base max-w-md mx-auto"
            style={{ color: "rgba(215,203,181,0.4)" }}
          >
            Cada período equivale a <strong style={{ color: "rgba(215,203,181,0.65)" }}>5 horas</strong> de uso.
            Matutino (08h–13h) ou vespertino (14h–19h). Pagamento via cartão.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative rounded-2xl p-5 sm:p-6 flex flex-col overflow-hidden group"
              style={plan.highlight ? {
                background: "rgba(215,203,181,0.07)",
                border: "1px solid rgba(215,203,181,0.18)",
                boxShadow: "0 0 60px rgba(215,203,181,0.06), inset 0 1px 0 rgba(215,203,181,0.1)",
              } : {
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(215,203,181,0.07)",
              }}
            >
              {plan.highlight && (
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.4), transparent)" }}
                />
              )}

              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(215,203,181,0.04) 0%, transparent 60%)" }}
              />

              {plan.tag ? (
                <div
                  className="inline-flex self-start mb-5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide"
                  style={{ background: "rgba(215,203,181,0.1)", color: "#d7cbb5", border: "1px solid rgba(215,203,181,0.15)" }}
                >
                  {plan.tag}
                </div>
              ) : (
                <div className="mb-10" />
              )}

              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "rgba(215,203,181,0.3)" }}>
                {plan.name}
              </p>

              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1" style={{ color: "#d7cbb5" }}>
                R${plan.price.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs mb-6" style={{ color: "rgba(215,203,181,0.35)" }}>
                ou {plan.installments} sem juros
              </p>

              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{ background: "rgba(215,203,181,0.3)" }} />
                  <span className="text-sm" style={{ color: "rgba(215,203,181,0.55)" }}>
                    {plan.periods} período{plan.periods > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{ background: "rgba(215,203,181,0.3)" }} />
                  <span className="text-sm" style={{ color: "rgba(215,203,181,0.55)" }}>Validade: {plan.validity}</span>
                </div>
                {plan.economy && (
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full" style={{ background: "#4ade80" }} />
                    <span className="text-sm" style={{ color: "rgba(74,222,128,0.7)" }}>{plan.economy}</span>
                  </div>
                )}
              </div>

              <motion.button
                onClick={() => document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-auto w-full py-3 rounded-xl text-sm font-semibold"
                style={plan.highlight ? {
                  background: "#d7cbb5",
                  color: "#321e07",
                } : {
                  background: "rgba(215,203,181,0.07)",
                  color: "rgba(215,203,181,0.7)",
                  border: "1px solid rgba(215,203,181,0.1)",
                }}
                whileHover={plan.highlight
                  ? { boxShadow: "0 0 24px rgba(215,203,181,0.2)" }
                  : { background: "rgba(215,203,181,0.12)" }
                }
                whileTap={{ scale: 0.97 }}
              >
                Escolher plano
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-xs mt-8"
          style={{ color: "rgba(215,203,181,0.25)" }}
        >
          Os benefícios são válidos durante o período de vigência do plano contratado.
          Itens consumidos do frigobar serão cobrados à parte.
        </motion.p>
      </div>
    </section>
  );
}
