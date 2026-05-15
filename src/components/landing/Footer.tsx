export function Footer() {
  return (
    <footer id="contato" className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VO</span>
              </div>
              <span className="text-white font-bold text-lg">Viver de Obra</span>
            </div>
            <p className="text-sm leading-relaxed">
              Sala comercial moderna para reuniões, atendimentos e trabalho profissional.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-sm">
              {["Sobre", "Espaço", "Como funciona", "Reservar"].map((l) => (
                <li key={l}>
                  <a href={`#${l.toLowerCase().replace(" ", "-")}`} className="hover:text-emerald-400 transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li>📧 contato@viverdeobra.com</li>
              <li>📍 Goiânia, GO</li>
              {/* Adicionar WhatsApp, Instagram etc quando receber do cliente */}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} Viver de Obra. Todos os direitos reservados.</p>
          <p>Desenvolvido por Johni Michael · CNPJ 65.002.492/0001-08</p>
        </div>
      </div>
    </footer>
  );
}
