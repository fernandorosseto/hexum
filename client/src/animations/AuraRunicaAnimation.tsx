import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';

interface Props {
  target: { q: number; r: number };
}

export const AuraRunicaAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {/* Círculo rúnico giratório */}
      <motion.circle
        r={45}
        fill="none"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeDasharray="10 5"
        initial={{ rotate: 0, scale: 0, opacity: 0 }}
        animate={{ rotate: 360, scale: 1.2, opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* Brilho hexagonal */}
      <motion.path
        d="M 30 0 L 15 26 L -15 26 L -30 0 L -15 -26 L 15 -26 Z"
        fill="rgba(96, 165, 250, 0.2)"
        stroke="#93c5fd"
        strokeWidth="3"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0] }}
        transition={{ duration: 0.7 }}
      />
    </motion.g>
  );
};
