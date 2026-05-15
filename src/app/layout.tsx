import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VDO HUB — Aluguel de Sala por Assinatura",
  description: "Espaço premium com acesso por reconhecimento facial, reserva online e automação completa. Anápolis, GO.",
  openGraph: {
    title: "VDO HUB — Aluguel de Sala por Assinatura",
    description: "Reserve sua sala. Acesso facial, pagamento online, confirmação imediata.",
    url: "https://viverdeobra.com",
    siteName: "VDO HUB",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-[#0c0704]">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
