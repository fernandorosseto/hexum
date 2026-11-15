import type { HexCoordinates, Unit } from 'shared';
import { tryGetUnitCard } from 'shared';
import type { GameStore } from './gameStore';

type StoreSet = (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void;
type StoreGet = () => GameStore;

/** Maior animação de carta (1000ms) + folga. */
const SANDBOX_MANA_RESTORE_MS = 1100;

export const createSandboxActions = (set: StoreSet, get: StoreGet) => ({
  spawnUnit: (unitName: string, hex: HexCoordinates, playerId: string) => {
    const card = tryGetUnitCard(unitName, get().language);
    if (!card) return;

    const unitId = `u_sbx_${Math.random().toString(36).slice(2, 7)}_${card.unitClass.toLowerCase()}`;
    // Tipar como Unit fez aparecer que `abilityCooldown` nunca era preenchido:
    // unidades criadas no Sandbox tinham a especial sempre disponível.
    const newUnit: Unit = {
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
      abilityCooldown: 0,
      equippedArtifacts: []
    };

    set(state => ({
      boardUnits: { ...state.boardUnits, [unitId]: newUnit }
    }));
    const lang = get().language || 'pt';
    const msg = lang === 'pt'
      ? `[Sandbox] Invocou ${card?.name || unitName} em (${hex.q}, ${hex.r}) para ${playerId}`
      : `[Sandbox] Spawned ${card?.name || unitName} at (${hex.q}, ${hex.r}) for ${playerId}`;
    get().addLog(msg, 'system');
  },

  addCardToHand: (cardId: string) => {
    set(state => {
      const pId = state.currentTurnPlayerId;
      const player = state.players[pId];
      return {
        players: {
          ...state.players,
          [pId]: { ...player, hand: [...player.hand, cardId] }
        }
      };
    });
    const lang = get().language || 'pt';
    const msg = lang === 'pt'
      ? `[Sandbox] Adicionou carta ${cardId} à mão`
      : `[Sandbox] Added card ${cardId} to hand`;
    get().addLog(msg, 'system');
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
      // A restauração precisa acontecer DEPOIS da animação: attemptPlayCard
      // aplica o estado final num setTimeout, e um restore síncrono era
      // sobrescrito por ele logo em seguida.
      setTimeout(() => {
        set(state => ({
          players: {
            ...state.players,
            [playerId]: { ...state.players[playerId], mana: originalMana }
          }
        }));
      }, SANDBOX_MANA_RESTORE_MS);
    }
  },

  purifyArena: () => {
    set({ boardUnits: {} });
    const lang = get().language || 'pt';
    const msg = lang === 'pt'
      ? `[Sandbox] Arena Purificada!`
      : `[Sandbox] Arena Purified!`;
    get().addLog(msg, 'system');
  },

  removeUnit: (unitId: string) => {
    set(state => {
      const { [unitId]: _removed, ...remainingUnits } = state.boardUnits;
      return {
        boardUnits: remainingUnits,
        selectedHex: null,
        inspectedItem: null
      };
    });
    const lang = get().language || 'pt';
    const msg = lang === 'pt'
      ? `[Sandbox] Unidade removida`
      : `[Sandbox] Unit removed`;
    get().addLog(msg, 'system');
  }
});
