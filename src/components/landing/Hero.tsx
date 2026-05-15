"use client";
import { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

function AnimatedOrb({ x, y, size, delay, opacity }: { x: string; y: string; size: number; delay: number; opacity: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x, top: y,
        width: size, height: size,
        background: `radial-gradient(circle, rgba(215,203,181,${opacity}) 0%, transparent 70%)`,
        filter: "blur(60px)",
      }}
      animate={{ scale: [1, 1.15, 1], opacity: [opacity, opacity * 1.5, opacity] }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function GridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" className="opacity-[0.03]">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(215,203,181,1)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 30, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay: i * 0.15, ease: "easeOut" as const },
  };
}

function FloatingDashboard() {
  return (
    <motion.div
      className="animate-float-slow"
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.2, delay: 1.2, ease: "easeOut" }}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(215,203,181,0.12)",
          backdropFilter: "blur(20px)",
          width: 320,
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(215,203,181,0.06), inset 0 1px 0 rgba(215,203,181,0.06)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(215,203,181,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: "rgba(215,203,181,0.5)" }}>VDO HUB — Anápolis</span>
          </div>
          <span className="text-xs" style={{ color: "rgba(215,203,181,0.25)" }}>ao vivo</span>
        </div>

        {/* Status cards */}
        <div className="p-4 space-y-3">
          {[
            { label: "Período Matutino", status: "Disponível", dot: "#4ade80", bar: 0.3 },
            { label: "Período Vespertino", status: "Reservado", dot: "#f59e0b", bar: 0.85 },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-3"
              style={{ background: "rgba(215,203,181,0.04)", border: "1px solid rgba(215,203,181,0.06)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: "rgba(215,203,181,0.7)" }}>{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.dot }} />
                  <span className="text-xs" style={{ color: "rgba(215,203,181,0.45)" }}>{item.status}</span>
                </div>
              </div>
              <div className="h-1 rounded-full" style={{ background: "rgba(215,203,181,0.08)" }}>
                <motion.div
                  className="h-1 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${item.dot}80, ${item.dot})` }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${item.bar * 100}%` }}
                  transition={{ duration: 1.5, delay: 1.8, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}

          {/* Último acesso */}
          <div
            className="rounded-xl p-3"
            style={{ background: "rgba(215,203,181,0.04)", border: "1px solid rgba(215,203,181,0.06)" }}
          >
            <p className="text-xs mb-2 font-medium" style={{ color: "rgba(215,203,181,0.45)" }}>Último acesso</p>
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(215,203,181,0.1)", color: "#d7cbb5" }}
              >
                M
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "rgba(215,203,181,0.8)" }}>Facial reconhecido</p>
                <p className="text-xs" style={{ color: "rgba(215,203,181,0.35)" }}>08:02 — Acesso liberado</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
            </div>
          </div>

          {/* Próxima reserva */}
          <div
            className="rounded-xl px-3 py-2.5 flex items-center justify-between"
            style={{ background: "rgba(215,203,181,0.06)", border: "1px solid rgba(215,203,181,0.1)" }}
          >
            <div>
              <p className="text-xs" style={{ color: "rgba(215,203,181,0.45)" }}>Próxima reserva</p>
              <p className="text-sm font-semibold" style={{ color: "#d7cbb5" }}>14h00 hoje</p>
            </div>
            <div
              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(215,203,181,0.1)", color: "#d7cbb5" }}
            >
              Confirmado
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 30, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 30, damping: 25 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left - rect.width / 2) * 0.015);
      mouseY.set((e.clientY - rect.top - rect.height / 2) * 0.015);
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "#0c0704" }}>

      {/* Background orbs */}
      <AnimatedOrb x="10%" y="20%" size={500} delay={0} opacity={0.06} />
      <AnimatedOrb x="60%" y="60%" size={400} delay={2} opacity={0.04} />
      <AnimatedOrb x="80%" y="10%" size={300} delay={4} opacity={0.05} />

      {/* Grid */}
      <GridLines />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #0c0704 100%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 w-full pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — texto */}
          <div className="text-center lg:text-left">
            <motion.div
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-4 py-2 rounded-full"
              style={{
                background: "rgba(215,203,181,0.06)",
                border: "1px solid rgba(215,203,181,0.1)",
              }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-medium tracking-wide" style={{ color: "rgba(215,203,181,0.6)" }}>
                Anápolis, GO
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(1)}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-5 sm:mb-6 glow-text"
              style={{ color: "#d7cbb5" }}
            >
              Seu espaço.<br />
              <span style={{ color: "rgba(215,203,181,0.35)" }}>Quando você precisar.</span>
            </motion.h1>

            <motion.p
              {...fadeUp(2)}
              className="text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-md mx-auto lg:mx-0"
              style={{ color: "rgba(215,203,181,0.5)" }}
            >
              Aluguel por período com reconhecimento facial, pagamento online e
              automação completa. Do agendamento ao acesso — sem fricção.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(3)}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <motion.button
                onClick={() => document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" })}
                className="px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm font-bold"
                style={{ background: "#d7cbb5", color: "#321e07" }}
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(215,203,181,0.25)" }}
                whileTap={{ scale: 0.97 }}
              >
                Reservar agora
              </motion.button>
              <motion.button
                onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}
                className="px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm font-bold"
                style={{
                  background: "rgba(215,203,181,0.06)",
                  border: "1px solid rgba(215,203,181,0.12)",
                  color: "rgba(215,203,181,0.7)",
                }}
                whileHover={{ scale: 1.03, background: "rgba(215,203,181,0.1)" }}
                whileTap={{ scale: 0.97 }}
              >
                Ver planos
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              {...fadeUp(4)}
              className="flex flex-wrap gap-6 sm:gap-8 mt-10 sm:mt-14 justify-center lg:justify-start"
            >
              {[
                { value: "5h", label: "por período" },
                { value: "10x", label: "sem juros" },
                { value: "Seg–Sex", label: "disponível" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: "#d7cbb5" }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(215,203,181,0.4)" }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — dashboard flutuante (só desktop) */}
          <motion.div
            className="hidden lg:flex justify-center"
            style={{ x: springX, y: springY }}
          >
            <FloatingDashboard />
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #0c0704)" }}
      />
    </section>
  );
}
