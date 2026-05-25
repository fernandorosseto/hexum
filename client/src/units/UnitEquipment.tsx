import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtifactIcon } from '../assets/icons/VectorIcons';
import { HEX_SIZE } from '../board/HexUtils';

interface Props {
  artifacts: string[];
  totalCount?: number;
  startIndex?: number;
}

export const UnitEquipment: React.FC<Props> = ({ artifacts, totalCount = artifacts.length, startIndex = 0 }) => {
  if (!artifacts || artifacts.length === 0) return null;

  // Proporções dinâmicas com base no HEX_SIZE
  const rBase = HEX_SIZE * (70 / 90);
  const strokeWidth = HEX_SIZE * (1 / 90);
  
  const rectSize = HEX_SIZE * (22 / 90);
  const iconSize = HEX_SIZE * (18 / 90);

  return (
    <g className="pointer-events-none" style={{ zIndex: 30 }}>
      <AnimatePresence>
        {artifacts.map((artId, idx) => {
          // Index global para distribuição circular ao longo da borda
          const globalIdx = startIndex + idx;
          const angleDegrees = 45 - ((totalCount - 1) / 2 - globalIdx) * 26;
          const angleRad = (angleDegrees * Math.PI) / 180;
          
          const targetX = rBase * Math.cos(angleRad);
          const targetY = -rBase * Math.sin(angleRad);

          return (
            <g key={`${artId}-${idx}`} transform={`translate(${targetX}, ${targetY})`}>
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <rect 
                  x={-rectSize / 2} 
                  y={-rectSize / 2} 
                  width={rectSize} 
                  height={rectSize} 
                  rx={HEX_SIZE * (3 / 90)} 
                  fill="rgba(15, 23, 42, 0.95)" 
                  stroke="rgba(251, 191, 36, 0.8)" 
                  strokeWidth={strokeWidth} 
                  filter="drop-shadow(0px 2px 4px rgba(251,191,36,0.4))" 
                />
                <svg 
                  x={-iconSize / 2} 
                  y={-iconSize / 2} 
                  width={iconSize} 
                  height={iconSize} 
                  overflow="visible"
                >
                  <ArtifactIcon id={artId} size={iconSize} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />
                </svg>
              </motion.g>
            </g>
          );
        })}
      </AnimatePresence>
    </g>
  );
};
