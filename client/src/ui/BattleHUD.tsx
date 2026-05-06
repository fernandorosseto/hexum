import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export const BattleHUD: React.FC = () => {
  const currentTurnPlayerId = useGameStore(state => state.currentTurnPlayerId);
  const players = useGameStore(state => state.players);
  const triggerEndTurn = useGameStore(state => state.triggerEndTurn);
  const turnNumber = useGameStore(state => state.turnNumber);
  const setCurrentView = useGameStore(state => state.setCurrentView);
  const isAiThinking = useGameStore(state => state.isAiThinking);
  const isLogVisible = useGameStore(state => state.isLogVisible);
  const toggleLog = useGameStore(state => state.toggleLog);
  const turnTimer = useGameStore(state => state.turnTimer);
  const isTimerRunning = useGameStore(state => state.isTimerRunning);
  
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
  const lobbyCode = useGameStore(state => state.lobbyCode);
  const isPvP = useGameStore(state => state.isPvP);
  const surrender = useGameStore(state => state.surrender);
  const clearLobbySession = useGameStore(state => state.clearLobbySession);
  const phase = useGameStore(state => state.currentPhase);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleQuit = () => {
    if (phase === 'GAME_OVER') {
      if (isPvP) clearLobbySession();
      setCurrentView('MENU');
      return;
    }

    if (isPvP) {
      surrender();
      setTimeout(() => {
        clearLobbySession();
        setCurrentView('MENU');
      }, 500);
    } else {
      setCurrentView('MENU');
    }
    setShowConfirm(false);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 w-full px-2 md:px-4 py-1 md:py-2 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-20 shrink-0 relative">
      
      {/* Modal de Confirmação */}
      {showConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0f172a]/95 border border-white/10 rounded-3xl p-8 max-w-xs w-full shadow-[0_32px_64px_rgba(0,0,0,0.8)] text-center relative overflow-hidden"
          >
            {/* Detalhe de brilho no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20">
              <span className="text-3xl">⚠️</span>
            </div>

            <h3 className="text-white font-black text-xl mb-3 tracking-tight">Abandonar Campo?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed px-2">
              {isPvP 
                ? "Esta ação será registrada como uma derrota imediata no PvP." 
                : "Sua jornada atual será perdida."}
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleQuit}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all active:scale-95 uppercase tracking-widest"
              >
                Confirmar Saída
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="w-full py-3 text-slate-500 hover:text-slate-300 font-bold text-xs transition-colors uppercase tracking-widest"
              >
                Voltar ao Jogo
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Topo no Mobile: Botão Voltar + Nomes/Mana */}
      <div className="w-full flex items-center justify-between md:w-auto gap-2">
        <button 
          onClick={() => {
            if (phase === 'GAME_OVER') handleQuit();
            else setShowConfirm(true);
          }}
          className="p-1 px-2 md:p-1.5 bg-slate-900/80 hover:bg-red-950/40 text-white/50 hover:text-red-400 rounded-lg border border-white/5 transition-all group flex items-center gap-1"
          title={isPvP ? "Desistir da Partida" : "Voltar ao Menu"}
        >
          <svg className="w-3 h-3 md:w-4 md:h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-[10px] md:hidden font-bold">{isPvP ? 'DESISTIR' : 'SAIR'}</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-between gap-4">
        {/* Player 1 (Azul) */}
        {!sandboxMode ? (
          <div className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1 md:py-2 rounded-xl transition-all duration-300 ${isMyTurn ? 'bg-[#0b622f]/20 ring-1 ring-[#0b622f]/60' : 'opacity-50'}`}>
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#0b622f] to-[#084822] border-2 border-[#0b622f]/30 flex items-center justify-center text-white font-black text-[9px] md:text-xs shadow-md">P1</div>
            <div>
              <span className="text-[#a7f3d0] font-bold text-[10px] md:text-sm block leading-none">P1</span>
              <div className="flex gap-0.5 mt-0.5 md:mt-1">{renderMana(players['p1'].mana, players['p1'].maxMana)}</div>
            </div>
          </div>
        ) : <div className="hidden md:block w-48" />}

        {/* Centro — Turno (Ou Lab) */}
        <div className="flex flex-col items-center gap-0.5 md:gap-1">
          <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] md:tracking-[0.2em] whitespace-nowrap">
            {sandboxMode ? 'SIMULADOR' : `Turno ${turnNumber}`}
            {isPvP && lobbyCode && (
              <span className="ml-1.5 md:ml-3 text-indigo-400/60 border border-indigo-400/20 px-1 md:px-1.5 py-0.5 rounded text-[7px] md:text-[8px] tracking-widest">
                ID: {lobbyCode}
              </span>
            )}
            {!sandboxMode && isTimerRunning && (
              <span className={`ml-1.5 md:ml-2 ${turnTimer <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                ⏳ {turnTimer}s
              </span>
            )}
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
          <div className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1 md:py-2 rounded-xl transition-all duration-300 ${!isMyTurn ? 'bg-[#602471]/20 ring-1 ring-[#602471]/60' : 'opacity-50'}`}>
            <div className="text-right">
              <span className="text-[#f5d0f9] font-bold text-[10px] md:text-sm block leading-none">P2</span>
              <div className="flex gap-0.5 mt-0.5 md:mt-1 justify-end">{renderMana(players['p2'].mana, players['p2'].maxMana)}</div>
            </div>
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#602471] to-[#40184b] border-2 border-[#a855f7]/30 flex items-center justify-center text-white font-black text-[9px] md:text-xs shadow-md">P2</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1 md:py-2 rounded-xl bg-[#0b622f]/20 ring-1 ring-[#0b622f]/60">
            <div className="text-right">
              <span className="text-[#a7f3d0] font-bold text-[10px] md:text-sm block leading-none underline decoration-[#0b622f]/50 underline-offset-4">P1</span>
              <div className="flex gap-0.5 mt-0.5 md:mt-1 justify-end">{renderMana(players['p1'].mana, players['p1'].maxMana)}</div>
            </div>
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#0b622f] to-[#084822] border-2 border-[#16a34a]/30 flex items-center justify-center text-white font-black text-[9px] md:text-xs shadow-md">P1</div>
          </div>
        )}
      </div>

      {/* Botão de Narração Mobile (Posicionado abaixo do menu, no canto direito) */}
      <button 
        onClick={toggleLog}
        className={`
          sm:hidden absolute top-full right-2 mt-2 p-3 rounded-full border-2 transition-all shadow-lg z-30
          ${isLogVisible 
            ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-blue-500/40' 
            : 'bg-slate-900 border-slate-700 text-slate-400'
          }
        `}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Botão Passar Turno Mobile (Segunda linha se no mobile) */}
      {!sandboxMode && isMyTurn && (
        <div className="sm:hidden w-full pt-1 flex justify-center">
          <button 
            onClick={triggerEndTurn}
            className="w-[80%] py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-xs rounded-lg shadow-lg active:scale-95 border border-blue-400/30 uppercase tracking-widest"
          >
            Passar Turno
          </button>
        </div>
      )}
      {/* Barra de Tempo (Pavio) estilo Arena */}
      {!sandboxMode && isTimerRunning && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${
              turnTimer <= 10 ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-blue-500'
            }`}
            style={{ width: `${(turnTimer / 60) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
