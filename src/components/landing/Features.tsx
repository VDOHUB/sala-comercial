"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: "01",
    title: "Agendamento por período",
    desc: "Escolha matutino (08h–13h) ou vespertino (14h–19h) diretamente no site. Disponibilidade em tempo real, sem conflitos.",
  },
  {
    icon: "02",
    title: "Cartão em até 10x",
    desc: "Parcele conforme o plano escolhido. Após a confirmação do pagamento, seu acesso é liberado automaticamente.",
  },
  {
    icon: "03",
    title: "Reconhecimento facial",
    desc: "Cadastre sua foto pelo celular após o pagamento. Na hora de entrar, aproxime o rosto — sem chave, sem código.",
  },
  {
    icon: "04",
    title: "Acesso temporário inteligente",
    desc: "Seu acesso é válido exatamente no período reservado e revogado automaticamente ao encerrar.",
  },
  {
    icon: "05",
    title: "Vouchers e promoções",
    desc: "Cupons exclusivos para parceiros e primeiras visitas, aplicados diretamente no checkout.",
  },
  {
    icon: "06",
    title: "Notificações automáticas",
    desc: "Confirmação por e-mail, lembrete antes do término e recibo após o pagamento. Tudo sem intervenção manual.",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative rounded-2xl p-5 sm:p-6 group cursor-default overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(215,203,181,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(215,203,181,0.06) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.2), transparent)" }}
      />

      <div className="text-xs font-bold tracking-widest mb-5 inline-flex" style={{ color: "rgba(215,203,181,0.2)" }}>
        {feature.icon}
      </div>
      <h3 className="text-base font-semibold mb-2 leading-snug" style={{ color: "#d7cbb5" }}>
        {feature.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(215,203,181,0.45)" }}>
        {feature.desc}
      </p>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="sobre" className="py-24 sm:py-32 relative" style={{ background: "#0c0704" }}>
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
            Por que escolher o VDO HUB
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "#d7cbb5" }}
          >
            Tecnologia que trabalha
            <span className="block" style={{ color: "rgba(215,203,181,0.3)" }}>por você.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg max-w-xl mx-auto"
            style={{ color: "rgba(215,203,181,0.4)" }}
          >
            Do agendamento ao acesso, tudo automatizado para você focar no que realmente importa.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
