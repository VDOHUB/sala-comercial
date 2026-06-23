import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt         = "VDO HUB — Aluguel de Sala por Assinatura";
export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const photoData = await readFile(path.join(process.cwd(), "public/sala/foto-08.jpeg"));
  const photoBase64 = `data:image/jpeg;base64,${photoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex",
          position: "relative",
        }}
      >
        {/* Foto da sala */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoBase64} width={1200} height={630}
          style={{ objectFit: "cover", width: "100%", height: "100%" }} alt="VDO HUB" />

        {/* Overlay escuro */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(8,4,2,0.7) 0%, rgba(8,4,2,0.2) 60%, transparent 100%)",
          display: "flex",
        }} />

        {/* Texto na parte inferior */}
        <div style={{
          position: "absolute", bottom: 40, left: 60,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: 42, fontWeight: 700, color: "#f5f0e8", display: "flex" }}>
            VDO HUB
          </div>
          <div style={{ fontSize: 22, color: "rgba(215,203,181,0.8)", display: "flex" }}>
            Aluguel de Sala por Assinatura · Anápolis, GO
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
