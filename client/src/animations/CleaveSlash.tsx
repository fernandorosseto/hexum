import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board';
import { HexCoordinates } from 'shared';

interface Props {
  source: HexCoordinates;
  target: HexCoordinates;
  color: 'gold' | 'cyan';
}

export const CleaveSlash: React.FC<Props> = ({ source, target, color }) => {
  const src = hexToPixel(source);
  const tgt = hexToPixel(target);
  
  // Calcular ângulo entre origem e destino
  const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x) * (180 / Math.PI);
  // O slash acontece um pouco antes de atingir o alvo na trajetória
  const slashCenter = {
    x: src.x + (tgt.x - src.x) * 0.7,
    y: src.y + (tgt.y - src.y) * 0.7,
  };

  const scale = color === 'gold' ? 1.5 : 1.0;
  
  // Cores personalizadas
  const strokeColor = color === 'gold' ? '#fde047' : '#22d3ee'; // yellow-300 ou cyan-400
  const glowColor = color === 'gold' ? 'rgba(234, 179, 8, 0.8)' : 'rgba(6, 182, 212, 0.8)'; // amber-500 ou cyan-500

  return (
    <motion.g 
      transform={`translate(${slashCenter.x}, ${slashCenter.y}) rotate(${angle}) scale(${scale})`} 
      className="pointer-events-none z-50 overflow-visible"
    >
      {/* O arco (cleave) */}
      <motion.path
        d={`M ${-HEX_SIZE} ${-HEX_SIZE*1.2} Q ${HEX_SIZE*1.5} 0 ${-HEX_SIZE} ${HEX_SIZE*1.2}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="16"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 10px ${glowColor}) blur(1px)` }}
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0], strokeWidth: [16, 2] }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      
      {/* Rastro branco interno */}
      <motion.path
        d={`M ${-HEX_SIZE} ${-HEX_SIZE*1.2} Q ${HEX_SIZE*1.5} 0 ${-HEX_SIZE} ${HEX_SIZE*1.2}`}
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        style={{ filter: "blur(0px)" }}
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
    </motion.g>
  );
};
