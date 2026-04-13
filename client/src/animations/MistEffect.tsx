import React from 'react';
import { motion } from 'framer-motion';
import type { Unit } from 'shared';
import { hexToPixel, HEX_SIZE } from '../board/HexUtils';

interface MistEffectProps {
  unit: Unit;
}

/**
 * Efeito visual de Névoa sobre uma unidade com imunidade a ataques à distância.
 * 
 * Renderiza círculos turbulentes ao redor da posição da unidade
 * com efeito de névoa fractal.
 * 
 * DEVE ser renderizado dentro de um <svg>.
 */
export const MistEffect: React.FC<MistEffectProps> = ({ unit }) => {
  const { x, y } = hexToPixel(unit.position);

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transform={`translate(${x}, ${y})`}
      className="pointer-events-none"
    >
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <motion.circle
          key={`mist-${unit.id}-${i}`}
          r={HEX_SIZE * 0.8}
          fill="url(#mist-radial)"
          filter="url(#mist-filter)"
          animate={{
            x: [Math.cos(angle * Math.PI / 180) * 10, Math.cos((angle + 40) * Math.PI / 180) * 30, Math.cos(angle * Math.PI / 180) * 10],
            y: [Math.sin(angle * Math.PI / 180) * 10, Math.sin((angle + 40) * Math.PI / 180) * 30, Math.sin(angle * Math.PI / 180) * 10],
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </motion.g>
  );
};
