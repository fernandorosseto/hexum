import type { HexCoordinates } from 'shared';
import { getUnitCard } from 'shared';

export const createSandboxActions = (set: any, get: any) => ({
  spawnUnit: (unitName: string, hex: HexCoordinates, playerId: string) => {
    let card;
    try { card = getUnitCard(unitName); } catch(e){}
    if (!card) return;

    const unitId = `u_sbx_${Math.random().toString(36).substr(2, 5)}_${card.unitClass.toLowerCase()}`;
    const newUnit = {
      id: unitId,
      playerId,
      cardId: card.id,
      unitClass: card.unitClass,
      hp: card.baseHp,
      maxHp: card.baseHp,
      attack: card.baseAttack,
      position: hex,
      buffs: [],
      roundsInField: 0,
      summoningSickness: false,
      canMove: true,
      canAttack: true,
      equippedArtifacts: []
    };

    set((state: any) => ({
      boardUnits: { ...state.boardUnits, [unitId]: newUnit }
    }));
    get().addLog(`[Sandbox] Spawnou ${unitName} em (${hex.q}, ${hex.r}) para ${playerId}`, 'system');
  },

  addCardToHand: (cardId: string) => {
    set((state: any) => {
      const pId = state.currentTurnPlayerId;
      const player = state.players[pId];
      return {
        players: {
          ...state.players,
          [pId]: { ...player, hand: [...player.hand, cardId] }
        }
      };
    });
    get().addLog(`[Sandbox] Adicionou carta ${cardId} à mão`, 'system');
  },

  sandboxPlayCard: (cardId: string, hex: HexCoordinates, playerId: string) => {
    const currentState = get();

    if (cardId.startsWith('unit_')) {
      const unitName = cardId.replace('unit_', '');
      const capitalized = unitName.charAt(0).toUpperCase() + unitName.slice(1);
      get().spawnUnit(capitalized, hex, playerId);
      return;
    }

    const originalMana = currentState.players[playerId].mana;

    set((state: any) => ({
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
      set((state: any) => ({
        players: {
          ...state.players,
          [playerId]: { ...state.players[playerId], mana: originalMana }
        }
      }));
    }
  },

  purifyArena: () => {
    set({ boardUnits: {} });
    get().addLog("[Sandbox] Arena Purificada!", 'system');
  },

  removeUnit: (unitId: string) => {
    set((state: any) => {
      const { [unitId]: _, ...remainingUnits } = state.boardUnits;
      return {
        boardUnits: remainingUnits,
        selectedHex: null,
        inspectedItem: null
      };
    });
    get().addLog(`[Sandbox] Unidade removida`, 'system');
  }
});
