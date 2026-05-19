"use client";
import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "5562996332257"; // 55 + DDD 62 + number
const WHATSAPP_MESSAGE = encodeURIComponent("Olá! Gostaria de saber mais sobre o VDO HUB.");

export function WhatsAppButton() {
  return (
    <motion.a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg"
      style={{ background: "rgba(26,14,5,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(26,14,5,0.12)" }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 2 }}
      whileHover={{ scale: 1.08, background: "rgba(26,14,5,0.28)" }}
      whileTap={{ scale: 0.95 }}
    >
      {/* WhatsApp SVG icon */}
      <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.34.627 4.62 1.82 6.613L2.667 29.333l6.9-1.787A13.267 13.267 0 0016 29.333c7.364 0 13.333-5.97 13.333-13.333S23.364 2.667 16 2.667z"
          fill="rgba(245,240,232,0.85)"
        />
        <path
          d="M21.84 18.547c-.32-.16-1.88-.927-2.173-1.027-.293-.107-.507-.16-.72.16-.213.32-.827 1.027-1.013 1.24-.187.213-.373.24-.693.08-.32-.16-1.347-.497-2.567-1.587-.947-.84-1.587-1.88-1.773-2.2-.187-.32-.02-.493.14-.653.143-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.26-.627-.527-.54-.72-.547h-.613c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667 0 1.573 1.147 3.093 1.307 3.307.16.213 2.253 3.44 5.467 4.827.76.327 1.36.52 1.827.667.767.24 1.467.207 2.013.127.613-.093 1.88-.767 2.147-1.507.267-.74.267-1.373.187-1.507-.08-.133-.293-.213-.613-.373z"
          fill="rgba(26,14,5,0.7)"
        />
      </svg>
    </motion.a>
  );
}
