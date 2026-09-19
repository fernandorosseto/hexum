// ============================================================
//  firebase/auth.ts
//  Funções de autenticação: registro, login, logout, Google
// ============================================================

import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { createUserProfile } from './firestore';

const googleProvider = new GoogleAuthProvider();

// ── Sessão de convidado (login anônimo) ────────────────────
/**
 * Abre uma sessão anônima no Firebase. Dá um uid real e estável sem pedir
 * cadastro — é o que permite escrever regras de segurança no Firestore,
 * impossíveis com um uid inventado no cliente.
 */
export async function ensureGuestSession(): Promise<User | null> {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

// ── Registro com email e senha ─────────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  if (!auth) throw new Error("Firebase não configurado. Por favor, adicione as credenciais no painel de controle da produção.");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Atualiza o nome de exibição no Firebase Auth
  await updateProfile(user, { displayName });

  // Cria o perfil no Firestore
  await createUserProfile(user.uid, {
    displayName,
    email: user.email ?? '',
  });

  return user;
}

// ── Login com email e senha ────────────────────────────────
export async function loginWithEmail(
  email: string,
  password: string
): Promise<User> {
  if (!auth) throw new Error("Firebase não configurado. Por favor, adicione as credenciais no painel de controle da produção.");
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ── Login com Google ───────────────────────────────────────
export async function loginWithGoogle(): Promise<User> {
  if (!auth) throw new Error("Firebase não configurado. Por favor, adicione as credenciais no painel de controle da produção.");
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  // Cria perfil no Firestore se for o primeiro acesso
  await createUserProfile(user.uid, {
    displayName: user.displayName ?? 'Jogador',
    email: user.email ?? '',
  });

  return user;
}

// ── Logout ─────────────────────────────────────────────────
export async function logout(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

// ── Observer de estado de autenticação ────────────────────
export function subscribeAuthState(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
