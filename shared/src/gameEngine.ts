import type { GameState, Unit, Card, UnitCard } from './types';
import { getHexDistance, getHexNeighbors, isInsideBoard } from './hexMath';
import type { HexCoordinates } from './hexMath';
import { ARTIFACTS, SPELLS, UNIT_STATS, getUnitCard } from './cardLibrary';
import { UNIT_BEHAVIORS, isPathBlocked, checkEffectTrigger } from './unitBehaviors';
import { SPELL_REGISTRY } from './spellHandlers';
import { ARTIFACT_REGISTRY } from './artifactHandlers';

/**
 * Funções Puras (Reducers) para manipular o Estado
 * Todas retornam um NOVO objeto GameState alterado.
 * 
 * A lógica específica de cada classe/feitiço/artefato foi extraída para:
 *   - unitBehaviors.ts  (movimento e ataque por classe)
 *   - spellHandlers.ts  (efeitos de feitiços)
 *   - artifactHandlers.ts (efeitos de artefatos)
 */

// ══════════════════════════════════════════════
//  Spawn / Posicionamento Válido
// ══════════════════════════════════════════════

export function getValidSpawnCoordinates(state: GameState, playerId: string, cardId: string): HexCoordinates[] {
  const boardUnits = Object.values(state.boardUnits);
  const myKing = boardUnits.find(u => u.unitClass === 'Rei' && u.playerId === playerId);
  const range = 5; // BOARD_RADIUS

  if (cardId.startsWith('unit_')) {
    if (state.sandboxMode) return getAllEmptyHexes(boardUnits, range);
    
    const valid: HexCoordinates[] = [];
    for (let q = -range; q <= range; q++) {
      for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
        const hex = { q, r, s: -q - r };
        if (boardUnits.some(u => u.position.q === hex.q && u.position.r === hex.r)) continue;
        const isStartingZone = playerId === 'p1' ? hex.r >= 4 : hex.r <= -4;
        const isAdjacentToKing = myKing ? getHexDistance(myKing.position, hex) === 1 : false;
        if (isStartingZone || isAdjacentToKing) valid.push(hex);
      }
    }
    return valid;
  }

  if (cardId.startsWith('art_')) {
    if (state.sandboxMode) return boardUnits.map(u => u.position);
    return boardUnits.filter(u => u.playerId === playerId).map(u => u.position);
  }

  if (cardId.startsWith('spl_')) {
    if (cardId === 'spl_muralha') {
      return getAllEmptyHexes(boardUnits, range);
    }
    
    // Feitiços de SUPORTE (Aliados)
    if (['spl_aurarunica', 'spl_nevoa', 'spl_passos', 'spl_bencao', 'spl_furia'].includes(cardId)) {
      if (state.sandboxMode) return boardUnits.filter(u => u.playerId === playerId).map(u => u.position);
      return boardUnits.filter(u => u.playerId === playerId).map(u => u.position);
    }
    
    // Feitiços de ATAQUE (Inimigos)
    if (['spl_raio', 'spl_raizes'].includes(cardId)) {
      const myKing = boardUnits.find(u => u.unitClass === 'Rei' && u.playerId === playerId);
      let potentialTargets = boardUnits.filter(u => u.playerId !== playerId);
      
      if (cardId === 'spl_raio' && myKing && !state.sandboxMode) {
        potentialTargets = potentialTargets.filter(u => getHexDistance(u.position, myKing.position) <= 5);
      }
      
      return potentialTargets.map(u => u.position);
    }

    // Transfusão Sombria (Adjacente ao Rei, qualquer lado)
    if (cardId === 'spl_transfusao') {
      const myKing = boardUnits.find(u => u.unitClass === 'Rei' && u.playerId === playerId);
      if (!myKing) return [];
      const neighbors = getHexNeighbors(myKing.position);
      return boardUnits.filter(u => 
        neighbors.some(n => n.q === u.position.q && n.r === u.position.r)
      ).map(u => u.position);
    }

    if (cardId === 'spl_meteoro') {
      const myKing = boardUnits.find(u => u.unitClass === 'Rei' && u.playerId === playerId);
      if (!myKing) return [];
      return getAllHexes(range).filter(hex => getHexDistance(myKing.position, hex) <= 4);
    }
    
    return getAllHexes(range);
  }

  return [];
}

function getAllEmptyHexes(boardUnits: Unit[], range: number): HexCoordinates[] {
  const valid: HexCoordinates[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      const hex = { q, r, s: -q - r };
      if (!boardUnits.some(u => u.position.q === hex.q && u.position.r === hex.r)) valid.push(hex);
    }
  }
  return valid;
}

function getAllHexes(range: number): HexCoordinates[] {
  const valid: HexCoordinates[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      valid.push({ q, r, s: -q - r });
    }
  }
  return valid;
}

// ══════════════════════════════════════════════
//  Estado Inicial
// ══════════════════════════════════════════════

export function createInitialState(): GameState {
  const p1Id = 'p1';
  const p2Id = 'p2';

  const state: GameState = {
    matchId: `m_${Math.random().toString(36).substr(2, 9)}`,
    turnNumber: 1,
    currentPhase: 'MAIN_PHASE',
    currentTurnPlayerId: p1Id,
    players: {
      [p1Id]: createInitialPlayer(p1Id),
      [p2Id]: createInitialPlayer(p2Id)
    },
    boardUnits: {}
  };

  addInitialUnit(state, p1Id, 'Rei', { q: -2, r: 4, s: -2 });
  addInitialUnit(state, p1Id, 'Lanceiro', { q: -2, r: 3, s: -1 });
  addInitialUnit(state, p1Id, 'Lanceiro', { q: -1, r: 3, s: -2 });
  // [Balanço Experimental] Arqueiro bônus para P1 combater Vantagem do Segundo Jogador
  addInitialUnit(state, p1Id, 'Arqueiro', { q: -3, r: 4, s: -1 });

  addInitialUnit(state, p2Id, 'Rei', { q: 2, r: -4, s: 2 });
  addInitialUnit(state, p2Id, 'Lanceiro', { q: 2, r: -3, s: 1 });
  addInitialUnit(state, p2Id, 'Lanceiro', { q: 1, r: -3, s: 2 });

  drawInitialHand(state, p1Id);
  drawInitialHand(state, p2Id);

  return state;
}

function createInitialPlayer(id: string) {
  const deck: string[] = [];
  const units = ['Lanceiro', 'Lanceiro', 'Lanceiro', 'Lanceiro', 'Cavaleiro', 'Cavaleiro', 'Arqueiro', 'Arqueiro', 'Arqueiro', 'Clerigo', 'Mago', 'Assassino'];
  units.forEach(u => deck.push(`unit_${u.toLowerCase()}`));

  const randomArts = [...ARTIFACTS].sort(() => 0.5 - Math.random()).slice(0, 4);
  randomArts.forEach(a => deck.push(a.id));

  const randomSpells = [...SPELLS].sort(() => 0.5 - Math.random()).slice(0, 4);
  randomSpells.forEach(s => deck.push(s.id));

  deck.sort(() => 0.5 - Math.random());
  return { id, mana: 1, maxMana: 1, canOfferCard: true, hand: [] as string[], deck, graveyard: [] as string[] };
}

function addInitialUnit(state: GameState, playerId: string, unitClass: string, pos: HexCoordinates) {
  const stats = UNIT_STATS[unitClass];
  const id = `u_${Math.random().toString(36).substr(2, 5)}_${unitClass.toLowerCase()}`;
  state.boardUnits[id] = {
    id, playerId, cardId: `unit_${unitClass.toLowerCase()}`, unitClass: unitClass as any,
    hp: stats.hp, maxHp: stats.hp, attack: stats.attack, position: pos,
    buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, equippedArtifacts: []
  };
}

// ══════════════════════════════════════════════
//  Compra de Cartas
// ══════════════════════════════════════════════

export function drawCard(state: GameState, playerId: string) {
  const player = state.players[playerId];
  if (player.deck.length > 0) {
    const cardId = player.deck.pop();
    if (cardId) player.hand.push(cardId);
  }
}

function drawInitialHand(state: GameState, playerId: string) {
  const player = state.players[playerId];
  let attempts = 0;
  while (attempts < 50) {
    const tempDeck = [...player.deck];
    tempDeck.sort(() => 0.5 - Math.random());
    const tempHand = tempDeck.splice(0, 3);
    const unitCount = tempHand.filter(id => id.startsWith('unit_')).length;
    if (unitCount >= 2) {
      player.hand = tempHand;
      player.deck = tempDeck;
      return;
    }
    attempts++;
  }
  player.hand = player.deck.splice(0, 3);
}

// ══════════════════════════════════════════════
//  Fast Clone (Performance)
// ══════════════════════════════════════════════
export function cloneGameState(state: GameState): GameState {
  const newPlayers: Record<string, import('./types').PlayerState> = {};
  for (const pid in state.players) {
    const p = state.players[pid];
    newPlayers[pid] = { ...p, hand: [...p.hand], deck: [...p.deck], graveyard: [...p.graveyard] };
  }

  const newBoard: Record<string, import('./types').Unit> = {};
  for (const uid in state.boardUnits) {
    const u = state.boardUnits[uid];
    newBoard[uid] = { 
      ...u, 
      position: { ...u.position }, 
      buffs: u.buffs.map(b => ({ ...b })),
      equippedArtifacts: u.equippedArtifacts ? [...u.equippedArtifacts] : []
    };
  }

  return {
    matchId: state.matchId,
    turnNumber: state.turnNumber,
    currentPhase: state.currentPhase,
    currentTurnPlayerId: state.currentTurnPlayerId,
    sandboxMode: state.sandboxMode,
    winner: state.winner,
    players: newPlayers,
    boardUnits: newBoard,
    combatLogs: state.combatLogs ? [...state.combatLogs] : []
  };
}

// ══════════════════════════════════════════════
//  Fim de Turno
// ══════════════════════════════════════════════

export function endTurn(state: GameState): GameState {
  const newState = cloneGameState(state);

  const endingPlayerId = newState.currentTurnPlayerId;

  // 1. Resolução de Fim de Turno (Veneno e Debuffs limitados ocorrem aqui)
  for (const unitId in newState.boardUnits) {
    const unit = newState.boardUnits[unitId];
    if (unit.playerId === endingPlayerId) {
      unit.buffs = unit.buffs.filter((buff) => {
        // Aplica Dano Contínuo no Final do Turno (dando 1 turno de chance pro jogador agir antes)
        if (buff.type === 'poison' || buff.type === 'burn' || buff.type === 'bleed') {
          unit.hp -= (buff.value || 1);
        }
        buff.duration -= 1;
        return buff.duration > 0;
      });

      if ((unit.equippedArtifacts || []).includes('art_tomo')) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'poison' && b.type !== 'burn' && b.type !== 'stun' && b.type !== 'bleed');
      }

      if (unit.hp <= 0) {
        if (unit.unitClass === 'Rei' && !newState.sandboxMode) {
          newState.currentPhase = 'GAME_OVER';
          newState.winner = endingPlayerId === 'p1' ? 'p2' : 'p1';
        }
        delete newState.boardUnits[unitId];
      }
    }
  }

  // Se o jogo acabou pelo veneno no rei, não continuamos configurando o próximo jogador
  if (newState.currentPhase === 'GAME_OVER') {
     return newState;
  }

  // 2. Transição de Turno e Fase Inicial do Próximo Jogador
  newState.turnNumber += 1;
  const nextPlayerId = newState.currentTurnPlayerId === 'p1' ? 'p2' : 'p1';
  newState.currentTurnPlayerId = nextPlayerId;
  const nextPlayer = newState.players[nextPlayerId];

  nextPlayer.maxMana = Math.min((nextPlayer.maxMana || 1) + 1, 6);
  nextPlayer.mana = nextPlayer.maxMana;
  nextPlayer.canOfferCard = true;

  drawCard(newState, nextPlayerId);

  // Zera estados de invocação / fadiga das tropas inimigas
  for (const unitId in newState.boardUnits) {
    const unit = newState.boardUnits[unitId];
    if (unit.playerId === nextPlayerId) {
      unit.roundsInField += 1;
      unit.summoningSickness = false;
      unit.canMove = true;
      unit.canAttack = true;
    }
  }

  return newState;
}

// ══════════════════════════════════════════════
//  Movimento
// ══════════════════════════════════════════════

export function moveTo(state: GameState, unitId: string, targetPosition: HexCoordinates, useSpecial: boolean = false): GameState {
  const newState = cloneGameState(state);
  const unit = newState.boardUnits[unitId];

  if (!unit || unit.playerId !== newState.currentTurnPlayerId) throw new Error("Unidade inválida ou não é seu turno.");
  if (unit.summoningSickness) throw new Error("A unidade ainda está com enjoo de invocação.");
  if (!unit.canMove) throw new Error("Esta unidade já se moveu neste turno.");
  if (!isInsideBoard(targetPosition)) throw new Error("Destino fora dos limites do tabuleiro!");

  if (useSpecial) {
    const cost = unit.unitClass === 'Cavaleiro' ? 3 : (unit.unitClass === 'Assassino' ? 3 : 0);
    const player = newState.players[unit.playerId];
    if (player.mana < cost) throw new Error("Mana insuficiente para habilidade especial.");
    player.mana -= cost;
  }

  const dist = getHexDistance(unit.position, targetPosition);
  
  // Base de movimento por classe
  let baseMove = 1;
  if (unit.unitClass === 'Cavaleiro') baseMove = 2;
  
  // Bônus de artefato (Corcel concede +1 de distância de movimento)
  const bonus = (unit.equippedArtifacts || []).includes('art_corcel') ? 1 : 0;
  const maxMoveDist = baseMove + bonus;

  // Validação delegada à behavior da classe
  const behavior = UNIT_BEHAVIORS[unit.unitClass];
  behavior.validateMove(unit, targetPosition, dist, maxMoveDist, newState, useSpecial);

  // Colisão (compartilhado)
  const collision = Object.values(newState.boardUnits).some(u =>
    u.position.q === targetPosition.q && u.position.r === targetPosition.r && u.position.s === targetPosition.s
  );
  if (collision) throw new Error("Hexágono ocupado!");

  unit.position = targetPosition;
  unit.canMove = false;
  return newState;
}

export function getValidMoveCoordinates(state: GameState, unitId: string, useSpecial: boolean = false): HexCoordinates[] {
  const unit = state.boardUnits[unitId];
  if (!unit) return [];

  const behavior = UNIT_BEHAVIORS[unit.unitClass];
  const validMoves: HexCoordinates[] = [];
  
  // Estruturas não se movem
  if (unit.unitClass === 'Estrutura') {
    return [];
  }

  // Lógica Padrão para outras unidades (Raio 3 de visualização para performance)
  const searchRange = 3; 

  for (let q = -searchRange; q <= searchRange; q++) {
    for (let r = Math.max(-searchRange, -q - searchRange); r <= Math.min(searchRange, -q + searchRange); r++) {
      const targetPos = { q: unit.position.q + q, r: unit.position.r + r, s: unit.position.s + (-q - r) };
      const dist = getHexDistance(unit.position, targetPos);
      if (dist === 0) continue;

      if (behavior.isValidMovePosition(unit, targetPos, dist, state, useSpecial)) {
        const collision = Object.values(state.boardUnits).some(u =>
          u.position.q === targetPos.q && u.position.r === targetPos.r && u.position.s === targetPos.s
        );
        if (!collision) validMoves.push(targetPos);
      }
    }
  }
  return validMoves;
}

// ══════════════════════════════════════════════
//  Ataque
// ══════════════════════════════════════════════

export function attack(state: GameState, attackerId: string, targetId: string, useSpecial: boolean = false): GameState {
  const newState = cloneGameState(state);
  const attacker = newState.boardUnits[attackerId];
  const target = newState.boardUnits[targetId];

  if (!attacker || !target) throw new Error("Ação de ataque inválida.");
  if (attacker.playerId !== newState.currentTurnPlayerId) throw new Error("Não é seu turno.");
  if (attacker.summoningSickness) throw new Error("A unidade ainda está com enjoo de invocação.");
  if (!attacker.canAttack) throw new Error("Esta unidade já atacou.");

  if (useSpecial) {
    const cost = attacker.unitClass === 'Cavaleiro' ? 3 : (attacker.unitClass === 'Assassino' ? 3 : 0);
    const player = newState.players[attacker.playerId];
    if (player.mana < cost) throw new Error("Mana insuficiente para habilidade especial.");
    player.mana -= cost;
  }

  const dist = getHexDistance(attacker.position, target.position);

  // Buff de imunidade a ataques à distância
  if (target.buffs.some(b => b.type === 'immune_ranged') && dist > 1) {
    throw new Error("Alvo imune a ataques de longa distância (Névoa).");
  }

  // Bônus de Alcance (Artefatos)
  let rangeBonus = 0;
  if ((attacker.equippedArtifacts || []).includes('art_arco')) rangeBonus += 1;
  if ((attacker.equippedArtifacts || []).includes('art_anel') && (attacker.unitClass === 'Mago' || attacker.unitClass === 'Clerigo')) rangeBonus += 1;

  // Delega validação à behavior da classe
  const behavior = UNIT_BEHAVIORS[attacker.unitClass];
  behavior.validateAttack(attacker, target, dist, rangeBonus, useSpecial, newState);

  // Aura de Medo do Rei (compartilhado)
  const fearInfo = getFearStatus(attacker, newState);
  if (fearInfo.inRange && dist === 1) {
    if (Math.random() < fearInfo.chance) {
      if (!newState.combatLogs) newState.combatLogs = [];
      newState.combatLogs.push(`😱 ${attacker.unitClass} sucumbiu ao Medo do Rei inimigo e hesitou no ataque!`);
      attacker.canAttack = false;
      return newState;
    }
  }

  // Prepara o array de logs detalhados
  newState.combatLogs = [];

  // Delega dano e efeitos à behavior da classe
  behavior.applyDamage(attacker, target, newState, dist, useSpecial, rangeBonus);

  attacker.canAttack = false;
  return newState;
}

// ══════════════════════════════════════════════
//  Jogar Carta (Unidade, Feitiço, Artefato)
// ══════════════════════════════════════════════

export function playCard(state: GameState, playerId: string, cardId: string, targetHex: HexCoordinates): GameState {
  const newState = cloneGameState(state);
  const player = newState.players[playerId];

  if (!player.hand.includes(cardId)) throw new Error("Carta não está na mão.");

  let card: Card | UnitCard | undefined;
  if (cardId.startsWith('unit_')) {
    const unitClass = cardId.replace('unit_', '');
    const capitalizedClass = unitClass.charAt(0).toUpperCase() + unitClass.slice(1);
    card = getUnitCard(capitalizedClass);
  } else {
    card = ARTIFACTS.find(a => a.id === cardId) || SPELLS.find(s => s.id === cardId);
  }
  if (!card) throw new Error("Carta inválida.");
  if (player.mana < card.manaCost) throw new Error("Mana insuficiente.");

  // ── Unidade ──
  if (card.type === 'Unit') {
    const unitCard = card as UnitCard;
    const myKing = Object.values(newState.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId === playerId);
    const distToKing = myKing ? getHexDistance(myKing.position, targetHex) : 999;
    const isStartingZone = playerId === 'p1' ? targetHex.r >= 4 : targetHex.r <= -4;
    const isAdjacentToKing = distToKing === 1;

    if (!isInsideBoard(targetHex)) throw new Error("Não pode invocar fora do tabuleiro!");
    if (!newState.sandboxMode && !isStartingZone && !isAdjacentToKing) throw new Error("Posicionamento inválido! Deve ser adjacente ao Rei ou na zona inicial.");

    const collision = Object.values(newState.boardUnits).find(u =>
      u.position.q === targetHex.q && u.position.r === targetHex.r && u.position.s === targetHex.s
    );
    if (collision) throw new Error("Hexágono já ocupado.");

    const newUnitId = `u_${Math.random().toString(36).substr(2, 5)}_${unitCard.unitClass.toLowerCase()}`;
    newState.boardUnits[newUnitId] = {
      id: newUnitId, playerId, cardId, unitClass: unitCard.unitClass,
      hp: unitCard.baseHp, maxHp: unitCard.baseHp, attack: unitCard.baseAttack,
      position: targetHex, buffs: [], roundsInField: 0,
      summoningSickness: true, canMove: false, canAttack: false, equippedArtifacts: []
    };
  }
  // ── Feitiço ──
  else if (card.type === 'Spell') {
    const validCoords = getValidSpawnCoordinates(state, playerId, cardId);
    const isValidTarget = validCoords.some(c => c.q === targetHex.q && c.r === targetHex.r);
    
    if (!isValidTarget) {
      throw new Error("Alvo inválido para este feitiço.");
    }

    const handler = SPELL_REGISTRY[card.id];
    if (!handler) throw new Error(`Feitiço desconhecido: ${card.id}`);
    handler.execute(newState, playerId, targetHex);

    // Cleanup de mortes após feitiço
    for (const uId in newState.boardUnits) {
      if (newState.boardUnits[uId].hp <= 0) {
        if (newState.boardUnits[uId].unitClass === 'Rei' && !newState.sandboxMode) {
          newState.currentPhase = 'GAME_OVER';
          newState.winner = playerId;
        }
        delete newState.boardUnits[uId];
      }
    }
  }
  // ── Artefato ──
  else if (card.type === 'Artifact') {
    const targetUnit = Object.values(newState.boardUnits).find(u =>
      u.position.q === targetHex.q && u.position.r === targetHex.r && u.position.s === targetHex.s
    );
    if (!targetUnit) throw new Error("Selecione uma unidade para equipar.");
    if (!newState.sandboxMode && targetUnit.playerId !== playerId) throw new Error("Deve equipar em uma unidade aliada.");

    if (!targetUnit.equippedArtifacts) targetUnit.equippedArtifacts = [];
    targetUnit.equippedArtifacts.push(card.id);

    const handler = ARTIFACT_REGISTRY[card.id];
    if (handler) handler.onEquip(targetUnit);
  }

  // Pagar custo e remover da mão
  player.mana -= card.manaCost;
  const cardIndex = player.hand.indexOf(cardId);
  if (cardIndex !== -1) player.hand.splice(cardIndex, 1);

  return newState;
}

// ══════════════════════════════════════════════
//  Habilidades do Clérigo
// ══════════════════════════════════════════════

export function heal(state: GameState, healerId: string, targetId: string): GameState {
  const newState = cloneGameState(state);
  const healer = newState.boardUnits[healerId];
  const target = newState.boardUnits[targetId];

  if (!healer.canAttack) throw new Error("Esta unidade já agiu neste turno.");

  let healAmount = 2;
  if ((healer.equippedArtifacts || []).includes('art_tomo')) healAmount += 1;

  let rangeBonus = (healer.equippedArtifacts || []).includes('art_anel') ? 1 : 0;
  if (getHexDistance(healer.position, target.position) > 1 + rangeBonus) throw new Error("Alvo fora de alcance para curar.");

  target.hp = Math.min(target.maxHp, target.hp + healAmount);
  if (checkEffectTrigger(healer)) target.buffs.push({ type: 'shield', duration: 1 });

  healer.canAttack = false;
  return newState;
}

export function convert(state: GameState, healerId: string, targetId: string): GameState {
  const newState = cloneGameState(state);
  const healer = newState.boardUnits[healerId];
  const target = newState.boardUnits[targetId];

  if (!healer || !target) throw new Error("Unidades inválidas.");
  if (healer.unitClass !== 'Clerigo') throw new Error("Apenas Clérigos podem converter.");
  if (healer.playerId !== newState.currentTurnPlayerId) throw new Error("Não é seu turno.");
  if (healer.summoningSickness) throw new Error("A unidade ainda está com enjoo de invocação.");
  if (!healer.canAttack) throw new Error("Esta unidade já agiu.");
  if (target.playerId === healer.playerId) throw new Error("Não pode converter aliados.");
  if (target.unitClass === 'Rei') throw new Error("O Rei não pode ser convertido.");
  if ((target.equippedArtifacts || []).includes('art_corcel') && target.unitClass === 'Cavaleiro') throw new Error("Cavaleiro com Corcel é imune a conversão.");

  let rangeBonus = (healer.equippedArtifacts || []).includes('art_anel') ? 1 : 0;
  const dist = getHexDistance(healer.position, target.position);
  if (dist > 1 + rangeBonus) throw new Error("Conversão: Alvo deve estar no alcance.");

  const successChance = (1 + healer.roundsInField) / 100;
  if (Math.random() < successChance) {
    target.playerId = healer.playerId;
  }

  healer.canAttack = false;
  return newState;
}

// ══════════════════════════════════════════════
//  Oferenda
// ══════════════════════════════════════════════

export function offerCard(state: GameState, playerId: string, cardId: string): GameState {
  const newState = cloneGameState(state);
  const player = newState.players[playerId];

  if (playerId !== newState.currentTurnPlayerId) throw new Error("Não é seu turno.");
  if (!player.canOfferCard) throw new Error("Você já fez uma oferenda este turno.");
  if (!player.hand.includes(cardId)) throw new Error("Carta não está na mão.");

  player.hand = player.hand.filter(id => id !== cardId);
  player.maxMana += 1;
  player.canOfferCard = false;

  return newState;
}
// ══════════════════════════════════════════════
//  Utilitários de Aura (Medo)
// ══════════════════════════════════════════════

export function getFearStatus(unit: Unit, state: GameState): { inRange: boolean, chance: number } {
  const enemyKing = Object.values(state.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId !== unit.playerId);
  if (!enemyKing) return { inRange: false, chance: 0 };

  const fearRadius = (enemyKing.equippedArtifacts || []).includes('art_coroa') ? 2 : 1;
  const inRange = getHexDistance(unit.position, enemyKing.position) <= fearRadius;
  
  // Fórmula: 5% base + 1% por turno que o rei sobreviveu (roundsInField), teto de 30%
  const chance = Math.min(0.05 + (enemyKing.roundsInField * 0.01), 0.30);

  return { inRange, chance };
}
