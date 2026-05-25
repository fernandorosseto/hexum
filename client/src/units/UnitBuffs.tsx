import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuffIcon } from '../assets/icons/VectorIcons';
import type { Buff } from 'shared';
import { HEX_SIZE } from '../board/HexUtils';

interface Props {
  buffs: Buff[];
  totalCount?: number;
  startIndex?: number;
}

export const UnitBuffs: React.FC<Props> = ({ buffs, totalCount = buffs.length, startIndex = 0 }) => {
  if (buffs.length === 0) return null;

  // Proporções dinâmicas com base no HEX_SIZE
  const rBase = HEX_SIZE * (70 / 90);
  const strokeWidth = HEX_SIZE * (1.5 / 90);
  const buffR = HEX_SIZE * (14 / 90);

  return (
    <g className="pointer-events-none" style={{ zIndex: 30 }}>
      <AnimatePresence>
        {buffs.map((buff, idx) => {
          const borderCol = 'rgba(205, 127, 50, 0.8)'; // Bronze padrão

          // Index global para distribuição circular ao longo da borda
          const globalIdx = startIndex + idx;
          const angleDegrees = 45 - ((totalCount - 1) / 2 - globalIdx) * 26;
          const angleRad = (angleDegrees * Math.PI) / 180;
          
          const targetX = rBase * Math.cos(angleRad);
          const targetY = -rBase * Math.sin(angleRad);

          return (
            <g key={`${buff.type}-${idx}`} transform={`translate(${targetX}, ${targetY})`}>
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {/* Círculo base com borda colorida bronze padrão */}
                <circle 
                  cx="0" cy="0" 
                  r={buffR} 
                  fill="rgba(15, 23, 42, 0.95)" 
                  stroke={borderCol} 
                  strokeWidth={strokeWidth} 
                  filter="drop-shadow(0px 2px 4px rgba(205,127,50,0.4))" 
                />
                
                {/* Ícone vetorial premium posicionado e centralizado */}
                <svg 
                  x={-buffR * 0.6} 
                  y={-buffR * 0.6} 
                  width={buffR * 1.2} 
                  height={buffR * 1.2} 
                  overflow="visible"
                >
                  <BuffIcon id={buff.type} size={buffR * 1.2} />
                </svg>
              </motion.g>
            </g>
          );
        })}
      </AnimatePresence>
    </g>
  );
};
