"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "Planos", id: "planos" },
  { label: "Espaço", id: "espaco" },
  { label: "Como funciona", id: "como-funciona" },
  { label: "Contato", id: "contato" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div
        className="transition-all duration-500"
        style={{
          background: scrolled
            ? "rgba(12, 7, 4, 0.85)"
            : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(215,203,181,0.06)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div
              className="relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(215,203,181,0.1)", border: "1px solid rgba(215,203,181,0.15)" }}
            >
              <span className="text-[10px] font-bold tracking-wider" style={{ color: "#d7cbb5" }}>VDO</span>
            </div>
            <span className="font-semibold text-base tracking-tight" style={{ color: "#d7cbb5" }}>
              VDO HUB
            </span>
          </motion.div>

          {/* Nav links desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <motion.button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm font-medium transition-colors relative group"
                style={{ color: "rgba(215,203,181,0.55)" }}
                whileHover={{ color: "#d7cbb5" }}
              >
                {link.label}
                <span
                  className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                  style={{ background: "rgba(215,203,181,0.3)" }}
                />
              </motion.button>
            ))}
          </nav>

          {/* CTA */}
          <motion.button
            onClick={() => scrollTo("reservar")}
            className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold relative overflow-hidden"
            style={{
              background: "rgba(215,203,181,0.1)",
              border: "1px solid rgba(215,203,181,0.15)",
              color: "#d7cbb5",
            }}
            whileHover={{ scale: 1.03, background: "rgba(215,203,181,0.15)" }}
            whileTap={{ scale: 0.97 }}
          >
            Reservar agora
          </motion.button>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <motion.span
              animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 7 : 0 }}
              className="block w-5 h-px"
              style={{ background: "#d7cbb5" }}
            />
            <motion.span
              animate={{ opacity: mobileOpen ? 0 : 1 }}
              className="block w-5 h-px"
              style={{ background: "#d7cbb5" }}
            />
            <motion.span
              animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -7 : 0 }}
              className="block w-5 h-px"
              style={{ background: "#d7cbb5" }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "rgba(12,7,4,0.95)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(215,203,181,0.08)",
            }}
          >
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4">
              {links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="text-left text-sm font-medium py-2"
                  style={{ color: "rgba(215,203,181,0.7)" }}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => scrollTo("reservar")}
                className="mt-2 px-5 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(215,203,181,0.1)", color: "#d7cbb5", border: "1px solid rgba(215,203,181,0.15)" }}
              >
                Reservar agora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
