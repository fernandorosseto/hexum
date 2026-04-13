import React from 'react';
import { motion } from 'framer-motion';
import type { HexCoordinates } from 'shared';
import { hexToPixel } from '../board/HexUtils';

interface TransfusionAnimationProps {
  source: HexCoordinates;
  target: HexCoordinates;
}

/**
 * Animação de Transfusão Sombria.
 * 
 * Renderiza um feixe de sangue animado entre a fonte e o alvo
 * com gradiente pulsante e brilhos nas pontas.
 * 
 * DEVE ser renderizado dentro de um <svg>.
 */
export const TransfusionAnimation: React.FC<TransfusionAnimationProps> = ({ source, target }) => {
  const start = hexToPixel(source);
  const end = hexToPixel(target);

  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none">
      <motion.path d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`} fill="none" stroke="url(#blood-gradient)" strokeWidth="12" strokeLinecap="round" />
      <circle cx={start.x} cy={start.y} r={10} fill="url(#blood-glow)" opacity="0.5" />
      <circle cx={end.x} cy={end.y} r={12} fill="url(#blood-glow)" opacity="0.5" />
    </motion.g>
  );
};
