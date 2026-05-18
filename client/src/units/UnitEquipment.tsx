import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtifactIcon } from '../assets/icons/VectorIcons';
import { HEX_SIZE } from '../board/HexUtils';

interface Props {
  artifacts: string[];
}

export const UnitEquipment: React.FC<Props> = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) return null;

  // Proporções dinâmicas com base no HEX_SIZE
  const rBase = HEX_SIZE * (70 / 90);
  const equipSpacing = HEX_SIZE * (24 / 90);
  const strokeWidth = HEX_SIZE * (1 / 90);
  
  const rectSize = HEX_SIZE * (22 / 90);
  const iconSize = HEX_SIZE * (18 / 90);

  const totalHeight = artifacts.length * equipSpacing;
  const startY = -(totalHeight / 2) + (equipSpacing / 2);
  const equipX = rBase - 5;

  return (
    <g className="pointer-events-none" style={{ zIndex: 30 }}>
      <AnimatePresence>
        {artifacts.map((artId, idx) => (
          <motion.g
            key={`${artId}-${idx}`}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 10, opacity: 0 }}
            transform={`translate(${equipX}, ${startY + idx * equipSpacing})`}
          >
            <rect 
              x={-rectSize / 2} 
              y={-rectSize / 2} 
              width={rectSize} 
              height={rectSize} 
              rx={HEX_SIZE * (3 / 90)} 
              fill="rgba(15, 23, 42, 0.9)" 
              stroke="rgba(245, 158, 11, 0.5)" 
              strokeWidth={strokeWidth} 
              filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))" 
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
        ))}
      </AnimatePresence>
    </g>
  );
};
