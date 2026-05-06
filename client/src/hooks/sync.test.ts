/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';


// Mock do pushGameState
const mockPushGameState = vi.fn();
vi.mock('../firebase/firestore', () => ({
  pushGameState: (...args: any[]) => mockPushGameState(...args),
  subscribeToLobby: vi.fn(),
  closeLobby: vi.fn(),
}));

describe('Lógica de Sincronização PvP', () => {
  it('Deve detectar mudanças no store e acionar o syncAction se for o turno do jogador', async () => {
    // 1. Configura o estado inicial do store para simular o P2
    useGameStore.setState({
      isPvP: true,
      lobbyId: 'test-lobby',
      myRole: 'p2',
      currentTurnPlayerId: 'p2', // Turno do P2
      boardUnits: {},
      players: { 
        p1: { mana: 1, maxMana: 1, hand: [], deck: [], graveyard: [], canOfferCard: true, id: 'p1' },
        p2: { mana: 1, maxMana: 1, hand: [], deck: [], graveyard: [], canOfferCard: true, id: 'p2' }
      }
    });

    // 2. Simula o comportamento do hook useMultiplayer (inscrição no store)
    // (Apenas a parte relevante da lógica que queremos testar)
    const myRole = 'p2';
    const lobbyId = 'test-lobby';
    
    const syncAction = async (state: any) => {
      mockPushGameState(lobbyId, state);
    };

    useGameStore.subscribe(
      (state) => state,
      (state, prevState) => {
        if (!state.isPvP) return;
        const hasChanged = state.boardUnits !== prevState.boardUnits;
        const isMyTurn = state.currentTurnPlayerId === myRole;
        if (hasChanged && isMyTurn) {
          syncAction(state);
        }
      }
    );

    // 3. Simula uma ação de jogo: P2 move uma unidade (altera boardUnits)
    useGameStore.setState({
      boardUnits: { 'u1': { id: 'u1', playerId: 'p2' } as any }
    });

    // 4. Verifica se o mockPushGameState foi chamado
    expect(mockPushGameState).toHaveBeenCalledWith('test-lobby', expect.objectContaining({
      boardUnits: { 'u1': expect.anything() }
    }));
  });
});
