import React from 'react';
import { motion } from 'framer-motion';
import type { HexCoordinates } from 'shared';
import { hexToPixel, HEX_SIZE } from '../board/HexUtils';

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

  // Comprimento base robusto da lança (75% da distância)
  const spearLength = thrustDistance * 0.75;
  const shaftLength = Math.max(0, spearLength - 36);
  const hitPosition = thrustDistance - spearLength;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${thrustAngle})`}>
      {/* ── 1. ANEL DE FORÇA DE IMPACTO (Sincronizado com o impacto aos 350ms) ── */}
      <g transform={`translate(${thrustDistance}, 0)`}>
        <motion.circle
          r={HEX_SIZE * 0.7}
          fill="none"
          stroke="#2dd4bf" // Teal
          strokeWidth="4"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, 1.8], opacity: [0.9, 0] }}
          transition={{ delay: 0.35, duration: 0.3, ease: "easeOut" }}
        />
        <motion.circle
          r={HEX_SIZE * 0.7}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, 1.6], opacity: [1, 0] }}
          transition={{ delay: 0.35, duration: 0.25, ease: "easeOut" }}
        />

        {/* ── 2. FAÍSCAS METÁLICAS DE COLISÃO (Explosão radial no impacto) ── */}
        {/* Faísca 1 (Norte) */}
        <motion.line
          x1="0" y1="0" x2="-25" y2="-25"
          stroke="#2dd4bf"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [1, 0] }}
          transition={{ delay: 0.37, duration: 0.3, ease: "easeOut" }}
        />
        {/* Faísca 2 (Sul) */}
        <motion.line
          x1="0" y1="0" x2="-25" y2="25"
          stroke="#2dd4bf"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [1, 0] }}
          transition={{ delay: 0.36, duration: 0.31, ease: "easeOut" }}
        />
        {/* Faísca 3 (Traseira-Esquerda) */}
        <motion.line
          x1="0" y1="0" x2="-40" y2="-10"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [1, 0] }}
          transition={{ delay: 0.35, duration: 0.33, ease: "easeOut" }}
        />
        {/* Faísca 4 (Traseira-Direita) */}
        <motion.line
          x1="0" y1="0" x2="-40" y2="10"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [1, 0] }}
          transition={{ delay: 0.34, duration: 0.35, ease: "easeOut" }}
        />
        {/* Faísca 5 (Diagonal Cima) */}
        <motion.line
          x1="0" y1="0" x2="-15" y2="-35"
          stroke="#fbbf24" // Amber spark for hot metal clash
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [1, 0] }}
          transition={{ delay: 0.38, duration: 0.28, ease: "easeOut" }}
        />
        {/* Faísca 6 (Diagonal Baixo) */}
        <motion.line
          x1="0" y1="0" x2="-15" y2="35"
          stroke="#fbbf24"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [1, 0] }}
          transition={{ delay: 0.35, duration: 0.34, ease: "easeOut" }}
        />
      </g>

      {/* ── 3. A LANÇA ELEGANTE (Anticipation + Smear Thrust + Impact Squash + Recoil) ── */}
      <motion.g
        initial={{ x: 0, scaleX: 1.0, scaleY: 1.0, opacity: 0 }}
        animate={{
          x: [0, -35, thrustDistance * 0.4, hitPosition, hitPosition + 3, 0],       // Anticipation recoil, fast smear, impact hit, recoil pull
          scaleX: [1.0, 1.0, 1.8, 0.7, 0.9, 0.1],                                  // Piercing stretching (1.8x max), impact squash (0.7x)
          scaleY: [1.0, 1.0, 0.45, 1.8, 1.1, 0.1],                                 // Aerodynamic thinning (0.45x), impact squash widening (1.8x)
          opacity: [0, 1, 0.95, 1, 0.9, 0]
        }}
        transition={{
          duration: 0.65,
          ease: "easeOut",
          times: [0, 0.25, 0.45, 0.55, 0.75, 1.0]
        }}
        style={{ transformOrigin: "0% 50%" }}
      >
        {/* Contrapeso (Pommel) na base da lança */}
        <path
          d="M-6,-4 L0,-2 L0,2 L-6,4 Z"
          fill="#2dd4bf"
          filter="url(#neon-glow-p1)"
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
          x={0}
          y={-1}
          width={shaftLength}
          height={2}
          rx={1}
          fill="white"
          opacity="0.6"
        />

        {/* Ponta da Lança (Lança Medieval / Alada) */}
        <g transform={`translate(${shaftLength - 2}, 0)`}>
          {/* Lâmina principal e guardas laterais */}
          <path
            d="M0,-6 L4,-6 L4,-3 L12,-5 L35,0 L12,5 L4,3 L4,6 L0,6 Z"
            fill="#2dd4bf"
            filter="url(#neon-glow-p1)"
          />
          {/* Fio da lâmina (Brilho interno) */}
          <path
            d="M2,-2 L4,-2 L4,-1 L10,-2 L30,0 L10,2 L4,1 L4,2 L2,2 Z"
            fill="white"
            opacity="0.8"
          />
          {/* Eixo central da lâmina */}
          <line 
            x1="0" y1="0" x2="33" y2="0" 
            stroke="white" strokeWidth="1" opacity="0.9" 
          />
        </g>
      </motion.g>
    </g>
  );
};
