import { GameState } from './types';
import { getHexDistance, getHexNeighbors, isLine, isDiagonal, isInsideBoard, type HexCoordinates } from './hexMath';
import { moveTo, attack, playCard, offerCard, heal, getValidSpawnCoordinates } from './gameEngine';

export type AIAction = 
  | { type: 'MOVE', unitId: string, target: HexCoordinates }
  | { type: 'ATTACK', attackerId: string, targetId: string, special: boolean }
  | { type: 'PLAY_CARD', cardId: string, target: HexCoordinates }
  | { type: 'OFFER', cardId: string }
  | { type: 'HEAL', healerId: string, targetId: string };

/**
 * Avalia o quão favorável está o estado do jogo para um jogador específico.
 * Agora utiliza uma abordagem Zero-Sum (Vantagem Aliada - Vantagem Inimiga).
 */
export function evaluateState(state: GameState, playerId: string): number {
  const opponentId = playerId === 'p1' ? 'p2' : 'p1';
  
  if (state.currentPhase === 'GAME_OVER') {
    return state.winner === playerId ? 50000 : -50000;
  }

  const myScore = calculateSideValue(state, playerId, opponentId);
  const oppScore = calculateSideValue(state, opponentId, playerId);

  return myScore - oppScore;
}

function calculateSideValue(state: GameState, playerId: string, opponentId: string): number {
  let value = 0;
  const player = state.players[playerId];
  const oppKing = Object.values(state.boardUnits).find(u => u.playerId === opponentId && u.unitClass === 'Rei');
  const myKing = Object.values(state.boardUnits).find(u => u.playerId === playerId && u.unitClass === 'Rei');

  // 1. Unidades no Tabuleiro
  for (const unitId in state.boardUnits) {
    const unit = state.boardUnits[unitId];
    if (unit.playerId !== playerId) continue;

    // Valor base da unidade (HP e Classe)
    let unitValue = unit.hp * 10;
    if (unit.unitClass === 'Rei') unitValue += 5000;
    if (unit.unitClass === 'Cavaleiro') unitValue += 200;
    if (unit.unitClass === 'Assassino') unitValue += 300;
    if (unit.unitClass === 'Mago') unitValue += 250;

    // Bônus de Proximidade ao Rei Inimigo (Agressividade)
    if (oppKing) {
      const distToEnemyKing = getHexDistance(unit.position, oppKing.position);
      unitValue += Math.max(0, (12 - distToEnemyKing) * 15);
      
      // Se estiver em alcance de ataque, bônus massivo
      if (distToEnemyKing <= 4) unitValue += 100;
    }

    // Penalidade de King Safety (Defensiva)
    // Se há unidades inimigas perto do meu rei, as minhas unidades valem mais se estiverem perto para defender
    if (myKing) {
        const enemyNearMyKing = Object.values(state.boardUnits).filter(u => u.playerId === opponentId && getHexDistance(u.position, myKing.position) <= 3);
        if (enemyNearMyKing.length > 0) {
            const distToMyAdmin = getHexDistance(unit.position, myKing.position);
            if (distToMyAdmin <= 2) unitValue += 50; // Bônus por escoltar o rei
        }
    }

    // Avaliação de Buffs e Debuffs
    if (unit.buffs && unit.buffs.length > 0) {
      for (const buff of unit.buffs) {
        if (['shield', 'fury', 'immune_ranged'].includes(buff.type)) {
          unitValue += 80;
        } else if (['poison', 'burn', 'stun'].includes(buff.type)) {
          unitValue -= 80;
        }
      }
    }

    // Avaliação de Equipamentos (Artefatos)
    if (unit.equippedArtifacts && unit.equippedArtifacts.length > 0) {
      unitValue += unit.equippedArtifacts.length * 150;
    }

    value += unitValue;
  }

  // 2. Recursos e Mão
  value += player.mana * 5;
  value += player.maxMana * 30; // Prioridade agressiva em expandir limite de mana
  value += player.hand.length * 10;

  // 3. Agressividade Direta (Dano no Rei Inimigo)
  if (oppKing) {
    value += (oppKing.maxHp - oppKing.hp) * 100;
  }

  return value;
}

/**
 * Lista todas as ações possíveis que um jogador pode tomar no estado atual.
 * Nota: Para manter a performance, limitamos as opções de cartas e movimentos.
 */
export function getPossibleActions(state: GameState, playerId: string): AIAction[] {
  const actions: AIAction[] = [];
  const player = state.players[playerId];

  // 1. Ações de Unidades no Tabuleiro (Mover/Atacar)
  for (const unitId in state.boardUnits) {
    const unit = state.boardUnits[unitId];
    if (unit.playerId !== playerId) continue;

    const myPos = unit.position;

    // Tentar Atacar (Alcance 5 para cobrir Arqueiros)
    for (const targetId in state.boardUnits) {
      const target = state.boardUnits[targetId];
      if (target.playerId === playerId) continue;

      const dist = getHexDistance(myPos, target.position);
      if (dist <= 5 && !unit.summoningSickness && unit.canAttack) {
        // Ataque Normal
        try {
          actions.push({ type: 'ATTACK', attackerId: unitId, targetId, special: false });
        } catch(e) {}

        // Ataque Especial (Choque de Investida etc) se tiver mana
        if (player.mana >= 3) {
          actions.push({ type: 'ATTACK', attackerId: unitId, targetId, special: true });
        }
      }
    }

    // Tentar Mover (Vizinhos)
    if (!unit.summoningSickness && unit.canMove) {
      const neighbors = getHexNeighbors(myPos).filter(n => isInsideBoard(n));
      for (const neighbor of neighbors) {
        actions.push({ type: 'MOVE', unitId, target: neighbor });
      }
    }
  }

  // 2. Jogar Cartas da Mão (Unidades, Magias, Artefatos)
  for (const cardId of player.hand) {
    const validHexes = getValidSpawnCoordinates(state, playerId, cardId);
    
    // Evitar explosão combinatória em feitiços que pegam todo o tabuleiro (ex: Muralha em 90 posições livres)
    let hexesToTry = validHexes;
    if (validHexes.length > 20) {
      // Tenta 10 posições aleatórias para feitiços muito abertos
      hexesToTry = validHexes.sort(() => 0.5 - Math.random()).slice(0, 10);
    }

    for (const hex of hexesToTry) {
        actions.push({ type: 'PLAY_CARD', cardId, target: hex });
    }
  }

  // 3. Cura (Clérigo)
  const clerigos = Object.values(state.boardUnits).filter(u => u.playerId === playerId && u.unitClass === 'Clerigo' && u.canAttack && !u.summoningSickness);
  for (const healer of clerigos) {
    const woundedAllies = Object.values(state.boardUnits).filter(u => u.playerId === playerId && u.hp < u.maxHp && getHexDistance(healer.position, u.position) <= 2);
    for (const target of woundedAllies) {
      actions.push({ type: 'HEAL', healerId: healer.id, targetId: target.id });
    }
  }

  // 4. Oferenda (Descarte por Mana)
  if (player.canOfferCard && player.maxMana < 6) {
    for (const cardId of player.hand) {
      actions.push({ type: 'OFFER', cardId });
    }
  }

  return actions;
}

/**
 * Escolhe a melhor ação imediata baseada na heurística.
 */
export function getBestAction(state: GameState, playerId: string): AIAction | null {
  const possibleActions = getPossibleActions(state, playerId);
  if (possibleActions.length === 0) return null;

  let bestAction: AIAction | null = null;
  let bestScore = evaluateState(state, playerId); 

  for (const action of possibleActions) {
    try {
      let newState: GameState;
      
      // Simula a ação
      if (action.type === 'MOVE') {
        newState = moveTo(state, action.unitId, action.target);
      } else if (action.type === 'ATTACK') {
        newState = attack(state, action.attackerId, action.targetId, action.special);
      } else if (action.type === 'PLAY_CARD') {
        newState = playCard(state, playerId, action.cardId, action.target);
      } else if (action.type === 'OFFER') {
        newState = offerCard(state, playerId, action.cardId);
      } else if (action.type === 'HEAL') {
        newState = heal(state, action.healerId, action.targetId);
      } else {
        continue;
      }

      const score = evaluateState(newState, playerId);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    } catch (e) {
      continue;
    }
  }

  return bestAction;
}
