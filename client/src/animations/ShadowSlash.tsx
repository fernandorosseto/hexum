import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board';
import { HexCoordinates } from 'shared';

interface Props {
  target: HexCoordinates;
}

export const ShadowSlash: React.FC<Props> = ({ target }) => {
  const center = hexToPixel(target);
  const size = HEX_SIZE * 1.5;

  return (
    <g transform={`translate(${center.x}, ${center.y})`}>
      <defs>
        {/* Gradiente radial de alta performance para a explosão de sombra (evita filtros de desfoque lentos) */}
        <radialGradient id="shadow-explosion-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(15, 23, 42, 0.95)" />
          <stop offset="60%" stopColor="rgba(88, 28, 135, 0.5)" /> {/* Roxo escuro */}
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
        </radialGradient>
      </defs>

      <motion.g className="pointer-events-none z-50 overflow-visible">
      
      {/* ── PRIMEIRO CORTE (Diagonal 1) ── */}
      {/* Camada Neon Externa */}
      <motion.path
        d={`M ${-size} ${-size} L ${size} ${size}`}
        fill="none"
        stroke="#c084fc" // purple-400
        strokeWidth="12"
        strokeLinecap="round"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
      {/* Núcleo Branco de Alta Intensidade */}
      <motion.path
        d={`M ${-size} ${-size} L ${size} ${size}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />

      {/* ── SEGUNDO CORTE (Diagonal 2, com atraso dinâmico) ── */}
      {/* Camada Neon Externa */}
      <motion.path
        d={`M ${-size} ${size} L ${size} ${-size}`}
        fill="none"
        stroke="#c084fc" // purple-400
        strokeWidth="10"
        strokeLinecap="round"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ delay: 0.12, duration: 0.25, ease: "easeOut" }}
      />
      {/* Núcleo Branco de Alta Intensidade */}
      <motion.path
        d={`M ${-size} ${size} L ${size} ${-size}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ delay: 0.12, duration: 0.25, ease: "easeOut" }}
      />

      {/* Explosão de Sombra Retardada */}
      <motion.circle
        r={HEX_SIZE * 1.4}
        fill="url(#shadow-explosion-grad)"
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.2], opacity: [0, 1, 0] }}
        transition={{ delay: 0.18, duration: 0.35, ease: "easeOut" }}
      />

      </motion.g>
    </g>
  );
};
