import React from 'react';
import { useGameStore } from '../store/gameStore';

export const BattleHUD: React.FC = () => {
  const currentTurnPlayerId = useGameStore(state => state.currentTurnPlayerId);
  const players = useGameStore(state => state.players);
  const triggerEndTurn = useGameStore(state => state.triggerEndTurn);
  const turnNumber = useGameStore(state => state.turnNumber);
  const setCurrentView = useGameStore(state => state.setCurrentView);
  const isAiThinking = useGameStore(state => state.isAiThinking);
  
  const renderMana = (current: number, max: number) => {
    return Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
        i < current 
          ? 'bg-blue-400 border-blue-300 shadow-[0_0_6px_rgba(96,165,250,0.8)]' 
          : i < max 
            ? 'bg-slate-600 border-slate-500' 
            : 'bg-slate-900 border-slate-800'
      }`} />
    ));
  };


  const isMyTurn = currentTurnPlayerId === 'p1';
  const sandboxMode = useGameStore(state => state.sandboxMode);

  return (
    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full px-2 md:px-4 py-1.5 md:py-2 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-20 shrink-0">
      
      {/* Topo no Mobile: Botão Voltar + Nomes/Mana */}
      <div className="w-full flex items-center justify-between md:w-auto gap-2">
        <button 
          onClick={() => setCurrentView('MENU')}
          className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-white/50 hover:text-white rounded-lg border border-white/5 transition-all group"
          title="Voltar ao Menu"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-between gap-4">
        {/* Player 1 (Azul) */}
        {!sandboxMode ? (
          <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl transition-all duration-300 ${isMyTurn ? 'bg-[#0b622f]/20 ring-1 ring-[#0b622f]/60' : 'opacity-50'}`}>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#0b622f] to-[#084822] border-2 border-[#0b622f]/30 flex items-center justify-center text-white font-black text-[10px] md:text-xs shadow-md">P1</div>
            <div>
              <span className="text-[#a7f3d0] font-bold text-xs md:text-sm block leading-none">Jogador 1</span>
              <div className="flex gap-0.5 mt-1">{renderMana(players['p1'].mana, players['p1'].maxMana)}</div>
            </div>
          </div>
        ) : <div className="hidden md:block w-48" />}

        {/* Centro — Turno (Ou Lab) */}
        <div className="hidden sm:flex flex-col items-center gap-1">
          <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
            {sandboxMode ? 'SIMULADOR DE GUERRA' : `Turno ${turnNumber}`}
          </span>
          {isAiThinking && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-lg animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">IA Pensando...</span>
            </div>
          )}
          {isMyTurn && !sandboxMode && !isAiThinking && (
            <button 
              onClick={triggerEndTurn}
              className="px-4 md:px-5 py-1 md:py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-[10px] md:text-sm rounded-lg shadow-[0_2px_10px_rgba(37,99,235,0.3)] transition-all active:scale-95 border border-blue-400/30"
            >
              PASSAR
            </button>
          )}
        </div>

        {/* Lado Direito */}
        {!sandboxMode ? (
          <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl transition-all duration-300 ${!isMyTurn ? 'bg-[#602471]/20 ring-1 ring-[#602471]/60' : 'opacity-50'}`}>
            <div className="text-right">
              <span className="text-[#f5d0f9] font-bold text-xs md:text-sm block leading-none">Oponente</span>
              <div className="flex gap-0.5 mt-1 justify-end">{renderMana(players['p2'].mana, players['p2'].maxMana)}</div>
            </div>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#602471] to-[#40184b] border-2 border-[#a855f7]/30 flex items-center justify-center text-white font-black text-[10px] md:text-xs shadow-md">P2</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-[#0b622f]/20 ring-1 ring-[#0b622f]/60">
            <div className="text-right">
              <span className="text-[#a7f3d0] font-bold text-xs md:text-sm block leading-none underline decoration-[#0b622f]/50 underline-offset-4">Jogador 1</span>
              <div className="flex gap-0.5 mt-1 justify-end">{renderMana(players['p1'].mana, players['p1'].maxMana)}</div>
            </div>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#0b622f] to-[#084822] border-2 border-[#16a34a]/30 flex items-center justify-center text-white font-black text-[10px] md:text-xs shadow-md">P1</div>
          </div>
        )}
      </div>

      {/* Botão Passar Turno Mobile (Segunda linha se no mobile) */}
      {!sandboxMode && isMyTurn && (
        <div className="sm:hidden w-full pt-1">
          <button 
            onClick={triggerEndTurn}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-xs rounded-lg shadow-lg active:scale-95 border border-blue-400/30 uppercase tracking-widest"
          >
            Passar Turno
          </button>
        </div>
      )}
    </div>
  );
};
