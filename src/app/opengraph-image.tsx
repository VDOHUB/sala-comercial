import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt         = "VDO HUB — Aluguel de Sala por Assinatura";
export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const logoData = await readFile(path.join(process.cwd(), "public/logo.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#f5f0e8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo centralizada */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoBase64} width={320} height={320}
          style={{ objectFit: "contain", marginBottom: 16 }} alt="VDO HUB" />

        {/* Subtítulo */}
        <div style={{
          fontSize: 24, color: "rgba(26,14,5,0.4)",
          fontWeight: 400, display: "flex",
        }}>
          Aluguel de Sala por Assinatura · Anápolis, GO
        </div>

        {/* Linha decorativa inferior */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, transparent, rgba(26,14,5,0.15), transparent)",
          display: "flex",
        }} />
      </div>
    ),
    { ...size }
  );
}
