import React from 'react';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';

export const BattleLog: React.FC = () => {
  const logs = useGameStore(state => state.logs);

  return (
    <div className="flex flex-col gap-1.5 md:gap-2 pointer-events-none px-2 md:px-0 max-h-[150px] md:max-h-none overflow-hidden">
      {logs.map((log, index) => {
        // No mobile, mostramos apenas os 1 ou 2 logs mais recentes para não poluir
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        if (isMobile && index > 1) return null;

        return (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              px-2 md:px-3 py-1.5 md:py-2 rounded-lg border-l-3 shadow-md backdrop-blur-lg transition-all duration-300
              ${log.playerId === 'p1' 
                ? 'bg-blue-950/60 border-l-blue-500 text-blue-100' 
                : 'bg-red-950/60 border-l-red-500 text-red-100'
              }
              ${index === 0 ? 'opacity-100' : index < 3 ? 'opacity-60' : 'opacity-30'}
              ${isMobile ? 'text-[10px]' : ''}
            `}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                log.playerId === 'p1' ? 'bg-blue-400' : 'bg-red-400'
              }`} />
              <p className="text-[11px] font-medium leading-tight">{log.message}</p>
            </div>
          </motion.div>
        );
      })}
      
      {logs.length === 0 && (
        <div className="px-3 py-2 bg-slate-900/40 rounded-lg border border-slate-800/50 text-slate-500 text-[11px] italic">
          Aguardando jogadas...
        </div>
      )}
    </div>
  );
};
