import { describe, it, expect } from 'vitest';
import { getValidAttackTargets } from './getValidAttackTargets';
import { UNIT_STATS } from './cardLibrary';

describe('Repro Sandbox Crash', () => {
  it('should not crash when computing attacks for a newly spawned unit', () => {
    const unitName = 'Cavaleiro';
    const stats = UNIT_STATS[unitName];
    const unitId = 'u_test';
    const hex = { q: 0, r: 0, s: 0 };
    const playerId = 'p1';
    
    const newUnit = {
      id: unitId,
      playerId,
      cardId: `unit_${unitName.toLowerCase()}`,
      unitClass: unitName as any,
      hp: stats.hp,
      maxHp: stats.hp,
      attack: stats.attack,
      position: hex,
      buffs: [],
      roundsInField: 0,
      summoningSickness: false,
      canMove: true,
      canAttack: true,
      equippedArtifacts: []
    };

    const mockBoard = { [unitId]: newUnit };
    const mockState = { 
      boardUnits: mockBoard, 
      currentTurnPlayerId: playerId, 
      currentPhase: 'MAIN_PHASE' 
    };

    // This simulates the call in HexMap.tsx
    const results = getValidAttackTargets(mockState as any, unitId);
    expect(Array.isArray(results)).toBe(true);
  });
});
