"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { format, addDays, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";

const PERIODS = [
  { id: "MORNING", label: "Matutino", hours: "08h00 — 13h00", startHour: 8, endHour: 13 },
  { id: "AFTERNOON", label: "Vespertino", hours: "14h00 — 19h00", startHour: 14, endHour: 19 },
];

const DAYS = Array.from({ length: 60 }, (_, i) => addDays(new Date(), i + 1))
  .filter((d) => !isWeekend(d))
  .slice(0, 30);

const PLANS: Record<string, { label: string; price: number; installments: string }> = {
  HUB_ONE:     { label: "HUB ONE — 1 periodo",    price: 300,  installments: "3x de R$ 100,00" },
  HUB_FIVE:    { label: "HUB FIVE — 5 periodos",  price: 1200, installments: "10x de R$ 120,00" },
  HUB_TEN:     { label: "HUB TEN — 10 periodos",  price: 2200, installments: "10x de R$ 220,00" },
  HUB_PARTNER: { label: "HUB PARTNER — 15 periodos", price: 3000, installments: "10x de R$ 300,00" },
};

const stepVariants: Variants = {
  enter: { opacity: 0, x: 24, filter: "blur(6px)" },
  center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, x: -24, filter: "blur(6px)", transition: { duration: 0.3, ease: "easeIn" } },
};

export function BookingSection() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("HUB_ONE");
  const [form, setForm] = useState({ name: "", email: "", phone: "", voucherCode: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ paymentUrl: string; total: number } | null>(null);

  const ref = useRef(null);
  const plan = PLANS[selectedPlan];
  const period = PERIODS.find((p) => p.id === selectedPeriod);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !period) return;
    setLoading(true);

    const startAt = new Date(selectedDate);
    startAt.setHours(period.startHour, 0, 0, 0);
    const endAt = new Date(selectedDate);
    endAt.setHours(period.endHour, 0, 0, 0);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          billingType: "CREDIT_CARD",
          voucherCode: form.voucherCode || undefined,
          planKey: selectedPlan,
          totalAmount: plan.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar reserva");
      setResult({ paymentUrl: data.paymentUrl, total: data.totalAmount });
      setStep(3);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao processar reserva. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function SelectionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        className="relative rounded-xl p-4 text-left w-full overflow-hidden group"
        style={{
          background: selected ? "rgba(215,203,181,0.08)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${selected ? "rgba(215,203,181,0.2)" : "rgba(215,203,181,0.06)"}`,
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {selected && (
          <div
            className="absolute top-0 left-4 right-4 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.3), transparent)" }}
          />
        )}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(215,203,181,0.04) 0%, transparent 60%)" }}
        />
        {children}
      </motion.button>
    );
  }

  function InputField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
      <div>
        <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "rgba(215,203,181,0.3)" }}>
          {label}
        </label>
        <input
          {...props}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(215,203,181,0.08)",
            color: "#d7cbb5",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(215,203,181,0.2)"; props.onFocus?.(e); }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(215,203,181,0.08)"; props.onBlur?.(e); }}
        />
      </div>
    );
  }

  return (
    <section id="reservar" className="py-32 relative" style={{ background: "#0c0704" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.06), transparent)" }} />

      {/* Ambient */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(215,203,181,0.03) 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "rgba(215,203,181,0.3)" }}>
            Reserve agora
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "#d7cbb5" }}>
            Seu periodo.
          </h2>
          <p className="text-base" style={{ color: "rgba(215,203,181,0.4)" }}>
            Disponibilidade em tempo real. Confirmacao instantanea.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[
            { n: 1, label: "Data e periodo" },
            { n: 2, label: "Seus dados" },
            { n: 3, label: "Confirmado" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step >= s.n ? "rgba(215,203,181,0.15)" : "rgba(215,203,181,0.04)",
                    border: `1px solid ${step >= s.n ? "rgba(215,203,181,0.2)" : "rgba(215,203,181,0.06)"}`,
                    color: step >= s.n ? "#d7cbb5" : "rgba(215,203,181,0.25)",
                  }}
                >{s.n}</div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: step >= s.n ? "rgba(215,203,181,0.6)" : "rgba(215,203,181,0.2)" }}
                >
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className="h-px w-6" style={{ background: step > s.n ? "rgba(215,203,181,0.15)" : "rgba(215,203,181,0.05)" }} />}
            </div>
          ))}
        </div>

        {/* Card container */}
        <div
          className="relative rounded-3xl p-8 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(215,203,181,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="absolute top-0 left-8 right-8 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(215,203,181,0.1), transparent)" }}
          />

          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit">
                <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "rgba(215,203,181,0.3)" }}>
                  01 / Selecione o dia
                </p>

                {/* Dias */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
                  {DAYS.map((day) => {
                    const sel = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                    return (
                      <motion.button
                        key={day.toISOString()}
                        onClick={() => { setSelectedDate(day); setSelectedPeriod(null); }}
                        className="flex-shrink-0 flex flex-col items-center py-3 px-2 rounded-xl w-12 transition-all"
                        style={{
                          background: sel ? "rgba(215,203,181,0.1)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${sel ? "rgba(215,203,181,0.2)" : "rgba(215,203,181,0.06)"}`,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-xs" style={{ color: "rgba(215,203,181,0.35)" }}>
                          {format(day, "EEE", { locale: ptBR })}
                        </span>
                        <span className="text-base font-bold my-0.5" style={{ color: sel ? "#d7cbb5" : "rgba(215,203,181,0.6)" }}>
                          {format(day, "d")}
                        </span>
                        <span className="text-xs" style={{ color: "rgba(215,203,181,0.25)" }}>
                          {format(day, "MMM", { locale: ptBR })}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Periodo */}
                <AnimatePresence>
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "rgba(215,203,181,0.3)" }}>
                        02 / Periodo
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-8">
                        {PERIODS.map((p) => (
                          <SelectionCard key={p.id} selected={selectedPeriod === p.id} onClick={() => setSelectedPeriod(p.id)}>
                            <p className="text-sm font-semibold mb-1" style={{ color: selectedPeriod === p.id ? "#d7cbb5" : "rgba(215,203,181,0.6)" }}>
                              {p.label}
                            </p>
                            <p className="text-xs" style={{ color: "rgba(215,203,181,0.35)" }}>{p.hours}</p>
                          </SelectionCard>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Plano */}
                <AnimatePresence>
                  {selectedDate && selectedPeriod && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "rgba(215,203,181,0.3)" }}>
                        03 / Plano
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {Object.entries(PLANS).map(([key, p]) => (
                          <SelectionCard key={key} selected={selectedPlan === key} onClick={() => setSelectedPlan(key)}>
                            <p className="text-xs font-semibold mb-2" style={{ color: selectedPlan === key ? "#d7cbb5" : "rgba(215,203,181,0.5)" }}>
                              {p.label}
                            </p>
                            <p className="text-xl font-extrabold" style={{ color: selectedPlan === key ? "#d7cbb5" : "rgba(215,203,181,0.4)" }}>
                              R${p.price.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(215,203,181,0.3)" }}>{p.installments}</p>
                          </SelectionCard>
                        ))}
                      </div>

                      {/* Resumo */}
                      <div
                        className="rounded-2xl p-4 mb-6"
                        style={{ background: "rgba(215,203,181,0.04)", border: "1px solid rgba(215,203,181,0.08)" }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs mb-1" style={{ color: "rgba(215,203,181,0.35)" }}>Reserva selecionada</p>
                            <p className="text-sm font-semibold" style={{ color: "#d7cbb5" }}>
                              {format(selectedDate, "dd/MM/yyyy")} — {period?.hours}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(215,203,181,0.4)" }}>{plan.label}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs mb-1" style={{ color: "rgba(215,203,181,0.35)" }}>Total</p>
                            <p className="text-2xl font-extrabold" style={{ color: "#d7cbb5" }}>
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
                    color: selectedDate && selectedPeriod ? "#321e07" : "rgba(215,203,181,0.2)",
                    border: `1px solid ${selectedDate && selectedPeriod ? "transparent" : "rgba(215,203,181,0.06)"}`,
                  }}
                  whileHover={selectedDate && selectedPeriod ? { scale: 1.02, boxShadow: "0 0 30px rgba(215,203,181,0.15)" } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  Continuar
                </motion.button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.form key="step2" onSubmit={handleSubmit} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: "rgba(215,203,181,0.3)" }}>
                  Seus dados
                </p>

                {/* Resumo */}
                <div
                  className="rounded-xl px-4 py-3 mb-6 flex items-center justify-between"
                  style={{ background: "rgba(215,203,181,0.04)", border: "1px solid rgba(215,203,181,0.07)" }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "rgba(215,203,181,0.7)" }}>
                      {selectedDate && format(selectedDate, "dd/MM/yyyy")} — {period?.hours}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(215,203,181,0.35)" }}>{plan.label}</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "#d7cbb5" }}>
                    R${plan.price.toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <InputField
                    label="Nome completo"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                  <InputField
                    label="Email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <InputField
                    label="WhatsApp"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(62) 99999-9999"
                  />
                  <InputField
                    label="Cupom de desconto"
                    value={form.voucherCode}
                    onChange={(e) => setForm({ ...form, voucherCode: e.target.value.toUpperCase() })}
                    placeholder="CODIGO"
                    className="uppercase"
                  />
                </div>

                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-xs"
                  style={{ background: "rgba(215,203,181,0.04)", border: "1px solid rgba(215,203,181,0.07)", color: "rgba(215,203,181,0.45)" }}
                >
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(215,203,181,0.08)" }}>
                    <span style={{ fontSize: 10 }}>CC</span>
                  </div>
                  Pagamento via <strong className="ml-1" style={{ color: "rgba(215,203,181,0.7)" }}>cartao de credito</strong>
                  <span className="ml-auto" style={{ color: "rgba(215,203,181,0.3)" }}>ate 10x sem juros</span>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                    style={{ background: "rgba(215,203,181,0.04)", color: "rgba(215,203,181,0.5)", border: "1px solid rgba(215,203,181,0.07)" }}
                    whileHover={{ background: "rgba(215,203,181,0.07)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Voltar
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold relative overflow-hidden"
                    style={{ background: "#d7cbb5", color: "#321e07", opacity: loading ? 0.7 : 1 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(215,203,181,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <motion.div
                        className="flex items-center justify-center gap-2"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        Processando...
                      </motion.div>
                    ) : "Confirmar reserva"}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* STEP 3 */}
            {step === 3 && result && (
              <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" className="text-center py-8">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                  className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}
                >
                  <div className="w-6 h-6 rounded-full" style={{ background: "rgba(74,222,128,0.6)" }} />
                </motion.div>

                <h3 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: "#d7cbb5" }}>Reserva criada</h3>
                <p className="text-sm mb-2" style={{ color: "rgba(215,203,181,0.45)" }}>
                  Email de confirmacao enviado em instantes.
                </p>
                <p className="text-sm mb-10" style={{ color: "rgba(215,203,181,0.45)" }}>
                  Apos o pagamento, seu acesso facial e configurado automaticamente.
                </p>

                <div
                  className="rounded-2xl p-5 mb-8"
                  style={{ background: "rgba(215,203,181,0.04)", border: "1px solid rgba(215,203,181,0.08)" }}
                >
                  <p className="text-xs mb-2" style={{ color: "rgba(215,203,181,0.35)" }}>Total a pagar</p>
                  <p className="text-4xl font-extrabold" style={{ color: "#d7cbb5" }}>
                    R${result.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <motion.button
                  className="w-full py-4 rounded-2xl text-sm font-bold"
                  style={{ background: "#d7cbb5", color: "#321e07" }}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(215,203,181,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.open(result.paymentUrl, "_blank")}
                >
                  Ir para o pagamento
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
