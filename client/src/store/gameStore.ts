import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { endTurn, createInitialState } from 'shared';
import { getBestAction } from 'shared/src/aiEngine';
import type { GameState, HexCoordinates } from 'shared';
import { createCombatActions } from './combatActions';
import { createSandboxActions } from './sandboxActions';
import type { 
  AnimationType, TransfusionAnimation, ProjectileAnimation, ThrustAnimation,
  CleaveAnimation, ShockwaveAnimationData, ShadowSlashAnimation, ArcaneExplosionAnimation,
  SimpleSpellAnimation, WallSpellAnimation
} from './animationActions';

interface GameLog {
  id: string;
  message: string;
  playerId: string;
}

interface GameStore extends GameState {
  currentView: 'MENU' | 'PLAY' | 'SANDBOX';
  setCurrentView: (view: 'MENU' | 'PLAY' | 'SANDBOX') => void;
  selectedHex: HexCoordinates | null;
  selectedCard: string | null;
  targetHex: HexCoordinates | null;
  selectedAbility: string | null;
  inspectedItem: { type: 'card' | 'unit'; id: string } | null;
  logs: GameLog[];
  animatingUnits: Record<string, AnimationType>;
  sandboxMode: boolean;
  isVsAI: boolean;
  isAiThinking: boolean;
  isCardExpanded: boolean;
  toggleCardExpanded: () => void;
  setSelectedHex: (hex: HexCoordinates | null) => void;
  setSelectedCard: (cardId: string | null) => void;
  setTargetHex: (hex: HexCoordinates | null) => void;
  setSelectedAbility: (ability: string | null) => void;
  setInspectedItem: (item: { type: 'card' | 'unit'; id: string } | null) => void;
  offerCard: (cardId: string) => void;
  healUnit: (healerId: string, targetId: string) => void;
  attemptMove: (unitId: string, hex: HexCoordinates, useSpecial?: boolean) => void;
  attemptAttack: (attackerId: string, targetId: string, useSpecial?: boolean) => void;
  attemptHeal: (healerId: string, targetId: string) => void;
  attemptPlayCard: (cardId: string, hex: HexCoordinates) => void;
  triggerEndTurn: () => void;
  runAiTurn: () => Promise<void>;
  addLog: (message: string, playerId: string) => void;
  setSandboxMode: (enabled: boolean) => void;
  spawnUnit: (unitName: string, hex: HexCoordinates, playerId: string) => void;
  addCardToHand: (cardId: string) => void;
  sandboxPlayCard: (cardId: string, hex: HexCoordinates, playerId: string) => void;
  activeTransfusion: TransfusionAnimation | null;
  activeProjectile: ProjectileAnimation | null;
  activeThrust: ThrustAnimation | null;
  activeMeteor: HexCoordinates | null;
  activeCleave: CleaveAnimation | null;
  activeShockwave: ShockwaveAnimationData | null;
  activeShadowSlash: ShadowSlashAnimation | null;
  activeArcaneExplosion: ArcaneExplosionAnimation | null;
  activeAuraRunica: SimpleSpellAnimation | null;
  activeDivineBlessing: SimpleSpellAnimation | null;
  activeEarthRoots: SimpleSpellAnimation | null;
  activeFuryPulse: SimpleSpellAnimation | null;
  activeWallFormation: WallSpellAnimation | null;
  activeMistImpact: SimpleSpellAnimation | null;
  activeWindTrail: SimpleSpellAnimation | null;
  isLogVisible: boolean;
  toggleLog: () => void;
  resetGame: () => void;
  purifyArena: () => void;
  removeUnit: (unitId: string) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      currentView: 'MENU',
      setCurrentView: (view) => {
        if (view === 'SANDBOX') {
          const initialState = createInitialState();
          set({
            ...initialState,
            sandboxMode: true,
            isVsAI: false,
            boardUnits: {},
            players: {
              ...initialState.players,
              p1: { ...initialState.players.p1, hand: [], mana: 99, maxMana: 99 },
              p2: { ...initialState.players.p2, hand: [], mana: 1, maxMana: 1 }
            },
            currentView: view,
            selectedHex: null,
            selectedCard: null,
            logs: []
          });
        } else if (view === 'PLAY') {
          const initialState = createInitialState();
          set({
            ...initialState,
            currentView: 'PLAY',
            sandboxMode: false,
            isVsAI: true,
            selectedHex: null,
            selectedCard: null
          });
        } else {
          set({ currentView: view });
        }
      },
      selectedHex: null,
      selectedCard: null,
      targetHex: null,
      selectedAbility: null,
      inspectedItem: null,
      logs: [],
      animatingUnits: {},
      sandboxMode: false,
      isVsAI: false,
      isAiThinking: false,
      activeTransfusion: null,
      activeProjectile: null,
      activeThrust: null,
      activeMeteor: null,
      activeCleave: null,
      activeShockwave: null,
      activeShadowSlash: null,
      activeArcaneExplosion: null,
      activeAuraRunica: null,
      activeDivineBlessing: null,
      activeEarthRoots: null,
      activeFuryPulse: null,
      activeWallFormation: null,
      activeMistImpact: null,
      activeWindTrail: null,

      isLogVisible: false,
      toggleLog: () => set(state => ({ isLogVisible: !state.isLogVisible })),

      isCardExpanded: false,
      toggleCardExpanded: () => set(state => ({ isCardExpanded: !state.isCardExpanded })),

      setSandboxMode: (enabled) => set({ sandboxMode: enabled }),

      setSelectedHex: (hex) => set({ selectedHex: hex, targetHex: null, selectedAbility: null, isCardExpanded: false }),
      setSelectedCard: (cardId) => set({ selectedCard: cardId, selectedHex: null, targetHex: null, selectedAbility: null, isCardExpanded: false }),
      setTargetHex: (hex) => set({ targetHex: hex }),
      setSelectedAbility: (ability) => set({ selectedAbility: ability }),
      setInspectedItem: (item) => set({ inspectedItem: item }),

      addLog: (message, playerId) => {
        const newLog = { id: Math.random().toString(36).substr(2, 9), message, playerId };
        set(state => ({ logs: [...state.logs, newLog].slice(-50) }));
      },

      ...createCombatActions(set, get),
      ...createSandboxActions(set, get),

      triggerEndTurn: () => {
        try {
          const currentGameState = get();
          const pId = currentGameState.currentTurnPlayerId;
          const newState = endTurn(currentGameState);
          set({ ...newState, selectedHex: null });
          get().addLog(`O turno de ${pId === 'p1' ? 'Azul' : 'Roxo'} chegou ao fim.`, pId);

          const updatedState = get();
          if (updatedState.isVsAI && updatedState.currentTurnPlayerId === 'p2' && updatedState.currentPhase !== 'GAME_OVER') {
            setTimeout(() => get().runAiTurn(), 1000);
          }
        } catch (err: any) {
          console.warn("Erro de Turno:", err.message);
        }
      },

      runAiTurn: async () => {
        const state = get();
        if (state.isAiThinking || state.currentTurnPlayerId !== 'p2' || state.currentPhase === 'GAME_OVER') return;

        set({ isAiThinking: true });

        let continueTurn = true;
        while (continueTurn) {
          const currentState = get();
          if (currentState.currentPhase === 'GAME_OVER') break;

          const action = getBestAction(currentState, 'p2');

          if (!action) {
            continueTurn = false;
            get().triggerEndTurn();
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 800));

          try {
            if (action.type === 'MOVE') {
              get().attemptMove(action.unitId, action.target);
            } else if (action.type === 'ATTACK') {
              get().attemptAttack(action.attackerId, action.targetId, action.special);
            } else if (action.type === 'PLAY_CARD') {
              get().attemptPlayCard(action.cardId, action.target);
            } else if (action.type === 'OFFER') {
              get().offerCard(action.cardId);
            } else if (action.type === 'HEAL') {
              get().attemptHeal(action.healerId, action.targetId);
            }
          } catch (e) {
            console.error("AI Error:", e);
            continueTurn = false;
            get().triggerEndTurn();
          }
        }

        set({ isAiThinking: false });
      },

      resetGame: () => {
        const initialState = createInitialState();
        set({
          ...initialState,
          selectedHex: null,
          selectedCard: null,
          targetHex: null,
          logs: [],
          animatingUnits: {}
        });
      }
    }),
    {
      name: 'hexum-game-state-v1',
      partialize: (state) => {
        const {
          animatingUnits,
          isAiThinking,
          selectedHex,
          selectedCard,
          targetHex,
          selectedAbility,
          activeTransfusion,
          activeProjectile,
          activeThrust,
          activeMeteor,
          activeCleave,
          activeShockwave,
          activeShadowSlash,
          activeArcaneExplosion,
          activeAuraRunica,
          activeDivineBlessing,
          activeEarthRoots,
          activeFuryPulse,
          activeWallFormation,
          activeMistImpact,
          activeWindTrail,
          isCardExpanded,
          ...rest
        } = state;
        return rest;
      },
    }
  )
);
