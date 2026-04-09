import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import type { HexCoordinates } from 'shared';

// Limpa o store antes de cada teste para isolar e evitar poluição da memória
beforeEach(() => {
  useGameStore.setState({
    selectedHex: null,
    boardUnits: {
      'u1': { id: 'u1', playerId: 'p1', cardId: 'c1', unitClass: 'Rei', hp: 5, maxHp: 5, attack: 3, buffs: [], position: { q: 0, r: 0, s: 0 }, canMove: true, canAttack: true, summoningSickness: false, roundsInField: 1 },
    }
  });
});

describe('Zustand GameStore (UI State Manager)', () => {
  
  it('Deve registrar a seleção de um Hexágono vazio (setSelectedHex)', () => {
    const coord: HexCoordinates = { q: 1, r: -1, s: 0 };
    useGameStore.getState().setSelectedHex(coord);
    
    expect(useGameStore.getState().selectedHex).toEqual(coord);
  });

  it('Deve realizar o movinento (attemptMove) de uma unidade com sucesso se adjacente', () => {
    const destination = { q: 1, r: -1, s: 0 }; // Distância 1 (Totalmente Válida)
    
    useGameStore.getState().attemptMove('u1', destination);
    
    // A unidade do Estado Reactivo andou de 0,0,0 para 1,-1,0
    const movedUnit = useGameStore.getState().boardUnits['u1'];
    expect(movedUnit.position).toEqual(destination);
    
    // Após andar com sucesso, o selectedHex volta pra vazio para limpar os realces da UI
    expect(useGameStore.getState().selectedHex).toBeNull();
  });
  
  it('A tentativa de movimentação deve REJEITAR pulos maiores do que 2 hexágonos de distância (Rede Mockada Fase 2)', () => {
    const origin = { q: 0, r: 0, s: 0 };
    const invalidDestination = { q: 3, r: -3, s: 0 }; // Distância 3 (Inválido para movimento direto da Fase 2)
    
    useGameStore.getState().attemptMove('u1', invalidDestination);
    
    // O Unit NÃO sai do lugar porque o Client-Side impediu.
    const unit = useGameStore.getState().boardUnits['u1'];
    expect(unit.position).toEqual(origin);
  });
});
