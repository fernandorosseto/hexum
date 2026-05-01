import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtifactIcon } from '../assets/icons/VectorIcons';

interface Props {
  artifacts: string[];
}

export const UnitEquipment: React.FC<Props> = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) return null;

  const totalHeight = artifacts.length * 24;
  const startY = -(totalHeight / 2) + 12;

  return (
    <g className="pointer-events-none" style={{ zIndex: 30 }}>
      <AnimatePresence>
        {artifacts.map((artId, idx) => (
          <motion.g
            key={`${artId}-${idx}`}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 10, opacity: 0 }}
            transform={`translate(65, ${startY + idx * 24})`}
          >
            <rect x="-11" y="-11" width="22" height="22" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="1" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))" />
            <svg x="-9" y="-9" width="18" height="18" overflow="visible">
              <ArtifactIcon id={artId} size={18} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />
            </svg>
          </motion.g>
        ))}
      </AnimatePresence>
    </g>
  );
};
