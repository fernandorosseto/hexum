import { describe, it, expect } from 'vitest';
import { shouldAcceptRemoteState, type LocalSyncView } from './pvpSync';
import { createInitialState } from 'shared';

const local = (over: Partial<LocalSyncView> = {}): LocalSyncView => ({
  turnNumber: 5,
  currentTurnPlayerId: 'p2',
  currentPhase: 'MAIN_PHASE',
  ...over,
});

function remote(over: Partial<ReturnType<typeof createInitialState>> = {}) {
  return { ...createInitialState(), turnNumber: 5, ...over };
}

describe('shouldAcceptRemoteState', () => {
  it('aceita a jogada feita no turno do adversário', () => {
    expect(shouldAcceptRemoteState(local(), remote({ turnNumber: 6 }), 'p1').accept).toBe(true);
  });

  it('rejeita escrita do adversário durante o meu turno', () => {
    const decision = shouldAcceptRemoteState(
      local({ currentTurnPlayerId: 'p1', turnNumber: 5 }),
      remote({ turnNumber: 5, winner: 'p2', currentPhase: 'GAME_OVER' }),
      'p1',
    );
    expect(decision.accept).toBe(false);
    expect(decision.reason).toMatch(/durante o meu turno/);
  });

  it('aceita quando o turno avança mesmo tendo sido minha vez', () => {
    expect(shouldAcceptRemoteState(
      local({ currentTurnPlayerId: 'p1' }),
      remote({ turnNumber: 6 }),
      'p1',
    ).accept).toBe(true);
  });

  it('rejeita snapshot que volta no tempo', () => {
    expect(shouldAcceptRemoteState(local(), remote({ turnNumber: 2 }), 'p1').accept).toBe(false);
  });

  it('rejeita snapshot malformado', () => {
    expect(shouldAcceptRemoteState(local(), {} as never, 'p1').accept).toBe(false);
  });

  it('não aplica nada depois do fim de jogo local', () => {
    expect(shouldAcceptRemoteState(
      local({ currentPhase: 'GAME_OVER' }),
      remote({ turnNumber: 9 }),
      'p1',
    ).accept).toBe(false);
  });
});
