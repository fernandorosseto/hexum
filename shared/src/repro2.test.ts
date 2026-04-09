import { describe, it, expect } from 'vitest';
import { getValidAttackTargets } from './getValidAttackTargets';

describe('Cavaleiro Attack Validation', () => {
  it('should include target at distance 2 in attack targets', () => {
    const mockState = {
      currentTurnPlayerId: 'p1',
      currentPhase: 'MAIN_PHASE',
      boardUnits: {
        'u1': {
          id: 'u1', playerId: 'p1', cardId: 'unit_cavaleiro', unitClass: 'Cavaleiro',
          hp: 5, maxHp: 5, attack: 3, position: { q: 0, r: 0, s: 0 },
          buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
        },
        'u2': {
          id: 'u2', playerId: 'p2', cardId: 'unit_lanceiro', unitClass: 'Lanceiro',
          hp: 3, maxHp: 3, attack: 1, position: { q: 0, r: -2, s: 2 },
          buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
        }
      }
    };

    const targets = getValidAttackTargets(mockState as any, 'u1');
    console.log("Targets found: ", targets);
    expect(targets.length).toBeGreaterThan(0);
  });
});
