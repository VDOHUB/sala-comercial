"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FaqItem = { id: string; question: string; answer: string; order: number };

export function Faq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [open, setOpen]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/faq")
      .then((r) => r.json())
      .then((data: FaqItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data.sort((a, b) => a.order - b.order));
        }
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="faq" className="py-24 px-6" style={{ background: "#0e0a06" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "rgba(215,203,181,0.3)" }}>
            Tire suas dúvidas
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight"
            style={{ color: "#d7cbb5" }}>
            Dúvidas frequentes
          </h2>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(215,203,181,0.07)" }}>
              <button
                type="button"
                onClick={() => setOpen(open === item.id ? null : item.id)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold" style={{ color: "#d7cbb5" }}>
                  {item.question}
                </span>
                <motion.span
                  animate={{ rotate: open === item.id ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-lg font-light"
                  style={{ color: "rgba(215,203,181,0.5)", background: "rgba(215,203,181,0.06)" }}>
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === item.id && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed"
                      style={{ color: "rgba(215,203,181,0.55)" }}>
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
