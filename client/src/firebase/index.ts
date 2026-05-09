// ============================================================
//  firebase/index.ts
//  Re-exporta todos os módulos Firebase do projeto
// ============================================================

export { auth, db }                         from './firebaseConfig';
export { registerWithEmail, loginWithEmail, loginWithGoogle, logout, subscribeAuthState } from './auth';
export { createUserProfile, getUserProfile, saveMatchResult, getTopPlayers, createLobby, joinLobbyByCode, subscribeToLobby, pushGameState, closeLobby } from './firestore';
export type { UserProfile, MatchRecord, LobbyDoc, LobbyStatus } from './firestore';
