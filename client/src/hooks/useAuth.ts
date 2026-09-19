// ============================================================
//  hooks/useAuth.ts
//  Hook React para estado de autenticação.
//
//  Dois modos, via VITE_AUTH_MODE:
//    'guest'    (padrão) — entra direto, sem tela de login. Usa login ANÔNIMO
//                do Firebase, que dá um uid real e estável (persistido pelo
//                próprio SDK), necessário para as regras do Firestore.
//    'firebase' — exige conta; a LoginPage passa a ser exibida.
//
//  A versão anterior devolvia um objeto fake criado no initializer do
//  useState: o uid mudava por instância do hook (App e useMultiplayer tinham
//  uids diferentes) e a cada reload, e todo o código de login ficava morto.
// ============================================================

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { subscribeAuthState, ensureGuestSession } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/firebaseConfig';

export type AuthMode = 'guest' | 'firebase';

export const AUTH_MODE: AuthMode =
  import.meta.env.VITE_AUTH_MODE === 'firebase' ? 'firebase' : 'guest';

const LOCAL_GUEST_KEY = 'hexum-guest-id';

/** Identidade local estável, usada quando o Firebase não está configurado. */
function getOfflineGuest(): User {
  let uid: string | null = null;
  try {
    uid = localStorage.getItem(LOCAL_GUEST_KEY);
  } catch {
    // localStorage indisponível (modo privado/SSR): segue com id de sessão.
  }
  if (!uid) {
    uid = `guest_${Math.random().toString(36).slice(2, 11)}`;
    try {
      localStorage.setItem(LOCAL_GUEST_KEY, uid);
    } catch { /* sem persistência: o id vale só para esta aba */ }
  }
  return {
    uid,
    displayName: 'Warrior (Guest)',
    email: null,
    isAnonymous: true,
  } as User;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * Retorna o usuário atual e um flag de carregamento.
 * Uso: const { user, loading } = useAuth();
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() => {
    if (AUTH_MODE === 'guest' && !isFirebaseConfigured) {
      return { user: getOfflineGuest(), loading: false };
    }
    return { user: null, loading: true };
  });

  useEffect(() => {
    if (AUTH_MODE === 'guest' && !isFirebaseConfigured) return;

    const unsubscribe = subscribeAuthState(user => {
      if (user) {
        setState({ user, loading: false });
        return;
      }
      if (AUTH_MODE === 'guest') {
        // Sem tela de login: abre sessão anônima e espera o próximo callback.
        ensureGuestSession().catch(error => {
          console.error('Falha no login anônimo, usando identidade local.', error);
          setState({ user: getOfflineGuest(), loading: false });
        });
        return;
      }
      setState({ user: null, loading: false });
    });

    return unsubscribe;
  }, []);

  return state;
}
