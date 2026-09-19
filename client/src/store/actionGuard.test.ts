import { describe, it, expect, vi } from 'vitest';
import { beginAction, type GuardedSet } from './actionGuard';

interface FakeStore {
  actionSeq: number;
  foo?: number;
  revertido?: boolean;
}

function fakeStore(seq = 0) {
  const state: FakeStore = { actionSeq: seq };
  const set = vi.fn<GuardedSet<FakeStore>>(partial => {
    Object.assign(state, typeof partial === 'function' ? partial(state) : partial);
  });
  return { state, set, get: () => state };
}

describe('beginAction', () => {
  it('aplica as escritas enquanto for a ação corrente', () => {
    const store = fakeStore();
    const action = beginAction(store.set, store.get);
    action.set({ foo: 1 });
    expect(store.state).toMatchObject({ foo: 1 });
  });

  it('descarta escritas atrasadas depois que outra ação começa', () => {
    const store = fakeStore();
    const first = beginAction(store.set, store.get);
    beginAction(store.set, store.get); // uma segunda ação assume

    first.set({ revertido: true });

    expect(store.state).not.toHaveProperty('revertido');
    expect(first.isCurrent()).toBe(false);
  });
});
