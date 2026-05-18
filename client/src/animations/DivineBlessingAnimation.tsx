import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';
import { HexCoordinates } from 'shared';

interface Props {
  target: HexCoordinates;
}

/**
 * Animação de Bênção Divina Premium.
 * 
 * Cria um pilar cônico de luz divina dourada descendente
 * e cruzes sagradas bioluminescentes que sobem suavemente em direção aos céus
 * acompanhadas de partículas douradas de cura.
 */
export const DivineBlessingAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none z-50 overflow-visible">
      {/* ── 1. PILAR SAGRADO DE LUZ (Pilar Cônico Radiante) ── */}
      <motion.polygon
        points="-28,-500 -16,10 16,10 28,-500"
        fill="url(#holy-gradient)"
        style={{ filter: 'url(#neon-glow-p1)', originY: 10 }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ 
          opacity: [0, 0.95, 0.95, 0], 
          scaleY: [0, 1.0, 1.0, 1.0] 
        }}
        transition={{ 
          duration: 0.85, 
          times: [0, 0.22, 0.78, 1.0], 
          ease: "easeOut" 
        }}
      />
      
      {/* Núcleo de Luz Branca de Alta Concentração */}
      <motion.polygon
        points="-12,-500 -6,10 6,10 12,-500"
        fill="white"
        opacity="0.8"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ 
          opacity: [0, 0.85, 0.85, 0], 
          scaleY: [0, 1.0, 1.0, 1.0] 
        }}
        transition={{ 
          duration: 0.85, 
          times: [0, 0.2, 0.8, 1.0], 
          ease: "easeOut" 
        }}
        style={{ originY: 10 }}
      />

      {/* ── 2. HALO REGENERATIVO NO CHÃO (Impacto da Cura) ── */}
      <motion.circle
        r={48}
        fill="rgba(253, 224, 71, 0.15)"
        stroke="#fef08a" // yellow-200
        strokeWidth="2.5"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.45], opacity: [0.95, 0] }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />

      {/* ── 3. CRUZES SAGRADAS ASCENDENTES (Healing Runes) ── */}
      {/* Cruz 1 (Centro-Esquerda) */}
      <motion.path
        d="M -5 0 L 5 0 M 0 -5 L 0 5"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ x: -14, y: 10, scale: 0.1, opacity: 0 }}
        animate={{ x: -22, y: -90, scale: [0.1, 1.3, 0.8], opacity: [0, 0.95, 0] }}
        transition={{ delay: 0.15, duration: 0.65, ease: "easeOut" }}
      />
      {/* Cruz 2 (Centro-Direita) */}
      <motion.path
        d="M -4 0 L 4 0 M 0 -4 L 0 4"
        stroke="#fde047" // yellow-300
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ x: 18, y: 0, scale: 0.1, opacity: 0 }}
        animate={{ x: 26, y: -120, scale: [0.1, 1.2, 0.7], opacity: [0, 0.9, 0] }}
        transition={{ delay: 0.22, duration: 0.6, ease: "easeOut" }}
      />
      {/* Cruz 3 (Centro) */}
      <motion.path
        d="M -5 0 L 5 0 M 0 -5 L 0 5"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ x: 2, y: 15, scale: 0.1, opacity: 0 }}
        animate={{ x: 0, y: -140, scale: [0.1, 1.4, 0.9], opacity: [0, 0.98, 0] }}
        transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
      />

      <defs>
        <linearGradient id="holy-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" /> {/* amber-600 */}
        </linearGradient>
      </defs>
    </motion.g>
  );
};
