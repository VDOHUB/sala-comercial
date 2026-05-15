"use client";
import { useState } from "react";
import { format, addDays, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";

const PERIODS = [
  { id: "MORNING", label: "Período Matutino", hours: "08h00 às 13h00", startHour: 8, endHour: 13 },
  { id: "AFTERNOON", label: "Período Vespertino", hours: "14h00 às 19h00", startHour: 14, endHour: 19 },
];

// Próximos 30 dias, apenas dias úteis (seg–sex)
const DAYS = Array.from({ length: 60 }, (_, i) => addDays(new Date(), i + 1))
  .filter((d) => !isWeekend(d))
  .slice(0, 30);

const PLAN_PRICES: Record<string, { label: string; price: number; installments: string }> = {
  HUB_ONE:     { label: "HUB ONE (1 período)",    price: 300,  installments: "3x de R$ 100,00" },
  HUB_FIVE:    { label: "HUB FIVE (5 períodos)",  price: 1200, installments: "10x de R$ 120,00" },
  HUB_TEN:     { label: "HUB TEN (10 períodos)",  price: 2200, installments: "10x de R$ 220,00" },
  HUB_PARTNER: { label: "HUB PARTNER (15 períodos)", price: 3000, installments: "10x de R$ 300,00" },
};

export function BookingSection() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("HUB_ONE");
  const [form, setForm] = useState({ name: "", email: "", phone: "", voucherCode: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ paymentUrl: string; total: number } | null>(null);

  const plan = PLAN_PRICES[selectedPlan];
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

  const btn = "px-5 py-3 rounded-xl text-sm font-semibold transition-all";

  return (
    <section id="reservar" className="py-24" style={{ backgroundColor: "#f5f0e8" }}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: "#8b6a3e" }}>
            Reserve agora
          </span>
          <h2 className="text-4xl font-bold mt-2 mb-4" style={{ color: "#321e07" }}>
            Escolha seu período
          </h2>
          <p className="text-lg" style={{ color: "#6b5a45" }}>
            Disponibilidade em tempo real. Confirmação instantânea após o pagamento.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[{ n: 1, label: "Data e período" }, { n: 2, label: "Seus dados" }, { n: 3, label: "Confirmado" }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                  style={{
                    backgroundColor: step >= s.n ? "#321e07" : "#e8ddd0",
                    color: step >= s.n ? "#d7cbb5" : "#9b8570",
                  }}
                >{s.n}</div>
                <span className="text-sm font-medium hidden sm:block" style={{ color: step >= s.n ? "#321e07" : "#9b8570" }}>{s.label}</span>
              </div>
              {i < 2 && <div className="h-px w-8" style={{ backgroundColor: step > s.n ? "#321e07" : "#e8ddd0" }} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8 border" style={{ borderColor: "#e8ddd0" }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-bold mb-6" style={{ color: "#321e07" }}>Selecione o dia</h3>

              <div className="flex gap-2 overflow-x-auto pb-3 mb-8">
                {DAYS.map((day) => {
                  const sel = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => { setSelectedDate(day); setSelectedPeriod(null); }}
                      className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl border-2 transition-all w-14"
                      style={{
                        borderColor: sel ? "#321e07" : "#e8ddd0",
                        backgroundColor: sel ? "#321e07" : "white",
                        color: sel ? "#d7cbb5" : "#6b5a45",
                      }}
                    >
                      <span className="text-xs font-medium">{format(day, "EEE", { locale: ptBR })}</span>
                      <span className="text-lg font-bold">{format(day, "d")}</span>
                      <span className="text-xs">{format(day, "MMM", { locale: ptBR })}</span>
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <>
                  <h3 className="text-lg font-bold mb-4" style={{ color: "#321e07" }}>Selecione o período</h3>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {PERIODS.map((p) => {
                      const sel = selectedPeriod === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPeriod(p.id)}
                          className="p-4 rounded-2xl border-2 text-left transition-all"
                          style={{
                            borderColor: sel ? "#321e07" : "#e8ddd0",
                            backgroundColor: sel ? "#321e07" : "white",
                          }}
                        >
                          <p className="font-bold text-sm mb-1" style={{ color: sel ? "#d7cbb5" : "#321e07" }}>{p.label}</p>
                          <p className="text-xs" style={{ color: sel ? "rgba(215,203,181,0.7)" : "#9b8570" }}>{p.hours}</p>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedDate && selectedPeriod && (
                <>
                  <h3 className="text-lg font-bold mb-4" style={{ color: "#321e07" }}>Selecione o plano</h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {Object.entries(PLAN_PRICES).map(([key, p]) => {
                      const sel = selectedPlan === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedPlan(key)}
                          className="p-4 rounded-xl border-2 text-left transition-all"
                          style={{
                            borderColor: sel ? "#321e07" : "#e8ddd0",
                            backgroundColor: sel ? "#321e07" : "white",
                          }}
                        >
                          <p className="font-bold text-sm" style={{ color: sel ? "#d7cbb5" : "#321e07" }}>{p.label}</p>
                          <p className="text-base font-bold mt-1" style={{ color: sel ? "white" : "#321e07" }}>
                            R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs" style={{ color: sel ? "rgba(215,203,181,0.6)" : "#9b8570" }}>{p.installments}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl p-4 mb-6 border" style={{ backgroundColor: "#f5f0e8", borderColor: "#e8ddd0" }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm" style={{ color: "#9b8570" }}>Reserva selecionada</p>
                        <p className="font-bold" style={{ color: "#321e07" }}>
                          {format(selectedDate, "dd/MM/yyyy")} · {period?.hours}
                        </p>
                        <p className="text-sm" style={{ color: "#6b5a45" }}>{plan.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm" style={{ color: "#9b8570" }}>Total</p>
                        <p className="text-2xl font-bold" style={{ color: "#321e07" }}>
                          R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                className={`${btn} w-full text-base`}
                disabled={!selectedDate || !selectedPeriod}
                onClick={() => setStep(2)}
                style={{
                  backgroundColor: selectedDate && selectedPeriod ? "#321e07" : "#e8ddd0",
                  color: selectedDate && selectedPeriod ? "#d7cbb5" : "#9b8570",
                }}
              >
                Continuar
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-bold mb-6" style={{ color: "#321e07" }}>Seus dados</h3>

              <div className="rounded-xl p-4 mb-6 text-sm border" style={{ backgroundColor: "#f5f0e8", borderColor: "#e8ddd0", color: "#6b5a45" }}>
                <span className="font-medium" style={{ color: "#321e07" }}>
                  {selectedDate && format(selectedDate, "dd/MM/yyyy")} · {period?.hours}
                </span>
                {" · "}
                <span className="font-bold" style={{ color: "#321e07" }}>R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                {" · "}
                <span>{plan.installments}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#321e07" }}>Nome completo *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#e8ddd0", "--tw-ring-color": "#321e07" } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#321e07" }}>Email *</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#e8ddd0" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#321e07" }}>WhatsApp</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(62) 99999-9999"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#e8ddd0" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#321e07" }}>Cupom de desconto</label>
                  <input value={form.voucherCode} onChange={(e) => setForm({ ...form, voucherCode: e.target.value.toUpperCase() })}
                    placeholder="CÓDIGO"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 uppercase"
                    style={{ borderColor: "#e8ddd0" }}
                  />
                </div>
              </div>

              <div
                className="flex items-center gap-3 rounded-xl p-3 mb-6 border text-sm"
                style={{ backgroundColor: "#f5f0e8", borderColor: "#e8ddd0", color: "#6b5a45" }}
              >
                <span>💳</span>
                <span>Pagamento via <strong style={{ color: "#321e07" }}>cartão de crédito</strong> em até 10x sem juros</span>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className={`${btn} flex-1 border`}
                  style={{ borderColor: "#e8ddd0", color: "#6b5a45" }}
                >
                  Voltar
                </button>
                <button type="submit" disabled={loading}
                  className={`${btn} flex-1 text-base`}
                  style={{ backgroundColor: "#321e07", color: "#d7cbb5", opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? "Processando..." : "Confirmar reserva"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && result && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🎉</div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: "#321e07" }}>Reserva criada!</h3>
              <p className="mb-2" style={{ color: "#6b5a45" }}>
                Você receberá um email de confirmação em instantes.
              </p>
              <p className="mb-8" style={{ color: "#6b5a45" }}>
                Após o pagamento, seu acesso facial será cadastrado automaticamente.
              </p>
              <div className="rounded-2xl p-4 mb-8 border" style={{ backgroundColor: "#f5f0e8", borderColor: "#e8ddd0" }}>
                <p className="text-sm mb-1" style={{ color: "#9b8570" }}>Total a pagar</p>
                <p className="text-3xl font-bold" style={{ color: "#321e07" }}>
                  R$ {result.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                className={`${btn} w-full text-base`}
                style={{ backgroundColor: "#321e07", color: "#d7cbb5" }}
                onClick={() => window.open(result.paymentUrl, "_blank")}
              >
                Ir para o pagamento
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
