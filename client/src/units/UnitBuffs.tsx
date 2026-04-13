import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BUFF_ICONS } from '../constants/buffIcons';
import type { Buff } from 'shared';

interface Props {
  buffs: Buff[];
}

export const UnitBuffs: React.FC<Props> = ({ buffs }) => {
  if (buffs.length === 0) return null;

  return (
    <div className="absolute -top-6 flex gap-1 z-30">
      <AnimatePresence>
        {buffs.map((buff, idx) => (
          <motion.div
            key={`${buff.type}-${idx}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`bg-black/90 rounded-full w-9 h-9 flex items-center justify-center text-base border border-white/30 shadow-xl ${buff.type === 'fear' ? 'text-purple-400' : ''}`}
            title={`${buff.type} ${buff.duration > 0 ? '(' + buff.duration + ')' : ''}`}
          >
            {BUFF_ICONS[buff.type] || '✨'}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
