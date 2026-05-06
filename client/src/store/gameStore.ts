import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { endTurn, createInitialState, hasAnyValidAction } from 'shared';
import { getBestAction } from 'shared/src/aiEngine';
import type { GameState, HexCoordinates } from 'shared';
import { createCombatActions } from './combatActions';
import { createSandboxActions } from './sandboxActions';
import type { 
  AnimationType, TransfusionAnimation, ProjectileAnimation, ThrustAnimation,
  CleaveAnimation, ShockwaveAnimationData, ShadowSlashAnimation, ArcaneExplosionAnimation,
  SimpleSpellAnimation, WallSpellAnimation
} from './animationActions';
import { 
  scheduleProjectileAnimation, scheduleThrustAnimation, scheduleMageAttack,
  scheduleAssassinAttack, scheduleHeavyMelee, scheduleCleaveAttack, scheduleMeleeAnimation
} from './animationActions';

interface GameLog {
  id: string;
  message: string;
  playerId: string;
}

interface GameStore extends GameState {
  currentView: 'MENU' | 'PLAY' | 'SANDBOX' | 'PVP';
  setCurrentView: (view: 'MENU' | 'PLAY' | 'SANDBOX' | 'PVP') => void;
  // PvP
  lobbyId: string | null;
  lobbyCode: string | null;
  p1Name: string;
  p2Name: string;
  myRole: 'p1' | 'p2' | null;
  isPvP: boolean;
  isMatchStarted: boolean;
  setLobbySession: (lobbyId: string, lobbyCode: string, myRole: 'p1' | 'p2') => void;
  setPlayerNames: (p1: string, p2: string) => void;
  setMatchStarted: (started: boolean) => void;
  clearLobbySession: () => void;
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
  isInspectMode: boolean;
  toggleInspectMode: () => void;
  isHandExpanded: boolean;
  toggleHandExpanded: () => void;
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
  clearLogs: () => void;
  surrender: () => void;
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
  isAutoPlay: boolean;
  toggleAutoPlay: () => void;
  setAiDifficulty: (difficulty: import('shared').AIDifficulty) => void;
  turnTimer: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  decrementTimer: () => void;
  triggerRemoteVfx: (vfx: NonNullable<GameState['lastActionVfx']>) => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      ...createInitialState(),
      currentView: 'MENU',
      // PvP state
      lobbyId: null,
      lobbyCode: null,
      p1Name: 'Jogador 1',
      p2Name: 'Jogador 2',
      myRole: null,
      isPvP: false,
      isMatchStarted: false,
      setLobbySession: (lobbyId, lobbyCode, myRole) => set({ lobbyId, lobbyCode, myRole, isPvP: true, isMatchStarted: false }),
      setPlayerNames: (p1, p2) => set({ p1Name: p1, p2Name: p2 }),
      setMatchStarted: (started) => set({ isMatchStarted: started }),
      clearLobbySession: () => {
        const initialState = createInitialState();
        set({ 
          ...initialState,
          lobbyId: null, 
          lobbyCode: null,
          p1Name: 'Jogador 1',
          p2Name: 'Jogador 2',
          myRole: null, 
          isMatchStarted: false,
          logs: [],
          selectedHex: null,
          selectedCard: null
        });
      },
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
        } else if (view === 'PVP') {
          // Modo PvP: não reseta o estado — o lobby já inicializou via createInitialState
          set({ currentView: 'PVP', sandboxMode: false, isVsAI: false });
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
      turnTimer: 60,
      isTimerRunning: false,
      startTimer: () => set({ isTimerRunning: true, turnTimer: 60 }),
      stopTimer: () => set({ isTimerRunning: false }),
      decrementTimer: () => set(state => {
        if (state.turnTimer <= 0) {
          return { turnTimer: 0 };
        }
        return { turnTimer: state.turnTimer - 1 };
      }),
      isAutoPlay: false,
      toggleAutoPlay: () => {
        const newVal = !get().isAutoPlay;
        set({ isAutoPlay: newVal });
        if (newVal) {
          // Pequeno delay para garantir que a UI processe a ativação
          setTimeout(() => get().runAiTurn(), 500);
        }
      },

      isLogVisible: false,
      toggleLog: () => set(state => ({ isLogVisible: !state.isLogVisible })),

      isInspectMode: false,
      toggleInspectMode: () => set(state => ({ isInspectMode: !state.isInspectMode })),

      isHandExpanded: false,
      toggleHandExpanded: () => set(state => ({ isHandExpanded: !state.isHandExpanded })),

      setSandboxMode: (enabled) => set({ sandboxMode: enabled }),

      setSelectedHex: (hex) => set({ selectedHex: hex, targetHex: null, selectedAbility: null }),
      setSelectedCard: (cardId) => set({ selectedCard: cardId, selectedHex: null, targetHex: null, selectedAbility: null }),
      setTargetHex: (hex) => set({ targetHex: hex }),
      setSelectedAbility: (ability) => set({ selectedAbility: ability }),
      setInspectedItem: (item) => set({ inspectedItem: item }),

      addLog: (message, playerId) => {
        const newLog = { id: Math.random().toString(36).substr(2, 9), message, playerId };
        set(state => ({ logs: [...state.logs, newLog].slice(-50) }));
      },

      clearLogs: () => set({ logs: [] }),

      surrender: () => {
        const state = get();
        if (state.currentPhase === 'GAME_OVER') return;

        const opponentId = state.myRole === 'p1' ? 'p2' : 'p1';
        const loserName = state.myRole === 'p1' ? 'Azul' : 'Roxo';

        set({
          currentPhase: 'GAME_OVER',
          winner: opponentId,
          isTimerRunning: false
        });

        get().addLog(`${loserName} desistiu da partida!`, state.myRole || 'p1');
      },

      ...createCombatActions(set, get),
      ...createSandboxActions(set, get),

      lastActionVfx: undefined,

      triggerRemoteVfx: (vfx) => {
        const { type, sourceId, targetId, targetPos, sourcePos, abilityId } = vfx;
        const state = get();
        
        if (type === 'ATTACK' && sourceId && targetId) {
          const attacker = state.boardUnits[sourceId] || { id: sourceId, position: sourcePos, unitClass: 'Arqueiro' }; // Fallback minimal
          const target = state.boardUnits[targetId] || { id: targetId, position: targetPos, hp: 0 };
          
          if (attacker.position && target.position) {
            const animations: Record<string, any> = { [sourceId]: 'attacking', [targetId]: 'damaged' };
            const dummyState = { ...state };
            const dummyMsg = "";
            const targetDied = target.hp <= 0;

            const uClass = (state.boardUnits[sourceId]?.unitClass) || attacker.unitClass;

            if (uClass === 'Arqueiro') scheduleProjectileAnimation(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
            else if (uClass === 'Lanceiro') scheduleThrustAnimation(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
            else if (uClass === 'Mago') scheduleMageAttack(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
            else if (uClass === 'Assassino') scheduleAssassinAttack(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
            else if (uClass === 'Cavaleiro') scheduleHeavyMelee(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
            else if (uClass === 'Rei') scheduleCleaveAttack(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied, 'gold');
            else if (uClass === 'Clerigo') scheduleCleaveAttack(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied, 'cyan');
            else scheduleMeleeAnimation(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
          }
        } else if (type === 'HEAL' && sourceId && targetId) {
          set({ animatingUnits: { [targetId]: 'healing' } });
          setTimeout(() => set({ animatingUnits: {} }), 600);
        } else if (type === 'SPELL' && abilityId && targetPos) {
           if (abilityId === 'spl_meteoro') {
             set({ activeMeteor: targetPos });
             setTimeout(() => set({ activeMeteor: null }), 1000);
           } else if (abilityId === 'spl_transfusao' && sourceId && sourcePos) {
             set({ activeTransfusion: { source: targetPos, target: sourcePos } });
             setTimeout(() => set({ activeTransfusion: null }), 1000);
           } else if (abilityId === 'spl_raio') {
             set({ animatingUnits: { [targetId || '']: 'lightning' } });
             setTimeout(() => set({ animatingUnits: {} }), 800);
           } else {
             const keyMap: Record<string, string> = {
               'spl_aurarunica': 'activeAuraRunica',
               'spl_nevoa': 'activeMistImpact',
               'spl_muralha': 'activeWallFormation',
               'spl_passos': 'activeWindTrail',
               'spl_bencao': 'activeDivineBlessing',
               'spl_raizes': 'activeEarthRoots',
               'spl_furia': 'activeFuryPulse'
             };
             const stateKey = keyMap[abilityId];
             if (stateKey) {
               set({ [stateKey]: targetPos });
               setTimeout(() => set({ [stateKey]: null }), 800);
             }
           }
        }
      },

      triggerEndTurn: () => {
        try {
          const currentGameState = get();
          const pId = currentGameState.currentTurnPlayerId;
          const newState = endTurn(currentGameState);
          set({ ...newState, selectedHex: null, turnTimer: 60, isTimerRunning: true });
          get().addLog(`O turno de ${pId === 'p1' ? 'Azul' : 'Roxo'} chegou ao fim.`, pId);

          const updatedState = get();
          const autoBattleTarget = updatedState.isAutoPlay ? 200 : 1000;
          if (updatedState.currentPhase !== 'GAME_OVER' && (updatedState.isAutoPlay || (updatedState.isVsAI && updatedState.currentTurnPlayerId === 'p2'))) {
            setTimeout(() => get().runAiTurn(), autoBattleTarget);
          } else if (updatedState.currentPhase === 'MAIN_PHASE' && !updatedState.sandboxMode && !hasAnyValidAction(updatedState, updatedState.currentTurnPlayerId)) {
            // Se o PRÓXIMO jogador (p1) não tem ações logo de cara
            setTimeout(() => {
              if (get().currentTurnPlayerId === updatedState.currentTurnPlayerId) {
                get().triggerEndTurn();
              }
            }, 1500);
          }
        } catch (err: any) {
          console.warn("Erro de Turno:", err.message);
        }
      },

      runAiTurn: async () => {
        const state = get();
        // No modo Auto-Play, permitimos que a IA jogue para QUALQUER jogador
        if (state.isAiThinking || state.currentPhase === 'GAME_OVER') return;
        if (!state.isAutoPlay && state.currentTurnPlayerId !== 'p2') return;

        set({ isAiThinking: true });

        let continueTurn = true;
        const currentPlayer = state.currentTurnPlayerId;
        while (continueTurn) {
          const currentState = get();
          if (currentState.currentPhase === 'GAME_OVER' || currentState.currentTurnPlayerId !== currentPlayer) break;

          const action = getBestAction(currentState, currentPlayer);

          if (!action) {
            continueTurn = false;
            get().triggerEndTurn();
            break;
          }

          const delay = state.isAutoPlay ? 150 : 800;
          await new Promise(resolve => setTimeout(resolve, delay));

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
      
      setAiDifficulty: (difficulty) => set({ aiDifficulty: difficulty }),

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
          isInspectMode,
          isHandExpanded,
          ...rest
        } = state;
        return rest;
      },
    }
  )
)
);
