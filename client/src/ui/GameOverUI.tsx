import React from 'react';
import { useGameStore } from '../store/gameStore';

export const GameOverUI: React.FC = () => {
  const winner = useGameStore(s => s.winner);
  const setCurrentView = useGameStore(s => s.setCurrentView);
  const resetGame = useGameStore(s => s.resetGame);

  if (!winner) return null;

  const isVictory = winner === 'p1';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-700">
      <div className="flex flex-col items-center max-w-md w-full px-8 text-center space-y-8">
        
        {/* Simbolo de Vitoria/Derrota */}
        <div className={`
          w-24 h-24 rounded-full flex items-center justify-center text-5xl
          ${isVictory 
            ? 'bg-[#0b622f]/20 text-[#10b981] border-2 border-[#0b622f]/50 shadow-[0_0_50px_rgba(11,98,47,0.3)]' 
            : 'bg-[#602471]/20 text-[#a855f7] border-2 border-[#602471]/50 shadow-[0_0_50px_rgba(96,36,113,0.3)]'
          }
        `}>
          {isVictory ? '👑' : '💀'}
        </div>

        <div className="space-y-2">
          <h1 className={`
            text-6xl font-black uppercase tracking-tighter
            ${isVictory ? 'text-[#10b981]' : 'text-[#a855f7]'}
          `}>
            {isVictory ? 'Vitória' : 'Derrota'}
          </h1>
          <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">
            {isVictory ? 'O Rei Inimigo sucumbiu perante o HEXUM' : 'Seu Rei caiu em combate'}
          </p>
        </div>

        <div className="w-full pt-8 space-y-4">
          <button
            onClick={() => {
              resetGame();
              setCurrentView('MENU');
            }}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-2xl"
          >
            Voltar ao Menu
          </button>
          
          <button
            onClick={() => {
               resetGame();
               // Mantém na view atual (PLAY ou SANDBOX) mas reseta o estado
            }}
            className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-slate-800 transition-all"
          >
            Nova Batalha
          </button>
        </div>

      </div>
    </div>
  );
};
