"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { roomPhotos } from "@/config/gallery";

const amenities = [
  "Ar-condicionado",
  "Wi-Fi de alta velocidade",
  "Frigobar",
  "Tomadas e USB",
  "Iluminação profissional",
  "Acesso facial",
];

// As fotos vêm de src/config/gallery.ts — edite lá para adicionar mais

export function Gallery() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((i) => (i + 1) % roomPhotos.length), 3800);
    return () => clearInterval(t);
  }, [paused]);

  const current = roomPhotos[active];

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

        {/* Slideshow */}
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
            {/* Slides */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              >
                {/* Gradiente fallback */}
                <div className="absolute inset-0" style={{ background: current.fallback }} />

                {/* Foto real — sobrepõe quando o arquivo existir */}
                <Image
                  src={current.src}
                  alt={current.label}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1152px"
                  priority={active === 0}
                  onError={() => {/* foto ausente: gradiente fica visível */}}
                />
              </motion.div>
            </AnimatePresence>

            {/* Overlay de legibilidade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(8,4,2,0.5) 0%, transparent 50%)" }}
            />

            {/* Label da foto */}
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
                {active + 1} / {roomPhotos.length}
              </span>
            </div>

            {/* Dots */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {roomPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setPaused(true); }}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === active ? 24 : 6,
                    height: 6,
                    background: i === active ? "rgba(215,203,181,0.85)" : "rgba(215,203,181,0.25)",
                  }}
                />
              ))}
            </div>

            {/* Seta esquerda */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "rgba(12,7,4,0.4)",
                border: "1px solid rgba(215,203,181,0.1)",
                backdropFilter: "blur(8px)",
              }}
              onClick={() => { setActive((i) => (i - 1 + photos.length) % photos.length); setPaused(true); }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8.5 2.5L4.5 7l4 4.5" stroke="rgba(215,203,181,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Seta direita */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "rgba(12,7,4,0.4)",
                border: "1px solid rgba(215,203,181,0.1)",
                backdropFilter: "blur(8px)",
              }}
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
