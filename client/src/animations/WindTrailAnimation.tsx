import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';

interface Props {
  target: { q: number; r: number };
}

export const WindTrailAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {/* Linhas de velocidade/vento */}
      {[0, 120, 240].map((angle, i) => (
        <motion.path
          key={i}
          d="M -30 0 L 30 0"
          stroke="rgba(147, 197, 253, 0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0, rotate: angle, x: -20 }}
          animate={{ pathLength: 1, opacity: [0, 1, 0], x: 20 }}
          transition={{ duration: 0.5, repeat: 2, ease: "linear" }}
        />
      ))}
      <motion.circle
        r={35}
        fill="none"
        stroke="#93c5fd"
        strokeWidth="1"
        strokeDasharray="4 4"
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: 1 }}
      />
    </motion.g>
  );
};
