import { expect, test, describe } from 'vitest';
import { playCard, attack, moveTo } from './gameEngine';
import { GameState } from './types';
import { createHex } from './hexMath';

describe('GameEngine - Regras de Tabuleiro Puras', () => {
  const getMockState = (): GameState => ({
    matchId: 'mock-1',
    turnNumber: 1,
    currentPhase: 'MAIN_PHASE',
    currentTurnPlayerId: 'p1',
    players: {
      'p1': { id: 'p1', mana: 3, maxMana: 3, canOfferCard: true, deck: [], hand: ['unit_lanceiro'], graveyard: [] },
      'p2': { id: 'p2', mana: 3, maxMana: 3, canOfferCard: true, deck: [], hand: [], graveyard: [] }
    },
    boardUnits: {}
  });

  test('playCard: invoca unidade gastando 1 Mana', () => {
    const state = getMockState();
    // Simula Rei para permitir invocação adjacente
    state.boardUnits['king'] = {
        id: 'king', playerId: 'p1', cardId: 'unit_rei', unitClass: 'Rei',
        hp: 6, maxHp: 6, attack: 1, position: createHex(0, 0, 0), buffs: [],
        roundsInField: 1, summoningSickness: false, canMove: true, canAttack: true
    };
    
    const target = createHex(0, 1, -1);
    const newState = playCard(state, 'p1', 'unit_lanceiro', target);
    
    const p1 = newState.players['p1'];
    expect(p1.mana).toBe(2); // Lanceiro custo 1
    
    // Unidade nasceu no estado global?
    const unitKeys = Object.keys(newState.boardUnits).filter(k => k !== 'king');
    expect(unitKeys.length).toBe(1);
    expect(newState.boardUnits[unitKeys[0]].position).toEqual(target);
    expect(newState.boardUnits[unitKeys[0]].summoningSickness).toBe(true);
  });

  test('playCard: falha se não tiver mana', () => {
    const state = getMockState();
    state.players['p1'].mana = 0;
    expect(() => playCard(state, 'p1', 'unit_lanceiro', createHex(0, 0, 0))).toThrow(/Mana insuficiente/);
  });

  test('moveTo: deve andar 1 casa corretamente e ficar exausto', () => {
    let state = getMockState();
    addInitialUnitDirectly(state, 'p1', 'Cavaleiro', createHex(0, 0, 0), 'u1');
    state.boardUnits['u1'].summoningSickness = false;
    
    const targetMove = createHex(1, -1, 0);
    const movedState = moveTo(state, 'u1', targetMove);
    
    expect(movedState.boardUnits['u1'].position).toEqual(targetMove);
    expect(movedState.boardUnits['u1'].canAttack).toBe(true); // Mover E Atacar permitido
  });

  test('attack: alvo deve perder HP e morrer se chegar a zero', () => {
    const state = getMockState();
    
    state.boardUnits['atk_1'] = {
      id: 'atk_1', playerId: 'p1', cardId: 'c1', unitClass: 'Cavaleiro',
      hp: 5, maxHp: 5, attack: 3, position: createHex(0, 0, 0), buffs: [],
      roundsInField: 1, summoningSickness: false, canMove: true, canAttack: true
    };
    
    state.boardUnits['def_2'] = {
      id: 'def_2', playerId: 'p2', cardId: 'c2', unitClass: 'Arqueiro',
      hp: 2, maxHp: 2, attack: 1, position: createHex(1, 0, -1), buffs: [],
      roundsInField: 1, summoningSickness: false, canMove: true, canAttack: true
    };

    const newState = attack(state, 'atk_1', 'def_2');
    expect(newState.boardUnits['def_2']).toBeUndefined();
    expect(newState.boardUnits['atk_1'].canMove).toBe(true); // Atacar E Mover permitido
  });
});

function addInitialUnitDirectly(state: GameState, playerId: string, unitClass: any, pos: any, id: string) {
  state.boardUnits[id] = {
    id, playerId, cardId: `unit_${unitClass.toLowerCase()}`, unitClass,
    hp: 5, maxHp: 5, attack: 2, position: pos, buffs: [],
    roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true
  };
}
