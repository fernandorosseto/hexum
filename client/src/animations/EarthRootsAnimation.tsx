import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';

interface Props {
  target: { q: number; r: number };
}

export const EarthRootsAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.path
          key={i}
          d="M 0 0 Q 15 -20 5 -40"
          stroke="#3f6212"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0, rotate: angle }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          style={{ originX: "0px", originY: "0px" }}
        />
      ))}
      <motion.circle
        r={35}
        fill="none"
        stroke="#4d7c0f"
        strokeWidth="2"
        strokeDasharray="5 5"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.5 }}
      />
    </motion.g>
  );
};
