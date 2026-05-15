"use client";
import { motion } from "framer-motion";

const links = [
  { label: "Planos", id: "planos" },
  { label: "O espaço", id: "espaco" },
  { label: "Como funciona", id: "como-funciona" },
  { label: "Reservar", id: "reservar" },
];

const contact = [
  "viverdeobrahub@gmail.com",
  "(62) 99633-2257",
  "@vdohub_",
];

export function Footer() {
  return (
    <footer id="contato" className="relative py-14 sm:py-16 overflow-hidden" style={{ background: "#0c0704" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.06), transparent)" }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 mb-10 sm:mb-12">

          {/* Marca */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(215,203,181,0.07)", border: "1px solid rgba(215,203,181,0.1)" }}
              >
                <span className="text-[9px] font-black tracking-wider" style={{ color: "#d7cbb5" }}>VDO</span>
              </div>
              <span className="font-semibold" style={{ color: "#d7cbb5" }}>VDO HUB</span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(215,203,181,0.35)" }}>
              Aluguel de sala comercial por assinatura. Espaço moderno para reuniões,
              atendimentos e trabalho profissional. Anápolis, GO.
            </p>
            <p className="text-xs" style={{ color: "rgba(215,203,181,0.25)" }}>
              Seg — Sex · 08h00–13h00 · 14h00–19h00
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "rgba(215,203,181,0.25)" }}>
              Navegação
            </p>
            <ul className="space-y-3">
              {links.map((l) => (
                <li key={l.id}>
                  <motion.a
                    href={`#${l.id}`}
                    className="text-sm transition-colors"
                    style={{ color: "rgba(215,203,181,0.4)" }}
                    whileHover={{ color: "#d7cbb5", x: 2 }}
                  >
                    {l.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "rgba(215,203,181,0.25)" }}>
              Contato
            </p>
            <ul className="space-y-3 mb-5">
              {contact.map((c) => (
                <li key={c} className="text-sm" style={{ color: "rgba(215,203,181,0.4)" }}>
                  {c}
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(215,203,181,0.25)" }}>
              Galeria Nazir — Av. São Francisco de Assis, 181<br />
              2º piso, sala 03 · Jundiaí, Anápolis - GO<br />
              CEP 75110-810
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-xs"
          style={{ borderTop: "1px solid rgba(215,203,181,0.05)", color: "rgba(215,203,181,0.2)" }}
        >
          <p>© {new Date().getFullYear()} VDO HUB. Todos os direitos reservados.</p>
          <p>Desenvolvido por Johni Michael · CNPJ 65.002.492/0001-08</p>
        </div>
      </div>
    </footer>
  );
}
