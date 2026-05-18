"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const amenities = [
  "Ar-condicionado",
  "Wi-Fi de alta velocidade",
  "Frigobar",
  "Tomadas e USB",
  "Iluminação profissional",
  "Acesso facial",
];

// Placeholders até as fotos reais chegarem
// Para usar fotos reais: substitua os gradients por <Image src="..." fill className="object-cover" />
const photos = [
  {
    id: 1,
    label: "Vista geral da sala",
    bg: "linear-gradient(135deg, #3d2010 0%, #5a3822 40%, #2a1608 100%)",
    accent: "radial-gradient(ellipse at 40% 60%, rgba(139,106,62,0.4) 0%, transparent 55%)",
  },
  {
    id: 2,
    label: "Mesa de reunião",
    bg: "linear-gradient(160deg, #1e1108 0%, #3a2412 50%, #4d3218 100%)",
    accent: "radial-gradient(ellipse at 65% 35%, rgba(90,56,34,0.45) 0%, transparent 50%)",
  },
  {
    id: 3,
    label: "Ambiente climatizado",
    bg: "linear-gradient(135deg, #2a1a0a 0%, #4a2e14 45%, #3d2010 100%)",
    accent: "radial-gradient(ellipse at 30% 70%, rgba(100,70,30,0.35) 0%, transparent 55%)",
  },
  {
    id: 4,
    label: "Detalhes da sala",
    bg: "linear-gradient(150deg, #321e07 0%, #1a0e05 50%, #4d3015 100%)",
    accent: "radial-gradient(ellipse at 70% 30%, rgba(139,106,62,0.3) 0%, transparent 50%)",
  },
  {
    id: 5,
    label: "Comodidades",
    bg: "linear-gradient(140deg, #1a0e05 0%, #3a2412 40%, #5a3822 100%)",
    accent: "radial-gradient(ellipse at 50% 50%, rgba(80,50,20,0.4) 0%, transparent 60%)",
  },
];

export function Gallery() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((i) => (i + 1) % photos.length), 3800);
    return () => clearInterval(t);
  }, [paused]);

  const current = photos[active];

  return (
    <section id="espaco" className="py-24 sm:py-32 relative" style={{ background: "#f5f0e8" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(26,14,5,0.08), transparent)" }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div ref={ref} className="text-center mb-14 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "rgba(26,14,5,0.3)" }}
          >
            O espaço
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "#1a0e05" }}
          >
            Conheça a sala.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base max-w-lg mx-auto"
            style={{ color: "rgba(26,14,5,0.45)" }}
          >
            Ambiente moderno, climatizado e equipado para reuniões, atendimentos e trabalho concentrado.
          </motion.p>
        </div>

        {/* Slideshow único */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="mb-8 sm:mb-12"
        >
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              aspectRatio: "16/7",
              border: "1px solid rgba(26,14,5,0.08)",
              boxShadow: "0 20px 60px rgba(26,14,5,0.1)",
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Foto ciclando */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              >
                <div className="absolute inset-0" style={{ background: current.bg }} />
                <div className="absolute inset-0" style={{ background: current.accent }} />
              </motion.div>
            </AnimatePresence>

            {/* Overlay sutil */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(8,4,2,0.5) 0%, transparent 50%)" }}
            />

            {/* Label da foto atual */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`lbl-${current.id}`}
                className="absolute bottom-5 left-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.5 }}
              >
                <span
                  className="text-sm font-medium px-3 py-1.5 rounded-xl"
                  style={{
                    background: "rgba(12,7,4,0.55)",
                    color: "rgba(215,203,181,0.85)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(215,203,181,0.1)",
                  }}
                >
                  {current.label}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Contador */}
            <div className="absolute bottom-5 right-6">
              <span className="text-xs" style={{ color: "rgba(215,203,181,0.4)" }}>
                {active + 1} / {photos.length}
              </span>
            </div>

            {/* Dots navegação */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setPaused(true); }}
                  className="rounded-full transition-all duration-400"
                  style={{
                    width: i === active ? 24 : 6,
                    height: 6,
                    background: i === active ? "rgba(215,203,181,0.85)" : "rgba(215,203,181,0.25)",
                  }}
                />
              ))}
            </div>

            {/* Setas */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(12,7,4,0.4)", border: "1px solid rgba(215,203,181,0.1)", backdropFilter: "blur(8px)" }}
              onClick={() => { setActive((i) => (i - 1 + photos.length) % photos.length); setPaused(true); }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8.5 2.5L4.5 7l4 4.5" stroke="rgba(215,203,181,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(12,7,4,0.4)", border: "1px solid rgba(215,203,181,0.1)", backdropFilter: "blur(8px)" }}
              onClick={() => { setActive((i) => (i + 1) % photos.length); setPaused(true); }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.5 2.5L9.5 7l-4 4.5" stroke="rgba(215,203,181,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Amenidades */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {amenities.map((a, i) => (
            <motion.div
              key={a}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.06 }}
              className="rounded-xl p-3 sm:p-4 text-center"
              style={{
                background: "rgba(26,14,5,0.04)",
                border: "1px solid rgba(26,14,5,0.07)",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "rgba(26,14,5,0.5)" }}>{a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
