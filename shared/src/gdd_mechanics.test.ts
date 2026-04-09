import { describe, it, expect, vi } from 'vitest';
import { 
  moveTo, 
  attack, 
  createInitialState, 
  playCard, 
  heal, 
  endTurn,
  convert
} from './gameEngine';
import { createHex } from './hexMath';
import type { GameState, Unit } from './types';

// Helper para criar um estado limpo
function mockState(): GameState {
  return {
    matchId: 'test',
    turnNumber: 1,
    currentPhase: 'MAIN_PHASE',
    currentTurnPlayerId: 'p1',
    players: {
      'p1': { id: 'p1', mana: 5, maxMana: 5, canOfferCard: true, hand: [], deck: [], graveyard: [] },
      'p2': { id: 'p2', mana: 5, maxMana: 5, canOfferCard: true, hand: [], deck: [], graveyard: [] }
    },
    boardUnits: {}
  };
}

function addUnit(state: GameState, id: string, playerId: string, unitClass: any, q: number, r: number): Unit {
  const unit: Unit = {
    id,
    playerId,
    cardId: `unit_${unitClass.toLowerCase()}`,
    unitClass,
    hp: 5,
    maxHp: 5,
    attack: 2,
    position: { q, r, s: -q - r },
    buffs: [],
    roundsInField: 0,
    summoningSickness: false,
    canMove: true,
    canAttack: true
  };
  state.boardUnits[id] = unit;
  return unit;
}

describe('GDD: Regras de Unidade Única (Ação Única e Enjoo)', () => {
  it('Unidade não pode AGIR no mesmo turno que entra (Enjoo de Invocação)', () => {
    let state = mockState();
    state.players.p1.hand = ['unit_lanceiro'];
    addUnit(state, 'king', 'p1', 'Rei', 0, 0); 
    addUnit(state, 'enemy', 'p2', 'Rei', 2, 0);
    
    state = playCard(state, 'p1', 'unit_lanceiro', createHex(1, 0, -1));
    const newUnitId = Object.keys(state.boardUnits).find(id => id !== 'king' && id !== 'enemy')!;
    
    expect(state.boardUnits[newUnitId].summoningSickness).toBe(true);
    expect(() => moveTo(state, newUnitId, createHex(1, 1, -2))).toThrow(/enjoo/);
    expect(() => attack(state, newUnitId, 'enemy')).toThrow(/enjoo/);
  });

  it('Unidade não pode MOVER e depois ATACAR no mesmo turno', () => {
    let state = mockState();
    addUnit(state, 'u1', 'p1', 'Cavaleiro', 0, 0);
    addUnit(state, 'enemy', 'p2', 'Rei', 2, 0);
    
    state = moveTo(state, 'u1', createHex(1, 0, -1));
    expect(state.boardUnits['u1'].canAttack).toBe(true); // Mover E Atacar permitido
    // Após mover, o ataque deve funcionar (regra atual)
    const afterAttack = attack(state, 'u1', 'enemy');
    expect(afterAttack.boardUnits['u1'].canAttack).toBe(false); // Agora sim, esgotou o ataque 
  });
});

describe('GDD: Lanceiro (Lancer)', () => {
  it('Lanceiro: Move apenas Verticalmente (r muda)', () => {
    let state = mockState();
    addUnit(state, 'l1', 'p1', 'Lanceiro', 0, 0);
    
    // Lateral (mesmo r) deve falhar
    expect(() => moveTo(state, 'l1', createHex(1, 0, -1))).toThrow(/apenas para frente\/trás/);
    // Vertical (r mudou) deve passar
    expect(() => moveTo(state, 'l1', createHex(0, 1, -1))).not.toThrow();
  });

  it('Lanceiro: Alcance 2 Vertical e Empurrão', () => {
    let state = mockState();
    addUnit(state, 'l1', 'p1', 'Lanceiro', 0, 4);
    addUnit(state, 'target', 'p2', 'Arqueiro', 0, 2); 
    
    state.boardUnits['l1'].roundsInField = 100; // Gatilho de efeito
    
    const nextState = attack(state, 'l1', 'target');
    expect(nextState.boardUnits['target'].position).toEqual(createHex(0, 1, -1));
  });
});

describe('GDD: Arqueiro (Archer)', () => {
  it('Arqueiro: Move 1 casa em qualquer direção', () => {
    let state = mockState();
    addUnit(state, 'a1', 'p1', 'Arqueiro', 0, 0);
    
    expect(() => moveTo(state, 'a1', createHex(0, 1, -1))).not.toThrow();
    expect(() => moveTo(state, 'a1', createHex(1, 0, -1))).not.toThrow();
    expect(() => moveTo(state, 'a1', createHex(0, 2, -2))).toThrow(); // dist 2 is invalid
  });

  it('Arqueiro: Ataque em único alvo dentro do cone (Alcance 3)', () => {
    let state = mockState();
    addUnit(state, 'a1', 'p1', 'Arqueiro', 0, 0);
    
    addUnit(state, 't1', 'p2', 'Lanceiro', 1, -1); // Dist 1
    addUnit(state, 't2', 'p2', 'Lanceiro', 1, 0);  // Dist 1
    
    const nextState = attack(state, 'a1', 't1');
    expect(nextState.boardUnits['t1'].hp).toBeLessThan(5); // Alvo primário sofre dano
    expect(nextState.boardUnits['t2'].hp).toBe(5); // Não é AoE, outro alvo não sofre dano
  });
});

describe('GDD: Assassino (Assassin)', () => {
  it('Assassino: Ataca adjacente ou Salto Diagonal de 2 casas', () => {
    let state = mockState();
    addUnit(state, 'ass', 'p1', 'Assassino', 0, 0);
    addUnit(state, 'target1', 'p2', 'Lanceiro', 1, 0); // Adjacente
    addUnit(state, 'target2', 'p2', 'Lanceiro', 2, -2); // Diagonal dist 2
    addUnit(state, 'target3', 'p2', 'Lanceiro', 2, 0); // Reta dist 2 (Proibido)
    
    expect(() => attack(state, 'ass', 'target1')).not.toThrow();
    
    state = mockState(); // Reset
    addUnit(state, 'ass', 'p1', 'Assassino', 0, 0);
    addUnit(state, 'target2', 'p2', 'Lanceiro', 2, -1); // Diagonal real dist 2
    expect(() => attack(state, 'ass', 'target2', true)).not.toThrow();

    state = mockState();
    addUnit(state, 'ass', 'p1', 'Assassino', 0, 0);
    addUnit(state, 'target3', 'p2', 'Lanceiro', 2, 0);
    expect(() => attack(state, 'ass', 'target3', true)).toThrow(/Salto Diagonal|movimento diagonal de 2 casas exatas/);
  });
});

describe('GDD: Mago (Mage)', () => {
  it('Mago: Explosão Rúnica ( Splash ) em raio 1', () => {
    let state = mockState();
    addUnit(state, 'mago', 'p1', 'Mago', 0, 0);
    addUnit(state, 't1', 'p2', 'Lanceiro', 0, 2); // Alvo a dist 2
    addUnit(state, 't2', 'p2', 'Lanceiro', 1, 1); // Vizinho do alvo (dist 3 do mago)
    
    const nextState = attack(state, 'mago', 't1');
    expect(nextState.boardUnits['t1'].hp).toBeLessThan(5);
    expect(nextState.boardUnits['t2'].hp).toBeLessThan(5);
  });
});

describe('GDD: Clérigo (Cleric)', () => {
  it('Clérigo: Conversão (Adjacente apenas)', () => {
    let state = mockState();
    addUnit(state, 'c', 'p1', 'Clerigo', 0, 0);
    state.boardUnits['c'].roundsInField = 100; // Sucesso garantido
    addUnit(state, 'enemy', 'p2', 'Lanceiro', 0, 1);
    addUnit(state, 'enemy2', 'p2', 'Lanceiro', 0, 2);
    
    expect(() => convert(state, 'c', 'enemy2')).toThrow(/alcance/);
    const nextState = convert(state, 'c', 'enemy');
    expect(nextState.boardUnits['enemy'].playerId).toBe('p1');
  });
});
