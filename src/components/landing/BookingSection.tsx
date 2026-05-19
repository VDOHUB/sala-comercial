"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { format, addDays, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";

const PERIODS = [
  { id: "MORNING",   label: "Matutino",    hours: "08h00 — 13h00", startHour: 8,  endHour: 13 },
  { id: "AFTERNOON", label: "Vespertino",  hours: "14h00 — 19h00", startHour: 14, endHour: 19 },
];

const DAYS = Array.from({ length: 60 }, (_, i) => addDays(new Date(), i + 1))
  .filter((d) => !isWeekend(d))
  .slice(0, 30);

const PLANS: Record<string, { label: string; price: number; installments: string }> = {
  HUB_ONE:     { label: "HUB ONE — 1 período",       price: 300,  installments: "ou 3x R$100" },
  HUB_FIVE:    { label: "HUB FIVE — 5 períodos",     price: 1200, installments: "ou 10x R$120" },
  HUB_TEN:     { label: "HUB TEN — 10 períodos",     price: 2200, installments: "ou 10x R$220" },
  HUB_PARTNER: { label: "HUB PARTNER — 15 períodos", price: 3000, installments: "ou 10x R$300" },
};

const stepVariants: Variants = {
  enter:  { opacity: 0, x: 24, filter: "blur(6px)" },
  center: { opacity: 1, x: 0,  filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
  exit:   { opacity: 0, x: -24, filter: "blur(6px)", transition: { duration: 0.3, ease: "easeIn" } },
};

// ── Sub-componentes estáveis fora do render ───────────────────────

function SelectionCard({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button" onClick={onClick}
      className="relative rounded-xl p-4 text-left w-full overflow-hidden group"
      style={{
        background: selected ? "rgba(215,203,181,0.08)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${selected ? "rgba(215,203,181,0.2)" : "rgba(215,203,181,0.06)"}`,
      }}
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
    >
      {selected && (
        <div className="absolute top-0 left-4 right-4 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(215,203,181,0.3),transparent)" }} />
      )}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 0%,rgba(215,203,181,0.04) 0%,transparent 60%)" }} />
      {children}
    </motion.button>
  );
}

function InputField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wider uppercase mb-2"
        style={{ color: "rgba(215,203,181,0.3)" }}>{label}</label>
      <input
        {...props}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(215,203,181,0.08)", color: "#d7cbb5" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(215,203,181,0.2)"; props.onFocus?.(e); }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(215,203,181,0.08)"; props.onBlur?.(e); }}
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────

// ── Verifica se um período está ocupado ──────────────────────────
type OccupiedSlot = { startAt: string; endAt: string };

function isPeriodOccupied(date: Date, period: typeof PERIODS[0], slots: OccupiedSlot[]) {
  const start = new Date(date); start.setHours(period.startHour, 0, 0, 0);
  const end   = new Date(date); end.setHours(period.endHour,   0, 0, 0);
  return slots.some((s) => {
    const sStart = new Date(s.startAt);
    const sEnd   = new Date(s.endAt);
    return sStart < end && sEnd > start;
  });
}

export function BookingSection() {
  const [step, setStep]               = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate]     = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan]     = useState<string>("HUB_ONE");

  // Slots ocupados (carregados do servidor)
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);

  // Dados pessoais
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "", voucherCode: "" });

  // Voucher resolvido
  const [voucherChecked, setVoucherChecked] = useState(false);
  const [finalAmount, setFinalAmount]       = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherError, setVoucherError]     = useState("");

  // Cartão
  const [card, setCard] = useState({ holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "" });

  // Booking criado
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Facial
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream]         = useState<MediaStream | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError]   = useState("");

  // Loading / error geral
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  const plan   = PLANS[selectedPlan];
  const period = PERIODS.find((p) => p.id === selectedPeriod);

  // Carrega slots ocupados ao montar
  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((slots) => { if (Array.isArray(slots)) setOccupiedSlots(slots); })
      .catch(() => {});
  }, []);

  // ── Câmera ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      setStream(s);
      if (videoRef.current) { videoRef.current.srcObject = s; }
    } catch {
      setCameraError("Não foi possível acessar a câmera. Permita o acesso e tente novamente.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  useEffect(() => {
    if (step === 4 && !photoDataUrl) startCamera();
    return () => { if (step !== 4) stopCamera(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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

  // ── Verificar voucher ─────────────────────────────────────────────
  async function checkVoucher() {
    setVoucherError("");
    if (!form.voucherCode) {
      setFinalAmount(plan.price);
      setDiscountAmount(0);
      setVoucherChecked(true);
      return;
    }
    const res = await fetch(
      `/api/voucher-check?code=${encodeURIComponent(form.voucherCode)}&amount=${plan.price}`
    );
    const data = await res.json();
    if (!data.valid) {
      setVoucherError("Cupom inválido ou expirado.");
      setFinalAmount(plan.price);
      setDiscountAmount(0);
    } else {
      setFinalAmount(data.finalAmount);
      setDiscountAmount(data.discountAmount);
    }
    setVoucherChecked(true);
  }

  async function handleStep2Continue() {
    await checkVoucher();
    setStep(3);
  }

  // ── Criar reserva (step 3) ────────────────────────────────────────
  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !period) return;
    setLoading(true); setError("");

    const startAt = new Date(selectedDate); startAt.setHours(period.startHour, 0, 0, 0);
    const endAt   = new Date(selectedDate); endAt.setHours(period.endHour, 0, 0, 0);
    const isFree  = (finalAmount ?? plan.price) === 0;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startAt:     startAt.toISOString(),
          endAt:       endAt.toISOString(),
          voucherCode: form.voucherCode || undefined,
          card:        isFree ? undefined : card,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao processar."); return; }
      setBookingId(data.bookingId);
      setStep(4);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── Salvar foto e finalizar (step 4) ─────────────────────────────
  async function handleFacialSubmit() {
    if (!photoDataUrl || !bookingId) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/facial`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoBase64: photoDataUrl }),
      });
      if (!res.ok) { setError("Erro ao salvar foto. Tente novamente."); return; }
      setDone(true);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  // ── Utilitários de cartão ─────────────────────────────────────────
  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  const total    = finalAmount ?? plan.price;
  const isFree   = total === 0;
  const steps    = ["Data e período", "Seus dados", "Pagamento", "Cadastro facial"];

  return (
    <section id="reservar" className="py-24 sm:py-32 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#0c0704 0%,#1a0e05 40%,#1f1008 60%,#0c0704 100%)" }}>

      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(215,203,181,0.2),transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(215,203,181,0.1),transparent)" }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: 900, height: 600,
          background: "radial-gradient(ellipse,rgba(139,106,62,0.18) 0%,rgba(215,203,181,0.06) 40%,transparent 70%)",
          filter: "blur(40px)" }} />

      <div className="max-w-2xl mx-auto px-5 sm:px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "rgba(215,203,181,0.3)" }}>Reserve agora</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "#d7cbb5" }}>Seu período.</h2>
          <p className="text-base" style={{ color: "rgba(215,203,181,0.4)" }}>
            Disponibilidade em tempo real. Confirmação instantânea.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {steps.map((label, i) => {
            const n = i + 1;
            const active = step >= n;
            return (
              <div key={n} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: active ? "rgba(215,203,181,0.15)" : "rgba(215,203,181,0.04)",
                      border: `1px solid ${active ? "rgba(215,203,181,0.2)" : "rgba(215,203,181,0.06)"}`,
                      color: active ? "#d7cbb5" : "rgba(215,203,181,0.25)",
                    }}>{n}</div>
                  <span className="text-xs font-medium hidden sm:block"
                    style={{ color: active ? "rgba(215,203,181,0.6)" : "rgba(215,203,181,0.2)" }}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="h-px w-4" style={{ background: step > n ? "rgba(215,203,181,0.15)" : "rgba(215,203,181,0.05)" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card container */}
        <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(215,203,181,0.14)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 0 1px rgba(215,203,181,0.04),0 40px 80px rgba(0,0,0,0.5),0 0 60px rgba(139,106,62,0.08)",
          }}>
          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(215,203,181,0.25),transparent)" }} />

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Data / Período / Plano ── */}
            {step === 1 && (
              <motion.div key="s1" variants={stepVariants} initial="enter" animate="center" exit="exit">
                <p className="text-xs font-semibold tracking-widest uppercase mb-5"
                  style={{ color: "rgba(215,203,181,0.3)" }}>01 / Selecione o dia</p>

                <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
                  {DAYS.map((day) => {
                    const sel      = selectedDate && format(day,"yyyy-MM-dd") === format(selectedDate,"yyyy-MM-dd");
                    const fullDay  = PERIODS.every((p) => isPeriodOccupied(day, p, occupiedSlots));
                    return (
                      <motion.button key={day.toISOString()} type="button"
                        disabled={fullDay}
                        onClick={() => { setSelectedDate(day); setSelectedPeriod(null); }}
                        className="flex-shrink-0 flex flex-col items-center py-3 px-2 rounded-xl w-12 transition-all"
                        style={{
                          background: fullDay ? "rgba(255,255,255,0.01)" : sel ? "rgba(215,203,181,0.1)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${fullDay ? "rgba(215,203,181,0.03)" : sel ? "rgba(215,203,181,0.2)" : "rgba(215,203,181,0.06)"}`,
                          opacity: fullDay ? 0.35 : 1,
                          cursor: fullDay ? "not-allowed" : "pointer",
                        }}
                        whileHover={!fullDay ? { scale: 1.05 } : {}}
                        whileTap={!fullDay ? { scale: 0.95 } : {}}>
                        <span className="text-xs" style={{ color: "rgba(215,203,181,0.35)" }}>
                          {format(day,"EEE",{locale:ptBR})}
                        </span>
                        <span className="text-base font-bold my-0.5"
                          style={{ color: sel ? "#d7cbb5" : "rgba(215,203,181,0.6)" }}>
                          {format(day,"d")}
                        </span>
                        <span className="text-xs" style={{ color: "rgba(215,203,181,0.25)" }}>
                          {format(day,"MMM",{locale:ptBR})}
                        </span>
                        {fullDay && <span className="text-xs mt-0.5" style={{ color: "rgba(215,203,181,0.25)", fontSize: 9 }}>Reservado</span>}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selectedDate && (
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-8 }} transition={{ duration:0.4 }}>
                      <p className="text-xs font-semibold tracking-widest uppercase mb-4"
                        style={{ color: "rgba(215,203,181,0.3)" }}>02 / Período</p>
                      <div className="grid grid-cols-2 gap-3 mb-8">
                        {PERIODS.map((p) => {
                          const occupied = selectedDate ? isPeriodOccupied(selectedDate, p, occupiedSlots) : false;
                          return occupied ? (
                            <div key={p.id} className="relative rounded-xl p-4 text-left"
                              style={{
                                background: "rgba(255,255,255,0.01)",
                                border: "1px solid rgba(215,203,181,0.04)",
                                opacity: 0.4, cursor: "not-allowed",
                              }}>
                              <p className="text-sm font-semibold mb-1" style={{ color: "rgba(215,203,181,0.4)" }}>{p.label}</p>
                              <p className="text-xs" style={{ color: "rgba(215,203,181,0.25)" }}>{p.hours}</p>
                              <p className="text-xs mt-1 font-semibold" style={{ color: "rgba(220,100,100,0.7)" }}>Indisponível</p>
                            </div>
                          ) : (
                            <SelectionCard key={p.id} selected={selectedPeriod===p.id} onClick={()=>setSelectedPeriod(p.id)}>
                              <p className="text-sm font-semibold mb-1"
                                style={{ color: selectedPeriod===p.id ? "#d7cbb5" : "rgba(215,203,181,0.6)" }}>{p.label}</p>
                              <p className="text-xs" style={{ color:"rgba(215,203,181,0.35)" }}>{p.hours}</p>
                            </SelectionCard>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedDate && selectedPeriod && (
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-8 }} transition={{ duration:0.4 }}>
                      <p className="text-xs font-semibold tracking-widest uppercase mb-4"
                        style={{ color: "rgba(215,203,181,0.3)" }}>03 / Plano</p>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {Object.entries(PLANS).map(([key,p]) => (
                          <SelectionCard key={key} selected={selectedPlan===key} onClick={()=>setSelectedPlan(key)}>
                            <p className="text-xs font-semibold mb-2"
                              style={{ color: selectedPlan===key ? "#d7cbb5" : "rgba(215,203,181,0.5)" }}>{p.label}</p>
                            <p className="text-xl font-extrabold"
                              style={{ color: selectedPlan===key ? "#d7cbb5" : "rgba(215,203,181,0.4)" }}>
                              R${p.price.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color:"rgba(215,203,181,0.3)" }}>{p.installments}</p>
                          </SelectionCard>
                        ))}
                      </div>
                      <div className="rounded-2xl p-4 mb-6"
                        style={{ background:"rgba(215,203,181,0.04)", border:"1px solid rgba(215,203,181,0.08)" }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs mb-1" style={{ color:"rgba(215,203,181,0.35)" }}>Reserva selecionada</p>
                            <p className="text-sm font-semibold" style={{ color:"#d7cbb5" }}>
                              {format(selectedDate,"dd/MM/yyyy")} — {period?.hours}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color:"rgba(215,203,181,0.4)" }}>{plan.label}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs mb-1" style={{ color:"rgba(215,203,181,0.35)" }}>Total</p>
                            <p className="text-2xl font-extrabold" style={{ color:"#d7cbb5" }}>
                              R${plan.price.toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  className="w-full py-4 rounded-2xl text-sm font-bold transition-all"
                  disabled={!selectedDate || !selectedPeriod}
                  onClick={() => setStep(2)}
                  style={{
                    background: selectedDate && selectedPeriod ? "#d7cbb5" : "rgba(215,203,181,0.05)",
                    color:      selectedDate && selectedPeriod ? "#321e07" : "rgba(215,203,181,0.2)",
                    border: `1px solid ${selectedDate && selectedPeriod ? "transparent" : "rgba(215,203,181,0.06)"}`,
                  }}
                  whileHover={selectedDate && selectedPeriod ? { scale:1.02, boxShadow:"0 0 30px rgba(215,203,181,0.15)" } : {}}
                  whileTap={{ scale:0.98 }}>
                  Continuar
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 2: Dados pessoais ── */}
            {step === 2 && (
              <motion.div key="s2" variants={stepVariants} initial="enter" animate="center" exit="exit">
                <p className="text-xs font-semibold tracking-widest uppercase mb-6"
                  style={{ color:"rgba(215,203,181,0.3)" }}>Seus dados</p>

                {/* Resumo */}
                <div className="rounded-xl px-4 py-3 mb-6 flex items-center justify-between"
                  style={{ background:"rgba(215,203,181,0.04)", border:"1px solid rgba(215,203,181,0.07)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"rgba(215,203,181,0.7)" }}>
                      {selectedDate && format(selectedDate,"dd/MM/yyyy")} — {period?.hours}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:"rgba(215,203,181,0.35)" }}>{plan.label}</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color:"#d7cbb5" }}>
                    R${plan.price.toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Nome completo" required value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Seu nome" />
                    <InputField label="Email" required type="email" value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})} placeholder="seu@email.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="WhatsApp" value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="(62) 99999-9999" />
                    <InputField label="CPF" value={form.cpf}
                      onChange={(e) => setForm({...form, cpf: e.target.value.replace(/\D/g,"")})}
                      placeholder="000.000.000-00" maxLength={11} />
                  </div>

                  {/* Voucher */}
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-2"
                      style={{ color:"rgba(215,203,181,0.3)" }}>Cupom de desconto</label>
                    <div className="flex gap-2">
                      <input
                        value={form.voucherCode}
                        onChange={(e) => { setForm({...form, voucherCode: e.target.value.toUpperCase()}); setVoucherChecked(false); }}
                        placeholder="CODIGO"
                        className="flex-1 rounded-xl px-4 py-3 text-sm outline-none uppercase"
                        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(215,203,181,0.08)", color:"#d7cbb5" }}
                        onFocus={(e) => e.currentTarget.style.borderColor="rgba(215,203,181,0.2)"}
                        onBlur={(e)  => e.currentTarget.style.borderColor="rgba(215,203,181,0.08)"}
                      />
                      <motion.button type="button" onClick={checkVoucher}
                        className="px-4 py-3 rounded-xl text-sm font-semibold"
                        style={{ background:"rgba(215,203,181,0.07)", color:"rgba(215,203,181,0.6)", border:"1px solid rgba(215,203,181,0.1)" }}
                        whileTap={{ scale:0.97 }}>
                        Aplicar
                      </motion.button>
                    </div>
                    {voucherError && (
                      <p className="text-xs mt-1.5" style={{ color:"rgba(220,38,38,0.8)" }}>{voucherError}</p>
                    )}
                    {voucherChecked && !voucherError && form.voucherCode && (
                      <p className="text-xs mt-1.5" style={{ color:"rgba(74,222,128,0.8)" }}>
                        ✓ Desconto de R${discountAmount.toLocaleString("pt-BR",{minimumFractionDigits:2})} aplicado
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                    style={{ background:"rgba(215,203,181,0.04)", color:"rgba(215,203,181,0.5)", border:"1px solid rgba(215,203,181,0.07)" }}
                    whileHover={{ background:"rgba(215,203,181,0.07)" }} whileTap={{ scale:0.98 }}>
                    Voltar
                  </motion.button>
                  <motion.button type="button"
                    disabled={!form.name || !form.email}
                    onClick={handleStep2Continue}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                    style={{
                      background: form.name && form.email ? "#d7cbb5" : "rgba(215,203,181,0.05)",
                      color:      form.name && form.email ? "#321e07" : "rgba(215,203,181,0.2)",
                    }}
                    whileHover={form.name && form.email ? { scale:1.02 } : {}} whileTap={{ scale:0.98 }}>
                    Continuar
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Pagamento ── */}
            {step === 3 && (
              <motion.form key="s3" onSubmit={handlePayment} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <p className="text-xs font-semibold tracking-widest uppercase mb-6"
                  style={{ color:"rgba(215,203,181,0.3)" }}>Pagamento</p>

                {/* Resumo com preço final */}
                <div className="rounded-2xl p-4 mb-6"
                  style={{ background:"rgba(215,203,181,0.04)", border:"1px solid rgba(215,203,181,0.08)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold" style={{ color:"rgba(215,203,181,0.7)" }}>
                        {selectedDate && format(selectedDate,"dd/MM/yyyy")} — {period?.hours}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color:"rgba(215,203,181,0.35)" }}>{plan.label}</p>
                    </div>
                    <div className="text-right">
                      {discountAmount > 0 && (
                        <p className="text-xs line-through" style={{ color:"rgba(215,203,181,0.3)" }}>
                          R${plan.price.toLocaleString("pt-BR",{minimumFractionDigits:2})}
                        </p>
                      )}
                      <p className="text-xl font-extrabold"
                        style={{ color: isFree ? "rgba(74,222,128,0.9)" : "#d7cbb5" }}>
                        {isFree ? "Gratuito" : `R$${total.toLocaleString("pt-BR",{minimumFractionDigits:2})}`}
                      </p>
                      {discountAmount > 0 && (
                        <p className="text-xs" style={{ color:"rgba(74,222,128,0.7)" }}>
                          − R${discountAmount.toLocaleString("pt-BR",{minimumFractionDigits:2})} de desconto
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isFree ? (
                  /* Reserva gratuita — não precisa de cartão */
                  <div className="rounded-2xl p-5 mb-6 text-center"
                    style={{ background:"rgba(74,222,128,0.05)", border:"1px solid rgba(74,222,128,0.15)" }}>
                    <p className="text-sm font-semibold" style={{ color:"rgba(74,222,128,0.9)" }}>
                      ✓ Reserva 100% gratuita com cupom
                    </p>
                    <p className="text-xs mt-1" style={{ color:"rgba(215,203,181,0.4)" }}>
                      Nenhuma cobrança será realizada.
                    </p>
                  </div>
                ) : (
                  /* Formulário de cartão */
                  <div className="space-y-4 mb-6">
                    <InputField label="Nome no cartão" required value={card.holderName}
                      onChange={(e) => setCard({...card, holderName: e.target.value})}
                      placeholder="Como está no cartão" />
                    <InputField label="Número do cartão" required value={card.number}
                      onChange={(e) => setCard({...card, number: formatCardNumber(e.target.value)})}
                      placeholder="0000 0000 0000 0000" maxLength={19} inputMode="numeric" />
                    <div className="grid grid-cols-3 gap-4">
                      <InputField label="Mês" required value={card.expiryMonth}
                        onChange={(e) => setCard({...card, expiryMonth: e.target.value.replace(/\D/g,"").slice(0,2)})}
                        placeholder="MM" maxLength={2} inputMode="numeric" />
                      <InputField label="Ano" required value={card.expiryYear}
                        onChange={(e) => setCard({...card, expiryYear: e.target.value.replace(/\D/g,"").slice(0,4)})}
                        placeholder="AAAA" maxLength={4} inputMode="numeric" />
                      <InputField label="CVV" required value={card.ccv}
                        onChange={(e) => setCard({...card, ccv: e.target.value.replace(/\D/g,"").slice(0,4)})}
                        placeholder="123" maxLength={4} inputMode="numeric" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-sm px-4 py-3 rounded-xl mb-4"
                    style={{ background:"rgba(220,38,38,0.08)", color:"#f87171", border:"1px solid rgba(220,38,38,0.2)" }}>
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <motion.button type="button" onClick={() => setStep(2)}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                    style={{ background:"rgba(215,203,181,0.04)", color:"rgba(215,203,181,0.5)", border:"1px solid rgba(215,203,181,0.07)" }}
                    whileTap={{ scale:0.98 }}>
                    Voltar
                  </motion.button>
                  <motion.button type="submit" disabled={loading}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                    style={{ background:"#d7cbb5", color:"#321e07", opacity: loading ? 0.7 : 1 }}
                    whileHover={{ scale:1.02, boxShadow:"0 0 30px rgba(215,203,181,0.2)" }}
                    whileTap={{ scale:0.98 }}>
                    {loading ? "Processando..." : isFree ? "Confirmar reserva" : "Pagar e continuar"}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* ── STEP 4: Cadastro facial ── */}
            {step === 4 && (
              <motion.div key="s4" variants={stepVariants} initial="enter" animate="center" exit="exit">

                {done ? (
                  /* Confirmação final */
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                      transition={{ duration:0.5, type:"spring", bounce:0.4 }}
                      className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                      style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)" }}>
                      <span style={{ fontSize:28 }}>✓</span>
                    </motion.div>
                    <h3 className="text-2xl font-extrabold mb-2" style={{ color:"#d7cbb5" }}>Tudo pronto!</h3>
                    <p className="text-sm mb-1" style={{ color:"rgba(215,203,181,0.5)" }}>
                      Reserva confirmada e acesso facial cadastrado.
                    </p>
                    <p className="text-sm" style={{ color:"rgba(215,203,181,0.5)" }}>
                      Você receberá um e-mail de confirmação em instantes.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold tracking-widest uppercase mb-2"
                      style={{ color:"rgba(215,203,181,0.3)" }}>Cadastro facial</p>
                    <p className="text-sm mb-6" style={{ color:"rgba(215,203,181,0.45)" }}>
                      Posicione seu rosto centralizado e com boa iluminação.
                    </p>

                    {/* Área da câmera */}
                    <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video bg-black flex items-center justify-center"
                      style={{ border:"1px solid rgba(215,203,181,0.1)" }}>
                      {cameraError ? (
                        <p className="text-sm text-center px-4" style={{ color:"rgba(220,38,38,0.8)" }}>
                          {cameraError}
                        </p>
                      ) : photoDataUrl ? (
                        <img src={photoDataUrl} alt="Foto capturada" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <video ref={videoRef} autoPlay playsInline muted
                            className="w-full h-full object-cover" />
                          {/* Guia oval */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="rounded-full"
                              style={{
                                width: "45%", paddingTop: "55%",
                                border: "2px solid rgba(215,203,181,0.3)",
                                boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                                borderRadius: "50%",
                              }} />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Canvas oculto para captura */}
                    <canvas ref={canvasRef} className="hidden" />

                    {error && (
                      <div className="text-sm px-4 py-3 rounded-xl mb-4"
                        style={{ background:"rgba(220,38,38,0.08)", color:"#f87171", border:"1px solid rgba(220,38,38,0.2)" }}>
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      {photoDataUrl ? (
                        <>
                          <motion.button type="button" onClick={retakePhoto}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                            style={{ background:"rgba(215,203,181,0.04)", color:"rgba(215,203,181,0.5)", border:"1px solid rgba(215,203,181,0.07)" }}
                            whileTap={{ scale:0.98 }}>
                            Tirar outra
                          </motion.button>
                          <motion.button type="button" disabled={loading} onClick={handleFacialSubmit}
                            className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                            style={{ background:"#d7cbb5", color:"#321e07", opacity: loading ? 0.7 : 1 }}
                            whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
                            {loading ? "Salvando..." : "Usar esta foto"}
                          </motion.button>
                        </>
                      ) : (
                        <motion.button type="button" onClick={capturePhoto} disabled={!!cameraError}
                          className="w-full py-4 rounded-2xl text-sm font-bold"
                          style={{
                            background: cameraError ? "rgba(215,203,181,0.05)" : "#d7cbb5",
                            color:      cameraError ? "rgba(215,203,181,0.3)" : "#321e07",
                          }}
                          whileHover={!cameraError ? { scale:1.02, boxShadow:"0 0 30px rgba(215,203,181,0.2)" } : {}}
                          whileTap={{ scale:0.98 }}>
                          Capturar foto
                        </motion.button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
