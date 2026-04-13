import React from 'react';
import { motion } from 'framer-motion';
import type { HexCoordinates } from 'shared';
import { getHexNeighbors } from 'shared';
import { hexToPixel, HEX_SIZE } from '../board/HexUtils';

interface MeteorAnimationProps {
  epicenter: HexCoordinates;
}

/**
 * Animação de Chuva de Meteoros.
 * 
 * Renderiza múltiplos meteoros caindo em arco sobre o epicentro e hexágonos vizinhos,
 * com explosões de fogo e ondas de choque.
 * 
 * DEVE ser renderizado dentro de um <svg>.
 */
export const MeteorAnimation: React.FC<MeteorAnimationProps> = ({ epicenter }) => {
  const epicenterPos = hexToPixel(epicenter);
  const neighborHexes = getHexNeighbors(epicenter);
  const epicenterOffsets = [{ dx: 15, dy: 10 }, { dx: -10, dy: -20 }, { dx: -20, dy: 5 }, { dx: 10, dy: -15 }];
  const meteorData = [
    ...epicenterOffsets.map((off, i) => ({ target: { x: epicenterPos.x + off.dx, y: epicenterPos.y + off.dy }, delay: i * 0.05, isEpicenter: true })),
    ...neighborHexes.map((n, i) => ({ target: hexToPixel(n), delay: 0.1 + i * 0.05, isEpicenter: false }))
  ];

  return (
    <motion.g key="meteor-animation" className="pointer-events-none">
      {meteorData.map((m, idx) => (
        <motion.g key={`meteor-drop-${idx}`}>
          <motion.g 
            initial={{ x: m.target.x - 150, y: m.target.y - 300, opacity: 0 }} 
            animate={{ x: m.target.x, y: m.target.y, opacity: [0, 1, 1, 0] }} 
            transition={{ duration: 0.2, delay: m.delay, ease: "easeIn" }}
          >
            <line x1="-10" y1="-40" x2="0" y2="0" stroke="url(#meteor-trail)" strokeWidth="6" strokeLinecap="round" />
            <circle r={m.isEpicenter ? 8 : 6} fill="#ef4444" />
          </motion.g>
          <motion.g 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: m.delay + 0.2 }} 
            transform={`translate(${m.target.x}, ${m.target.y})`}
          >
            <motion.circle 
              r={m.isEpicenter ? HEX_SIZE * 1.2 : HEX_SIZE * 0.8} 
              fill="url(#explosion-glow)" 
              initial={{ scale: 0 }} 
              animate={{ scale: [1, 1.2, 0], opacity: [0.8, 1, 0] }} 
              transition={{ duration: 0.3 }} 
            />
          </motion.g>
        </motion.g>
      ))}
    </motion.g>
  );
};
