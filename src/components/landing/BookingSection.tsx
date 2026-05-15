"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { format, addDays, isBefore, startOfDay, setHours } from "date-fns";
import { ptBR } from "date-fns/locale";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h às 20h
const PRICE_PER_HOUR = 50; // R$/hora — ajustar conforme cliente

export function BookingSection() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", billingType: "PIX", voucherCode: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ paymentUrl: string; total: number } | null>(null);

  // Gera os próximos 30 dias
  const days = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i + 1));

  const total = startHour && endHour ? (endHour - startHour) * PRICE_PER_HOUR : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !startHour || !endHour) return;
    setLoading(true);

    const startAt = setHours(selectedDate, startHour).toISOString();
    const endAt   = setHours(selectedDate, endHour).toISOString();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startAt, endAt }),
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

  return (
    <section id="reservar" className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
            Reserve agora
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
            Escolha seu horário
          </h2>
          <p className="text-gray-500 text-lg">
            Disponibilidade em tempo real. Confirmação instantânea após o pagamento.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[{ n: 1, label: "Data e horário" }, { n: 2, label: "Seus dados" }, { n: 3, label: "Pagamento" }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s.n ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-400"
                }`}>{s.n}</div>
                <span className={`text-sm font-medium hidden sm:block ${step >= s.n ? "text-gray-900" : "text-gray-400"}`}>{s.label}</span>
              </div>
              {i < 2 && <div className={`h-px w-8 ${step > s.n ? "bg-emerald-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {/* STEP 1 — Data e horário */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Selecione a data</h3>

              <div className="flex gap-2 overflow-x-auto pb-3 mb-8">
                {days.map((day) => {
                  const isSelected = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => { setSelectedDate(day); setStartHour(null); setEndHour(null); }}
                      className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl border-2 transition-all w-14 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-100 hover:border-emerald-200 text-gray-600"
                      }`}
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
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Horário de entrada</h3>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-6">
                    {HOURS.slice(0, -1).map((h) => (
                      <button
                        key={h}
                        onClick={() => { setStartHour(h); setEndHour(null); }}
                        className={`py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          startHour === h
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-gray-100 hover:border-emerald-200 text-gray-600"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </>
              )}

              {startHour && (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Horário de saída</h3>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-6">
                    {HOURS.filter((h) => h > startHour!).map((h) => (
                      <button
                        key={h}
                        onClick={() => setEndHour(h)}
                        className={`py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          endHour === h
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-gray-100 hover:border-emerald-200 text-gray-600"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selectedDate && startHour && endHour && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Reserva selecionada</p>
                      <p className="font-bold text-gray-900">
                        {format(selectedDate, "dd/MM/yyyy")} · {startHour}h às {endHour}h ({endHour - startHour}h)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        R$ {total.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!selectedDate || !startHour || !endHour}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </div>
          )}

          {/* STEP 2 — Dados pessoais */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Seus dados</h3>

              {/* Resumo */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {selectedDate && format(selectedDate, "dd/MM/yyyy")} · {startHour}h às {endHour}h
                </span>
                {" · "}
                <span className="text-emerald-600 font-bold">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(62) 99999-9999"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cupom de desconto</label>
                  <input
                    value={form.voucherCode}
                    onChange={(e) => setForm({ ...form, voucherCode: e.target.value.toUpperCase() })}
                    placeholder="CÓDIGO"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de pagamento *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{ v: "PIX", label: "PIX", icon: "⚡" }, { v: "BOLETO", label: "Boleto", icon: "📄" }, { v: "CREDIT_CARD", label: "Cartão", icon: "💳" }].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setForm({ ...form, billingType: opt.v })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.billingType === opt.v
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-100 hover:border-emerald-200 text-gray-600"
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                  {loading ? "Processando..." : "Confirmar reserva"}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3 — Sucesso */}
          {step === 3 && result && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reserva criada!</h3>
              <p className="text-gray-500 mb-2">
                Você receberá um email de confirmação em instantes.
              </p>
              <p className="text-gray-500 mb-8">
                Após o pagamento, seu acesso facial será cadastrado automaticamente.
              </p>
              <div className="bg-emerald-50 rounded-2xl p-4 mb-8">
                <p className="text-sm text-gray-500 mb-1">Total a pagar</p>
                <p className="text-3xl font-bold text-emerald-600">
                  R$ {result.total.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => window.open(result.paymentUrl, "_blank")}
              >
                Ir para o pagamento
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
