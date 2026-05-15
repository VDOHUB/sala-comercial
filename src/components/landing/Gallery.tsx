// ── Substituir os placeholders pelas fotos reais quando receber ──
// Trocar cada <div className="placeholder"> por:
// <Image src="/images/sala-1.jpg" alt="..." fill className="object-cover" />

const photos = [
  { id: 1, label: "Vista geral da sala" },
  { id: 2, label: "Mesa de trabalho" },
  { id: 3, label: "Iluminação e ambiente" },
  { id: 4, label: "Detalhes do espaço" },
  { id: 5, label: "Frigobar e comodidades" },
];

export function Gallery() {
  return (
    <section id="espaco" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
            O espaço
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
            Conheça a sala
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Ambiente moderno, climatizado e equipado para reuniões, atendimentos e trabalho concentrado.
          </p>
        </div>

        {/* Grid de fotos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Foto principal — ocupa 2 colunas */}
          <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-5xl mb-3">🏢</div>
              <p className="text-sm font-medium">Foto principal da sala</p>
              <p className="text-xs mt-1 opacity-70">Aguardando imagem do cliente</p>
            </div>
          </div>

          {/* Fotos menores */}
          {photos.slice(1).map((photo) => (
            <div
              key={photo.id}
              className="relative rounded-2xl overflow-hidden aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
            >
              <div className="text-center text-gray-400 p-4">
                <div className="text-3xl mb-2">📷</div>
                <p className="text-xs font-medium">{photo.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Amenidades */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "❄️", text: "Ar-condicionado" },
            { icon: "📶", text: "Wi-Fi de alta velocidade" },
            { icon: "🧊", text: "Frigobar" },
            { icon: "🔌", text: "Tomadas e USB" },
          ].map((a) => (
            <div
              key={a.text}
              className="flex items-center gap-3 bg-gray-50 rounded-xl p-4"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm font-medium text-gray-700">{a.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
