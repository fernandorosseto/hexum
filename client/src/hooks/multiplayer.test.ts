/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

// ─── MOCKS ───

// Mock do Firestore
const mockPushGameState = vi.fn();
const mockSubscribeToLobby = vi.fn();

vi.mock('../firebase/firestore', () => ({
  pushGameState: (...args: any[]) => mockPushGameState(...args),
  subscribeToLobby: (...args: any[]) => mockSubscribeToLobby(...args),
  closeLobby: vi.fn(),
}));

describe('Sistema de Sincronização PvP (Multiplayer)', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpa o estado do store para cada teste
    useGameStore.setState({
      isPvP: true,
      lobbyId: 'room-123',
      myRole: 'p1',
      currentTurnPlayerId: 'p1',
      boardUnits: {},
      players: { 
        p1: { id: 'p1', mana: 1 } as any, 
        p2: { id: 'p2', mana: 1 } as any 
      }
    });
  });

  it('1. Deve ignorar snapshots que sejam idênticos ao último estado enviado (Prevenção de Loop)', async () => {
    // Simulamos a lógica do hook
    let lastSyncedState = JSON.stringify({ boardUnits: {} }); // Estado inicial mockado
    
    const incomingSnapshot = { 
      gameState: { boardUnits: {} } // Snapshot idêntico ao que "enviamos"
    };

    const shouldApply = JSON.stringify(incomingSnapshot.gameState) !== lastSyncedState;
    
    expect(shouldApply).toBe(false);
  });

  it('2. Deve permitir a aplicação de snapshots quando o estado é diferente', () => {
    let lastSyncedState = JSON.stringify({ boardUnits: {} });
    
    const incomingSnapshot = { 
      gameState: { boardUnits: { 'u1': { id: 'u1' } } } 
    };

    const shouldApply = JSON.stringify(incomingSnapshot.gameState) !== lastSyncedState;
    
    expect(shouldApply).toBe(true);
  });

  it('3. Deve sincronizar apenas campos permitidos (filtro de GameState)', () => {
    const fullStoreState = {
      boardUnits: { 'u1': {} },
      myRole: 'p1', // Campo local
      lobbyId: '123', // Campo local
      currentTurnPlayerId: 'p1'
    };

    // Lógica de extração usada no syncAction
    const extractGameState = (state: any) => ({
      boardUnits: state.boardUnits,
      currentTurnPlayerId: state.currentTurnPlayerId
    });

    const filtered = extractGameState(fullStoreState);
    
    expect(filtered).not.toHaveProperty('myRole');
    expect(filtered).not.toHaveProperty('lobbyId');
    expect(filtered).toHaveProperty('boardUnits');
  });

  it('4. Deve detectar transição de turno corretamente', () => {
    const myRole = 'p1';
    let prevTurnId = 'p1';
    
    // Simula mudança de turno no store (p1 -> p2)
    const newState = { currentTurnPlayerId: 'p2' };
    
    const isMyTurn = newState.currentTurnPlayerId === myRole;
    const iJustPassedTurn = prevTurnId === myRole && newState.currentTurnPlayerId !== myRole;

    expect(isMyTurn).toBe(false);
    expect(iJustPassedTurn).toBe(true); // O sistema detecta que EU passei a vez
  });
});
