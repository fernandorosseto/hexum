import { describe, it, expect } from 'vitest';
import { moveTo, attack, createInitialState, playCard, heal, endTurn } from './gameEngine';
import { createHex } from './hexMath';
import type { GameState, Unit } from './types';

function mockState(): GameState {
  return {
    matchId: 'test',
    turnNumber: 1,
    currentPhase: 'MAIN_PHASE',
    currentTurnPlayerId: 'p1',
    players: {
      'p1': { id: 'p1', mana: 5, maxMana: 5, canOfferCard: true, deck: [], hand: [], graveyard: [] },
      'p2': { id: 'p2', mana: 5, maxMana: 5, canOfferCard: true, deck: [], hand: [], graveyard: [] }
    },
    boardUnits: {}
  };
}

function addUnit(state: GameState, id: string, playerId: string, unitClass: any, q: number, r: number): Unit {
  const unit: Unit = {
    id, playerId, cardId: `unit_${unitClass.toLowerCase()}`, unitClass,
    hp: 5, maxHp: 5, attack: 2, position: { q, r, s: -q - r }, buffs: [],
    roundsInField: 1, summoningSickness: false, canMove: true, canAttack: true
  };
  state.boardUnits[id] = unit;
  return unit;
}

describe('Mecânicas GDD: Setup Inicial', () => {
  it('Deve iniciar com Rei e 2 Lanceiros para cada jogador', () => {
    const state = createInitialState();
    const units = Object.values(state.boardUnits);
    const p1Units = units.filter(u => u.playerId === 'p1');
    const p2Units = units.filter(u => u.playerId === 'p2');

    expect(p1Units.length).toBe(3);
    expect(p1Units.some(u => u.unitClass === 'Rei')).toBe(true);
    expect(p2Units.length).toBe(3);
  });
});

describe('Mecânicas GDD: Movimentação', () => {
  it('Lanceiro deve mover 1 casa verticalmente e não atravessar', () => {
    let state = mockState();
    addUnit(state, 'l1', 'p1', 'Lanceiro', 0, 0);
    addUnit(state, 'blocker', 'p1', 'Lanceiro', 0, 1);
    
    expect(() => moveTo(state, 'l1', createHex(0, 1, -1))).toThrow(/Hexágono ocupado/);
    expect(() => moveTo(state, 'l1', createHex(0, -1, 1))).not.toThrow();
  });
});

describe('Mecânicas GDD: Habilidades Especiais', () => {
  it('Knight Choque de Investida deve causar +2 de dano', () => {
    let state = mockState();
    state.players['p1'].mana = 5;
    addUnit(state, 'atk', 'p1', 'Cavaleiro', 0, 0);
    addUnit(state, 'target', 'p2', 'Lanceiro', 3, 0);
    state.boardUnits['atk'].roundsInField = 100;

    const nextState = attack(state, 'atk', 'target', true);
    expect(nextState.players['p1'].mana).toBe(5); // Não consome mana na ação de ataque mais
    expect(nextState.boardUnits['target'].hp).toBe(1); // 5 - (2 base + 2 investida) = 1
    expect(nextState.boardUnits['target'].buffs.some((b: any) => b.type === 'stun')).toBe(true);
  });
});

describe('Mecânicas GDD: Status e Turnos', () => {
  it('Mago deve causar dano em área (Splash)', () => {
    let state = mockState();
    addUnit(state, 'mago', 'p1', 'Mago', 0, 0);
    addUnit(state, 't1', 'p2', 'Cavaleiro', 0, 2);
    addUnit(state, 't2', 'p2', 'Lanceiro', 1, 1);

    const nextState = attack(state, 'mago', 't1');
    expect(nextState.boardUnits['t1'].hp).toBeLessThan(5);
    expect(nextState.boardUnits['t2'].hp).toBeLessThan(5);
  });

  it('End Turn deve processar veneno e restaurar mana', () => {
    let state = mockState();
    state.currentTurnPlayerId = 'p1';
    state.players['p2'].maxMana = 1;
    addUnit(state, 'v', 'p2', 'Cavaleiro', 0, 0);
    state.boardUnits['v'].buffs = [{ type: 'poison', duration: 2, value: 1 }];
    
    const nextState = endTurn(state);
    expect(nextState.currentTurnPlayerId).toBe('p2');
    expect(nextState.players['p2'].mana).toBe(2);
    expect(nextState.boardUnits['v'].hp).toBe(4);
  });
});
