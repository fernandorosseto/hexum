import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';

export const BattleLog: React.FC = () => {
  const logs = useGameStore(state => state.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fundo quando novos logs chegam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="flex flex-col gap-1.5 md:gap-2 px-2 md:px-3 py-2 max-h-[160px] md:max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-black/20 rounded-xl border border-white/5 shadow-inner"
    >
      {logs.map((log, index) => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const total = logs.length;
        // No mobile mostramos apenas os últimos logs se não houver scroll, 
        // mas aqui vamos permitir scroll então o filtro index > 1 não é mais necessário se o painel for interativo.
        
        // Opacidade baseada na proximidade do fim (mais recente)
        const age = total - 1 - index;
        const opacity = age === 0 ? 'opacity-100' : age < 3 ? 'opacity-70' : age < 8 ? 'opacity-40' : 'opacity-20';

        return (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              shrink-0 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border-l-3 shadow-md backdrop-blur-lg transition-all duration-300
              ${log.playerId === 'p1' 
                ? 'bg-blue-950/60 border-l-blue-500 text-blue-100' 
                : log.playerId === 'p2'
                  ? 'bg-red-950/60 border-l-red-500 text-red-100'
                  : 'bg-slate-800/60 border-l-slate-400 text-slate-200'
              }
              ${opacity}
              ${isMobile ? 'text-[10px]' : ''}
            `}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                log.playerId === 'p1' ? 'bg-blue-400' : log.playerId === 'p2' ? 'bg-red-400' : 'bg-slate-400'
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
