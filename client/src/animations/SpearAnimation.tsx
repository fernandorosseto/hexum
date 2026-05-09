import React from 'react';
import { motion } from 'framer-motion';
import type { HexCoordinates } from 'shared';
import { hexToPixel } from '../board/HexUtils';

interface SpearAnimationProps {
  attackerPosition: HexCoordinates;
  target: HexCoordinates;
}

/**
 * Animação da Lança Holográfica Neon (Versão Pura SVG para iOS).
 */
export const SpearAnimation: React.FC<SpearAnimationProps> = ({ attackerPosition, target }) => {
  const { x, y } = hexToPixel(attackerPosition);
  const targetPx = hexToPixel(target);
  const dx = targetPx.x - x;
  const dy = targetPx.y - y;
  const thrustDistance = Math.hypot(dx, dy);
  const thrustAngle = Math.atan2(dy, dx) * (180 / Math.PI);

  const spearLength = thrustDistance * 0.8;
  const shaftLength = Math.max(0, spearLength - 36);
  const hitOffset = thrustDistance - spearLength;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${thrustAngle})`}>
      <motion.g
        initial={{ x: 0, opacity: 0, scale: 0.8 }}
        animate={{
          x: [0, -20, thrustDistance - 20, 0],
          opacity: [0, 1, 1, 0],
          scale: [0.8, 0.8, 1.1, 0.5]
        }}
        transition={{
          duration: 0.55,
          times: [0, 0.2, 0.5, 1],
          ease: ["easeOut", "backInOut", "circIn"]
        }}
      >
        {/* Glow de Impacto (Shockwave) */}
        <motion.circle
          cx={spearLength + 10}
          cy={0}
          r={5}
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="3"
          initial={{ opacity: 0, scale: 0.1 }}
          animate={{ opacity: [0, 1, 0], scale: [0.1, 4, 5] }}
          transition={{ duration: 0.3, delay: 0.25 }}
        />

        {/* Cabo da Lança */}
        <rect
          x={0}
          y={-2}
          width={shaftLength}
          height={4}
          rx={2}
          fill="#2dd4bf"
          filter="url(#neon-glow-p1)"
        />
        
        {/* Brilho interno do cabo */}
        <rect
          x={2}
          y={-1}
          width={shaftLength - 4}
          height={2}
          rx={1}
          fill="white"
          opacity="0.6"
        />

        {/* Ponta da Lança (Triângulo estilizado) */}
        <g transform={`translate(${shaftLength - 2}, 0)`}>
          <path
            d="M0,-8 L24,0 L0,8 L4,0 Z"
            fill="#2dd4bf"
            filter="url(#neon-glow-p1)"
          />
          <path
            d="M2,-4 L16,0 L2,4 L4,0 Z"
            fill="white"
            opacity="0.8"
          />
        </g>
      </motion.g>
    </g>
  );
};
