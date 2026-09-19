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
  writeBatch,
  runTransaction,
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
  if (!db) return;
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
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Partidas ───────────────────────────────────────────────

/**
 * Salva o resultado e atualiza as estatísticas do JOGADOR LOCAL.
 *
 * Antes esta função escrevia no documento dos dois jogadores a partir do
 * navegador — qualquer cliente conseguia inflar (ou zerar) o placar alheio.
 * As regras do Firestore agora só permitem que cada um escreva no próprio
 * documento. Um ranking realmente confiável precisa de Cloud Function: o
 * cliente continua podendo mexer no próprio placar.
 */
export async function saveMatchResult(match: MatchRecord, localUid: string): Promise<string> {
  if (!db) return 'offline_match';

  const matchRef = await addDoc(collection(db, 'matches'), {
    ...match,
    endedAt: serverTimestamp(),
  });

  const isRealPlayer = localUid && localUid !== 'ai' && localUid !== 'p1' && localUid !== 'p2';
  if (isRealPlayer && match.players.includes(localUid)) {
    const result =
      match.winner === localUid ? 'wins'
      : match.winner === 'draw' ? 'draws'
      : 'losses';

    await updateDoc(doc(db, 'users', localUid), {
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
  if (!db) return [];
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
  /** uid de quem escreveu o último gameState (checado na recepção). */
  updatedBy?: string;
}

/**
 * Índice público código -> sala. Mantém o documento da partida legível apenas
 * pelos dois participantes: antes, entrar numa sala exigia listar `lobbies`,
 * o que deixava qualquer usuário ler o estado (e as mãos) de partidas alheias.
 * Este documento não guarda nada do jogo.
 */
export interface LobbyCodeDoc {
  lobbyId: string;
  hostName: string;
  status: LobbyStatus;
}

const LOBBY_CODE_LENGTH = 6;
const LOBBY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I/O/0/1

function generateLobbyCode(): string {
  const bytes = new Uint32Array(LOBBY_CODE_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, b => LOBBY_CODE_ALPHABET[b % LOBBY_CODE_ALPHABET.length]).join('');
}

/**
 * Cria uma nova sala PvP e retorna o ID do documento.
 */
export async function createLobby(
  hostId: string,
  hostName: string,
  initialGameState: GameState
): Promise<{ lobbyId: string; code: string }> {
  if (!db) throw new Error("Firebase não inicializado. Verifique a configuração.");

  const code = generateLobbyCode();
  const lobbyRef = doc(collection(db, 'lobbies'));

  // Sala e índice do código são gravados juntos para não existir código órfão.
  const batch = writeBatch(db);
  batch.set(lobbyRef, {
    code,
    hostId,
    hostName,
    guestId: null,
    guestName: null,
    status: 'waiting' as LobbyStatus,
    createdAt: serverTimestamp(),
    gameState: initialGameState,
    updatedBy: hostId,
  });
  batch.set(doc(db, 'lobbyCodes', code), {
    lobbyId: lobbyRef.id,
    hostName,
    status: 'waiting' as LobbyStatus,
  });
  await batch.commit();

  return { lobbyId: lobbyRef.id, code };
}

/**
 * Entra numa sala pelo código.
 *
 * A versão anterior lia as 20 salas mais recentes e filtrava no cliente: salas
 * mais antigas ficavam inacessíveis e, sem transação, dois convidados podiam
 * ocupar a mesma vaga. Agora o código resolve direto para o id da sala e a
 * ocupação da vaga é atômica.
 */
export async function joinLobbyByCode(
  code: string,
  guestId: string,
  guestName: string
): Promise<{ lobbyId: string; hostName: string } | null> {
  if (!db) return null;
  const database = db;

  const normalized = code.trim().toUpperCase();
  const codeSnap = await getDoc(doc(database, 'lobbyCodes', normalized));
  if (!codeSnap.exists()) return null;

  const { lobbyId } = codeSnap.data() as LobbyCodeDoc;
  const lobbyRef = doc(database, 'lobbies', lobbyId);

  try {
    return await runTransaction(database, async transaction => {
      const lobbySnap = await transaction.get(lobbyRef);
      if (!lobbySnap.exists()) return null;

      const lobby = lobbySnap.data() as LobbyDoc;
      if (lobby.status !== 'waiting' || lobby.guestId) return null;
      if (lobby.hostId === guestId) return null; // não dá para jogar sozinho

      transaction.update(lobbyRef, {
        guestId,
        guestName,
        status: 'in_progress' as LobbyStatus,
      });
      transaction.update(doc(database, 'lobbyCodes', normalized), {
        status: 'in_progress' as LobbyStatus,
      });

      return { lobbyId, hostName: lobby.hostName };
    });
  } catch (error) {
    console.error('Falha ao entrar na sala:', error);
    return null;
  }
}

/**
 * Escuta mudanças em tempo real no documento da sala.
 * Retorna a função para cancelar o listener (unsubscribe).
 */
export function subscribeToLobby(
  lobbyId: string,
  callback: (lobby: LobbyDoc) => void
): Unsubscribe {
  if (!db) return () => {};
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
  gameState: GameState,
  updatedBy: string
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'lobbies', lobbyId), { gameState, updatedBy });
}

/**
 * Marca a sala como finalizada.
 */
export async function closeLobby(lobbyId: string, code?: string): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);
  batch.update(doc(db, 'lobbies', lobbyId), { status: 'finished' as LobbyStatus });
  if (code) batch.update(doc(db, 'lobbyCodes', code.toUpperCase()), { status: 'finished' as LobbyStatus });
  await batch.commit();
}
