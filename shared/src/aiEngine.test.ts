import { describe, it, expect, vi, afterEach } from 'vitest';
import { evaluateState, getPossibleActions, simulateAction, getBestAction } from './aiEngine';
import { createInitialState } from './gameEngine';
import { makeState, makeUnit, hex } from './testUtils';

afterEach(() => vi.restoreAllMocks());

describe('evaluateState', () => {
  it('é soma-zero — requisito do alfa-beta', () => {
    const state = createInitialState();
    expect(evaluateState(state, 'p1') + evaluateState(state, 'p2')).toBe(0);
  });

  it('continua soma-zero em posições assimétricas', () => {
    const state = makeState([
      makeUnit({ id: 'k1', unitClass: 'Rei', position: hex(0, 0) }),
      makeUnit({ id: 'k2', playerId: 'p2', unitClass: 'Rei', hp: 2, position: hex(2, -2) }),
      makeUnit({ id: 'a1', unitClass: 'Arqueiro', position: hex(1, -1) }),
    ]);
    expect(evaluateState(state, 'p1') + evaluateState(state, 'p2')).toBe(0);
  });

  it('pontua a vitória a favor de quem venceu', () => {
    const state = makeState([], { currentPhase: 'GAME_OVER', winner: 'p2' });
    expect(evaluateState(state, 'p2')).toBeGreaterThan(0);
    expect(evaluateState(state, 'p1')).toBeLessThan(0);
  });
});

describe('getPossibleActions', () => {
  it('não gera ações para quem não tem a vez', () => {
    const state = createInitialState();
    state.currentTurnPlayerId = 'p1';
    expect(getPossibleActions(state, 'p2')).toEqual([]);
  });

  it('sempre oferece END_TURN', () => {
    const state = createInitialState();
    expect(getPossibleActions(state, 'p1').some(a => a.type === 'END_TURN')).toBe(true);
  });

  it('gera cura para o Clérigo com aliado ferido ao alcance', () => {
    const state = makeState([
      makeUnit({ id: 'c1', unitClass: 'Clerigo', position: hex(0, 0) }),
      makeUnit({ id: 'a1', hp: 1, position: hex(1, 0) }),
    ]);
    const heals = getPossibleActions(state, 'p1').filter(a => a.type === 'HEAL');
    expect(heals).toEqual([{ type: 'HEAL', healerId: 'c1', targetId: 'a1' }]);
  });
});

describe('simulateAction', () => {
  it('END_TURN troca de lado — é o que torna a busca adversarial possível', () => {
    const state = createInitialState();
    const next = simulateAction(state, 'p1', { type: 'END_TURN' });
    expect(next).not.toBeNull();
    expect(next!.currentTurnPlayerId).toBe('p2');
  });

  it('depois de END_TURN o oponente consegue de fato jogar', () => {
    const afterPass = simulateAction(createInitialState(), 'p1', { type: 'END_TURN' })!;
    const replies = getPossibleActions(afterPass, 'p2');
    // Não basta gerar: as jogadas precisam ser aplicáveis de verdade.
    const applicable = replies.filter(a => simulateAction(afterPass, 'p2', a) !== null);
    expect(applicable.length).toBeGreaterThan(1);
  });

  it('devolve null para ação ilegal em vez de lançar', () => {
    const state = createInitialState();
    expect(simulateAction(state, 'p1', { type: 'MOVE', unitId: 'inexistente', target: hex(0, 0) })).toBeNull();
  });
});

describe('getBestAction', () => {
  it('enxerga o mate em 1 e ataca o Rei inimigo', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999); // sem medo, sem procs
    const state = makeState([
      makeUnit({ id: 'k1', unitClass: 'Rei', position: hex(-3, 3) }),
      makeUnit({ id: 'hero', unitClass: 'Cavaleiro', attack: 5, position: hex(1, 0) }),
      makeUnit({ id: 'k2', playerId: 'p2', unitClass: 'Rei', hp: 1, position: hex(0, 0) }),
    ]);
    state.players.p1.hand = [];

    const action = getBestAction(state, 'p1', { maxDepth: 2, timeBudgetMs: 2000 });
    expect(action).toEqual({ type: 'ATTACK', attackerId: 'hero', targetId: 'k2', special: false });
  });

  it('devolve alguma ação legal na posição inicial', () => {
    const state = createInitialState();
    const action = getBestAction(state, 'p1', { timeBudgetMs: 1500 });
    expect(action).not.toBeNull();
    expect(simulateAction(state, 'p1', action!)).not.toBeNull();
  });

  it('respeita o orçamento de tempo', () => {
    const state = createInitialState();
    const started = Date.now();
    getBestAction(state, 'p1', { maxDepth: 12, timeBudgetMs: 300 });
    // Margem generosa: o corte acontece entre nós, não no meio de um nó.
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it('devolve null quando não há jogador válido', () => {
    const state = createInitialState();
    expect(getBestAction(state, 'p3')).toBeNull();
  });
});
