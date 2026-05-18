import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';
import { HexCoordinates } from 'shared';

interface Props {
  target: HexCoordinates;
}

/**
 * Animação de Aura Rúnica Premium.
 * 
 * Renderiza uma cúpula de força com matriz hexagonal digital (honeycomb shield)
 * e anéis rúnicos com rotação oposta que se entrelaçam com faíscas arcanas.
 */
export const AuraRunicaAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none z-50 overflow-visible">
      {/* ── 1. CÚPULA DE FORÇA TRANSLÚCIDA (Domo de Defesa) ── */}
      <motion.circle
        r={44}
        fill="rgba(34, 211, 238, 0.08)" // cyan-400 ultra translúcido
        stroke="rgba(34, 211, 238, 0.45)"
        strokeWidth="1.5"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.25, 1.15], opacity: [0, 0.95, 0] }}
        transition={{ duration: 0.72, ease: "easeOut" }}
      />

      {/* ── 2. ESCUDO COLMEIA DIGITAL (Hexágonos Entrelaçados em Rotação Oposta) ── */}
      {/* Hexágono Primário (Gira no sentido horário) */}
      <motion.path
        d="M 32 0 L 16 27.7 L -16 27.7 L -32 0 L -16 -27.7 L 16 -27.7 Z"
        fill="none"
        stroke="#22d3ee" // cyan-400
        strokeWidth="3.2"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 0.1, opacity: 0, rotate: 0 }}
        animate={{ scale: [0.1, 1.45, 1.3], opacity: [0, 1.0, 0], rotate: 45 }}
        transition={{ duration: 0.68, ease: "easeOut" }}
      />

      {/* Hexágono Secundário (Gira no sentido anti-horário) */}
      <motion.path
        d="M 0 32 L 27.7 16 L 27.7 -16 L 0 -32 L -27.7 -16 L -27.7 16 Z"
        fill="none"
        stroke="#06b6d4" // cyan-500
        strokeWidth="1.5"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 0.1, opacity: 0, rotate: 0 }}
        animate={{ scale: [0.1, 1.35, 1.2], opacity: [0, 0.85, 0], rotate: -45 }}
        transition={{ duration: 0.68, delay: 0.04, ease: "easeOut" }}
      />

      {/* ── 3. ANEL DE CARGA RÚNICO DASHED (Mística Arcana) ── */}
      <motion.circle
        r={48}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeDasharray="12 8"
        initial={{ rotate: 0, scale: 0.1, opacity: 0 }}
        animate={{ rotate: -90, scale: [0.1, 1.25, 1.2], opacity: [0, 0.95, 0] }}
        transition={{ duration: 0.75, ease: "easeOut" }}
      />

      {/* ── 4. PARTÍCULAS SHIELD SPARKLES (Estrelas Arcanas desvanecendo) ── */}
      {[-30, 30].map((offsetX, i) => (
        <motion.circle
          key={i}
          cx={offsetX}
          cy={i === 0 ? -15 : 15}
          r={2.5}
          fill="#ffffff"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 0.9, 0], y: i === 0 ? -18 : 18 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
      ))}
    </motion.g>
  );
};
