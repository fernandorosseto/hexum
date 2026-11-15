import { describe, it, expect } from 'vitest';
import { createInitialState, endTurn } from './gameEngine';
import { getBestAction, simulateAction } from './aiEngine';

/**
 * Substitui os scripts soltos test_ai.ts / test_ai_sim.ts que existiam na raiz
 * e nunca eram executados por nenhum script do projeto.
 *
 * Serve de rede de segurança: com a busca quebrada (turno que nunca trocava),
 * a IA não conseguia encadear um jogo inteiro.
 */
describe('IA vs IA (fumaça)', () => {
  it('conduz uma partida completa sem travar', () => {
    let state = createInitialState();
    const startedAt = Date.now();
    let turns = 0;
    let actions = 0;

    while (state.currentPhase !== 'GAME_OVER' && turns < 30 && Date.now() - startedAt < 30_000) {
      const me = state.currentTurnPlayerId;
      let guard = 0;

      while (state.currentTurnPlayerId === me && state.currentPhase !== 'GAME_OVER' && guard++ < 25) {
        const action = getBestAction(state, me, { maxDepth: 2, timeBudgetMs: 120 });
        if (!action) break;
        const next = simulateAction(state, me, action);
        if (!next) break;
        state = next;
        actions++;
      }

      if (state.currentTurnPlayerId === me && state.currentPhase !== 'GAME_OVER') {
        state = endTurn(state);
      }
      turns++;
    }

    // A IA precisa efetivamente jogar (não só passar a vez) e trocar de lado.
    expect(actions).toBeGreaterThan(10);
    expect(turns).toBeGreaterThan(1);
  }, 60_000);
});
