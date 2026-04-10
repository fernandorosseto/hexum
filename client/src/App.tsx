import { HexMap } from './board/HexMap';
import { BattleHUD } from './ui/BattleHUD';
import { HandUI } from './ui/HandUI';
import { BattleLog } from './ui/BattleLog';
import { CardDetailsUI } from './ui/CardDetailsUI';
import { SandboxUI } from './ui/SandboxUI';
import { MainMenu } from './ui/MainMenu';
import { GameOverUI } from './ui/GameOverUI';
import { useBot } from './hooks/useBot';
import { useGameStore } from './store/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';
import backgroundImg from './assets/background.jpg';

function App() {
  useBot();
  const currentTurnPlayerId = useGameStore(s => s.currentTurnPlayerId);
  const phase = useGameStore(s => s.currentPhase);
  const currentView = useGameStore(s => s.currentView);
  const isLogVisible = useGameStore(s => s.isLogVisible);
  const selectedHex = useGameStore(s => s.selectedHex);
  const selectedCard = useGameStore(s => s.selectedCard);

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

      {/* CAMADA 4: Mão de Cartas (Oculta apenas no mobile durante seleção) */}
      <div className="fixed bottom-12 md:bottom-4 left-0 right-0 z-20 flex justify-center md:justify-end p-2 md:p-4 pointer-events-none">
        <div className={`
          w-full md:w-auto flex justify-center md:justify-end pointer-events-auto transition-all duration-500
          ${(selectedHex || selectedCard) ? 'max-md:opacity-0 max-md:translate-y-32 max-md:pointer-events-none' : 'opacity-100 translate-y-0'}
        `}>
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
    </div>
  );
}

export default App;
