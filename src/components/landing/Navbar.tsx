"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

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
        scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — substituir por <Image> quando receber o arquivo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">VO</span>
          </div>
          <span className={`font-bold text-lg transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
            Viver de Obra
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {["Sobre", "Espaço", "Como funciona", "Contato"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className={`text-sm font-medium transition-colors hover:text-emerald-500 ${
                scrolled ? "text-gray-600" : "text-white/90"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <Button
          size="sm"
          onClick={() => document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" })}
        >
          Reservar agora
        </Button>
      </div>
    </header>
  );
}
