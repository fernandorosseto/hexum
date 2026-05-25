import { HexMap } from './board/HexMap';
import { BattleHUD } from './ui/BattleHUD';
import { HandUI } from './ui/HandUI';
import { BattleLog } from './ui/BattleLog';
import { CardDetailsUI } from './ui/CardDetailsUI';
import { SandboxUI } from './ui/SandboxUI';
import { MainMenu } from './ui/MainMenu';
import { GameOverUI } from './ui/GameOverUI';
import { useBot } from './hooks/useBot';
import { useMultiplayer } from './hooks/useMultiplayer';
import { useGameStore } from './store/gameStore';
import { motion } from 'framer-motion';
import './index.css';
import backgroundImg from './assets/background.jpg';

function App() {
  useBot();
  const lobbyId = useGameStore(s => s.lobbyId);
  const myRole = useGameStore(s => s.myRole);
  useMultiplayer({ lobbyId, myRole });

  const currentTurnPlayerId = useGameStore(s => s.currentTurnPlayerId);
  const phase = useGameStore(s => s.currentPhase);
  const currentView = useGameStore(s => s.currentView);
  const isLogVisible = useGameStore(s => s.isLogVisible);
  const isHandVisible = useGameStore(s => s.isHandVisible);
  const toggleHand = useGameStore(s => s.toggleHand);
  const isCardDetailsVisible = useGameStore(s => s.isCardDetailsVisible);
  const toggleCardDetails = useGameStore(s => s.toggleCardDetails);
  const selectedHex = useGameStore(s => s.selectedHex);
  const selectedCard = useGameStore(s => s.selectedCard);
  const triggerEndTurn = useGameStore(s => s.triggerEndTurn);
  const sandboxMode = useGameStore(s => s.sandboxMode);
  const isAiThinking = useGameStore(s => s.isAiThinking);
  const isPvP = useGameStore(s => s.isPvP);

  const isMyTurn = isPvP ? (currentTurnPlayerId === myRole) : (currentTurnPlayerId === 'p1');

  // Se estiver no MENU, renderiza apenas o MainMenu
  if (currentView === 'MENU') {
    return <MainMenu />;
  }

  return (
    <div
      className="w-screen h-[100dvh] relative overflow-hidden bg-transparent"
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
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <BattleHUD />
        </div>
      </div>

      {/* CAMADA 6: Sandbox Controls (sobreposto) - Apenas no modo SANDBOX */}
      {currentView === 'SANDBOX' && <SandboxUI />}

      {/* CAMADA 2: BattleLog (Apenas Desktop) */}
      <div className="hidden md:block absolute top-20 right-4 w-64 z-20 pointer-events-auto">
        <BattleLog />
      </div>

      {/* CAMADA 3: Detalhes da Carta (Independente) */}
      <div className="absolute md:bottom-4 md:left-4 md:w-80 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <CardDetailsUI />
        </div>
      </div>

      {/* CAMADA 4: Mão de Cartas — Bottom Tray */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Gradiente de fundo para integração visual */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none md:hidden" />
        <div className={`
          relative flex justify-center md:justify-end p-2 md:p-4 pointer-events-auto transition-all duration-400
          ${(selectedHex || selectedCard || !isHandVisible) ? 'max-md:opacity-0 max-md:translate-y-20 max-md:pointer-events-none' : 'opacity-100 translate-y-0'}
        `}>
          <HandUI />
        </div>
      </div>



      {phase === 'GAME_OVER' && <GameOverUI />}

      {/* CAMADA 6: FABs Mobile — Stack vertical no canto direito */}
      {currentView === 'PLAY' && (
        <div className="sm:hidden fixed right-3 z-50 pointer-events-auto flex flex-col gap-3" style={{ bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
          {/* Botão Passar Turno (principal) */}
          {!sandboxMode && isMyTurn && !isAiThinking && phase !== 'GAME_OVER' && (
            <button 
              onClick={triggerEndTurn}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-blue-400/60 text-white shadow-[0_4px_20px_rgba(59,130,246,0.5)] active:scale-90 transition-all flex items-center justify-center"
              title="Passar Turno"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {/* Toggle Cartas */}
          <button 
            onClick={toggleHand}
            className={`w-11 h-11 rounded-full border-2 shadow-[0_4px_15px_rgba(0,0,0,0.8)] transition-all flex items-center justify-center ${isHandVisible ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900/90 border-slate-700 text-slate-400'}`}
            title="Mostrar/Ocultar Cartas"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          {/* Toggle Inspeção */}
          <button 
            onClick={toggleCardDetails}
            className={`w-11 h-11 rounded-full border-2 shadow-[0_4px_15px_rgba(0,0,0,0.8)] transition-all flex items-center justify-center ${isCardDetailsVisible ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-900/90 border-slate-700 text-slate-400'}`}
            title="Mostrar/Ocultar Inspeção"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* Botão de Feedback Flutuante (Beta - Desktop only) */}
      <motion.button
        initial={{ opacity: 0, left: 16 }}
        animate={{ 
          opacity: 0.5, 
          left: (selectedHex || selectedCard) ? 352 : 16 
        }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => window.open('https://forms.gle/c9ReRbd2SAc5dggr7', '_blank')}
        className="fixed bottom-4 z-50 p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg shadow-xl pointer-events-auto flex items-center gap-2 group transition-all hidden md:flex"
      >
        <span className="text-lg">📩</span>
        <span className="text-[10px] text-white/70 group-hover:text-white font-bold tracking-widest uppercase hidden md:block">Feedback Beta</span>
      </motion.button>
    </div>
  );
}

export default App;
