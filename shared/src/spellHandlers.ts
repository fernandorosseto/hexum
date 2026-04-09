import type { GameState, Unit } from './types';
import { applyFinalDamage } from './unitBehaviors';
import { getHexDistance, getHexNeighbors, isInsideBoard } from './hexMath';
import type { HexCoordinates } from './hexMath';

// ══════════════════════════════════════════════
//  Interface do Handler de Feitiço
// ══════════════════════════════════════════════

export interface SpellHandler {
  /** Executa o efeito do feitiço. Modifica state in-place (já clonado). */
  execute(state: GameState, playerId: string, targetHex: HexCoordinates): void;
}

// ══════════════════════════════════════════════
//  Handlers Individuais
// ══════════════════════════════════════════════

const AuraRunica: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    if (!targetUnit || targetUnit.playerId !== playerId) throw new Error("Selecione um aliado para Aura Rúnica.");
    targetUnit.maxHp += 2;
    targetUnit.hp += 2;
    targetUnit.buffs.push({ type: 'shield', duration: 99 });
  }
};

const CadeiaDeRelampagos: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    if (!targetUnit) throw new Error("Alvo inválido para Cadeia de Relâmpagos.");

    const myKing = Object.values(state.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId === playerId);
    if (myKing) {
      const dist = getHexDistance(myKing.position, targetHex);
      if (dist > 5) throw new Error("Alvo fora de alcance (máximo 5 hexágonos do Rei).");
    }

    targetUnit.hp -= 2;
    const neighbors = getHexNeighbors(targetHex);
    const neighborUnits = Object.values(state.boardUnits).filter(u =>
      u.playerId !== playerId && 
      u.id !== targetUnit.id &&
      neighbors.some(n => n.q === u.position.q && n.r === u.position.r)
    );

    if (neighborUnits.length > 0) {
      // Ordenar por HP (menor primeiro) e desempate por proximidade ao Rei
      neighborUnits.sort((a, b) => {
        if (a.hp !== b.hp) return a.hp - b.hp;
        if (!myKing) return 0;
        const distA = getHexDistance(a.position, myKing.position);
        const distB = getHexDistance(b.position, myKing.position);
        return distA - distB;
      });
      neighborUnits[0].hp -= 1;
    }
  }
};

const TransfusaoSombria: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    if (!targetUnit) throw new Error("Alvo inválido para Transfusão Sombria (selecione quem perderá HP).");

    const myKing = Object.values(state.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId === playerId);
    if (!myKing) throw new Error("O Rei deve estar no tabuleiro para usar Transfusão.");

    const dist = getHexDistance(myKing.position, targetHex);
    if (dist > 1) throw new Error("O Rei deve estar adjacente ao alvo para realizar a transfusão.");

    applyFinalDamage(targetUnit, 2, state);
    myKing.hp = Math.min(myKing.maxHp, myKing.hp + 2);
  }
};

const NevoaEspessa: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    if (!targetUnit || targetUnit.playerId !== playerId) throw new Error("Selecione um aliado para proteger com Névoa.");
    targetUnit.buffs.push({ type: 'immune_ranged', duration: 2 });
  }
};

const MuralhaDeGelo: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targets = [targetHex, ...getHexNeighbors(targetHex)];
    let wallsSpawned = 0;

    for (const hex of targets) {
      if (wallsSpawned >= 3) break;
      const occupant = findUnitAtHex(state, hex);
      if (!occupant && isInsideBoard(hex)) {
        const wallId = `u_${Math.random().toString(36).substr(2, 5)}_muralha`;
        state.boardUnits[wallId] = {
          id: wallId, playerId, cardId: 'spl_muralha', unitClass: 'Estrutura' as any,
          hp: 6, maxHp: 6, attack: 0, position: hex, buffs: [], roundsInField: 0,
          summoningSickness: true, canMove: false, canAttack: false, equippedArtifacts: []
        };
        wallsSpawned++;
      }
    }
    if (wallsSpawned === 0) throw new Error("A Muralha requer espaços vazios adjacentes.");
  }
};

const PassosDeVento: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    if (!targetUnit || targetUnit.playerId !== playerId) throw new Error("Selecione um aliado para Passos de Vento.");
    targetUnit.canMove = true;
    targetUnit.canAttack = true;
  }
};

const ChuvaDeMeteoros: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    const targetId = targetUnit ? targetUnit.id : null;
    if (targetUnit) {
      const damage = targetUnit.unitClass === 'Estrutura' ? 4 : 2;
      applyFinalDamage(targetUnit, damage, state);
    }
    const neighbors = getHexNeighbors(targetHex);
    const splashUnits = Object.values(state.boardUnits).filter(u =>
      u.id !== targetId && neighbors.some(n => n.q === u.position.q && n.r === u.position.r)
    );
    splashUnits.forEach(u => {
      const damage = u.unitClass === 'Estrutura' ? 2 : 1;
      applyFinalDamage(u, damage, state);
    });
  }
};

const BencaoDivina: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    if (!targetUnit || targetUnit.playerId !== playerId) throw new Error("Selecione um aliado para Bênção Divina.");
    targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + 3);
    targetUnit.buffs = targetUnit.buffs.filter(b => b.type !== 'poison' && b.type !== 'burn' && b.type !== 'stun' && b.type !== 'bleed');
  }
};

const RaizesDaTerra: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    if (!targetUnit || targetUnit.playerId === playerId) throw new Error("Selecione um inimigo para enraizar.");
    targetUnit.buffs.push({ type: 'stun', duration: 1 });
  }
};

const FuriaDeBatalha: SpellHandler = {
  execute(state, playerId, targetHex) {
    const targetUnit = findUnitAtHex(state, targetHex);
    if (!targetUnit || targetUnit.playerId !== playerId) throw new Error("Selecione um aliado para Fúria.");
    targetUnit.buffs.push({ type: 'fury', duration: 1 });
  }
};

const ChamadoDosReforcos: SpellHandler = {
  execute(state, playerId) {
    const player = state.players[playerId];
    player.deck.push('unit_lanceiro');
    player.hand.push('unit_lanceiro');
  }
};

// ══════════════════════════════════════════════
//  Utilitário
// ══════════════════════════════════════════════

function findUnitAtHex(state: GameState, hex: HexCoordinates): Unit | undefined {
  return Object.values(state.boardUnits).find(u =>
    u.position.q === hex.q && u.position.r === hex.r && u.position.s === hex.s
  );
}

// ══════════════════════════════════════════════
//  Registry
// ══════════════════════════════════════════════

export const SPELL_REGISTRY: Record<string, SpellHandler> = {
  'spl_aurarunica': AuraRunica,
  'spl_raio': CadeiaDeRelampagos,
  'spl_transfusao': TransfusaoSombria,
  'spl_nevoa': NevoaEspessa,
  'spl_muralha': MuralhaDeGelo,
  'spl_passos': PassosDeVento,
  'spl_meteoro': ChuvaDeMeteoros,
  'spl_bencao': BencaoDivina,
  'spl_raizes': RaizesDaTerra,
  'spl_furia': FuriaDeBatalha,
  'spl_reforcos': ChamadoDosReforcos,
};
