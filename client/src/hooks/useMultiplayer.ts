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
import { shouldAcceptRemoteState } from './pvpSync';

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
  const myUid = user?.uid ?? null;
  const setCurrentView = useGameStore(s => s.setCurrentView);
  const currentPhase   = useGameStore(s => s.currentPhase);

  // Ref para evitar loop: não aplicar o snapshot que nós mesmos geramos
  const lastSyncedState = useRef<string>('');

  // ── Recebe snapshot do Firestore e aplica no store local ──
  useEffect(() => {
    if (!lobbyId || !myRole) return;

    const role = myRole;
    const unsub = subscribeToLobby(lobbyId, (lobby: LobbyDoc) => {
      // Sala finalizada: se a partida terminou aqui também, deixamos o jogador
      // na tela de resultado (antes os dois clientes eram jogados no menu antes
      // de o GameOverUI sequer aparecer). Só voltamos ao menu quando a sala
      // fecha sem um fim de jogo local (host saiu, sala expirou).
      if (lobby.status === 'finished') {
        if (useGameStore.getState().currentPhase !== 'GAME_OVER') {
          useGameStore.getState().clearLobbySession();
          setCurrentView('MENU');
        }
        return;
      }

      // Ignora o snapshot se for idêntico ao que acabamos de enviar
      const incomingJson = JSON.stringify(lobby.gameState);
      if (incomingJson === lastSyncedState.current) return;

      // Aplica apenas os campos do GameState, sem sobrescrever o papel (myRole) ou IDs de sala
      if (lobby.gameState) {
        // Sem servidor autoritativo, o adversário pode escrever qualquer coisa
        // no documento. Barramos o caso óbvio: escrita fora do turno dele e
        // snapshot que volta no tempo.
        const localState = useGameStore.getState();
        const decision = shouldAcceptRemoteState(
          {
            turnNumber: localState.turnNumber,
            currentTurnPlayerId: localState.currentTurnPlayerId,
            currentPhase: localState.currentPhase,
          },
          lobby.gameState,
          role,
        );
        if (!decision.accept) {
          console.warn('PvP: snapshot recusado —', decision.reason);
          return;
        }

        const { 
          matchId, turnNumber, currentPhase, currentTurnPlayerId, 
          players, boardUnits, combatLogs, winner 
        } = lobby.gameState;

        useGameStore.setState({
          matchId,
          turnNumber,
          currentPhase,
          currentTurnPlayerId,
          players,
          boardUnits,
          combatLogs,
          winner,
          lastActionVfx: lobby.gameState.lastActionVfx,
          // Limpa estados de seleção local após atualização externa
          selectedHex:  null,
          selectedCard: null,
          targetHex:    null,
        } as any);

        // Dispara VFX se houver um novo timestamp
        if (lobby.gameState.lastActionVfx && lobby.gameState.lastActionVfx.timestamp !== useGameStore.getState().lastActionVfx?.timestamp) {
           useGameStore.getState().triggerRemoteVfx(lobby.gameState.lastActionVfx);
        }
      }
    });

    return () => unsub();
  }, [lobbyId, myRole, setCurrentView]);

  // ── Envia o estado local para o Firestore após uma ação ──
  const syncAction = useCallback(
    async (fullState: GameState) => {
      if (!lobbyId || !myUid) return;
      
      const gameState: GameState = {
        matchId:             fullState.matchId,
        turnNumber:          fullState.turnNumber,
        currentPhase:        fullState.currentPhase,
        currentTurnPlayerId: fullState.currentTurnPlayerId,
        players:             fullState.players,
        boardUnits:          fullState.boardUnits,
        combatLogs:          fullState.combatLogs || [],
        winner:              fullState.winner ?? undefined,
        lastActionVfx:       fullState.lastActionVfx,
      };

      const stateJson = JSON.stringify(gameState);
      if (stateJson === lastSyncedState.current) return;

      lastSyncedState.current = stateJson;
      try {
        await pushGameState(lobbyId, gameState, myUid);
      } catch (err) {
        console.error('Falha ao sincronizar PvP:', err);
      }
    },
    [lobbyId, myUid]
  );

  // Ref para a função de sincronização para evitar re-inscrições desnecessárias no store
  const syncActionRef = useRef(syncAction);
  useEffect(() => {
    syncActionRef.current = syncAction;
  }, [syncAction]);

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
          state.turnNumber !== prevState.turnNumber ||
          state.lastActionVfx?.timestamp !== prevState.lastActionVfx?.timestamp;

        if (!hasChanged) return;

        const isMyTurn = state.currentTurnPlayerId === myRole;
        const iJustPassedTurn = prevState.currentTurnPlayerId === myRole && !isMyTurn;

        if (isMyTurn || iJustPassedTurn) {
          syncActionRef.current(state);
        }
      }
    );

    return () => unsubStore();
  }, [lobbyId, myRole]);

  // ── Listener para o botão "FORÇAR SYNC" do Debug ──
  useEffect(() => {
    const handleForceSync = () => {
      lastSyncedState.current = ''; // Limpa o cache para garantir que o sync dispare
      syncActionRef.current(useGameStore.getState());
    };
    window.addEventListener('force-pvp-sync', handleForceSync);
    return () => window.removeEventListener('force-pvp-sync', handleForceSync);
  }, []);

  // ── Encerra a sala quando o jogo termina ──
  useEffect(() => {
    if (!lobbyId || currentPhase !== 'GAME_OVER') return;
    const code = useGameStore.getState().lobbyCode ?? undefined;
    closeLobby(lobbyId, code).catch(err => console.warn('Falha ao fechar a sala:', err));
  }, [lobbyId, currentPhase]);

  return { syncAction, myUid };
}
