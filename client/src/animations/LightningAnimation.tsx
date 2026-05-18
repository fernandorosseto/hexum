import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animação de Relâmpago Premium com Queda do Céu.
 *
 * IMPORTANTE: Este componente é renderizado dentro de um <g> SVG (via UnitSprite),
 * portanto DEVE usar apenas elementos SVG puros — nunca <div> ou HTML.
 *
 * O raio cai de y=-400 (céu) até y=0 (posição da unidade) usando pathLength
 * para criar o efeito de desenho progressivo de cima para baixo.
 */
export const LightningAnimation: React.FC = () => (
  <motion.g
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 0.15, 0.95, 0] }}
    exit={{ opacity: 0 }}
    transition={{
      duration: 0.5,
      ease: 'easeOut',
      times: [0, 0.16, 0.3, 0.42, 1.0],
    }}
    className="pointer-events-none"
  >
    {/* Filtro de glow local (este SVG vive dentro do <svg> do HexMap,
        mas usamos um ID único para evitar conflitos) */}
    <defs>
      <filter id="lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* ── 1. GLOW EXTERNO AZUL (Camada de brilho neon) ── */}
    <motion.polyline
      points="0,-400 -8,-330 18,-270 -18,-200 10,-140 -28,-70 0,0"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: 'url(#lightning-glow)' }}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 0.4, 0.15, 0.35, 0] }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    />

    {/* ── 2. NÚCLEO BRANCO DE ALTA INTENSIDADE (Raio principal) ── */}
    <motion.polyline
      points="0,-400 -8,-330 18,-270 -18,-200 10,-140 -28,-70 0,0"
      fill="none"
      stroke="#ffffff"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 1, 0.7, 1, 0] }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    />

    {/* ── 3. RAMIFICAÇÕES ELÉTRICAS SECUNDÁRIAS ── */}
    {/* Ramo superior-direito */}
    <motion.polyline
      points="18,-270 38,-240 28,-210 45,-185"
      fill="none"
      stroke="#06b6d4"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: 'url(#lightning-glow)' }}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 0.8, 0] }}
      transition={{ delay: 0.06, duration: 0.18 }}
    />
    {/* Ramo médio-esquerdo */}
    <motion.polyline
      points="-18,-200 -40,-170 -30,-140 -48,-115"
      fill="none"
      stroke="#06b6d4"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: 'url(#lightning-glow)' }}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 0.8, 0] }}
      transition={{ delay: 0.08, duration: 0.18 }}
    />
    {/* Ramo inferior-direito */}
    <motion.polyline
      points="-28,-70 -48,-45 -38,-20"
      fill="none"
      stroke="#22d3ee"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 0.7, 0] }}
      transition={{ delay: 0.1, duration: 0.15 }}
    />

    {/* ── 4. HALO DE IMPACTO NO CHÃO ── */}
    <motion.circle
      cx={0}
      cy={0}
      r={30}
      fill="none"
      stroke="#e0f2fe"
      strokeWidth="4"
      style={{ filter: 'url(#lightning-glow)' }}
      initial={{ scale: 0.1, opacity: 0 }}
      animate={{ scale: [0.1, 1.6], opacity: [0.95, 0] }}
      transition={{ delay: 0.15, duration: 0.3, ease: 'easeOut' }}
    />
    <motion.circle
      cx={0}
      cy={0}
      r={18}
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      initial={{ scale: 0.1, opacity: 0 }}
      animate={{ scale: [0.1, 1.3], opacity: [1, 0] }}
      transition={{ delay: 0.15, duration: 0.25, ease: 'easeOut' }}
    />

    {/* ── 5. FAÍSCAS DE IMPACTO ── */}
    <motion.line
      x1={0} y1={0} x2={-30} y2={-25}
      stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [1, 0] }}
      transition={{ delay: 0.17, duration: 0.22 }}
    />
    <motion.line
      x1={0} y1={0} x2={30} y2={-25}
      stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [1, 0] }}
      transition={{ delay: 0.16, duration: 0.24 }}
    />
    <motion.line
      x1={0} y1={0} x2={0} y2={-45}
      stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [1, 0] }}
      transition={{ delay: 0.18, duration: 0.2 }}
    />
  </motion.g>
);
