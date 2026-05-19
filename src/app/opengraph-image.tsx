import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt     = "VDO HUB — Aluguel de Sala por Assinatura";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#1a0e05",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Glow de fundo */}
        <div style={{
          position: "absolute",
          width: 700, height: 500,
          background: "radial-gradient(ellipse, rgba(139,106,62,0.35) 0%, transparent 70%)",
          borderRadius: "50%",
          display: "flex",
        }} />

        {/* Logo badge */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 88, height: 88, borderRadius: 22,
          background: "#f5f0e8", marginBottom: 32,
        }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#1a0e05", letterSpacing: 2 }}>
            VDO
          </span>
        </div>

        {/* Título */}
        <div style={{
          fontSize: 64, fontWeight: 900, color: "#f5f0e8",
          letterSpacing: -1, marginBottom: 16, display: "flex",
        }}>
          VDO HUB
        </div>

        {/* Subtítulo */}
        <div style={{
          fontSize: 26, color: "rgba(245,240,232,0.5)",
          fontWeight: 400, display: "flex",
        }}>
          Aluguel de Sala por Assinatura · Anápolis, GO
        </div>

        {/* Linha decorativa inferior */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 4,
          background: "linear-gradient(90deg, transparent, rgba(245,240,232,0.3), transparent)",
          display: "flex",
        }} />
      </div>
    ),
    { ...size }
  );
}
