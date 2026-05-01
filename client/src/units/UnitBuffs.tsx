import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BUFF_ICONS } from '../constants/buffIcons';
import type { Buff } from 'shared';

interface Props {
  buffs: Buff[];
}

export const UnitBuffs: React.FC<Props> = ({ buffs }) => {
  if (buffs.length === 0) return null;

  const totalWidth = buffs.length * 36;
  const startX = -(totalWidth / 2) + 18;

  return (
    <g className="pointer-events-none" style={{ zIndex: 30 }}>
      <AnimatePresence>
        {buffs.map((buff, idx) => (
          <motion.g
            key={`${buff.type}-${idx}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transform={`translate(${startX + idx * 36}, -65)`}
          >
            <circle cx="0" cy="0" r="14" fill="rgba(0, 0, 0, 0.9)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))" />
            <text x="0" y="5" fontSize="16" textAnchor="middle" fill={buff.type === 'fear' ? '#c084fc' : '#ffffff'}>
              {BUFF_ICONS[buff.type] || '✨'}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>
    </g>
  );
};
