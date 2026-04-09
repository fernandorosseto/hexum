import { describe, it, expect } from 'vitest';
import { createInitialState, playCard, cloneGameState } from './gameEngine';
import { getHexDistance } from './hexMath';

describe('Chain Lightning (Cadeia de Relâmpagos)', () => {
  it('should limit range to 5 hexes from the King', () => {
    const state = createInitialState();
    const p1Id = 'p1';
    const player = state.players[p1Id];
    player.mana = 10;
    player.hand.push('spl_raio');

    const myKing = Object.values(state.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId === p1Id)!;
    
    // Alvo muito longe (raio 6+)
    const farHex = { q: myKing.position.q + 6, r: myKing.position.r, s: myKing.position.s - 6 };
    
    // Mockar uma unidade inimiga lá para o teste não falhar por falta de alvo
    state.boardUnits['enemy_far'] = {
        id: 'enemy_far', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
        hp: 3, maxHp: 3, attack: 1, position: farHex, buffs: [], roundsInField: 0,
        summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
    };

    expect(() => playCard(state, p1Id, 'spl_raio', farHex)).toThrow(/fora de alcance/);
  });

  it('should hit the adjacent enemy with lowest HP', () => {
    const state = createInitialState();
    const p1Id = 'p1';
    const player = state.players[p1Id];
    player.mana = 10;
    player.hand.push('spl_raio');

    const mainTargetHex = { q: 0, r: 0, s: 0 };
    state.boardUnits['target'] = {
        id: 'target', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
        hp: 3, maxHp: 3, attack: 1, position: mainTargetHex, buffs: [], roundsInField: 0,
        summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
    };

    // Vizinho 1: 3 HP
    const n1Hex = { q: 1, r: -1, s: 0 };
    state.boardUnits['n1'] = {
        id: 'n1', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
        hp: 3, maxHp: 3, attack: 1, position: n1Hex, buffs: [], roundsInField: 0,
        summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
    };

    // Vizinho 2: 2 HP (Deveria ser o escolhido)
    const n2Hex = { q: 1, r: 0, s: -1 };
    state.boardUnits['n2'] = {
        id: 'n2', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
        hp: 2, maxHp: 2, attack: 1, position: n2Hex, buffs: [], roundsInField: 0,
        summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
    };

    const newState = playCard(state, p1Id, 'spl_raio', mainTargetHex);
    
    expect(newState.boardUnits['target'].hp).toBe(1); // 3 - 2
    expect(newState.boardUnits['n2'].hp).toBe(1); // 2 - 1
    expect(newState.boardUnits['n1'].hp).toBe(3); // Inalterado
  });

  it('should hit the adjacent enemy closest to King if HP is tied', () => {
    const state = createInitialState();
    const p1Id = 'p1';
    const player = state.players[p1Id];
    player.mana = 10;
    player.hand.push('spl_raio');

    const myKing = Object.values(state.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId === p1Id)!;
    
    // Alvo principal
    const mainTargetHex = { q: 0, r: 0, s: 0 };
    state.boardUnits['target'] = {
        id: 'target', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
        hp: 3, maxHp: 3, attack: 1, position: mainTargetHex, buffs: [], roundsInField: 0,
        summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
    };

    // Vizinho 1: 3 HP, Distância ao Rei
    const n1Hex = { q: 1, r: -1, s: 0 };
    state.boardUnits['n1'] = {
        id: 'n1', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
        hp: 3, maxHp: 3, attack: 1, position: n1Hex, buffs: [], roundsInField: 0,
        summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
    };

    // Vizinho 2: 3 HP, Distância ao Rei
    const n2Hex = { q: -1, r: 0, s: 1 };
    state.boardUnits['n2'] = {
        id: 'n2', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
        hp: 3, maxHp: 3, attack: 1, position: n2Hex, buffs: [], roundsInField: 0,
        summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
    };

    const d1 = getHexDistance(n1Hex, myKing.position);
    const d2 = getHexDistance(n2Hex, myKing.position);

    const newState = playCard(state, p1Id, 'spl_raio', mainTargetHex);
    
    if (d1 < d2) {
        expect(newState.boardUnits['n1'].hp).toBe(2);
        expect(newState.boardUnits['n2'].hp).toBe(3);
    } else if (d2 < d1) {
        expect(newState.boardUnits['n2'].hp).toBe(2);
        expect(newState.boardUnits['n1'].hp).toBe(3);
    }
  });
});
