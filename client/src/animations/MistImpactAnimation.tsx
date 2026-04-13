import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';

interface Props {
  target: { q: number; r: number };
}

export const MistImpactAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {/* Explosão de fumaça inicial */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <motion.circle
          key={i}
          r={20}
          fill="rgba(203, 213, 225, 0.6)"
          filter="blur(8px)"
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ 
            x: Math.cos(angle * Math.PI / 180) * 60, 
            y: Math.sin(angle * Math.PI / 180) * 60, 
            scale: [1, 2.5, 3],
            opacity: [0, 0.8, 0] 
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
      <motion.circle
        r={40}
        fill="white"
        filter="blur(15px)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2, 3], opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.6 }}
      />
    </motion.g>
  );
};
