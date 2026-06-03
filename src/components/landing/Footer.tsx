"use client";
import { motion } from "framer-motion";

const links = [
  { label: "Planos", id: "planos" },
  { label: "O espaço", id: "espaco" },
  { label: "Como funciona", id: "como-funciona" },
  { label: "Reservar", id: "reservar" },
];

const contact = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
    label: "viverdeobrahub@gmail.com",
    href: "mailto:viverdeobrahub@gmail.com",
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    label: "(62) 99633-2257",
    href: "https://wa.me/5562996332257",
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
      </svg>
    ),
    label: "@vdohub_",
    href: "https://instagram.com/vdohub_",
  },
];

export function Footer() {
  return (
    <footer id="contato" className="relative py-14 sm:py-16 overflow-hidden" style={{ background: "#0c0704" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.08), transparent)" }} />

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
            <p className="text-xs" style={{ color: "rgba(215,203,181,0.22)" }}>
              Seg — Sex · 08h00–13h00 · 14h00–19h00
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "rgba(215,203,181,0.22)" }}>
              Navegação
            </p>
            <ul className="space-y-3">
              {links.map((l) => (
                <li key={l.id}>
                  <motion.a
                    href={`#${l.id}`}
                    className="text-sm transition-colors"
                    style={{ color: "rgba(215,203,181,0.38)" }}
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
            <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "rgba(215,203,181,0.22)" }}>
              Contato
            </p>
            <ul className="space-y-3 mb-5">
              {contact.map((c) => (
                <li key={c.label}>
                  <motion.a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm transition-colors group"
                    style={{ color: "rgba(215,203,181,0.38)" }}
                    whileHover={{ color: "#d7cbb5", x: 2 }}
                  >
                    <span style={{ color: "rgba(215,203,181,0.3)" }} className="group-hover:text-[#d7cbb5] transition-colors flex-shrink-0">
                      {c.icon}
                    </span>
                    {c.label}
                  </motion.a>
                </li>
              ))}
            </ul>
            <motion.a
              href="https://maps.google.com/?q=Galeria+Nazir+Av+São+Francisco+de+Assis+181+Anápolis+GO"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 group"
              whileHover={{ x: 2 }}
            >
              <span className="flex-shrink-0 mt-0.5 transition-colors" style={{ color: "rgba(215,203,181,0.3)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </span>
              <p className="text-xs leading-relaxed transition-colors" style={{ color: "rgba(215,203,181,0.22)" }}>
                Galeria Nazir — Av. São Francisco de Assis, 181<br />
                2º piso, sala 03 · Jundiaí, Anápolis - GO<br />
                CEP 75110-810
              </p>
            </motion.a>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-xs"
          style={{ borderTop: "1px solid rgba(215,203,181,0.05)", color: "rgba(215,203,181,0.18)" }}
        >
          <p>© {new Date().getFullYear()} VDO HUB. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <motion.a href="/termos" target="_blank"
              className="transition-colors" style={{ color: "rgba(215,203,181,0.22)" }}
              whileHover={{ color: "rgba(215,203,181,0.5)" }}>
              Termos de uso
            </motion.a>
            <motion.a href="/cancelar"
              className="transition-colors" style={{ color: "rgba(215,203,181,0.22)" }}
              whileHover={{ color: "rgba(215,203,181,0.5)" }}>
              Solicitar cancelamento
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
}
