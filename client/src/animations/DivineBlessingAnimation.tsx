import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';

interface Props {
  target: { q: number; r: number };
}

export const DivineBlessingAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {/* Coluna de Luz Central */}
      <motion.rect
        x={-20}
        y={-500}
        width={40}
        height={500}
        fill="url(#holy-gradient)"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scaleY: 1 }}
        transition={{ duration: 0.8, times: [0, 0.2, 0.8, 1] }}
        style={{ originY: 1 }}
      />
      {/* Brilho no Impacto */}
      <motion.circle
        r={50}
        fill="rgba(253, 224, 71, 0.4)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 2], opacity: [0, 1, 0] }}
        transition={{ duration: 0.8 }}
      />
      <defs>
        <linearGradient id="holy-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="gold" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </motion.g>
  );
};
