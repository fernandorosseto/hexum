import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Dispara o turno da IA quando a vez passa para o p2.
 *
 * A execução em si mora em `gameStore.runAiTurn`, que é protegida por
 * `isAiThinking`. Antes existiam DOIS laços de IA independentes — este hook e o
 * agendamento em `triggerEndTurn` — cada um com seu próprio guard, então os dois
 * rodavam sobre o mesmo estado e a IA jogava em duplicidade.
 */
export function useBot() {
  const currentTurnPlayerId = useGameStore(s => s.currentTurnPlayerId);
  const currentPhase = useGameStore(s => s.currentPhase);

  useEffect(() => {
    const state = useGameStore.getState();
    if (state.isPvP || state.sandboxMode) return;
    if (!state.isVsAI && !state.isAutoPlay) return;
    if (currentPhase !== 'MAIN_PHASE') return;
    if (!state.isAutoPlay && currentTurnPlayerId !== 'p2') return;

    const timer = setTimeout(() => {
      void useGameStore.getState().runAiTurn();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentTurnPlayerId, currentPhase]);
}
