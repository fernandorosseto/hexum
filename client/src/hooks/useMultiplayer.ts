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

      // Aplica o GameState do Firestore no store local
      if (lobby.gameState) {
        useGameStore.setState(state => ({
          ...state,
          ...lobby.gameState,
          // Mantém estados de UI local intactos
          selectedHex:  null,
          selectedCard: null,
          targetHex:    null,
        }));
      }
    });

    return () => unsub();
  }, [lobbyId, myRole, setCurrentView]);

  // ── Envia o estado local para o Firestore após uma ação ──
  const syncAction = useCallback(
    async (newGameState: GameState) => {
      if (!lobbyId) return;
      isSyncing.current = true;
      try {
        await pushGameState(lobbyId, newGameState);
      } finally {
        // Libera flag após um pequeno delay para evitar echo
        setTimeout(() => { isSyncing.current = false; }, 300);
      }
    },
    [lobbyId]
  );

  // ── Encerra a sala quando o jogo termina ──
  useEffect(() => {
    if (!lobbyId || currentPhase !== 'GAME_OVER') return;
    closeLobby(lobbyId);
  }, [lobbyId, currentPhase]);

  return { syncAction, myUid: user?.uid ?? null };
}
