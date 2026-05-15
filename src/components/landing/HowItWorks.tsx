"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Escolha o período",
    desc: "Selecione o dia e o período — matutino (08h–13h) ou vespertino (14h–19h). Disponibilidade em tempo real, sem conflitos.",
    detail: "Apenas dias úteis",
  },
  {
    number: "02",
    title: "Pague no cartão",
    desc: "Parcele em até 10x sem juros conforme o plano. A confirmação é automática após o processamento.",
    detail: "Cartão de crédito",
  },
  {
    number: "03",
    title: "Cadastre seu rosto",
    desc: "Receba um link por e-mail para cadastrar sua foto pelo celular. O sistema biométrico é configurado automaticamente.",
    detail: "Reconhecimento facial",
  },
  {
    number: "04",
    title: "Acesse a sala",
    desc: "No horário reservado, aproxime o rosto da fechadura e a porta abre. Acesso revogado automaticamente ao encerrar.",
    detail: "Acesso automatizado",
  },
];

const periods = [
  { label: "Período Matutino", time: "08h00 às 13h00", note: "Tolerância de 15 min após o encerramento" },
  { label: "Período Vespertino", time: "14h00 às 19h00", note: "Intervalo das 13h às 14h para manutenção" },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className="relative group"
    >
      <div
        className="rounded-2xl p-5 sm:p-6 h-full relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(215,203,181,0.07)",
        }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: "radial-gradient(circle at 0% 0%, rgba(215,203,181,0.05) 0%, transparent 60%)" }}
        />

        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex-shrink-0 text-xs font-black tracking-widest tabular-nums"
            style={{ color: "rgba(215,203,181,0.15)", fontSize: "11px" }}
          >
            {step.number}
          </div>
          <div
            className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs"
            style={{ background: "rgba(215,203,181,0.06)", color: "rgba(215,203,181,0.35)", border: "1px solid rgba(215,203,181,0.08)" }}
          >
            {step.detail}
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold mb-2 leading-snug" style={{ color: "#d7cbb5" }}>{step.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(215,203,181,0.45)" }}>{step.desc}</p>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="como-funciona" className="py-24 sm:py-32 relative" style={{ background: "#0c0704" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.06), transparent)" }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div ref={ref} className="text-center mb-14 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "rgba(215,203,181,0.3)" }}
          >
            Processo
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "#d7cbb5" }}
          >
            Como funciona.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base max-w-md mx-auto"
            style={{ color: "rgba(215,203,181,0.4)" }}
          >
            Do agendamento ao acesso em 4 etapas. Tudo automatizado.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-16">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
        >
          {periods.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl p-5 sm:p-6 relative overflow-hidden group"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(215,203,181,0.07)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(215,203,181,0.04) 0%, transparent 60%)" }}
              />
              <div
                className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.15), transparent)" }}
              />
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(215,203,181,0.3)" }}>
                {p.label}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#d7cbb5" }}>{p.time}</p>
              <p className="text-sm" style={{ color: "rgba(215,203,181,0.4)" }}>{p.note}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
