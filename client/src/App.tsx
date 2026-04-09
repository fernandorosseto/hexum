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
import './index.css';
import backgroundImg from './assets/background.jpg';

function App() {
  useBot();
  const currentTurnPlayerId = useGameStore(s => s.currentTurnPlayerId);
  const phase = useGameStore(s => s.currentPhase);
  const currentView = useGameStore(s => s.currentView);

  // Se estiver no MENU, renderiza apenas o MainMenu
  if (currentView === 'MENU') {
    return <MainMenu />;
  }

  return (
    <div 
      className="w-screen h-screen relative overflow-hidden bg-transparent"
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

      {/* CAMADA 2: BattleLog (Responsivo) */}
      <div className="absolute top-16 md:top-20 right-0 md:right-4 w-full md:w-64 z-20 pointer-events-auto">
        <BattleLog />
      </div>

      {/* CAMADA 3: CardDetails & CAMADA 4: Mão de Cartas (Container Flex na Base) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col md:flex-row items-end justify-between p-2 md:p-4 gap-4 pointer-events-none">
        {/* Detalhes da Carta - No mobile aparece acima da mão */}
        <div className="w-full md:w-64 pointer-events-auto">
          <CardDetailsUI />
        </div>

        {/* Mão de Cartas - Centralizada no mobile */}
        <div className="w-full md:w-auto flex justify-center md:justify-end pointer-events-auto">
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
