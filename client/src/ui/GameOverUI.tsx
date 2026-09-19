import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { translations } from './translations';

export const GameOverUI: React.FC = () => {
  const winner = useGameStore(s => s.winner);
  const isPvP = useGameStore(s => s.isPvP);
  const myRole = useGameStore(s => s.myRole);
  const setCurrentView = useGameStore(s => s.setCurrentView);
  const resetGame = useGameStore(s => s.resetGame);
  const clearLobbySession = useGameStore(s => s.clearLobbySession);
  const language = useGameStore(s => s.language);
  const t = translations[language];
  
  const [shouldShow, setShouldShow] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Delay inicial de 2 segundos antes de subir o modal
  useEffect(() => {
    if (!winner) return;
    const delayTimer = setTimeout(() => setShouldShow(true), 2000);
    return () => clearTimeout(delayTimer);
  }, [winner]);

  // Timer automático de 1 minuto para sair da partida
  useEffect(() => {
    if (!winner || !shouldShow) return;

    const autoExitTimer = setTimeout(() => {
      if (useGameStore.getState().isPvP) clearLobbySession();
      resetGame();
      setCurrentView('MENU');
    }, 60000); // 1 minuto

    return () => clearTimeout(autoExitTimer);
  }, [winner, shouldShow, resetGame, setCurrentView, clearLobbySession]);

  if (!winner || !shouldShow) return null;

  // No PvP o convidado joga como p2; fixar 'p1' mostrava derrota para quem venceu.
  const localPlayerId = isPvP ? (myRole ?? 'p1') : 'p1';
  const isVictory = winner === localPlayerId;

  // Versão minimizada do modal para revisão do campo
  if (isMinimized) {
    return (
      <div className="fixed top-20 right-4 z-[600] animate-in slide-in-from-right duration-500">
        <button
          onClick={() => setIsMinimized(false)}
          className={`
            px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl border-2
            ${isVictory ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-purple-600 text-white border-purple-400'}
            hover:scale-105 active:scale-95 transition-all
          `}
        >
           {t.viewResult} {isVictory ? '👑' : '💀'}
         </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-700">
      <div className="flex flex-col items-center max-w-sm w-full px-10 text-center space-y-12">
        
        {/* Simbolo centralizado com Brilho Atmosférico */}
        <div className={`
          relative w-24 h-24 rounded-full flex items-center justify-center text-5xl
          ${isVictory 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
            : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
          }
          animate-in zoom-in duration-1000 slide-in-from-bottom-12
        `}>
          {/* Brilho Externo (Glow) */}
          <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${isVictory ? 'bg-emerald-500' : 'bg-purple-500'}`} />
          <span className="relative z-10 drop-shadow-2xl">{isVictory ? '👑' : '💀'}</span>
        </div>

        {/* Título e Subtítulo */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          <h1 className={`
            text-7xl font-black uppercase tracking-tightest drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]
            ${isVictory ? 'text-emerald-400' : 'text-[#b794f4]'}
          `}>
            {isVictory ? t.victory : t.defeat}
          </h1>
          <p className="text-white/50 font-bold tracking-[0.4em] uppercase text-[9px] drop-shadow-md">
            {isVictory ? t.enemyKingDefeated : t.kingFell}
          </p>
        </div>

        {/* Ações (Botões revisados) */}
        <div className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
          <button
            onClick={() => {
              if (isPvP) clearLobbySession();
              resetGame();
            }}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-slate-100 transition-all active:scale-95 shadow-2xl"
          >
            {t.newBattle}
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="w-full py-2.5 bg-white/5 text-white/70 font-bold uppercase tracking-[0.2em] text-[10px] rounded-lg border border-white/5 hover:bg-white/10 transition-all"
          >
            {t.reviewBoard}
          </button>
          
          <button
            onClick={() => {
              if (isPvP) clearLobbySession();
              resetGame();
              setCurrentView('MENU');
            }}
            className="w-full py-4 bg-[#0a0f1a]/80 text-white font-black uppercase tracking-widest text-sm rounded-xl border border-white/10 hover:bg-[#1a2233] transition-all active:scale-95"
          >
            {t.backToMenu}
          </button>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-white/20 uppercase font-bold tracking-[0.1em] animate-pulse">
          {t.autoReturn}
        </p>

      </div>
    </div>
  );
};
