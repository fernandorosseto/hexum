import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { moveTo, attack, endTurn, heal, createInitialState, playCard, offerCard, UNIT_STATS, getHexDistance, getHexNeighbors } from 'shared';
import { getBestAction } from 'shared/src/aiEngine';
import type { GameState, HexCoordinates } from 'shared';

interface GameLog {
  id: string;
  message: string;
  playerId: string;
}

type AnimationType = 'attacking' | 'damaged' | 'healing' | 'lightning';

interface TransfusionAnimation {
  source: HexCoordinates;
  target: HexCoordinates;
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
  activeMeteor: HexCoordinates | null;
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
      activeMeteor: null,

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

      attemptMove: (unitId, targetHex, useSpecial = false) => {
        try {
          const currentGameState = get();
          const unit = currentGameState.boardUnits[unitId];
          if (!unit) return;

          let effectiveState = currentGameState;
          if (currentGameState.sandboxMode) {
            effectiveState = {
              ...currentGameState,
              boardUnits: {
                ...currentGameState.boardUnits,
                [unitId]: {
                  ...unit,
                  canMove: true,
                  summoningSickness: false
                }
              },
              players: {
                ...currentGameState.players,
                [unit.playerId]: { ...currentGameState.players[unit.playerId], mana: 99 }
              }
            };
          }

          const finalUseSpecial = useSpecial || !!currentGameState.selectedAbility;
          const newState = moveTo(effectiveState, unitId, targetHex, finalUseSpecial);
          set({ ...newState, selectedHex: null, selectedAbility: null });

          const moveTemplates = [
            `O ${unit.unitClass} marchou pelo campo de batalha.`,
            `${unit.unitClass} se posicionou estrategicamente.`,
            `O ${unit.unitClass} avançou em direção ao objetivo.`
          ];
          const moveMsg = moveTemplates[Math.floor(Math.random() * moveTemplates.length)];
          get().addLog(moveMsg, unit.playerId);
        } catch (err: any) {
          console.warn("Erro de Regra:", err.message);
          set({ selectedHex: null, selectedAbility: null });
        }
      },

      attemptAttack: (attackerId, targetId, useSpecial = false) => {
        try {
          const currentGameState = get();
          const attacker = currentGameState.boardUnits[attackerId];
          const target = currentGameState.boardUnits[targetId];

          if (!attacker || !target) return;
          const hpBefore = target.hp;

          const finalUseSpecial = useSpecial || !!currentGameState.selectedAbility;

          let effectiveState = currentGameState;
          if (currentGameState.sandboxMode) {
            effectiveState = {
              ...currentGameState,
              currentTurnPlayerId: attacker.playerId,
              boardUnits: {
                ...currentGameState.boardUnits,
                [attackerId]: {
                  ...attacker,
                  canAttack: true,
                  summoningSickness: false
                }
              },
              players: {
                ...currentGameState.players,
                [attacker.playerId]: { ...currentGameState.players[attacker.playerId], mana: 99 }
              }
            };
          }

          const newState = attack(effectiveState, attackerId, targetId, finalUseSpecial);
          newState.currentTurnPlayerId = currentGameState.currentTurnPlayerId;

          const updatedTarget = newState.boardUnits[targetId];
          const damageDealt = hpBefore - (updatedTarget ? updatedTarget.hp : 0);
          const targetDied = !updatedTarget && !!target;

          const animations: Record<string, AnimationType> = { [attackerId]: 'attacking' };
          if (target) animations[targetId] = 'damaged';

          if (targetDied) {
            newState.boardUnits[targetId] = { ...target, hp: 0 };
          }

          set({
            ...newState,
            selectedHex: null,
            targetHex: null,
            selectedAbility: null,
            animatingUnits: animations,
            combatLogs: []
          });

          const details = (newState.combatLogs && newState.combatLogs.length > 0) ? `. ${newState.combatLogs.join('. ')}` : '';

          const attackTemplates = [
            `O ${attacker.unitClass} desferiu um golpe certeiro em ${target.unitClass} causando ${damageDealt} de dano!`,
            `${attacker.unitClass} atacou ${target.unitClass} infligindo ${damageDealt} de dano.`,
            `O impacto de ${attacker.unitClass} atingiu ${target.unitClass} com força: ${damageDealt} de dano.`
          ];
          const attackMsg = attackTemplates[Math.floor(Math.random() * attackTemplates.length)] + details;

          get().addLog(attackMsg, attacker.playerId);

          setTimeout(() => {
            set(state => {
              const cleanBoard = { ...state.boardUnits };
              if (targetDied) delete cleanBoard[targetId];
              return { animatingUnits: {}, boardUnits: cleanBoard };
            });
          }, 500);
        } catch (err: any) {
          console.warn("Erro de Ataque:", err.message);
          set({ selectedHex: null, targetHex: null, selectedAbility: null });
        }
      },

      attemptHeal: (healerId, targetId) => {
        try {
          const currentGameState = get();
          const healer = currentGameState.boardUnits[healerId];
          const target = currentGameState.boardUnits[targetId];

          let effectiveState = currentGameState;
          if (currentGameState.sandboxMode) {
            effectiveState = {
              ...currentGameState,
              boardUnits: {
                ...currentGameState.boardUnits,
                [healerId]: {
                  ...healer,
                  canAttack: true,
                  summoningSickness: false
                }
              }
            };
          }

          const newState = heal(effectiveState, healerId, targetId);
          set({ ...newState, selectedHex: null, animatingUnits: { [targetId]: 'healing' } });
          get().addLog(`O ${healer.unitClass} usou preces divinas para curar o ${target.unitClass}!`, healer.playerId);
          setTimeout(() => set({ animatingUnits: {} }), 600);
        } catch (err: any) {
          console.warn("Erro de Cura:", err.message);
          set({ selectedHex: null });
        }
      },

      attemptPlayCard: (cardId, targetHex) => {
        try {
          const currentGameState = get();

          let effectiveState = currentGameState;
          if (currentGameState.sandboxMode && currentGameState.currentTurnPlayerId === 'p1') {
            effectiveState = {
              ...currentGameState,
              players: {
                ...currentGameState.players,
                p1: { ...currentGameState.players.p1, mana: 99 }
              }
            };
          }

          const newState = playCard(effectiveState, currentGameState.currentTurnPlayerId, cardId, targetHex);

          if (currentGameState.sandboxMode) {
            newState.players['p1'].mana = 99;
            newState.players['p1'].maxMana = 99;
          }

          const deadUnitIds = Object.keys(currentGameState.boardUnits).filter(id => !newState.boardUnits[id]);

          let hasCustomAnimation = false;
          if (cardId === 'spl_raio') {
            const targetUnitId = Object.keys(currentGameState.boardUnits).find(id => {
              const u = currentGameState.boardUnits[id];
              return u.position.q === targetHex.q && u.position.r === targetHex.r;
            });

            if (targetUnitId) {
              hasCustomAnimation = true;
              const animations: Record<string, AnimationType> = { [targetUnitId]: 'lightning' };

              const myKing = Object.values(currentGameState.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId === currentGameState.currentTurnPlayerId);
              const neighbors = getHexNeighbors(targetHex);
              const neighborUnits = Object.values(currentGameState.boardUnits).filter(u =>
                u.playerId !== currentGameState.currentTurnPlayerId &&
                u.id !== targetUnitId &&
                neighbors.some(n => n.q === u.position.q && n.r === u.position.r)
              );

              if (neighborUnits.length > 0) {
                neighborUnits.sort((a, b) => {
                  if (a.hp !== b.hp) return a.hp - b.hp;
                  if (!myKing) return 0;
                  const distA = getHexDistance(a.position, myKing.position);
                  const distB = getHexDistance(b.position, myKing.position);
                  return distA - distB;
                });
                animations[neighborUnits[0].id] = 'lightning';
              }

              set({ animatingUnits: animations });
            }
          }

          if (cardId === 'spl_transfusao') {
            const myKing = Object.values(currentGameState.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId === currentGameState.currentTurnPlayerId);
            if (myKing) {
              set({ activeTransfusion: { source: targetHex, target: myKing.position } });
              setTimeout(() => set({ activeTransfusion: null }), 1000);
            }
          }

          if (cardId === 'spl_meteoro') {
            set({ activeMeteor: targetHex });

            const neighbors = getHexNeighbors(targetHex);
            const affectedUnitIds = Object.keys(currentGameState.boardUnits).filter(id => {
              const u = currentGameState.boardUnits[id];
              return (u.position.q === targetHex.q && u.position.r === targetHex.r) ||
                neighbors.some(n => n.q === u.position.q && n.r === u.position.r);
            });

            if (affectedUnitIds.length > 0) {
              const animations: Record<string, AnimationType> = {};
              affectedUnitIds.forEach(id => {
                animations[id] = 'damaged';
              });
              set({ animatingUnits: animations });
            }

            setTimeout(() => set({ activeMeteor: null, animatingUnits: {} }), 1000);
            hasCustomAnimation = true;
          }

          if (deadUnitIds.length > 0) {
            deadUnitIds.forEach(id => {
              newState.boardUnits[id] = { ...currentGameState.boardUnits[id], hp: 0 };
              if (!get().animatingUnits[id]) {
                set(state => ({ animatingUnits: { ...state.animatingUnits, [id]: 'damaged' } }));
              }
            });
          }

          set({ ...newState, selectedCard: null, selectedHex: null });

          if (deadUnitIds.length > 0 || hasCustomAnimation) {
            setTimeout(() => {
              set(state => {
                const cleanBoard = { ...state.boardUnits };
                deadUnitIds.forEach(id => delete cleanBoard[id]);
                return { boardUnits: cleanBoard, animatingUnits: {} };
              });
            }, 800);
          }

          const cardName = cardId.replace('unit_', '').replace('spl_', '').replace('art_', '').toUpperCase();
          let playMsg = `Jogou ${cardName}`;

          if (cardId.startsWith('unit_')) {
            playMsg = `O ${currentGameState.currentTurnPlayerId === 'p1' ? 'Azul' : 'Roxo'} convocou o ${cardName} para o campo de batalha!`;
          } else if (cardId.startsWith('spl_')) {
            playMsg = `Uma poderosa magia foi conjurada: ${cardName}!`;
          } else if (cardId.startsWith('art_')) {
            playMsg = `O artefato sagrado ${cardName} foi revelado.`;
          }

          get().addLog(playMsg, currentGameState.currentTurnPlayerId);
        } catch (err: any) {
          console.warn("Erro ao jogar carta:", err.message);
          set({ selectedCard: null, selectedHex: null });
        }
      },

      offerCard: (cardId) => {
        try {
          const currentGameState = get();

          let effectiveState = currentGameState;
          if (currentGameState.sandboxMode) {
            const pId = currentGameState.currentTurnPlayerId;
            effectiveState = {
              ...currentGameState,
              players: {
                ...currentGameState.players,
                [pId]: { ...currentGameState.players[pId], canOfferCard: true }
              }
            };
          }

          const newState = offerCard(effectiveState, currentGameState.currentTurnPlayerId, cardId);

          if (currentGameState.sandboxMode && currentGameState.currentTurnPlayerId === 'p1') {
            newState.players['p1'].mana = 99;
            newState.players['p1'].maxMana = 99;
            newState.players['p1'].canOfferCard = true;
          }

          set({ ...newState });
          get().addLog(`Uma oferenda de mana foi feita por ${currentGameState.currentTurnPlayerId === 'p1' ? 'Azul' : 'Roxo'}.`, currentGameState.currentTurnPlayerId);
        } catch (err: any) {
          console.warn("Erro ao oferecer carta:", err.message);
        }
      },

      healUnit: (healerId, targetId) => {
        try {
          const currentGameState = get();
          const healer = currentGameState.boardUnits[healerId];
          const target = currentGameState.boardUnits[targetId];
          const newState = heal(currentGameState, healerId, targetId);
          set({ ...newState, animatingUnits: { [targetId]: 'healing' } });
          get().addLog(`${healer.unitClass} curou ${target.unitClass}`, healer.playerId);
          setTimeout(() => set({ animatingUnits: {} }), 600);
        } catch (err: any) {
          console.warn("Erro ao curar:", err.message);
        }
      },

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

      spawnUnit: (unitName, hex, playerId) => {
        const stats = UNIT_STATS[unitName];
        if (!stats) return;

        const unitId = `u_sbx_${Math.random().toString(36).substr(2, 5)}_${unitName.toLowerCase()}`;
        const newUnit = {
          id: unitId,
          playerId,
          cardId: `unit_${unitName.toLowerCase()}`,
          unitClass: unitName as any,
          hp: stats.hp,
          maxHp: stats.hp,
          attack: stats.attack,
          position: hex,
          buffs: [],
          roundsInField: 0,
          summoningSickness: false,
          canMove: true,
          canAttack: true,
          equippedArtifacts: []
        };

        set(state => ({
          boardUnits: { ...state.boardUnits, [unitId]: newUnit }
        }));
        get().addLog(`[Sandbox] Spawnou ${unitName} em (${hex.q}, ${hex.r}) para ${playerId}`, 'system');
      },

      addCardToHand: (cardId) => {
        set(state => {
          const pId = state.currentTurnPlayerId;
          const player = state.players[pId];
          return {
            players: {
              ...state.players,
              [pId]: {
                ...player,
                hand: [...player.hand, cardId]
              }
            }
          };
        });
        get().addLog(`[Sandbox] Adicionou carta ${cardId} à mão`, 'system');
      },

      sandboxPlayCard: (cardId, hex, playerId) => {
        const currentState = get();

        if (cardId.startsWith('unit_')) {
          const unitName = cardId.replace('unit_', '');
          const capitalized = unitName.charAt(0).toUpperCase() + unitName.slice(1);
          get().spawnUnit(capitalized, hex, playerId);
          return;
        }

        const originalMana = currentState.players[playerId].mana;

        set(state => ({
          players: {
            ...state.players,
            [playerId]: {
              ...state.players[playerId],
              hand: [...state.players[playerId].hand, cardId],
              mana: 99
            }
          }
        }));

        try {
          get().attemptPlayCard(cardId, hex);
        } finally {
          set(state => ({
            players: {
              ...state.players,
              [playerId]: {
                ...state.players[playerId],
                mana: originalMana
              }
            }
          }));
        }
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
      },

      purifyArena: () => {
        set({ boardUnits: {} });
        get().addLog("[Sandbox] Arena Purificada!", 'system');
      },

      removeUnit: (unitId: string) => {
        set(state => {
          const { [unitId]: _, ...remainingUnits } = state.boardUnits;
          return {
            boardUnits: remainingUnits,
            selectedHex: null,
            inspectedItem: null
          };
        });
        get().addLog(`[Sandbox] Unidade removida`, 'system');
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
          activeMeteor,
          isCardExpanded,
          ...rest
        } = state;
        return rest;
      },
    }
  )
);
