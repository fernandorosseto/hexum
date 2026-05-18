import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';
import { HexCoordinates } from 'shared';

interface Props {
  target: HexCoordinates;
}

/**
 * Animação de Raízes da Terra Premium.
 * 
 * Cria raízes orgânicas espinhosas detalhadas que brotam do solo em espiral,
 * enrolando-se e brotando folhas de neon brilhantes, prendendo a unidade fisicamente.
 */
export const EarthRootsAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none z-50 overflow-visible">
      {/* ── 1. CIPÓS E RAÍZES ESPINHOSAS CONCÊNTRICAS (6 direções radiais) ── */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.g
          key={i}
          rotate={angle}
          style={{ originX: "0px", originY: "0px" }}
        >
          {/* A Raiz de Madeira Espessa */}
          <motion.path
            d="M 0 0 Q 18 -24 8 -48 Q 20 -64 12 -78"
            stroke="#3f6212" // lime-800
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.68, delay: i * 0.04, ease: "easeOut" }}
          />

          {/* O Brilho Bioluminescente da Seiva da Raiz (Neon) */}
          <motion.path
            d="M 0 0 Q 18 -24 8 -48 Q 20 -64 12 -78"
            stroke="#84cc16" // lime-500
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            style={{ filter: 'url(#neon-glow-p1)' }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.95, 0.95, 0] }}
            transition={{ duration: 0.68, delay: i * 0.04, ease: "easeOut" }}
          />

          {/* Folhas Místicas de Neon que Brotam das Raízes */}
          <motion.circle
            cx={8}
            cy={-48}
            r={3.8}
            fill="#a3e635" // lime-400
            stroke="#ffffff"
            strokeWidth="0.8"
            style={{ filter: 'url(#neon-glow-p1)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1, 0], opacity: [0, 0.9, 0.9, 0] }}
            transition={{ duration: 0.55, delay: i * 0.04 + 0.28 }}
          />
          <motion.circle
            cx={12}
            cy={-78}
            r={2.5}
            fill="#a3e635"
            stroke="#ffffff"
            strokeWidth="0.5"
            style={{ filter: 'url(#neon-glow-p1)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1, 0], opacity: [0, 0.9, 0.9, 0] }}
            transition={{ duration: 0.5, delay: i * 0.04 + 0.36 }}
          />
        </motion.g>
      ))}

      {/* ── 2. ONDA DE ADERÊNCIA TELÚRICA (Shockwave Florestal) ── */}
      <motion.circle
        r={38}
        fill="none"
        stroke="#4d7c0f"
        strokeWidth="3.5"
        strokeDasharray="6 6"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 0.2, opacity: 0, rotate: 0 }}
        animate={{ scale: [0.2, 1.25, 1.1], opacity: [0, 0.95, 0], rotate: [0, 45] }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />
    </motion.g>
  );
};
