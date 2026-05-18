import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';
import { HexCoordinates } from 'shared';

interface Props {
  target: HexCoordinates;
}

/**
 * Animação de Passos de Vento Premium.
 * 
 * Cria turbilhões e lufadas de vento tridimensionais curvados (wind arcs)
 * que contornam a base do card com brilho azul/cyan neon, acompanhados de anéis
 * de deslocamento de ar rotativos e de alta velocidade.
 */
export const WindTrailAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none z-50 overflow-visible">
      {/* ── 1. LUFADAS E ARCOS DE VENTO (Curvas Aerodinâmicas Aerotransportadas) ── */}
      {/* Lufada Superior */}
      <motion.path
        d="M -35 -15 Q 0 -42 35 -15"
        fill="none"
        stroke="#e0f2fe" // sky-100
        strokeWidth="3.2"
        strokeLinecap="round"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ pathLength: 0, opacity: 0, x: -10 }}
        animate={{ pathLength: [0, 1], opacity: [0, 0.95, 0], x: 10 }}
        transition={{ duration: 0.58, repeat: 1, ease: "easeOut" }}
      />
      
      {/* Lufada Inferior */}
      <motion.path
        d="M -30 20 Q 0 45 30 20"
        fill="none"
        stroke="#7dd3fc" // sky-300
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ pathLength: 0, opacity: 0, x: 12 }}
        animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0], x: -12 }}
        transition={{ duration: 0.58, repeat: 1, ease: "easeOut" }}
      />

      {/* Onda de Vento Transversal Sinuosa */}
      <motion.path
        d="M -40 0 Q -20 18 0 0 Q 20 -18 40 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1], opacity: [0, 1.0, 0] }}
        transition={{ duration: 0.52, delay: 0.08, repeat: 1, ease: "easeInOut" }}
      />

      {/* ── 2. ANEL DE DESLOCAMENTO TÉRMICO DE AR (Turbilhão Rúnico) ── */}
      <motion.circle
        r={38}
        fill="none"
        stroke="#38bdf8" // sky-400
        strokeWidth="2.5"
        strokeDasharray="8 14" // Anel de vento rúnico
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ rotate: 0, scale: 0.3, opacity: 0 }}
        animate={{ 
          rotate: [0, 220], 
          scale: [0.3, 1.35, 1.2], 
          opacity: [0, 0.9, 0] 
        }}
        transition={{ duration: 0.72, ease: "easeOut" }}
      />
    </motion.g>
  );
};
