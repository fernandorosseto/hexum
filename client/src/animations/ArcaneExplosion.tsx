import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board';
import { HexCoordinates } from 'shared';

interface Props {
  epicenter: HexCoordinates;
}

export const ArcaneExplosion: React.FC<Props> = ({ epicenter }) => {
  const center = hexToPixel(epicenter);

  return (
    <g transform={`translate(${center.x}, ${center.y})`}>
      <motion.g className="pointer-events-none z-50 overflow-visible">
        {/* ── 1. NÚCLEO DE IMPLOSÃO ANTERIOR AO DETONAMENTO (t = 0 a 140ms) ── */}
        <motion.circle
          r={HEX_SIZE * 0.9}
          fill="rgba(192, 132, 252, 0.35)" // purple-400 translúcido
          stroke="#c084fc"
          strokeWidth="2"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ scale: 2.2, opacity: 0 }}
          animate={{
            scale: [2.2, 0.15, 3.2],
            opacity: [0, 0.95, 0]
          }}
          transition={{
            duration: 0.58,
            times: [0, 0.24, 1.0],
            ease: "easeOut"
          }}
        />
        
        {/* ── 2. FLASHE BRANCO DA EXPLOSÃO (No pico da implosão, aos 140ms) ── */}
        <motion.circle
          r={HEX_SIZE * 1.3}
          fill="white"
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{
            scale: [0.1, 1.6, 2.5],
            opacity: [0, 1.0, 0]
          }}
          transition={{
            delay: 0.13,
            duration: 0.42,
            times: [0, 0.25, 1.0],
            ease: "easeOut"
          }}
        />

        {/* ── 3. ANEL RÚNICO CONCÊNTRICO EXTERNO (Magenta/Violeta) ── */}
        <motion.circle
          r={HEX_SIZE * 1.6}
          fill="none"
          stroke="rgba(168, 85, 247, 0.9)" // purple-500
          strokeWidth="6"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{
            scale: [0.1, 2.4],
            opacity: [0, 0.95, 0],
            strokeWidth: [6, 1.5]
          }}
          transition={{
            delay: 0.13,
            duration: 0.48,
            ease: "easeOut"
          }}
        />

        {/* ── 4. ANEL INTERNO RUNICO DASHED (Cyan / Místico) ── */}
        <motion.circle
          r={HEX_SIZE * 1.25}
          fill="none"
          stroke="#22d3ee" // cyan-400
          strokeWidth="4"
          strokeDasharray="8 6" // Cria os blocos simulando glifos/runas arcanas
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ scale: 0.1, opacity: 0, rotate: 0 }}
          animate={{
            scale: [0.1, 2.1],
            opacity: [0, 0.85, 0],
            rotate: [0, 90], // Rotação rúnica na expansão
            strokeWidth: [4, 1.0]
          }}
          transition={{
            delay: 0.15,
            duration: 0.45,
            ease: "easeOut"
          }}
        />

        {/* ── 5. FEIXES ESTELARES ARCANOS (Starburst Rays voando radialmente) ── */}
        {/* Ray 1 (0° - Leste) */}
        <motion.line
          x1="0" y1="0" x2="70" y2="0"
          stroke="#f472b6" strokeWidth="3.5" strokeLinecap="round" // pink-400
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.9, 0] }}
          transition={{ delay: 0.15, duration: 0.38, ease: "easeOut" }}
        />
        {/* Ray 2 (60° - Sudeste) */}
        <motion.line
          x1="0" y1="0" x2="35" y2="60.6"
          stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0] }}
          transition={{ delay: 0.17, duration: 0.36, ease: "easeOut" }}
        />
        {/* Ray 3 (120° - Sudoeste) */}
        <motion.line
          x1="0" y1="0" x2="-35" y2="60.6"
          stroke="#f472b6" strokeWidth="3.5" strokeLinecap="round"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.9, 0] }}
          transition={{ delay: 0.16, duration: 0.37, ease: "easeOut" }}
        />
        {/* Ray 4 (180° - Oeste) */}
        <motion.line
          x1="0" y1="0" x2="-70" y2="0"
          stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0] }}
          transition={{ delay: 0.14, duration: 0.39, ease: "easeOut" }}
        />
        {/* Ray 5 (240° - Noroeste) */}
        <motion.line
          x1="0" y1="0" x2="-35" y2="-60.6"
          stroke="#f472b6" strokeWidth="3.5" strokeLinecap="round"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.9, 0] }}
          transition={{ delay: 0.18, duration: 0.35, ease: "easeOut" }}
        />
        {/* Ray 6 (300° - Nordeste) */}
        <motion.line
          x1="0" y1="0" x2="35" y2="-60.6"
          stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0] }}
          transition={{ delay: 0.15, duration: 0.38, ease: "easeOut" }}
        />
      </motion.g>
    </g>
  );
};
