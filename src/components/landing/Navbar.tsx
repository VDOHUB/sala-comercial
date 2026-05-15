"use client";
import { useState, useEffect } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-sm" : ""
      }`}
      style={{ backgroundColor: scrolled ? "#f5f0e8" : "transparent" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#d7cbb5" }}
          >
            <span className="font-bold text-xs" style={{ color: "#321e07" }}>VDO</span>
          </div>
          <span
            className={`font-bold text-lg transition-colors`}
            style={{ color: scrolled ? "#321e07" : "white" }}
          >
            VDO HUB
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "Planos", id: "planos" },
            { label: "Espaço", id: "espaco" },
            { label: "Como funciona", id: "como-funciona" },
            { label: "Contato", id: "contato" },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm font-medium transition-colors"
              style={{ color: scrolled ? "#321e07" : "rgba(255,255,255,0.85)" }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          onClick={() => document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" })}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: "#321e07", color: "#d7cbb5" }}
        >
          Reservar agora
        </button>
      </div>
    </header>
  );
}
