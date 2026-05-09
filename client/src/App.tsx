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
  const isHandVisible = useGameStore(s => s.isHandVisible);
  const toggleHand = useGameStore(s => s.toggleHand);
  const isCardDetailsVisible = useGameStore(s => s.isCardDetailsVisible);
  const toggleCardDetails = useGameStore(s => s.toggleCardDetails);
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

      {/* CAMADA 4: Mão de Cartas (Oculta apenas no mobile durante seleção ou quando minimizada) */}
      <div className="fixed bottom-12 md:bottom-4 left-0 right-0 z-20 flex justify-center md:justify-end p-2 md:p-4 pointer-events-none">
        <div className={`
          w-full md:w-auto flex justify-center md:justify-end pointer-events-auto transition-all duration-500
          ${(selectedHex || selectedCard || !isHandVisible) ? 'max-md:opacity-0 max-md:translate-y-32 max-md:pointer-events-none' : 'opacity-100 translate-y-0'}
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

      {/* Botoes de Visibilidade Mobile (Toggles) */}
      {currentView === 'PLAY' && (
        <>
          <div className="sm:hidden fixed bottom-4 right-4 z-50 pointer-events-auto">
            <button 
              onClick={toggleHand}
              className={`p-3 rounded-full border-2 shadow-[0_4px_15px_rgba(0,0,0,0.8)] transition-all ${isHandVisible ? 'bg-blue-600 border-blue-400 text-white scale-110' : 'bg-slate-900 border-slate-700 text-slate-400 scale-90'}`}
              title="Mostrar/Ocultar Cartas"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
          </div>

          <div className="sm:hidden fixed bottom-4 left-4 z-50 pointer-events-auto">
            <button 
              onClick={toggleCardDetails}
              className={`p-3 rounded-full border-2 shadow-[0_4px_15px_rgba(0,0,0,0.8)] transition-all ${isCardDetailsVisible ? 'bg-purple-600 border-purple-400 text-white scale-110' : 'bg-slate-900 border-slate-700 text-slate-400 scale-90'}`}
              title="Mostrar/Ocultar Inspeção"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Botão de Feedback Flutuante (Beta) */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => window.open('https://forms.gle/c9ReRbd2SAc5dggr7', '_blank')}
        className="fixed bottom-4 left-4 z-50 p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg shadow-xl pointer-events-auto flex items-center gap-2 group transition-all hidden md:flex"
      >
        <span className="text-lg">📩</span>
        <span className="text-[10px] text-white/70 group-hover:text-white font-bold tracking-widest uppercase hidden md:block">Feedback Beta</span>
      </motion.button>
    </div>
  );
}

export default App;
