"use client";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Fundo marrom escuro com textura sutil */}
      <div className="absolute inset-0" style={{ backgroundColor: "#321e07" }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #d7cbb5 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* Círculo decorativo */}
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
        style={{ backgroundColor: "#d7cbb5", transform: "translate(30%, -50%)" }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <span
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border"
          style={{ backgroundColor: "rgba(215,203,181,0.15)", borderColor: "rgba(215,203,181,0.3)", color: "#d7cbb5" }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#d7cbb5" }} />
          Sala disponível — Anápolis, GO
        </span>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ color: "#d7cbb5" }}>
          Seu espaço de trabalho{" "}
          <span style={{ color: "white" }}>profissional</span>
        </h1>

        <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "rgba(215,203,181,0.75)" }}>
          Aluguel de sala por período. Acesso por reconhecimento facial,
          pagamento no cartão e reserva em minutos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ backgroundColor: "#d7cbb5", color: "#321e07" }}
          >
            Reservar agora
          </button>
          <button
            onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-4 rounded-2xl text-base font-bold transition-all border hover:bg-white/5"
            style={{ borderColor: "rgba(215,203,181,0.3)", color: "#d7cbb5" }}
          >
            Ver planos
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-16 text-sm" style={{ color: "rgba(215,203,181,0.6)" }}>
          {[
            { icon: "🔐", text: "Acesso facial" },
            { icon: "💳", text: "Cartão em até 10x" },
            { icon: "⚡", text: "Confirmação imediata" },
            { icon: "📅", text: "Seg a Sex" },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-2">
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full flex justify-center pt-2 border-2" style={{ borderColor: "rgba(215,203,181,0.3)" }}>
          <div className="w-1 h-3 rounded-full" style={{ backgroundColor: "rgba(215,203,181,0.5)" }} />
        </div>
      </div>
    </section>
  );
}
