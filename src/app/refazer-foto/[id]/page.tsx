"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function RefazerFotoPage() {
  const { id }       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isSubscription = searchParams.get("type") === "subscription";

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream]             = useState<MediaStream | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError]   = useState("");
  const [loading, setLoading]           = useState(false);
  const [done, setDone]                 = useState(false);
  const [error, setError]               = useState("");

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setCameraError("Não foi possível acessar a câmera. Permita o acesso e tente novamente.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function capturePhoto() {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  }

  function retakePhoto() {
    setPhotoDataUrl(null);
    startCamera();
  }

  async function handleSubmit() {
    if (!photoDataUrl) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/bookings/${id}/facial`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ photoBase64: photoDataUrl, isSubscription }),
      });
      if (!res.ok) { setError("Erro ao salvar foto. Tente novamente."); return; }
      setDone(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0ebe2", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#1a0e05", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#f5f0e8", letterSpacing: 1 }}>VDO</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(26,14,5,0.35)", margin: 0 }}>Sala Comercial · Anápolis, GO</p>
        </div>

        <div style={{ background: "#faf7f2", borderRadius: 20, padding: 28, border: "1px solid rgba(26,14,5,0.08)", boxShadow: "0 4px 24px rgba(26,14,5,0.06)" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20 }}>
                ✓
              </div>
              <h2 style={{ color: "#1a0e05", fontWeight: 800, fontSize: 22, margin: "0 0 8px" }}>Foto atualizada!</h2>
              <p style={{ color: "rgba(26,14,5,0.5)", fontSize: 14, margin: 0 }}>
                Seu cadastro facial foi atualizado com sucesso. Agora você já pode acessar a sala.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ color: "#1a0e05", fontWeight: 800, fontSize: 20, margin: "0 0 6px" }}>
                Atualizar cadastro facial
              </h2>
              <p style={{ color: "rgba(26,14,5,0.5)", fontSize: 13, margin: "0 0 24px" }}>
                Posicione seu rosto centralizado, olhe direto para a câmera e garanta boa iluminação.
              </p>

              {/* Câmera */}
              <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginBottom: 20, aspectRatio: "4/3", background: "#000", border: "1px solid rgba(26,14,5,0.1)" }}>
                {cameraError ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 24 }}>
                    <p style={{ color: "rgba(220,38,38,0.8)", fontSize: 13, textAlign: "center" }}>{cameraError}</p>
                  </div>
                ) : photoDataUrl ? (
                  <img src={photoDataUrl} alt="Foto capturada" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <div style={{
                        width: "45%", paddingTop: "55%",
                        border: "2px solid rgba(255,255,255,0.4)",
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                        borderRadius: "50%",
                      }} />
                    </div>
                  </>
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {error && (
                <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#b91c1c", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                {photoDataUrl ? (
                  <>
                    <button onClick={retakePhoto}
                      style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1px solid rgba(26,14,5,0.12)", background: "transparent", color: "rgba(26,14,5,0.5)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      Tirar outra
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                      style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", background: "#1a0e05", color: "#f5f0e8", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                      {loading ? "Salvando..." : "Usar esta foto"}
                    </button>
                  </>
                ) : (
                  <button onClick={capturePhoto} disabled={!!cameraError}
                    style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "none", background: cameraError ? "rgba(26,14,5,0.08)" : "#1a0e05", color: cameraError ? "rgba(26,14,5,0.3)" : "#f5f0e8", fontWeight: 700, fontSize: 14, cursor: cameraError ? "not-allowed" : "pointer" }}>
                    Capturar foto
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
