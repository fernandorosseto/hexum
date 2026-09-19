// ============================================================
//  store/actionGuard.ts
//  Impede que callbacks atrasados de uma ação já superada sobrescrevam
//  o estado. As animações aplicam o estado final dentro de setTimeout;
//  sem esse guard, uma ação iniciada no meio da animação era revertida
//  quando o timer antigo disparava.
// ============================================================

type StoreSet = (partial: unknown, replace?: boolean) => void;
type StoreGet = () => { actionSeq: number };

export interface GuardedAction {
  /** `set` que só escreve enquanto esta ação for a mais recente. */
  set: StoreSet;
  /** true enquanto nenhuma ação posterior tiver começado. */
  isCurrent: () => boolean;
}

/**
 * Marca o início de uma ação de jogo e devolve um `set` protegido.
 * Toda ação que agenda animação deve passar por aqui.
 */
export function beginAction(set: StoreSet, get: StoreGet): GuardedAction {
  const seq = get().actionSeq + 1;
  set({ actionSeq: seq });

  const isCurrent = () => get().actionSeq === seq;
  return {
    isCurrent,
    set: (partial, replace) => {
      if (isCurrent()) set(partial, replace);
    },
  };
}
