import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';

interface Props {
  targets: { q: number; r: number }[];
}

export const WallFormationAnimation: React.FC<Props> = ({ targets }) => {
  return (
    <g className="pointer-events-none">
      {targets.map((target, idx) => {
        const { x, y } = hexToPixel(target);
        return (
          <motion.g key={idx} transform={`translate(${x}, ${y})`}>
            {/* Cristais de gelo subindo */}
            {[ -15, 0, 15 ].map((offsetX, i) => (
              <motion.path
                key={i}
                d={`M ${offsetX} 20 L ${offsetX - 10} 0 L ${offsetX} -30 L ${offsetX + 10} 0 Z`}
                fill="#bae6fd"
                stroke="#7dd3fc"
                strokeWidth="1"
                initial={{ scaleY: 0, opacity: 0, y: 30 }}
                animate={{ scaleY: [0, 1.2, 1], opacity: [0, 1, 0], y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                style={{ originY: "20px" }}
              />
            ))}
            {/* Brilho de geada */}
            <motion.circle
              r={30}
              fill="rgba(186, 230, 253, 0.3)"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0] }}
              transition={{ duration: 0.5 }}
            />
          </motion.g>
        );
      })}
    </g>
  );
};
