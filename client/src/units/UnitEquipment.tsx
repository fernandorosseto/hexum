import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtifactIcon } from '../assets/icons/VectorIcons';

interface Props {
  artifacts: string[];
}

export const UnitEquipment: React.FC<Props> = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) return null;

  return (
    <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
      <AnimatePresence>
        {artifacts.map((artId, idx) => (
          <motion.div
            key={`${artId}-${idx}`}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 10, opacity: 0 }}
            className="bg-slate-900/90 rounded border border-amber-500/50 p-1 shadow-lg flex items-center justify-center"
            title={artId}
          >
            <ArtifactIcon id={artId} size={18} className="text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
