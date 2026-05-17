// ============================================================
//  firebase/auth.ts
//  Funções de autenticação: registro, login, logout, Google
// ============================================================

import {
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

// ── Registro com email e senha ─────────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
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
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ── Login com Google ───────────────────────────────────────
export async function loginWithGoogle(): Promise<User> {
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
