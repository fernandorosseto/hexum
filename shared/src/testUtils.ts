import type { GameState, Unit } from './types';
import { createInitialState } from './gameEngine';

/** Unidade de teste com campos obrigatórios preenchidos. */
export function makeUnit(over: Partial<Unit> & { id: string }): Unit {
  return {
    playerId: 'p1',
    cardId: 'unit_lanceiro',
    unitClass: 'Lanceiro',
    hp: 5,
    maxHp: 5,
    attack: 2,
    position: { q: 0, r: 0, s: 0 },
    buffs: [],
    roundsInField: 0,
    summoningSickness: false,
    canMove: true,
    canAttack: true,
    abilityCooldown: 0,
    equippedArtifacts: [],
    ...over,
  };
}

/**
 * Estado limpo: sem unidades, sem cartas na mão, mana à vontade, turno do p1.
 *
 * O baralho NÃO fica vazio de propósito: desde a regra de derrota por baralho
 * vazio, um deck sem cartas faz o próximo `endTurn` encerrar a partida. Testes
 * que queiram exercitar o deck-out zeram o deck explicitamente.
 */
export function makeState(units: Unit[] = [], over: Partial<GameState> = {}): GameState {
  const stockDeck = () => Array.from({ length: 10 }, () => 'unit_lanceiro');

  const state = createInitialState();
  state.boardUnits = {};
  for (const u of units) state.boardUnits[u.id] = u;
  state.currentTurnPlayerId = 'p1';
  state.players.p1 = { ...state.players.p1, mana: 9, maxMana: 9, hand: [], deck: stockDeck() };
  state.players.p2 = { ...state.players.p2, mana: 9, maxMana: 9, hand: [], deck: stockDeck() };
  return { ...state, ...over };
}

export function hex(q: number, r: number) {
  return { q, r, s: -q - r };
}
