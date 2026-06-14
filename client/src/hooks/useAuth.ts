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
  // ── MOCK FOR GAME JAM: Skip login screen ──
  // Use a random uid so PvP can still work with multiple guests
  const [mockUser] = useState(() => ({
    uid: 'guest_' + Math.random().toString(36).substring(2, 11),
    displayName: 'Warrior (Guest)',
    email: 'guest@hexum.local',
  } as User));

  return { user: mockUser, loading: false };
}
