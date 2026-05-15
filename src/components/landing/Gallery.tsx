"use client";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const amenities = [
  { icon: "—", label: "Ar-condicionado" },
  { icon: "—", label: "Wi-Fi de alta velocidade" },
  { icon: "—", label: "Frigobar" },
  { icon: "—", label: "Tomadas e USB" },
  { icon: "—", label: "Iluminacao profissional" },
  { icon: "—", label: "Acesso facial 24h" },
];

const photos = [
  { id: 1, label: "Vista geral", span: "col-span-2 row-span-2" },
  { id: 2, label: "Mesa de reuniao" },
  { id: 3, label: "Ambiente" },
  { id: 4, label: "Detalhes" },
  { id: 5, label: "Comodidades" },
];

function PhotoPlaceholder({ label, className }: { label: string; className?: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden ${className ?? "aspect-square"}`}
      style={{
        background: "linear-gradient(135deg, rgba(50,30,7,0.8) 0%, rgba(20,12,4,0.9) 100%)",
        border: "1px solid rgba(215,203,181,0.08)",
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.01 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(215,203,181,0.06) 0%, transparent 70%)" }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(215,203,181,0.06)", border: "1px solid rgba(215,203,181,0.1)" }}
        >
          <span className="text-xs font-bold" style={{ color: "rgba(215,203,181,0.3)" }}>IMG</span>
        </div>
        <p className="text-xs" style={{ color: "rgba(215,203,181,0.25)" }}>{label}</p>
        <p className="text-xs" style={{ color: "rgba(215,203,181,0.15)" }}>Em breve</p>
      </div>
    </motion.div>
  );
}

export function Gallery() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="espaco" className="py-32 relative" style={{ background: "#0c0704" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.06), transparent)" }} />

      <div className="max-w-6xl mx-auto px-6">
        <div ref={ref} className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "rgba(215,203,181,0.3)" }}
          >
            O espaco
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "#d7cbb5" }}
          >
            Conhea a sala.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base max-w-lg mx-auto"
            style={{ color: "rgba(215,203,181,0.4)" }}
          >
            Ambiente moderno, climatizado e equipado para reunioes, atendimentos e trabalho concentrado.
            Galeria completa em breve.
          </motion.p>
        </div>

        {/* Grid de fotos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12"
        >
          <div className="col-span-2 row-span-2">
            <PhotoPlaceholder label="Vista geral da sala" className="aspect-[4/3]" />
          </div>
          {photos.slice(1).map((p) => (
            <PhotoPlaceholder key={p.id} label={p.label} />
          ))}
        </motion.div>

        {/* Amenidades */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {amenities.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.06 }}
              className="rounded-xl p-4 text-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(215,203,181,0.07)",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "rgba(215,203,181,0.5)" }}>{a.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
