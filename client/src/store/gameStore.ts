import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { endTurn, createInitialState, hasAnyValidAction, getBestAction } from 'shared';
import type { GameState, HexCoordinates } from 'shared';
import { createCombatActions } from './combatActions';
import { createSandboxActions } from './sandboxActions';
import type { 
  AnimationActor, AnimationType, TransfusionAnimation, ProjectileAnimation, ThrustAnimation,
  CleaveAnimation, OverheadSlashAnimationData, ShadowSlashAnimation, ArcaneExplosionAnimation,
  SimpleSpellAnimation, WallSpellAnimation
} from './animationActions';
import { 
  scheduleProjectileAnimation, scheduleThrustAnimation, scheduleMageAttack,
  scheduleAssassinAttack, scheduleHeavyMelee, scheduleCleaveAttack, scheduleMeleeAnimation
} from './animationActions';

/** Duração do turno em segundos (HUD e auto-pass do PvP). */
export const TURN_SECONDS = 60;

/** Limites do laço da IA: evitam travar a aba se uma ação não avançar o estado. */
const AI_MAX_ACTIONS_PER_TURN = 25;
const AI_MAX_TURN_MS = 15_000;

/** Resumo barato do estado: detecta se a ação da IA realmente mudou algo. */
function aiProgressSignature(state: GameState): string {
  const units = Object.values(state.boardUnits)
    .map(u => `${u.id}:${u.position.q},${u.position.r}:${u.hp}:${u.canMove ? 1 : 0}${u.canAttack ? 1 : 0}`)
    .sort()
    .join(';');
  const players = Object.values(state.players)
    .map(p => `${p.id}:${p.mana}:${p.maxMana}:${p.hand.length}:${p.canOfferCard ? 1 : 0}`)
    .sort()
    .join(';');
  return `${state.currentTurnPlayerId}|${state.currentPhase}|${units}|${players}`;
}

interface GameLog {
  id: string;
  message: string;
  playerId: string;
}

export interface GameStore extends GameState {
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
  activeOverheadSlash: OverheadSlashAnimationData | null;
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
  /** Contador de ações: invalida callbacks de animação de uma ação já superada. */
  actionSeq: number;
  /** true enquanto uma animação de ação está resolvendo — a UI ignora cliques. */
  isResolving: boolean;
  isHandVisible: boolean;
  toggleHand: () => void;
  isCardDetailsVisible: boolean;
  toggleCardDetails: () => void;
  turnTimer: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  decrementTimer: () => void;
  triggerRemoteVfx: (vfx: NonNullable<GameState['lastActionVfx']>) => void;
  language: 'en' | 'pt';
  setLanguage: (lang: 'en' | 'pt') => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      ...createInitialState(),
      language: (typeof navigator !== 'undefined' && navigator.language.startsWith('pt')) ? 'pt' : 'en',
      setLanguage: (lang: 'en' | 'pt') => set({ language: lang }),
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
        set(state => ({ 
          ...initialState,
          language: state.language,
          lobbyId: null, 
          lobbyCode: null,
          p1Name: 'Jogador 1',
          p2Name: 'Jogador 2',
          myRole: null, 
          isPvP: false,
          isMatchStarted: false,
          logs: [],
          selectedHex: null,
          selectedCard: null
        }));
      },
      setCurrentView: (view) => {
        if (view === 'SANDBOX') {
          const initialState = createInitialState();
          set(state => ({
            ...initialState,
            language: state.language,
            sandboxMode: true,
            isVsAI: false,
            isAutoPlay: false,
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
          }));
        } else if (view === 'PLAY') {
          const initialState = createInitialState();
          set(state => ({
            ...initialState,
            language: state.language,
            currentView: 'PLAY',
            sandboxMode: false,
            isVsAI: true,
            isAutoPlay: false,
            selectedHex: null,
            selectedCard: null,
            turnTimer: TURN_SECONDS,
            isTimerRunning: true
          }));
        } else if (view === 'PVP') {
          // Modo PvP: não reseta o estado — o lobby já inicializou via createInitialState
          set({
            currentView: 'PVP', sandboxMode: false, isVsAI: false, isAutoPlay: false,
            turnTimer: TURN_SECONDS, isTimerRunning: true
          });
        } else {
          set({ 
            currentView: view, 
            isAutoPlay: false,
            sandboxMode: false,
            isPvP: false,
            selectedHex: null,
            selectedCard: null
          });
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
      activeOverheadSlash: null,
      activeShadowSlash: null,
      activeArcaneExplosion: null,
      activeAuraRunica: null,
      activeDivineBlessing: null,
      activeEarthRoots: null,
      activeFuryPulse: null,
      activeWallFormation: null,
      activeMistImpact: null,
      activeWindTrail: null,
      turnTimer: TURN_SECONDS,
      isTimerRunning: false,
      startTimer: () => set({ isTimerRunning: true, turnTimer: TURN_SECONDS }),
      stopTimer: () => set({ isTimerRunning: false }),
      decrementTimer: () => {
        const state = get();
        if (!state.isTimerRunning || state.currentPhase === 'GAME_OVER' || state.sandboxMode) return;
        if (state.turnTimer > 0) {
          set({ turnTimer: state.turnTimer - 1 });
          return;
        }
        // Zerou: em PvP o turno passa sozinho para a partida não travar com um
        // jogador ausente. Fora do PvP o relógio é apenas informativo.
        set({ isTimerRunning: false });
        if (state.isPvP && state.currentTurnPlayerId === state.myRole) {
          get().triggerEndTurn();
        }
      },
      actionSeq: 0,
      isResolving: false,
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

      isHandVisible: true,
      toggleHand: () => set(state => ({ isHandVisible: !state.isHandVisible })),

      isCardDetailsVisible: true,
      toggleCardDetails: () => set(state => ({ isCardDetailsVisible: !state.isCardDetailsVisible })),

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

        // Fora do PvP `myRole` é null; quem desiste é sempre o jogador local (p1).
        const loserId = state.isPvP ? (state.myRole ?? 'p1') : 'p1';
        const winnerId = loserId === 'p1' ? 'p2' : 'p1';
        const loserName = loserId === 'p1' ? 'Azul' : 'Roxo';

        set({
          currentPhase: 'GAME_OVER',
          winner: winnerId,
          winReason: 'surrender',
          isTimerRunning: false,
          actionSeq: state.actionSeq + 1,
          isResolving: false,
        });

        get().addLog(`${loserName} surrendered!`, loserId);
      },

      ...createCombatActions(set, get),
      ...createSandboxActions(set, get),

      lastActionVfx: undefined,

      triggerRemoteVfx: (vfx) => {
        const { type, sourceId, targetId, targetPos, sourcePos, abilityId } = vfx;
        const state = get();
        
        if (type === 'ATTACK' && sourceId && targetId) {
          // A unidade pode já ter sumido do tabuleiro local quando o VFX chega.
          const localAttacker = state.boardUnits[sourceId];
          const localTarget = state.boardUnits[targetId];
          const attackerPos = localAttacker?.position ?? sourcePos;
          const targetPosition = localTarget?.position ?? targetPos;

          if (attackerPos && targetPosition) {
            const attacker: AnimationActor = {
              id: sourceId,
              position: attackerPos,
              playerId: localAttacker?.playerId ?? '',
              unitClass: localAttacker?.unitClass ?? 'Arqueiro',
            };
            const target: AnimationActor = {
              id: targetId,
              position: targetPosition,
              playerId: localTarget?.playerId ?? '',
              unitClass: localTarget?.unitClass,
            };
            const animations: Record<string, AnimationType> = { [sourceId]: 'attacking', [targetId]: 'damaged' };
            const dummyState = { ...state };
            const dummyMsg = "";
            const targetDied = (localTarget?.hp ?? 0) <= 0;

            const uClass = attacker.unitClass;

            if (uClass === 'Arqueiro') scheduleProjectileAnimation(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
            else if (uClass === 'Lanceiro') scheduleThrustAnimation(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
            else if (uClass === 'Mago' || uClass === 'Alquimista') scheduleMageAttack(set, get, attacker, target, dummyState, animations, dummyMsg, targetDied);
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
          set({
            ...newState,
            selectedHex: null,
            turnTimer: TURN_SECONDS,
            isTimerRunning: true,
            // Qualquer animação pendente do turno anterior deixa de valer.
            actionSeq: currentGameState.actionSeq + 1,
            isResolving: false,
          });
          get().addLog(`${pId === 'p1' ? 'Blue' : 'Purple'}'s turn ended.`, pId);

          const updatedState = get();
          const autoBattleTarget = updatedState.isAutoPlay ? 200 : 1000;
          if (updatedState.currentPhase !== 'GAME_OVER' && (updatedState.isAutoPlay || (updatedState.isVsAI && updatedState.currentTurnPlayerId === 'p2'))) {
            setTimeout(() => get().runAiTurn(), autoBattleTarget);
          } else if (updatedState.currentPhase === 'MAIN_PHASE' && !updatedState.sandboxMode && !hasAnyValidAction(updatedState, updatedState.currentTurnPlayerId)) {
            // Se o PRÓXIMO jogador não tem nenhuma ação, passa sozinho.
            setTimeout(() => {
              try {
                const latest = get();
                if (latest.currentTurnPlayerId === updatedState.currentTurnPlayerId &&
                    latest.currentPhase === 'MAIN_PHASE' &&
                    !hasAnyValidAction(latest, latest.currentTurnPlayerId)) {
                  latest.triggerEndTurn();
                }
              } catch (autoPassErr) {
                console.warn('Auto-pass:', autoPassErr);
              }
            }, 1500);
          }
        } catch (err) {
          console.warn("Erro de Turno:", err instanceof Error ? err.message : err);
        }
      },

      runAiTurn: async () => {
        const state = get();
        // No modo Auto-Play, permitimos que a IA jogue para QUALQUER jogador
        if (state.isAiThinking || state.currentPhase === 'GAME_OVER') return;
        if (!state.isAutoPlay && state.currentTurnPlayerId !== 'p2') return;

        set({ isAiThinking: true });

        const currentPlayer = state.currentTurnPlayerId;
        const startedAt = Date.now();
        let actionsTaken = 0;

        try {
          while (true) {
            const before = get();
            if (before.currentPhase === 'GAME_OVER') break;
            if (before.currentTurnPlayerId !== currentPlayer) break;

            // Guard-rails: sem eles, uma ação recusada pelo motor (cujo erro é
            // engolido pelos wrappers) faria este laço rodar para sempre.
            if (actionsTaken >= AI_MAX_ACTIONS_PER_TURN || Date.now() - startedAt > AI_MAX_TURN_MS) {
              console.warn('IA: limite de ações/tempo atingido, encerrando o turno.');
              before.triggerEndTurn();
              break;
            }

            const action = getBestAction(before, currentPlayer, { timeBudgetMs: 800 });
            if (!action || action.type === 'END_TURN') {
              before.triggerEndTurn();
              break;
            }

            await new Promise(resolve => setTimeout(resolve, get().isAutoPlay ? 150 : 800));
            if (get().currentTurnPlayerId !== currentPlayer) break;

            const signatureBefore = aiProgressSignature(get());
            const actions = get();
            switch (action.type) {
              case 'MOVE':      actions.attemptMove(action.unitId, action.target); break;
              case 'ATTACK':    actions.attemptAttack(action.attackerId, action.targetId, action.special); break;
              case 'PLAY_CARD': actions.attemptPlayCard(action.cardId, action.target); break;
              case 'OFFER':     actions.offerCard(action.cardId); break;
              case 'HEAL':      actions.attemptHeal(action.healerId, action.targetId); break;
            }
            actionsTaken++;

            // A ação não mudou nada? O motor a recusou — não insistir nela.
            if (aiProgressSignature(get()) === signatureBefore) {
              console.warn('IA: ação sem efeito, encerrando o turno.', action.type);
              get().triggerEndTurn();
              break;
            }
          }
        } catch (err) {
          console.error('AI Error:', err);
          if (get().currentTurnPlayerId === currentPlayer) get().triggerEndTurn();
        } finally {
          set({ isAiThinking: false });
        }
      },

      resetGame: () => {
        const initialState = createInitialState();
        set(state => ({
          ...initialState,
          language: state.language,
          selectedHex: null,
          selectedCard: null,
          targetHex: null,
          logs: [],
          animatingUnits: {},
          isAutoPlay: false,
          isAiThinking: false
        }));
      }
    }),
    {
      name: 'hexum-game-state-v2',
      // Persistimos só a partida em si. Estado de navegação, sessão de lobby,
      // cronômetro e flags efêmeras voltavam do localStorage e reabriam telas
      // de PvP mortas depois de um reload.
      partialize: (state) => ({
        matchId: state.matchId,
        turnNumber: state.turnNumber,
        currentPhase: state.currentPhase,
        currentTurnPlayerId: state.currentTurnPlayerId,
        winner: state.winner,
        players: state.players,
        boardUnits: state.boardUnits,
        language: state.language,
        isVsAI: state.isVsAI,
        sandboxMode: state.sandboxMode,
      }),
    }
  )
)
);
