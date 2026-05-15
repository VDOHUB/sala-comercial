"use client";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imagem de fundo — substituir src quando receber as fotos */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900">
        {/* Placeholder da foto hero — trocar por:
            <Image src="/images/hero.jpg" alt="Sala Comercial" fill className="object-cover" />
            e adicionar overlay: <div className="absolute inset-0 bg-black/50" />
        */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Sala disponível agora
        </span>

        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Seu espaço de trabalho{" "}
          <span className="text-emerald-400">profissional</span>
        </h1>

        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Sala comercial equipada, com acesso por reconhecimento facial,
          pagamento online e reserva em minutos. Simples assim.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" })}
          >
            Reservar agora
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => document.getElementById("espaco")?.scrollIntoView({ behavior: "smooth" })}
          >
            Conhecer o espaço
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-16 text-gray-400 text-sm">
          {[
            { icon: "🔐", text: "Acesso por facial" },
            { icon: "💳", text: "PIX ou cartão" },
            { icon: "⚡", text: "Confirmação imediata" },
            { icon: "📅", text: "Reserve em minutos" },
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
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
