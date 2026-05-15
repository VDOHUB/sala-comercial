import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sala Comercial — Viver de Obra",
  description: "Espaço moderno e equipado para reuniões, atendimentos e trabalho. Reserve online com acesso imediato.",
  openGraph: {
    title: "Sala Comercial — Viver de Obra",
    description: "Reserve sua sala com facilidade. Acesso por reconhecimento facial, pagamento online e confirmação imediata.",
    url: "https://viverdeobra.com",
    siteName: "Viver de Obra",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
