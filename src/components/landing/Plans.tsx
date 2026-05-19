"use client";
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { DEFAULT_PLANS, type Plan } from "@/lib/plans";

// Visual metadata per plan key (stays static)
const PLAN_META: Record<string, { tag: string | null; economy: string | null; highlight: boolean }> = {
  HUB_ONE:     { tag: null,           economy: null,                highlight: false },
  HUB_FIVE:    { tag: null,           economy: "Economia de R$ 300", highlight: false },
  HUB_TEN:     { tag: "Mais popular", economy: "Economia de R$ 400", highlight: true  },
  HUB_PARTNER: { tag: null,           economy: "Economia de R$ 500", highlight: false },
};

export function Plans() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);

  useEffect(() => {
    fetch("/api/plans").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setPlans(data);
    }).catch(() => {});
  }, []);

  return (
    <section id="planos" className="py-24 sm:py-32 relative" style={{ background: "#f5f0e8" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(26,14,5,0.08), transparent)" }} />

      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(139,106,62,0.07) 0%, transparent 70%)", filter: "blur(40px)" }}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div ref={ref} className="text-center mb-14 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "rgba(26,14,5,0.3)" }}
          >
            Planos de assinatura
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "#1a0e05" }}
          >
            Escolha seu plano.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base max-w-md mx-auto"
            style={{ color: "rgba(26,14,5,0.6)" }}
          >
            Cada período equivale a <strong style={{ color: "rgba(26,14,5,0.7)" }}>5 horas</strong> de uso.
            Matutino (08h–13h) ou vespertino (14h–19h). Pagamento via cartão.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {plans.map((plan, i) => {
            const meta = PLAN_META[plan.key] ?? { tag: null, economy: null, highlight: false };
            return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative rounded-2xl p-5 sm:p-6 flex flex-col overflow-hidden group"
              style={meta.highlight ? {
                background: "#1a0e05",
                border: "1px solid rgba(26,14,5,0.8)",
                boxShadow: "0 20px 60px rgba(26,14,5,0.18), inset 0 1px 0 rgba(215,203,181,0.08)",
              } : {
                background: "rgba(26,14,5,0.04)",
                border: "1px solid rgba(26,14,5,0.07)",
              }}
            >
              {meta.highlight && (
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.35), transparent)" }}
                />
              )}

              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{ background: meta.highlight
                  ? "radial-gradient(circle at 50% 0%, rgba(215,203,181,0.05) 0%, transparent 60%)"
                  : "radial-gradient(circle at 50% 0%, rgba(26,14,5,0.04) 0%, transparent 60%)"
                }}
              />

              {meta.tag ? (
                <div
                  className="inline-flex self-start mb-5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide"
                  style={meta.highlight
                    ? { background: "rgba(215,203,181,0.12)", color: "#d7cbb5", border: "1px solid rgba(215,203,181,0.18)" }
                    : { background: "rgba(26,14,5,0.07)", color: "#1a0e05", border: "1px solid rgba(26,14,5,0.1)" }
                  }
                >
                  {meta.tag}
                </div>
              ) : (
                <div className="mb-10" />
              )}

              <p className="text-xs font-semibold tracking-widest uppercase mb-4"
                style={{ color: meta.highlight ? "rgba(215,203,181,0.35)" : "rgba(26,14,5,0.28)" }}>
                {plan.key.replace("_", " ")}
              </p>

              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1"
                style={{ color: meta.highlight ? "#d7cbb5" : "#1a0e05" }}>
                R${plan.price.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs mb-6"
                style={{ color: meta.highlight ? "rgba(215,203,181,0.35)" : "rgba(26,14,5,0.38)" }}>
                {plan.installments} sem juros
              </p>

              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{ background: meta.highlight ? "rgba(215,203,181,0.3)" : "rgba(26,14,5,0.25)" }} />
                  <span className="text-sm" style={{ color: meta.highlight ? "rgba(215,203,181,0.6)" : "rgba(26,14,5,0.55)" }}>
                    {plan.credits} período{plan.credits > 1 ? "s" : ""}
                  </span>
                </div>
                {plan.validityMonths && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{ background: meta.highlight ? "rgba(215,203,181,0.3)" : "rgba(26,14,5,0.25)" }} />
                  <span className="text-sm" style={{ color: meta.highlight ? "rgba(215,203,181,0.6)" : "rgba(26,14,5,0.55)" }}>
                    Validade: {plan.validityMonths} meses
                  </span>
                </div>
                )}
                {meta.economy && (
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full" style={{ background: "#4ade80" }} />
                    <span className="text-sm" style={{ color: "rgba(74,222,128,0.8)" }}>{meta.economy}</span>
                  </div>
                )}
              </div>

              <motion.button
                onClick={() => document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-auto w-full py-3 rounded-xl text-sm font-semibold"
                style={meta.highlight ? {
                  background: "#d7cbb5",
                  color: "#1a0e05",
                } : {
                  background: "rgba(26,14,5,0.07)",
                  color: "rgba(26,14,5,0.65)",
                  border: "1px solid rgba(26,14,5,0.1)",
                }}
                whileHover={meta.highlight
                  ? { boxShadow: "0 0 24px rgba(215,203,181,0.3)" }
                  : { background: "rgba(26,14,5,0.11)" }
                }
                whileTap={{ scale: 0.97 }}
              >
                Escolher plano
              </motion.button>
            </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-xs mt-8"
          style={{ color: "rgba(26,14,5,0.45)" }}
        >
          Os benefícios são válidos durante o período de vigência do plano contratado.
          Itens consumidos do frigobar (café incluso) serão cobrados à parte conforme consumo.
        </motion.p>
      </div>
    </section>
  );
}
