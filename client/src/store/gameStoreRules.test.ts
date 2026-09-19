/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, TURN_SECONDS } from './gameStore';
import { createInitialState } from 'shared';

beforeEach(() => {
  useGameStore.setState({
    ...createInitialState(),
    isPvP: false,
    myRole: null,
    currentPhase: 'MAIN_PHASE',
    winner: undefined,
    isTimerRunning: true,
    turnTimer: TURN_SECONDS,
    sandboxMode: false,
    actionSeq: 0,
    isResolving: false,
  });
});

describe('surrender', () => {
  it('no modo solo entrega a vitória ao oponente, não a quem desiste', () => {
    useGameStore.getState().surrender();
    expect(useGameStore.getState().winner).toBe('p2');
    expect(useGameStore.getState().currentPhase).toBe('GAME_OVER');
  });

  it('no PvP usa o papel local', () => {
    useGameStore.setState({ isPvP: true, myRole: 'p2' });
    useGameStore.getState().surrender();
    expect(useGameStore.getState().winner).toBe('p1');
  });

  it('não faz nada se a partida já acabou', () => {
    useGameStore.setState({ currentPhase: 'GAME_OVER', winner: 'p1' });
    useGameStore.getState().surrender();
    expect(useGameStore.getState().winner).toBe('p1');
  });
});

describe('cronômetro de turno', () => {
  it('decrementa a cada tick', () => {
    useGameStore.getState().decrementTimer();
    expect(useGameStore.getState().turnTimer).toBe(TURN_SECONDS - 1);
  });

  it('não corre com o timer parado nem no sandbox', () => {
    useGameStore.setState({ isTimerRunning: false, turnTimer: 30 });
    useGameStore.getState().decrementTimer();
    expect(useGameStore.getState().turnTimer).toBe(30);

    useGameStore.setState({ isTimerRunning: true, sandboxMode: true, turnTimer: 30 });
    useGameStore.getState().decrementTimer();
    expect(useGameStore.getState().turnTimer).toBe(30);
  });

  it('ao zerar em PvP passa o turno sozinho', () => {
    useGameStore.setState({ isPvP: true, myRole: 'p1', currentTurnPlayerId: 'p1', turnTimer: 0 });
    useGameStore.getState().decrementTimer();
    expect(useGameStore.getState().currentTurnPlayerId).toBe('p2');
  });

  it('ao zerar fora do PvP apenas para, sem punir o jogador', () => {
    useGameStore.setState({ turnTimer: 0, currentTurnPlayerId: 'p1' });
    useGameStore.getState().decrementTimer();
    expect(useGameStore.getState().currentTurnPlayerId).toBe('p1');
    expect(useGameStore.getState().isTimerRunning).toBe(false);
  });
});

describe('limite de mão (store)', () => {
  const overLimit = ['unit_lanceiro', 'spl_raio', 'art_carvalho', 'unit_arqueiro', 'spl_meteoro', 'unit_cavaleiro'];

  it('triggerEndTurn para em END_PHASE e não passa a vez', () => {
    const state = useGameStore.getState();
    useGameStore.setState({
      players: { ...state.players, p1: { ...state.players.p1, hand: [...overLimit] } },
    });

    useGameStore.getState().triggerEndTurn();

    const after = useGameStore.getState();
    expect(after.currentPhase).toBe('END_PHASE');
    expect(after.currentTurnPlayerId).toBe('p1');
  });

  it('discardCard libera a vez quando a mão chega ao limite', () => {
    const state = useGameStore.getState();
    useGameStore.setState({
      players: { ...state.players, p1: { ...state.players.p1, hand: [...overLimit] } },
    });
    useGameStore.getState().triggerEndTurn();

    useGameStore.getState().discardCard('spl_meteoro');

    const after = useGameStore.getState();
    expect(after.currentPhase).toBe('MAIN_PHASE');
    expect(after.currentTurnPlayerId).toBe('p2');
    expect(after.players.p1.hand).toHaveLength(5);
    expect(after.players.p1.graveyard).toContain('spl_meteoro');
  });

  it('descarte inválido não quebra nem passa a vez', () => {
    const state = useGameStore.getState();
    useGameStore.setState({
      players: { ...state.players, p1: { ...state.players.p1, hand: [...overLimit] } },
    });
    useGameStore.getState().triggerEndTurn();

    useGameStore.getState().discardCard('carta_inexistente');

    const after = useGameStore.getState();
    expect(after.currentPhase).toBe('END_PHASE');
    expect(after.players.p1.hand).toHaveLength(6);
  });
});

describe('triggerEndTurn', () => {
  it('invalida animações pendentes e reinicia o cronômetro', () => {
    useGameStore.setState({ actionSeq: 7, isResolving: true, turnTimer: 3 });
    useGameStore.getState().triggerEndTurn();
    const state = useGameStore.getState();
    expect(state.actionSeq).toBe(8);
    expect(state.isResolving).toBe(false);
    expect(state.turnTimer).toBe(TURN_SECONDS);
    expect(state.currentTurnPlayerId).toBe('p2');
  });
});
