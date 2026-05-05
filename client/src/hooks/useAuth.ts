// ============================================================
//  hooks/useAuth.ts
//  Hook React para estado de autenticação do Firebase
// ============================================================

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { subscribeAuthState } from '../firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * Retorna o usuário autenticado atual e um flag de carregamento.
 * Uso: const { user, loading } = useAuth();
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cancela o listener ao desmontar
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
