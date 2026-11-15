import type { GameState, HexCoordinates, Unit } from 'shared';
// Import só de tipo: não cria ciclo em runtime.
import type { GameStore } from './gameStore';

export type AnimationType = 'attacking' | 'damaged' | 'healing' | 'lightning';

// ── Contrato mínimo com o store ─────────────────────────────
// Tipar estruturalmente evita importar o gameStore aqui (que já importa este
// módulo) e mantém os agendadores independentes da store inteira.

/** Fatia do store que os agendadores leem. */
export interface AnimationStoreSlice {
  boardUnits: Record<string, Unit>;
  addLog: (message: string, playerId: string) => void;
}

export type AnimationSet = (
  partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>),
) => void;

export type AnimationGet = () => GameStore;

/** Quem participa da animação. Nem sempre é uma Unit completa (VFX remoto). */
export interface AnimationActor {
  id: string;
  position: HexCoordinates;
  playerId: string;
  unitClass?: Unit['unitClass'];
}

/** Estado final já calculado pelo motor, aplicado ao fim da animação. */
export type AnimationResultState = GameState;

export interface TransfusionAnimation { source: HexCoordinates; target: HexCoordinates; }
export interface ProjectileAnimation { id: string; source: HexCoordinates; target: HexCoordinates; type: 'arrow' | 'bolt'; playerId: string; }
export interface ThrustAnimation { attackerId: string; target: HexCoordinates; }

// Novas Animações Especiais
export interface CleaveAnimation { source: HexCoordinates; target: HexCoordinates; color: 'gold' | 'cyan'; }
export interface OverheadSlashAnimationData { source: HexCoordinates; target: HexCoordinates; }
export interface ShadowSlashAnimation { target: HexCoordinates; }
export interface ArcaneExplosionAnimation { epicenter: HexCoordinates; }

// Animações de Cartas de Magia
export type SimpleSpellAnimation = HexCoordinates;
export type WallSpellAnimation = HexCoordinates[];

export const scheduleProjectileAnimation = (set: AnimationSet, get: AnimationGet, attacker: AnimationActor, target: AnimationActor, newState: AnimationResultState, animations: Record<string, AnimationType>, attackMsg: string, targetDied: boolean) => {
  const projectileId = `proj_${Math.random().toString(36).substr(2, 5)}`;
  set({ activeProjectile: { id: projectileId, source: attacker.position, target: target.position, type: 'arrow', playerId: attacker.playerId } });
  setTimeout(() => {
    set({ ...newState, activeProjectile: null, selectedHex: null, targetHex: null, selectedAbility: null, animatingUnits: animations, combatLogs: [] });
    get().addLog(attackMsg, attacker.playerId);
    setTimeout(() => {
      set((state: AnimationStoreSlice) => {
        const cleanBoard = { ...state.boardUnits };
        if (targetDied) delete cleanBoard[target.id];
        return { animatingUnits: {}, boardUnits: cleanBoard };
      });
    }, 500);
  }, 600);
};

export const scheduleThrustAnimation = (set: AnimationSet, get: AnimationGet, attacker: AnimationActor, target: AnimationActor, newState: AnimationResultState, animations: Record<string, AnimationType>, attackMsg: string, targetDied: boolean) => {
  set({ activeThrust: { attackerId: attacker.id, target: target.position } });
  setTimeout(() => {
    set({ ...newState, activeThrust: { attackerId: attacker.id, target: target.position }, selectedHex: null, targetHex: null, selectedAbility: null, animatingUnits: animations, combatLogs: [] });
    get().addLog(attackMsg, attacker.playerId);
    setTimeout(() => { set({ activeThrust: null }); }, 350);
    setTimeout(() => {
      set((state: AnimationStoreSlice) => {
        const cleanBoard = { ...state.boardUnits };
        if (targetDied) delete cleanBoard[target.id];
        return { animatingUnits: {}, boardUnits: cleanBoard };
      });
    }, 500);
  }, 250);
};

// A explosão do Alquimista pode matar vários alvos, então a limpeza olha o
// estado final inteiro em vez do flag de um alvo só.
export const scheduleMageAttack = (set: AnimationSet, get: AnimationGet, attacker: AnimationActor, target: AnimationActor, newState: AnimationResultState, animations: Record<string, AnimationType>, attackMsg: string, _targetDied: boolean) => {
  set({ animatingUnits: { [attacker.id]: 'attacking' } });
  setTimeout(() => {
    set({ activeArcaneExplosion: { epicenter: target.position } });
    setTimeout(() => {
      set({ ...newState, activeArcaneExplosion: null, selectedHex: null, targetHex: null, selectedAbility: null, animatingUnits: animations, combatLogs: [] });
      get().addLog(attackMsg, attacker.playerId);
      setTimeout(() => {
        set((state: AnimationStoreSlice) => {
          const cleanBoard = { ...state.boardUnits };
          Object.keys(state.boardUnits).forEach(id => { if (newState.boardUnits[id]?.hp <= 0) delete cleanBoard[id]; });
          return { animatingUnits: {}, boardUnits: cleanBoard };
        });
      }, 500);
    }, 550); // tempo que a magia explode visualmente (aumentado de 300ms para 550ms para completar a animação)
  }, 200); // 200ms animando a pulse magic
};

export const scheduleAssassinAttack = (set: AnimationSet, get: AnimationGet, attacker: AnimationActor, target: AnimationActor, newState: AnimationResultState, animations: Record<string, AnimationType>, attackMsg: string, targetDied: boolean) => {
  set({ animatingUnits: { [attacker.id]: 'attacking' } });
  setTimeout(() => {
    set({ activeShadowSlash: { target: target.position } });
    setTimeout(() => {
      set({ ...newState, activeShadowSlash: null, selectedHex: null, targetHex: null, selectedAbility: null, animatingUnits: animations, combatLogs: [] });
      get().addLog(attackMsg, attacker.playerId);
      setTimeout(() => {
        set((state: AnimationStoreSlice) => {
          const cleanBoard = { ...state.boardUnits };
          if (targetDied) delete cleanBoard[target.id];
          return { animatingUnits: {}, boardUnits: cleanBoard };
        });
      }, 500);
    }, 450); // delay do Shadow Slash finishing
  }, 100);
};

export const scheduleHeavyMelee = (set: AnimationSet, get: AnimationGet, attacker: AnimationActor, target: AnimationActor, newState: AnimationResultState, animations: Record<string, AnimationType>, attackMsg: string, targetDied: boolean) => {
  const currentAttackerPos = attacker.position;
  const finalAttackerPos = newState.boardUnits[attacker.id]?.position;
  const didMove = finalAttackerPos && (finalAttackerPos.q !== currentAttackerPos.q || finalAttackerPos.r !== currentAttackerPos.r);

  if (didMove) {
    // 1. Mover o Cavaleiro primeiro (slide de movimento suave)
    set((state: AnimationStoreSlice) => {
      const updatedUnits = { ...state.boardUnits };
      if (updatedUnits[attacker.id]) {
        updatedUnits[attacker.id] = {
          ...updatedUnits[attacker.id],
          position: finalAttackerPos
        };
      }
      return {
        boardUnits: updatedUnits,
        animatingUnits: { [attacker.id]: 'attacking' }
      };
    });

    // 2. Esperar o slide terminar (400ms) para desferir o corte da espada no alvo
    setTimeout(() => {
      set({ activeOverheadSlash: { source: currentAttackerPos, target: target.position } });
      
      // 3. Aplicar o estado final (dano, sumiço do alvo se morto, logs) após o golpe acabar (700ms)
      setTimeout(() => {
        set({ ...newState, activeOverheadSlash: null, selectedHex: null, targetHex: null, selectedAbility: null, animatingUnits: animations, combatLogs: [] });
        get().addLog(attackMsg, attacker.playerId);
        setTimeout(() => {
          set((state: AnimationStoreSlice) => {
            const cleanBoard = { ...state.boardUnits };
            if (targetDied) delete cleanBoard[target.id];
            return { animatingUnits: {}, boardUnits: cleanBoard };
          });
        }, 500);
      }, 700);
    }, 400);

  } else {
    // Caso padrão: Golpe direto (sem movimento especial ativo)
    set({ animatingUnits: { [attacker.id]: 'attacking' } });
    setTimeout(() => {
      set({ activeOverheadSlash: { source: currentAttackerPos, target: target.position } });
      setTimeout(() => {
        set({ ...newState, activeOverheadSlash: null, selectedHex: null, targetHex: null, selectedAbility: null, animatingUnits: animations, combatLogs: [] });
        get().addLog(attackMsg, attacker.playerId);
        setTimeout(() => {
          set((state: AnimationStoreSlice) => {
            const cleanBoard = { ...state.boardUnits };
            if (targetDied) delete cleanBoard[target.id];
            return { animatingUnits: {}, boardUnits: cleanBoard };
          });
        }, 500);
      }, 700);
    }, 200);
  }
};

export const scheduleCleaveAttack = (set: AnimationSet, get: AnimationGet, attacker: AnimationActor, target: AnimationActor, newState: AnimationResultState, animations: Record<string, AnimationType>, attackMsg: string, targetDied: boolean, color: 'gold' | 'cyan') => {
  set({ animatingUnits: { [attacker.id]: 'attacking' } });
  setTimeout(() => {
    set({ activeCleave: { source: attacker.position, target: target.position, color } });
    setTimeout(() => {
      set({ ...newState, activeCleave: null, selectedHex: null, targetHex: null, selectedAbility: null, animatingUnits: animations, combatLogs: [] });
      get().addLog(attackMsg, attacker.playerId);
      setTimeout(() => {
        set((state: AnimationStoreSlice) => {
          const cleanBoard = { ...state.boardUnits };
          if (targetDied) delete cleanBoard[target.id];
          return { animatingUnits: {}, boardUnits: cleanBoard };
        });
      }, 500);
    }, 300);
  }, 100);
};

export const scheduleMeleeAnimation = (set: AnimationSet, get: AnimationGet, attacker: AnimationActor, target: AnimationActor, newState: AnimationResultState, animations: Record<string, AnimationType>, attackMsg: string, targetDied: boolean) => {
  set({ animatingUnits: { [attacker.id]: 'attacking' } });
  setTimeout(() => {
    set({ ...newState, selectedHex: null, targetHex: null, selectedAbility: null, animatingUnits: animations, combatLogs: [] });
    get().addLog(attackMsg, attacker.playerId);
    setTimeout(() => {
      set((state: AnimationStoreSlice) => {
        const cleanBoard = { ...state.boardUnits };
        if (targetDied) delete cleanBoard[target.id];
        return { animatingUnits: {}, boardUnits: cleanBoard };
      });
    }, 500);
  }, 200);
};

/**
 * Agendador genérico para animações de impacto de mágicas.
 */
export const scheduleSpellCardAnimation = (
  set: AnimationSet,
  stateKey: string,
  target: HexCoordinates | HexCoordinates[],
  newState: AnimationResultState,
  duration: number = 800
) => {
  set({ [stateKey]: target });
  setTimeout(() => {
    set({ ...newState, [stateKey]: null });
  }, duration);
};
