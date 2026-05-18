import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BUFF_ICONS } from '../constants/buffIcons';
import type { Buff } from 'shared';
import { HEX_SIZE } from '../board/HexUtils';

interface Props {
  buffs: Buff[];
}

export const UnitBuffs: React.FC<Props> = ({ buffs }) => {
  if (buffs.length === 0) return null;

  // Proporções dinâmicas com base no HEX_SIZE
  const rBase = HEX_SIZE * (70 / 90);
  const buffSpacing = HEX_SIZE * (36 / 90);
  const buffR = HEX_SIZE * (14 / 90);
  const strokeWidth = HEX_SIZE * (1 / 90);
  const fontSize = HEX_SIZE * (16 / 90);
  const textYOffset = HEX_SIZE * (5 / 90);
  
  const totalWidth = buffs.length * buffSpacing;
  const startX = -(totalWidth / 2) + (buffSpacing / 2);
  const buffY = -rBase + 5;

  return (
    <g className="pointer-events-none" style={{ zIndex: 30 }}>
      <AnimatePresence>
        {buffs.map((buff, idx) => (
          <motion.g
            key={`${buff.type}-${idx}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transform={`translate(${startX + idx * buffSpacing}, ${buffY})`}
          >
            <circle cx="0" cy="0" r={buffR} fill="rgba(0, 0, 0, 0.9)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth={strokeWidth} filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))" />
            <text x="0" y={textYOffset} fontSize={fontSize} textAnchor="middle" fill={buff.type === 'fear' ? '#c084fc' : '#ffffff'}>
              {BUFF_ICONS[buff.type] || '✨'}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>
    </g>
  );
};
