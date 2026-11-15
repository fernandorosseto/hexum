// ============================================================
//  hooks/pvpSync.ts
//  Regras puras de sincronização PvP, isoladas para poderem ser testadas.
// ============================================================

import type { GameState } from 'shared';

export type Role = 'p1' | 'p2';

/** Recorte do estado local que a decisão precisa conhecer. */
export interface LocalSyncView {
  turnNumber: number;
  currentTurnPlayerId: string;
  currentPhase: GameState['currentPhase'];
}

export interface RemoteDecision {
  accept: boolean;
  reason: string;
}

/**
 * Decide se um snapshot recebido do Firestore pode ser aplicado.
 *
 * O cliente é a autoridade nesta arquitetura (sem servidor), então um
 * adversário mal-intencionado pode escrever qualquer coisa no documento. Estas
 * checagens não substituem um servidor autoritativo, mas barram o caso óbvio:
 * escrever no turno do outro (inclusive "eu venci") e voltar o jogo no tempo.
 */
export function shouldAcceptRemoteState(
  local: LocalSyncView,
  incoming: GameState,
  myRole: Role,
): RemoteDecision {
  if (!incoming || typeof incoming.turnNumber !== 'number' || !incoming.players || !incoming.boardUnits) {
    return { accept: false, reason: 'snapshot malformado' };
  }

  // O jogo nunca anda para trás.
  if (incoming.turnNumber < local.turnNumber) {
    return { accept: false, reason: 'turno anterior ao local' };
  }

  // Partida já encerrada aqui: nada mais é aplicado.
  if (local.currentPhase === 'GAME_OVER') {
    return { accept: false, reason: 'partida já encerrada localmente' };
  }

  // Era a vez do adversário: a escrita é legítima.
  if (local.currentTurnPlayerId !== myRole) return { accept: true, reason: 'turno do adversário' };

  // Era a minha vez. Só aceito se o turno de fato avançou (por exemplo, eu
  // passei a vez em outra aba); escrita no meio do meu turno é rejeitada.
  if (incoming.turnNumber > local.turnNumber) {
    return { accept: true, reason: 'turno avançou' };
  }

  return { accept: false, reason: 'escrita do adversário durante o meu turno' };
}
