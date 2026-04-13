import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';

interface Props {
  target: { q: number; r: number };
}

export const FuryPulseAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {[1, 1.5, 2].map((s, i) => (
        <motion.circle
          key={i}
          r={40}
          fill="none"
          stroke="#ef4444"
          strokeWidth="4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: s, opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
        />
      ))}
      <motion.path
        d="M -20 -10 L 20 -10 L 0 20 Z"
        fill="#b91c1c"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.5 }}
      />
    </motion.g>
  );
};
