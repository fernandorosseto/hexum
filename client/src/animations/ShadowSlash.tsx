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
    <motion.g transform={`translate(${center.x}, ${center.y})`} className="pointer-events-none z-50 overflow-visible">
      
      {/* Primeiro Corte (Diagonal 1) */}
      <motion.path
        d={`M ${-size} ${-size} L ${size} ${size}`}
        fill="none"
        stroke="#e2e8f0" // slate-200
        strokeWidth="12"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 1))' }} // Roxo forte
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0], strokeWidth: [12, 0] }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      {/* Segundo Corte (Diagonal 2, com atraso mínimo) */}
      <motion.path
        d={`M ${-size} ${size} L ${size} ${-size}`}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="10"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 8px rgba(220, 38, 38, 1))' }} // Roxo/Vermelho forte
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0], strokeWidth: [10, 0] }}
        transition={{ delay: 0.15, duration: 0.3, ease: "easeOut" }}
      />

      {/* Explosão de Sombra Retardada */}
      <motion.circle
        r={HEX_SIZE}
        fill="rgba(15, 23, 42, 0.9)" // slate-900
        style={{ filter: 'blur(10px)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2], opacity: [0, 0.8, 0] }}
        transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
      />

    </motion.g>
  );
};
