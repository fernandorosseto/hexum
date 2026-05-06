// ============================================================
//  hooks/useMultiplayer.ts
//  Gerencia a sessão PvP: sincroniza o GameState com Firestore
//  via onSnapshot e envia ações como o jogador da vez.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuth } from './useAuth';
import {
  subscribeToLobby,
  pushGameState,
  closeLobby,
  type LobbyDoc,
} from '../firebase/firestore';
import type { GameState } from 'shared';

interface UseMultiplayerOptions {
  lobbyId: string | null;
  /** 'p1' se este cliente é o host, 'p2' se é o guest */
  myRole: 'p1' | 'p2' | null;
}

/**
 * Escuta o Firestore em tempo real.
 * - Quando o oponente age: aplica o gameState recebido no store local.
 * - Quando é nossa vez e agimos: pushGameState() sobe para o Firestore.
 */
export function useMultiplayer({ lobbyId, myRole }: UseMultiplayerOptions) {
  const { user } = useAuth();
  const setCurrentView = useGameStore(s => s.setCurrentView);
  const currentPhase   = useGameStore(s => s.currentPhase);

  // Ref para evitar loop: não aplicar o snapshot que nós mesmos geramos
  const isSyncing = useRef(false);

  // ── Recebe snapshot do Firestore e aplica no store local ──
  useEffect(() => {
    if (!lobbyId || !myRole) return;

    const unsub = subscribeToLobby(lobbyId, (lobby: LobbyDoc) => {
      // Se a sala foi finalizada por outra aba/cliente, volta ao menu
      if (lobby.status === 'finished') {
        setCurrentView('MENU');
        return;
      }

      // Ignora o snapshot que nós mesmos enviamos
      if (isSyncing.current) return;

      // Aplica apenas os campos do GameState, sem sobrescrever o papel (myRole) ou IDs de sala
      if (lobby.gameState) {
        const { 
          matchId, turnNumber, currentPhase, currentTurnPlayerId, 
          aiDifficulty, players, boardUnits, combatLogs, winner 
        } = lobby.gameState;

        useGameStore.setState({
          matchId,
          turnNumber,
          currentPhase,
          currentTurnPlayerId,
          aiDifficulty,
          players,
          boardUnits,
          combatLogs,
          winner,
          // Limpa estados de seleção local após atualização externa
          selectedHex:  null,
          selectedCard: null,
          targetHex:    null,
        } as any);
      }
    });

    return () => unsub();
  }, [lobbyId, myRole, setCurrentView]);

  // ── Envia o estado local para o Firestore após uma ação ──
  const syncAction = useCallback(
    async (fullState: any) => {
      if (!lobbyId) return;
      isSyncing.current = true;
      try {
        const gameState: GameState = {
          matchId:             fullState.matchId,
          turnNumber:          fullState.turnNumber,
          currentPhase:        fullState.currentPhase,
          currentTurnPlayerId: fullState.currentTurnPlayerId,
          aiDifficulty:        fullState.aiDifficulty,
          players:             fullState.players,
          boardUnits:          fullState.boardUnits,
          combatLogs:          fullState.combatLogs || [],
          winner:              fullState.winner || null,
        };
        await pushGameState(lobbyId, gameState);
      } finally {
        // Reduzido para 100ms para ser mais responsivo
        setTimeout(() => { isSyncing.current = false; }, 100);
      }
    },
    [lobbyId]
  );

  // ── Inscrição direta no store para sincronização de saída ──
  useEffect(() => {
    if (!lobbyId || !myRole) return;

    const unsubStore = useGameStore.subscribe(
      (state) => state,
      (state, prevState) => {
        if (!state.isPvP) return;

        // Detecta mudanças no estado vital do jogo
        const hasChanged = 
          state.boardUnits !== prevState.boardUnits || 
          state.players !== prevState.players || 
          state.currentTurnPlayerId !== prevState.currentTurnPlayerId ||
          state.currentPhase !== prevState.currentPhase ||
          state.winner !== prevState.winner ||
          state.turnNumber !== prevState.turnNumber;

        if (!hasChanged) return;

        const isMyTurn = state.currentTurnPlayerId === myRole;
        const iJustPassedTurn = prevState.currentTurnPlayerId === myRole && !isMyTurn;

        if (isMyTurn || iJustPassedTurn) {
          syncAction(state);
        }
      }
    );

    return () => unsubStore();
  }, [lobbyId, myRole, syncAction]);

  // ── Encerra a sala quando o jogo termina ──
  useEffect(() => {
    if (!lobbyId || currentPhase !== 'GAME_OVER') return;
    closeLobby(lobbyId);
  }, [lobbyId, currentPhase]);

  return { syncAction, myUid: user?.uid ?? null };
}
