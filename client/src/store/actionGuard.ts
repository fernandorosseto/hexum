// ============================================================
//  store/actionGuard.ts
//  Impede que callbacks atrasados de uma ação já superada sobrescrevam
//  o estado. As animações aplicam o estado final dentro de setTimeout;
//  sem esse guard, uma ação iniciada no meio da animação era revertida
//  quando o timer antigo disparava.
// ============================================================

/** Qualquer store que participe do guard precisa expor o contador. */
export interface SequencedStore {
  actionSeq: number;
}

export type GuardedSet<S> = (partial: Partial<S> | ((state: S) => Partial<S>)) => void;

export interface GuardedAction<S> {
  /** `set` que só escreve enquanto esta ação for a mais recente. */
  set: GuardedSet<S>;
  /** true enquanto nenhuma ação posterior tiver começado. */
  isCurrent: () => boolean;
}

/**
 * Marca o início de uma ação de jogo e devolve um `set` protegido.
 * Toda ação que agenda animação deve passar por aqui.
 */
export function beginAction<S extends SequencedStore>(
  set: GuardedSet<S>,
  get: () => S,
): GuardedAction<S> {
  const seq = get().actionSeq + 1;
  set({ actionSeq: seq } as Partial<S>);

  const isCurrent = () => get().actionSeq === seq;
  return {
    isCurrent,
    set: partial => {
      if (isCurrent()) set(partial);
    },
  };
}
