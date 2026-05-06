import { HexMap } from './board/HexMap';
import { BattleHUD } from './ui/BattleHUD';
import { HandUI } from './ui/HandUI';
import { BattleLog } from './ui/BattleLog';
import { CardDetailsUI } from './ui/CardDetailsUI';
import { SandboxUI } from './ui/SandboxUI';
import { MainMenu } from './ui/MainMenu';
import { GameOverUI } from './ui/GameOverUI';
import { LoginPage } from './ui/LoginPage';
import { LobbyPage } from './ui/LobbyPage';
import { useBot } from './hooks/useBot';
import { useGameStore } from './store/gameStore';
import { useAuth } from './hooks/useAuth';
import { useMultiplayer } from './hooks/useMultiplayer';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';
import backgroundImg from './assets/background.jpg';

import { useEffect, useRef } from 'react';

function App() {
  useBot();
  const { user, loading: authLoading } = useAuth();
  const currentTurnPlayerId = useGameStore(s => s.currentTurnPlayerId);
  const isPvP    = useGameStore(s => s.isPvP);
  const isMatchStarted = useGameStore(s => s.isMatchStarted);
  const lobbyId  = useGameStore(s => s.lobbyId);
  const myRole   = useGameStore(s => s.myRole);

  // Liga sincronização multiplayer apenas quando em modo PvP
  const { syncAction } = useMultiplayer({ lobbyId: isPvP ? lobbyId : null, myRole });
  const phase = useGameStore(s => s.currentPhase);
  const currentView = useGameStore(s => s.currentView);

  const boardUnits = useGameStore(s => s.boardUnits);
  const players = useGameStore(s => s.players);

  // O hook useMultiplayer agora gerencia a sincronização interna via subscribe()
  // para garantir que cada mudança no store seja enviada sem depender do ciclo de render do React.

  const isLogVisible = useGameStore(s => s.isLogVisible);
  const selectedCard = useGameStore(s => s.selectedCard);
  const isHandExpanded = useGameStore(s => s.isHandExpanded);
  const toggleHandExpanded = useGameStore(s => s.toggleHandExpanded);
  const isInspectMode = useGameStore(s => s.isInspectMode);
  const toggleInspectMode = useGameStore(s => s.toggleInspectMode);

  const startTimer = useGameStore(s => s.startTimer);
  const decrementTimer = useGameStore(s => s.decrementTimer);
  const turnTimer = useGameStore(s => s.turnTimer);
  const isTimerRunning = useGameStore(s => s.isTimerRunning);
  const triggerEndTurn = useGameStore(s => s.triggerEndTurn);
  const sandboxMode = useGameStore(s => s.sandboxMode);

  // Efeito do Timer de Turno
  useEffect(() => {
    if (currentView === 'PLAY' && !sandboxMode && !isTimerRunning && phase === 'MAIN_PHASE') {
      startTimer();
    }

    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, currentView, sandboxMode, phase, startTimer, decrementTimer]);

  // Se o tempo acabar, passa o turno automaticamente
  useEffect(() => {
    if (isTimerRunning && turnTimer <= 0 && currentView === 'PLAY' && !sandboxMode) {
      triggerEndTurn();
    }
  }, [turnTimer, isTimerRunning, triggerEndTurn, currentView, sandboxMode]);

  // Tela de carregamento enquanto o Firebase resolve o estado de auth
  if (authLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs uppercase tracking-widest">Carregando...</p>
        </div>
      </div>
    );
  }

  // Página de Login — exibida se o usuário não está autenticado
  if (!user) {
    return <LoginPage onAuthenticated={() => {}} />;
  }

  // Lobby PvP (sala de espera) — view PVP mas ainda sem adversário ou partida iniciada
  if (currentView === 'PVP' && (!isPvP || !isMatchStarted)) {
    return <LobbyPage />;
  }

  // Se estiver no MENU, renderiza apenas o MainMenu
  if (currentView === 'MENU') {
    return <MainMenu />;
  }

  return (
    <div
      className="w-full h-[100dvh] relative overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >


      {/* CAMADA 0: Tabuleiro fullscreen (ocupa TODA a tela) */}
      <HexMap />

      {/* CAMADA 1: HUD Compacto (topo, sobreposto) */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <BattleHUD />
        </div>
      </div>

      {/* CAMADA 6: Sandbox Controls (sobreposto) - Apenas no modo SANDBOX */}
      {currentView === 'SANDBOX' && <SandboxUI />}

      {/* CAMADA 2: BattleLog (Responsivo e Ocultável no Mobile) */}
      <AnimatePresence>
        {(isLogVisible || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="absolute top-24 md:top-20 right-0 md:right-4 w-[65%] md:w-64 z-20 pointer-events-auto"
          >
            <BattleLog />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CAMADA 3: Detalhes da Carta (Independente) */}
      <div className="absolute md:bottom-4 md:left-4 md:w-80 z-40 pointer-events-auto">
        <CardDetailsUI />
      </div>

      {/* CAMADA 4: Mão de Cartas */}
      <div className={`
        fixed z-20 pointer-events-none flex transition-all duration-500
        md:bottom-4 md:left-0 md:right-0 md:justify-end md:p-6
        max-md:bottom-20 max-md:right-2 max-md:flex-col max-md:items-end
        ${!isHandExpanded ? 'max-md:translate-x-[150%] max-md:opacity-0 max-md:pointer-events-none' : 'max-md:translate-x-0 max-md:opacity-100'}
      `}>
        <div className="pointer-events-auto">
          <HandUI />
        </div>
      </div>

      {/* CAMADA 5: Overlay de turno do oponente (Apenas no modo PLAY) */}
      {currentView === 'PLAY' && currentTurnPlayerId === 'p2' && phase !== 'GAME_OVER' && (
        <div className="absolute top-4 inset-x-0 z-30 flex justify-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-red-900/60 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-bold text-sm tracking-widest uppercase">Oponente pensando...</span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      )}

      {phase === 'GAME_OVER' && <GameOverUI />}

      {/* Botão de Feedback Flutuante (Beta) */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => window.open('https://forms.gle/c9ReRbd2SAc5dggr7', '_blank')}
        className="fixed top-24 left-2 md:top-20 md:left-4 z-50 p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg shadow-xl pointer-events-auto flex items-center gap-2 group transition-all"
      >
        <span className="text-lg">📩</span>
        <span className="text-[10px] text-white/70 group-hover:text-white font-bold tracking-widest uppercase hidden md:block">Feedback Beta</span>
      </motion.button>

      {/* Botões de Ação Mobile */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-auto md:hidden">
        <button 
          onClick={toggleInspectMode}
          className={`px-4 py-2.5 backdrop-blur-md border rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center gap-2 font-black text-xs uppercase tracking-wider transition-all active:scale-95 ${
            isInspectMode 
              ? 'bg-amber-600/90 border-amber-400 text-white shadow-[0_0_15px_rgba(217,119,6,0.5)] hover:bg-amber-500' 
              : 'bg-slate-900/90 border-slate-600 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span className="text-lg">ℹ️</span>
          <span>{isInspectMode ? 'Fechar Info' : 'Info Carta'}</span>
        </button>
      </div>

      <div className="fixed bottom-4 right-4 z-50 pointer-events-auto md:hidden">
        <button 
          onClick={toggleHandExpanded}
          className="px-4 py-2.5 bg-[#0b622f]/90 backdrop-blur-md border border-green-500/50 rounded-xl shadow-[0_0_15px_rgba(11,98,47,0.5)] flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider hover:bg-[#0b622f] transition-all active:scale-95"
        >
          <span className="text-lg">🃏</span>
          <span>{isHandExpanded ? 'Esconder Mão' : 'Ver Mão'}</span>
        </button>
      </div>
    </div>
  );
}

export default App;
