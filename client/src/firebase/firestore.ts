// ============================================================
//  firebase/firestore.ts
//  Funções de banco de dados: perfis, partidas, ranking, PvP
// ============================================================

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { GameState } from 'shared';

// ── Tipos ──────────────────────────────────────────────────

export interface UserProfile {
  displayName: string;
  email: string;
  createdAt?: unknown; // serverTimestamp
  stats: {
    wins: number;
    losses: number;
    draws: number;
  };
}

export interface MatchRecord {
  players: string[];       // [uid1, uid2]
  winner: string | 'draw'; // uid do vencedor ou 'draw'
  difficulty?: string;     // 'BEGINNER' | 'ELITE' | 'GRANDMASTER' | 'DEUS'
  durationSeconds?: number;
  startedAt?: unknown;
  endedAt?: unknown;
}

// ── Perfil de Usuário ──────────────────────────────────────

/**
 * Cria ou atualiza um perfil de usuário no Firestore.
 * Usa merge para não sobrescrever dados existentes.
 */
export async function createUserProfile(
  uid: string,
  data: { displayName: string; email: string }
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Novo usuário: cria o documento com stats zeradas
    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      stats: { wins: 0, losses: 0, draws: 0 },
    });
  } else {
    // Usuário existente: atualiza apenas nome/email (sem sobrescrever stats)
    await updateDoc(ref, { displayName: data.displayName, email: data.email });
  }
}

/**
 * Busca o perfil de um usuário pelo UID.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Partidas ───────────────────────────────────────────────

/**
 * Salva o resultado de uma partida e atualiza as estatísticas
 * dos jogadores envolvidos.
 */
export async function saveMatchResult(match: MatchRecord): Promise<string> {
  // Registra a partida
  const matchRef = await addDoc(collection(db, 'matches'), {
    ...match,
    endedAt: serverTimestamp(),
  });

  // Atualiza stats de cada jogador (apenas UIDs reais, não 'ai')
  for (const uid of match.players) {
    if (uid === 'ai' || uid === 'p2') continue; // pula jogadores IA

    const userRef = doc(db, 'users', uid);
    const result =
      match.winner === uid   ? 'wins'
      : match.winner === 'draw' ? 'draws'
      : 'losses';

    await updateDoc(userRef, {
      [`stats.${result}`]: increment(1),
    });
  }

  return matchRef.id;
}

// ── Ranking ────────────────────────────────────────────────

/**
 * Retorna os top N jogadores ordenados por vitórias.
 */
export async function getTopPlayers(n = 10): Promise<(UserProfile & { uid: string })[]> {
  const q = query(
    collection(db, 'users'),
    orderBy('stats.wins', 'desc'),
    limit(n)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...(d.data() as UserProfile) }));
}

// ── PvP — Lobby / Match em tempo real ─────────────────────

export type LobbyStatus = 'waiting' | 'in_progress' | 'finished';

export interface LobbyDoc {
  code: string;             // código de 6 chars para entrar na sala
  hostId: string;           // uid do criador (joga como p1)
  hostName: string;
  guestId: string | null;   // uid do adversário (joga como p2)
  guestName: string | null;
  status: LobbyStatus;
  createdAt: unknown;
  gameState: GameState | null;
}

/**
 * Cria uma nova sala PvP e retorna o ID do documento.
 */
export async function createLobby(
  hostId: string,
  hostName: string,
  initialGameState: GameState
): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const ref = doc(collection(db, 'lobbies'));
  await setDoc(ref, {
    code,
    hostId,
    hostName,
    guestId: null,
    guestName: null,
    status: 'waiting' as LobbyStatus,
    createdAt: serverTimestamp(),
    gameState: initialGameState,
  });

  return ref.id;
}

/**
 * Busca uma sala pelo código de 6 chars e entra como guest.
 * Retorna { lobbyId, doc } ou null se não encontrada.
 */
export async function joinLobbyByCode(
  code: string,
  guestId: string,
  guestName: string
): Promise<{ lobbyId: string; lobby: LobbyDoc } | null> {
  const q = query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(20));
  const snap = await getDocs(q);

  const match = snap.docs.find(
    d => (d.data() as LobbyDoc).code === code.toUpperCase() &&
         (d.data() as LobbyDoc).status === 'waiting'
  );

  if (!match) return null;

  await updateDoc(match.ref, {
    guestId,
    guestName,
    status: 'in_progress' as LobbyStatus,
  });

  return { lobbyId: match.id, lobby: match.data() as LobbyDoc };
}

/**
 * Escuta mudanças em tempo real no documento da sala.
 * Retorna a função para cancelar o listener (unsubscribe).
 */
export function subscribeToLobby(
  lobbyId: string,
  callback: (lobby: LobbyDoc) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'lobbies', lobbyId), snap => {
    if (snap.exists()) callback(snap.data() as LobbyDoc);
  });
}

/**
 * Empurra o novo gameState para o Firestore após uma ação.
 * Só quem tem o turno deve chamar isso.
 */
export async function pushGameState(
  lobbyId: string,
  gameState: GameState
): Promise<void> {
  await updateDoc(doc(db, 'lobbies', lobbyId), { gameState });
}

/**
 * Marca a sala como finalizada.
 */
export async function closeLobby(lobbyId: string): Promise<void> {
  await updateDoc(doc(db, 'lobbies', lobbyId), { status: 'finished' as LobbyStatus });
}
