export function Footer() {
  return (
    <footer id="contato" className="py-14" style={{ backgroundColor: "#321e07", color: "rgba(215,203,181,0.6)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Marca */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(215,203,181,0.15)" }}
              >
                <span className="font-bold text-xs" style={{ color: "#d7cbb5" }}>VDO</span>
              </div>
              <span className="font-bold text-lg" style={{ color: "#d7cbb5" }}>VDO HUB</span>
            </div>
            <p className="text-sm leading-relaxed mb-3">
              Aluguel de sala comercial por assinatura. Espaço moderno para reuniões, atendimentos e trabalho profissional.
            </p>
            <p className="text-sm">
              <strong style={{ color: "#d7cbb5" }}>Horários:</strong> Seg a Sex<br />
              08h00–13h00 · 14h00–19h00
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: "#d7cbb5" }}>Navegação</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Planos", id: "planos" },
                { label: "Sobre o espaço", id: "sobre" },
                { label: "Como funciona", id: "como-funciona" },
                { label: "Reservar agora", id: "reservar" },
              ].map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    className="transition-colors hover:opacity-100"
                    style={{ color: "rgba(215,203,181,0.6)" }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: "#d7cbb5" }}>Contato</h4>
            <ul className="space-y-3 text-sm">
              <li>✉️ viverdeobrahub@gmail.com</li>
              <li>📞 (62) 99633-2257</li>
              <li>📸 @vdohub_</li>
              <li className="leading-relaxed pt-2">
                📍 Galeria Nazir — Av. São Francisco de Assis, 181<br />
                2º piso, sala 03 · Jundiaí, Anápolis - GO<br />
                CEP 75110-810
              </li>
            </ul>
          </div>
        </div>

        <div
          className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs"
          style={{ borderColor: "rgba(215,203,181,0.12)" }}
        >
          <p>© {new Date().getFullYear()} VDO HUB. Todos os direitos reservados.</p>
          <p>Desenvolvido por Johni Michael · CNPJ 65.002.492/0001-08</p>
        </div>
      </div>
    </footer>
  );
}
