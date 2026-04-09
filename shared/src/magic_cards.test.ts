import { expect, test, describe } from 'vitest';
import { playCard, attack, endTurn, moveTo } from './gameEngine';
import { GameState } from './types';

function mockGameState(): GameState {
  return {
    matchId: 'test_magic',
    turnNumber: 1,
    currentPhase: 'MAIN_PHASE',
    currentTurnPlayerId: 'p1',
    players: {
      p1: { id: 'p1', mana: 5, maxMana: 5, canOfferCard: true, hand: ['art_escudo', 'art_montante', 'spl_raio', 'spl_bencao', 'spl_raizes', 'spl_nevoa', 'spl_meteoro', 'spl_transfusao'], deck: [], graveyard: [] },
      p2: { id: 'p2', mana: 5, maxMana: 5, canOfferCard: true, hand: [], deck: [], graveyard: [] }
    },
    boardUnits: {
      king_p1: {
        id: 'king_p1', playerId: 'p1', cardId: 'unit_rei', unitClass: 'Rei',
        position: { q: 0, r: 5, s: -5 }, hp: 6, maxHp: 6, attack: 1, buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
      },
      knight_p1: {
        id: 'knight_p1', playerId: 'p1', cardId: 'unit_cavaleiro', unitClass: 'Cavaleiro',
        position: { q: 0, r: 0, s: 0 }, hp: 5, maxHp: 5, attack: 3, buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
      },
      archer_p1: {
        id: 'archer_p1', playerId: 'p1', cardId: 'unit_arqueiro', unitClass: 'Arqueiro',
        position: { q: 1, r: -1, s: 0 }, hp: 2, maxHp: 2, attack: 1, buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
      },
      assassin_p1: {
        id: 'assassin_p1', playerId: 'p1', cardId: 'unit_assassino', unitClass: 'Assassino',
        position: { q: -2, r: 0, s: 2 }, hp: 2, maxHp: 2, attack: 4, buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
      },
      lancer_p2: {
        id: 'lancer_p2', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
        position: { q: 0, r: -4, s: 4 }, hp: 3, maxHp: 3, attack: 1, buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
      },
      mage_p2: {
        id: 'mage_p2', playerId: 'p2', cardId: 'unit_mago', unitClass: 'Mago',
        position: { q: 0, r: -3, s: 3 }, hp: 3, maxHp: 3, attack: 1, buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
      }
    }
  };
}

describe('Magic Cards and Artifacts Mechanics', () => {

  test('Artifact: Escudo de Torre gives HP and MaxHP', () => {
    let state = mockGameState();
    const heroHpBefore = state.boardUnits.knight_p1.hp;
    
    // Equip shield
    state = playCard(state, 'p1', 'art_escudo', { q: 0, r: 0, s: 0 });
    
    expect(state.boardUnits.knight_p1.equippedArtifacts).toContain('art_escudo');
    expect(state.boardUnits.knight_p1.hp).toBe(heroHpBefore + 2);
    expect(state.boardUnits.knight_p1.maxHp).toBe(heroHpBefore + 2);
    expect(state.boardUnits.knight_p1.buffs.some(b => b.type === 'shield')).toBe(true);
    expect(state.players.p1.mana).toBe(3); // 5 - 2 = 3
  });

  test('Artifact: Montante do Carrasco gives permanent +2 ATK', () => {
    let state = mockGameState();
    const atkBefore = state.boardUnits.knight_p1.attack;
    
    state = playCard(state, 'p1', 'art_montante', { q: 0, r: 0, s: 0 });
    
    expect(state.boardUnits.knight_p1.equippedArtifacts).toContain('art_montante');
    expect(state.boardUnits.knight_p1.attack).toBe(atkBefore + 2);
  });

  test('Spell: Cadeia de Relâmpagos deals 2 direct and 1 splash', () => {
    let state = mockGameState();
    // Lanceiro e Mago estão grudados (+1 q, +1 r vizinhos) no mock? q=0,r=-4 e q=1,r=-3 são vizinhos.
    const lancerHp = state.boardUnits.lancer_p2.hp;
    const mageHp = state.boardUnits.mage_p2.hp;

    state = playCard(state, 'p1', 'spl_raio', { q: 0, r: -4, s: 4 });

    // Target levou -2, Splash levou -1
    expect(state.boardUnits.lancer_p2.hp).toBe(lancerHp - 2);
    expect(state.boardUnits.mage_p2.hp).toBe(mageHp - 1);
  });

  test('Spell: Bênção Divina heals +3 and removes debuffs', () => {
    let state = mockGameState();
    state.boardUnits.knight_p1.hp = 1;
    state.boardUnits.knight_p1.buffs.push({ type: 'poison', duration: 2 });
    
    state = playCard(state, 'p1', 'spl_bencao', { q: 0, r: 0, s: 0 });
    
    expect(state.boardUnits.knight_p1.hp).toBe(4);
    expect(state.boardUnits.knight_p1.buffs.length).toBe(0); // Poison removed
  });

  test('Spell: Raízes da Terra applies STUN to enemy', () => {
    let state = mockGameState();
    state = playCard(state, 'p1', 'spl_raizes', { q: 0, r: -4, s: 4 }); // target lancer
    expect(state.boardUnits.lancer_p2.buffs.some(b => b.type === 'stun')).toBe(true);
  });

  test('Spell: Transfusão Sombria damages unit and heals King', () => {
    let state = mockGameState();
    state.boardUnits.king_p1.hp = 2; // machucar o rei
    
    const knightHpBefore = state.boardUnits.knight_p1.hp;
    state = playCard(state, 'p1', 'spl_transfusao', { q: 0, r: 0, s: 0 });
    
    expect(state.boardUnits.knight_p1.hp).toBe(knightHpBefore - 2);
    expect(state.boardUnits.king_p1.hp).toBe(4); // 2 + 2 = 4
  });

  test('Spell: Névoa Espessa applies immune_ranged to prevent targeting', () => {
    let state = mockGameState();
    // Proteger o Knight
    state = playCard(state, 'p1', 'spl_nevoa', { q: 0, r: 0, s: 0 });
    
    // Mudar turno pro inimigo testar o ataque a longa distância
    state.currentTurnPlayerId = 'p2';
    // Mover Mago para perto do ataque (dist=2) para testar
    state.boardUnits.mage_p2.position = { q: 0, r: -2, s: 2 };
    state.boardUnits.mage_p2.canAttack = true;

    // Mage ataca Knight (distancia 2), deveria dar erro pois Knight está imune
    expect(() => {
      attack(state, 'mage_p2', 'knight_p1');
    }).toThrow(/imune/);
    
  });

  test('Spell: Chuva de Meteoros AoE Damage', () => {
    let state = mockGameState();
    
    // Meteror no Lancer
    state = playCard(state, 'p1', 'spl_meteoro', { q: 0, r: -4, s: 4 });

    // Lancer morre (-3 HP do max 3)
    expect(state.boardUnits.lancer_p2).toBeUndefined();
    
    // Mago adjacente toma respingo (-2 HP do max 3, sobra 1)
    expect(state.boardUnits.mage_p2.hp).toBe(1);
  });

});
