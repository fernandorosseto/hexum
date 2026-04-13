import { expect, test, describe, vi } from 'vitest';
import { applyFinalDamage, applyDoT, UNIT_BEHAVIORS, addCombatLog } from './unitBehaviors';
import { createHex } from './hexMath';
import { GameState, Unit } from './types';

// Mock functions
function createMockState(): GameState {
  return {
    matchId: 'test-match',
    turnNumber: 1,
    currentPhase: 'MAIN_PHASE',
    currentTurnPlayerId: 'p1',
    players: {
      p1: { id: 'p1', mana: 10, maxMana: 10, canOfferCard: true, deck: [], hand: [], graveyard: [] },
      p2: { id: 'p2', mana: 10, maxMana: 10, canOfferCard: true, deck: [], hand: [], graveyard: [] }
    },
    boardUnits: {},
    combatLogs: []
  };
}

function createMockUnit(id: string, unitClass: any, playerId: string, hp: number, attack: number, pos: any): Unit {
  return {
    id,
    playerId,
    cardId: `unit_${unitClass.toLowerCase()}`,
    unitClass,
    hp,
    maxHp: hp,
    attack,
    position: pos,
    buffs: [],
    equippedArtifacts: [],
    roundsInField: 100, // Alto para garantir triggers de porcentagem alta se dependesse disso, mas checkEffectTrigger usa random.
    summoningSickness: false,
    canMove: true,
    canAttack: true
  };
}

describe('Unit Attacks and Behaviors', () => {

  describe('Cavaleiro', () => {
    test('Ataque Normal: Aplica dano e pode atordoar', () => {
      const state = createMockState();
      const cavaleiro = createMockUnit('c1', 'Cavaleiro', 'p1', 5, 2, createHex(0, 0, 0));
      const target = createMockUnit('t1', 'Arqueiro', 'p2', 5, 1, createHex(1, -1, 0));
      state.boardUnits[cavaleiro.id] = cavaleiro;
      state.boardUnits[target.id] = target;

      // Mock random to always trigger stun
      vi.spyOn(Math, 'random').mockReturnValue(0);
      
      UNIT_BEHAVIORS['Cavaleiro'].applyDamage(cavaleiro, target, state, 2, false, 0);

      expect(target.hp).toBe(3); // Tomou 2 de dano
      expect(target.buffs.some(b => b.type === 'stun')).toBe(true);

      vi.restoreAllMocks();
    });
  });

  describe('Lanceiro', () => {
    test('Ataque empurra o inimigo', () => {
      const state = createMockState();
      const lanceiro = createMockUnit('l1', 'Lanceiro', 'p1', 4, 2, createHex(0, 0, 0));
      const target = createMockUnit('t1', 'Arqueiro', 'p2', 5, 1, createHex(0, -1, 1)); // q=0, r=-1
      
      state.boardUnits[lanceiro.id] = lanceiro;
      state.boardUnits[target.id] = target;

      vi.spyOn(Math, 'random').mockReturnValue(0); // Força o push
      
      // distance = 1
      UNIT_BEHAVIORS['Lanceiro'].applyDamage(lanceiro, target, state, 1);

      expect(target.hp).toBe(3);
      // Direção do lanceiro pro alvo é dq=0, dr=-1 (s=1).
      // Destino do empurrão deve ser q=0+0, r=-1-1=-2, s=2
      expect(target.position.q).toBe(0);
      expect(target.position.r).toBe(-2);
      expect(target.position.s).toBe(2);

      vi.restoreAllMocks();
    });
  });

  describe('Assassino', () => {
    test('Aplica dano normal e aplica Sangramento (bleed)', () => {
      const state = createMockState();
      const assassino = createMockUnit('a1', 'Assassino', 'p1', 3, 3, createHex(0, 0, 0));
      const target = createMockUnit('t1', 'Arqueiro', 'p2', 5, 1, createHex(1, -1, 0));
      
      state.boardUnits[assassino.id] = assassino;
      state.boardUnits[target.id] = target;

      UNIT_BEHAVIORS['Assassino'].applyDamage(assassino, target, state, 1, false);

      expect(target.hp).toBe(2); // 5 - 3 = 2
      expect(target.buffs.some(b => b.type === 'bleed')).toBe(true);
    });

    test('Transposição Etérea movimenta o Assassino após matar o alvo', () => {
      const state = createMockState();
      const assassino = createMockUnit('a1', 'Assassino', 'p1', 3, 3, createHex(0, 0, 0));
      const target = createMockUnit('t1', 'Arqueiro', 'p2', 4, 1, createHex(2, -1, -1)); // 2 casas
      
      state.boardUnits[assassino.id] = assassino;
      state.boardUnits[target.id] = target;

      // Ataque especial Transposição Etérea
      UNIT_BEHAVIORS['Assassino'].applyDamage(assassino, target, state, 2, true);

      // HP inicial = 4. Dano base = 3 + Transposição(2) = 5. Target morre.
      expect(target.hp).toBeLessThanOrEqual(0);
      
      // Como o alvo morreu, o Assassino deve ocupar a posição exata do alvo.
      // (a função `handleUnitDeath` cuida de remover o alvo da mesa global na jogada normal, mas o behaviour move o boneco de qualquer forma)
      expect(assassino.position.q).toBe(2);
      expect(assassino.position.r).toBe(-1);
    });
  });

  describe('Mago', () => {
    test('Ataque Cataclismo Arcano causa dano em área (AoE) e pode queimar', () => {
      const state = createMockState();
      const mago = createMockUnit('m1', 'Mago', 'p1', 2, 2, createHex(0, 0, 0));
      const target = createMockUnit('t1', 'Cavaleiro', 'p2', 5, 2, createHex(2, 0, -2));
      const bystander = createMockUnit('t2', 'Arqueiro', 'p2', 4, 1, createHex(3, 0, -3)); // Distancia 1 do target

      state.boardUnits[mago.id] = mago;
      state.boardUnits[target.id] = target;
      state.boardUnits[bystander.id] = bystander;

      vi.spyOn(Math, 'random').mockReturnValue(0); // Força a chance de queimar para todos

      UNIT_BEHAVIORS['Mago'].applyDamage(mago, target, state, 2);

      // Mago tem splash de 1. target sofre 2, bystander sofre 2.
      expect(target.hp).toBe(3);
      expect(bystander.hp).toBe(2);
      
      expect(target.buffs.some(b => b.type === 'burn')).toBe(true);
      expect(bystander.buffs.some(b => b.type === 'burn')).toBe(true);

      vi.restoreAllMocks();
    });
  });

});
