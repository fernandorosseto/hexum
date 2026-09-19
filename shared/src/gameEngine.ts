import type { GameState, Unit, Card, UnitCard } from './types';
import { getHexDistance, getHexNeighbors, isInsideBoard, BOARD_RADIUS } from './hexMath';
import type { HexCoordinates } from './hexMath';
import { ARTIFACTS, SPELLS, getUnitCard, tryGetUnitCard } from './cardLibrary';
import { UNIT_BEHAVIORS, checkEffectTrigger, handleUnitDeath, addCombatLog } from './unitBehaviors';
import { SPELL_REGISTRY } from './spellHandlers';
import { ARTIFACT_REGISTRY } from './artifactHandlers';
import { getValidAttackTargets } from './getValidAttackTargets';

// ══════════════════════════════════════════════
//  Utilitários
// ══════════════════════════════════════════════

let idCounter = 0;

/** Id curto e sem colisão: contador monotônico + ruído aleatório. */
function makeId(prefix: string, suffix = ''): string {
  idCounter += 1;
  const noise = Math.random().toString(36).slice(2, 7);
  return suffix ? `${prefix}_${idCounter}${noise}_${suffix}` : `${prefix}_${idCounter}${noise}`;
}

/** Embaralhamento uniforme (Fisher-Yates). `Array.sort(() => 0.5 - random)` é enviesado. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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
  const range = BOARD_RADIUS;

  if (cardId.startsWith('unit_') || cardId.startsWith('hero_')) {
    if (state.sandboxMode) return getAllEmptyHexes(boardUnits, range);
    
    const valid: HexCoordinates[] = [];
    for (let q = -range; q <= range; q++) {
      for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
        const hex = { q, r, s: -q - r };
        if (boardUnits.some(u => u.position.q === hex.q && u.position.r === hex.r)) continue;
        const isAdjacentToKing = myKing ? getHexDistance(myKing.position, hex) === 1 : false;
        if (isAdjacentToKing) valid.push(hex);
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
      return boardUnits.filter(u => u.playerId !== playerId).map(u => u.position);
    }

    // Transfusão Sombria (Adjacente ao Rei, qualquer lado)
    if (cardId === 'spl_transfusao') {
      if (state.sandboxMode) return boardUnits.map(u => u.position);
      const myKing = boardUnits.find(u => u.unitClass === 'Rei' && u.playerId === playerId);
      if (!myKing) return [];
      const neighbors = getHexNeighbors(myKing.position);
      return boardUnits.filter(u => 
        neighbors.some(n => n.q === u.position.q && n.r === u.position.r)
      ).map(u => u.position);
    }

    if (cardId === 'spl_meteoro') {
      if (state.sandboxMode) return getAllHexes(Math.max(range, 4));
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
    matchId: makeId('m'),
    turnNumber: 1,
    currentPhase: 'MAIN_PHASE',
    currentTurnPlayerId: p1Id,
    players: {
      [p1Id]: createInitialPlayer(p1Id),
      [p2Id]: createInitialPlayer(p2Id)
    },
    boardUnits: {}
  };

  addInitialUnit(state, p1Id, 'hero_balduino', { q: -2, r: 3, s: -1 });
  addInitialUnit(state, p1Id, 'hero_elcid', { q: -2, r: 2, s: 0 });
  addInitialUnit(state, p1Id, 'hero_elcid', { q: -1, r: 2, s: -1 });

  addInitialUnit(state, p2Id, 'hero_leonidas', { q: 2, r: -3, s: 1 });
  addInitialUnit(state, p2Id, 'hero_landsknecht', { q: 2, r: -2, s: 0 });
  addInitialUnit(state, p2Id, 'hero_landsknecht', { q: 1, r: -2, s: 1 });

  drawInitialHand(state, p1Id);
  drawInitialHand(state, p2Id);

  return state;
}

function createInitialPlayer(id: string) {
  const deck: string[] = [];
  const heroes = [
    'hero_elcid', 'hero_elcid', 'hero_landsknecht', 'hero_landsknecht', // 4 Lanceiros
    'hero_joana', 'hero_marshall', // 2 Cavaleiros
    'hero_robin', 'hero_nasu', 'hero_robin', // 3 Arqueiros
    'hero_richelieu', // 1 Clerigo
    'hero_bacon', // 1 Alquimista
    'hero_hassan' // 1 Assassino
  ];
  heroes.forEach(h => deck.push(h));

  shuffle(ARTIFACTS).slice(0, 4).forEach(a => deck.push(a.id));
  shuffle(SPELLS).slice(0, 4).forEach(s => deck.push(s.id));

  return {
    id, mana: 1, maxMana: 1, canOfferCard: true,
    hand: [] as string[], deck: shuffle(deck), graveyard: [] as string[]
  };
}

function addInitialUnit(state: GameState, playerId: string, heroId: string, pos: HexCoordinates) {
  const card = getUnitCard(heroId);
  const id = makeId('u', card.unitClass.toLowerCase());
  state.boardUnits[id] = {
    id, playerId, cardId: heroId, unitClass: card.unitClass,
    hp: card.baseHp, maxHp: card.baseHp, attack: card.baseAttack, position: pos,
    buffs: [], roundsInField: 0, summoningSickness: false, canMove: true, canAttack: true, 
    abilityCooldown: 0, equippedArtifacts: []
  };
}

// ══════════════════════════════════════════════
//  Compra de Cartas
// ══════════════════════════════════════════════

/**
 * Compra uma carta. Devolve `false` quando o baralho está vazio — quem precisa
 * comprar e não consegue perde a partida (ver `endTurn`).
 */
export function drawCard(state: GameState, playerId: string): boolean {
  const player = state.players[playerId];
  const cardId = player.deck.pop();
  if (!cardId) return false;
  player.hand.push(cardId);
  return true;
}

function drawInitialHand(state: GameState, playerId: string) {
  const player = state.players[playerId];
  let attempts = 0;
  while (attempts < 50) {
    const tempDeck = shuffle(player.deck);
    const tempHand = tempDeck.splice(0, 3);
    const unitCount = tempHand.filter(id => id.startsWith('hero_') || id.startsWith('unit_')).length;
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
    // `language` precisa ser copiado: os reducers leem state.language para escolher
    // o idioma dos logs e das mensagens de erro depois do clone.
    language: state.language,
    sandboxMode: state.sandboxMode,
    winner: state.winner,
    winReason: state.winReason,
    players: newPlayers,
    boardUnits: newBoard,
    combatLogs: state.combatLogs ? [...state.combatLogs] : [],
    lastActionVfx: state.lastActionVfx ? { ...state.lastActionVfx } : undefined,
  };
}

// ══════════════════════════════════════════════
//  Fim de Turno
// ══════════════════════════════════════════════

export function endTurn(state: GameState): GameState {
  // Já parado aguardando descarte: reentrar aplicaria os DoTs de novo.
  if (state.currentPhase === 'END_PHASE') return cloneGameState(state);

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
        // Reverte bônus de Fúria ao expirar
        if (buff.type === 'fury' && buff.duration <= 1) {
          unit.attack -= (buff.value || 2);
        }
        buff.duration -= 1;
        return buff.duration > 0;
      });

      // Diminuir cooldown de habilidades
      if (unit.abilityCooldown > 0) {
        unit.abilityCooldown -= 1;
      }

      if ((unit.equippedArtifacts || []).includes('art_tomo')) {
        unit.buffs = unit.buffs.filter(b => b.type !== 'poison' && b.type !== 'burn' && b.type !== 'stun' && b.type !== 'bleed');
      }

      if (unit.hp <= 0) {
        if (unit.unitClass === 'Rei' && !newState.sandboxMode) {
          newState.currentPhase = 'GAME_OVER';
          newState.winner = endingPlayerId === 'p1' ? 'p2' : 'p1';
          newState.winReason = 'king';
        }
        delete newState.boardUnits[unitId];
      }
    }
  }

  // Se o jogo acabou pelo veneno no rei, não continuamos configurando o próximo jogador
  if (newState.currentPhase === 'GAME_OVER') {
     return newState;
  }

  // 2. Limite de mão: quem termina o turno acima do limite precisa descartar
  // ANTES de a vez passar. O turno fica parado em END_PHASE até `discardCard`
  // resolver — é uma decisão do jogador, não um descarte automático.
  if (!newState.sandboxMode && newState.players[endingPlayerId].hand.length > HAND_LIMIT) {
    newState.currentPhase = 'END_PHASE';
    return newState;
  }

  return advanceToNextPlayer(newState);
}

/**
 * Descarta uma carta durante a END_PHASE. Quando a mão chega ao limite, a vez
 * passa de fato para o próximo jogador.
 */
export function discardCard(state: GameState, playerId: string, cardId: string): GameState {
  const newState = cloneGameState(state);

  if (newState.currentPhase !== 'END_PHASE') throw new Error("Nothing to discard right now.");
  if (playerId !== newState.currentTurnPlayerId) {
    throw new Error(newState.language === 'pt' ? "Não é o seu turno." : "Not your turn.");
  }

  const player = newState.players[playerId];
  const index = player.hand.indexOf(cardId);
  if (index === -1) throw new Error("Card not in hand.");

  player.hand.splice(index, 1);
  player.graveyard.push(cardId);

  // Ainda acima do limite: continua em END_PHASE aguardando o próximo descarte.
  if (player.hand.length > HAND_LIMIT) return newState;

  newState.currentPhase = 'MAIN_PHASE';
  return advanceToNextPlayer(newState);
}

/** Quantas cartas ainda precisam ser descartadas para o turno poder passar. */
export function getPendingDiscards(state: GameState, playerId: string): number {
  if (state.currentPhase !== 'END_PHASE') return 0;
  if (state.currentTurnPlayerId !== playerId) return 0;
  const player = state.players[playerId];
  if (!player) return 0;
  return Math.max(0, player.hand.length - HAND_LIMIT);
}

/** Passa a vez: mana, compra, reset de fadiga das tropas do próximo jogador. */
function advanceToNextPlayer(newState: GameState): GameState {
  newState.turnNumber += 1;
  const endingPlayerId = newState.currentTurnPlayerId;
  const nextPlayerId = endingPlayerId === 'p1' ? 'p2' : 'p1';
  newState.currentTurnPlayerId = nextPlayerId;
  const nextPlayer = newState.players[nextPlayerId];

  nextPlayer.maxMana = Math.min((nextPlayer.maxMana || 1) + 1, 6);
  nextPlayer.mana = nextPlayer.maxMana;
  nextPlayer.canOfferCard = true;

  // Derrota por baralho vazio: quem precisa comprar e não tem carta perde.
  // No Sandbox a regra não vale, para não interromper testes.
  const drew = drawCard(newState, nextPlayerId);
  if (!drew && !newState.sandboxMode) {
    newState.currentPhase = 'GAME_OVER';
    newState.winner = nextPlayerId === 'p1' ? 'p2' : 'p1';
    newState.winReason = 'deckout';
    addCombatLog(
      newState,
      `📜 ${nextPlayerId === 'p1' ? 'Blue' : 'Purple'} has no cards left to draw and was defeated.`,
      `📜 ${nextPlayerId === 'p1' ? 'Azul' : 'Roxo'} ficou sem cartas para comprar e foi derrotado.`,
    );
    return newState;
  }

  // Zera estados de invocação / fadiga das tropas inimigas
  for (const unitId in newState.boardUnits) {
    const unit = newState.boardUnits[unitId];
    if (unit.playerId === nextPlayerId) {
      unit.roundsInField += 1;
      unit.summoningSickness = false;
      
      const isStunned = unit.buffs.some(b => b.type === 'stun');
      const isRooted = unit.buffs.some(b => b.type === 'rooted');

      unit.canMove = !isStunned && !isRooted;
      unit.canAttack = !isStunned;
    }
  }

  return cleanupDeaths(newState);
}

// ══════════════════════════════════════════════
//  Movimento
// ══════════════════════════════════════════════

export function moveTo(state: GameState, unitId: string, targetPosition: HexCoordinates, useSpecial: boolean = false): GameState {
  const newState = cloneGameState(state);
  const unit = newState.boardUnits[unitId];

  if (!unit || unit.playerId !== newState.currentTurnPlayerId) throw new Error("Invalid unit or not your turn.");
  if (unit.summoningSickness) throw new Error(newState.language === 'en' ? "Unit has summoning sickness." : "Unidade está com enjoo de invocação.");
  if (!unit.canMove) throw new Error("This unit already moved this turn.");
  if (!isInsideBoard(targetPosition)) throw new Error("Destination out of board bounds!");

  if (useSpecial) {
    if (unit.abilityCooldown > 0) throw new Error("Ability on cooldown.");
    if (unit.buffs.some(b => b.type === 'rooted')) throw new Error("Rooted unit: Cannot use impact abilities.");
    
    const cost = unit.unitClass === 'Cavaleiro' ? 3 : (unit.unitClass === 'Assassino' ? 3 : 0);
    const player = newState.players[unit.playerId];
    if (player.mana < cost) throw new Error("Not enough mana for special ability.");
    player.mana -= cost;
    unit.abilityCooldown = 2; // Inicia cooldown (pulará o próximo turno do dono)
  }

  if (unit.buffs.some(b => b.type === 'stun')) throw new Error("Unit is stunned!");
  if (unit.buffs.some(b => b.type === 'rooted')) throw new Error("Unit is rooted!");

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
  if (collision) throw new Error(newState.language === 'en' ? "Hexagon occupied!" : "Hexágono ocupado!");

  unit.position = targetPosition;
  unit.canMove = false;
  return newState;
}

export function getValidMoveCoordinates(state: GameState, unitId: string, useSpecial: boolean = false): HexCoordinates[] {
  const unit = state.boardUnits[unitId];
  if (!unit) return [];

  // Checa restrições globais
  if (!state.sandboxMode) {
    if (unit.summoningSickness || !unit.canMove) return [];
  }

  const isStunned = unit.buffs.some(b => b.type === 'stun');
  const isRooted = unit.buffs.some(b => b.type === 'rooted');

  if (isStunned || isRooted) return [];
  if (useSpecial && unit.abilityCooldown > 0) return [];

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

/** Alcance em que uma unidade com Provocar força o inimigo a atacá-la. */
export const TAUNT_RADIUS = 2;

/** Lista os inimigos com Provocar que obrigam `unit` a mudar de alvo. */
export function getTauntingEnemies(state: GameState, unit: Unit): Unit[] {
  return Object.values(state.boardUnits).filter(u =>
    u.playerId !== unit.playerId &&
    u.buffs.some(b => b.type === 'taunt') &&
    getHexDistance(unit.position, u.position) <= TAUNT_RADIUS
  );
}

function assertTauntRespected(state: GameState, attacker: Unit, target: Unit): void {
  const taunting = getTauntingEnemies(state, attacker);
  if (taunting.length === 0) return;
  if (taunting.some(u => u.id === target.id)) return;
  throw new Error(state.language === 'pt'
    ? 'Provocar: você deve atacar a unidade que está provocando.'
    : 'Taunt: you must attack the taunting unit.');
}

export function attack(state: GameState, attackerId: string, targetId: string, useSpecial: boolean = false): GameState {
  const newState = cloneGameState(state);
  const attacker = newState.boardUnits[attackerId];
  const target = newState.boardUnits[targetId];

  if (!attacker || !target) throw new Error("Invalid attack action.");
  if (attacker.playerId !== newState.currentTurnPlayerId) throw new Error("Not your turn.");
  if (attacker.summoningSickness) throw new Error(newState.language === 'en' ? "Unit has summoning sickness." : "Unidade está com enjoo de invocação.");
  if (!attacker.canAttack) throw new Error("This unit already attacked.");

  if (useSpecial) {
    if (attacker.abilityCooldown > 0) throw new Error("Ability on cooldown.");
    if (attacker.buffs.some(b => b.type === 'rooted')) throw new Error("Rooted unit: Cannot use impact abilities.");

    const cost = attacker.unitClass === 'Cavaleiro' ? 3 : (attacker.unitClass === 'Assassino' ? 3 : 0);
    const player = newState.players[attacker.playerId];
    if (player.mana < cost) throw new Error("Not enough mana for special ability.");
    player.mana -= cost;
    attacker.abilityCooldown = 2;
  }

  if (attacker.buffs.some(b => b.type === 'stun')) throw new Error("Unit is stunned!");

  const dist = getHexDistance(attacker.position, target.position);

  if (target.buffs.some(b => b.type === 'immune_ranged') && dist > 1) {
    throw new Error(newState.language === 'en' ? "Target immune to ranged attacks (Fog)." : "Alvo imune a ataques à distância (Névoa).");
  }

  // Bônus de Alcance (Artefatos)
  let rangeBonus = 0;
  if ((attacker.equippedArtifacts || []).includes('art_arco')) rangeBonus += 1;
  if ((attacker.equippedArtifacts || []).includes('art_anel') && (attacker.unitClass === 'Alquimista' || attacker.unitClass === 'Clerigo')) rangeBonus += 1;

  // Provocar: se houver inimigo com Taunt ao alcance da regra, ele é alvo obrigatório.
  // Precisa viver aqui (e não só no helper de UI), senão IA e PvP ignoram o efeito.
  assertTauntRespected(newState, attacker, target);

  // Delega validação à behavior da classe
  const behavior = UNIT_BEHAVIORS[attacker.unitClass];
  behavior.validateAttack(attacker, target, dist, rangeBonus, useSpecial, newState);

  // Prepara o array de logs detalhados (limpa o que veio do turno anterior)
  newState.combatLogs = [];

  // Aura de Medo do Rei (compartilhado). O raio vem de getFearStatus — com a
  // Coroa do Regente ele é 2, e antes esta checagem fixava dist === 1.
  const fearInfo = getFearStatus(attacker, newState);
  if (fearInfo.inRange) {
    if (Math.random() < fearInfo.chance) {
      const fearMsg = newState.language === 'pt'
        ? `😱 ${attacker.unitClass} sucumbiu ao Medo do Rei inimigo e hesitou em atacar!`
        : `😱 ${attacker.unitClass} succumbed to the enemy King's Fear and hesitated to attack!`;
      newState.combatLogs.push(fearMsg);
      attacker.canAttack = false;
      return newState;
    }
  }

  // Delega dano e efeitos à behavior da classe
  behavior.applyDamage(attacker, target, newState, dist, useSpecial, rangeBonus);

  if (newState.boardUnits[attackerId]) {
    newState.boardUnits[attackerId].canAttack = false;
  }
  return cleanupDeaths(newState);
}

// ══════════════════════════════════════════════
//  Jogar Carta (Unidade, Feitiço, Artefato)
// ══════════════════════════════════════════════

/** Quantos artefatos diferentes uma mesma unidade pode carregar. */
export const MAX_ARTIFACTS_PER_UNIT = 3;

/** Tamanho máximo da mão ao encerrar o turno; o excedente é descartado. */
export const HAND_LIMIT = 5;

export function playCard(state: GameState, playerId: string, cardId: string, targetHex: HexCoordinates): GameState {
  const newState = cloneGameState(state);
  const player = newState.players[playerId];

  if (!player) throw new Error("Unknown player.");
  // Sandbox permite montar o tabuleiro dos dois lados; a partida real, não.
  if (!newState.sandboxMode && playerId !== newState.currentTurnPlayerId) {
    throw new Error(newState.language === 'pt' ? "Não é o seu turno." : "Not your turn.");
  }
  if (!player.hand.includes(cardId)) throw new Error("Card not in hand.");

  let card: Card | UnitCard | undefined;
  if (cardId.startsWith('unit_') || cardId.startsWith('hero_')) {
    card = getUnitCard(cardId);
  } else {
    card = ARTIFACTS.find(a => a.id === cardId) || SPELLS.find(s => s.id === cardId);
  }
  if (!card) throw new Error("Invalid card.");
  if (player.mana < card.manaCost) throw new Error(newState.language === 'pt' ? "Mana insuficiente." : "Not enough mana.");

  // ── Unidade ──
  if (card.type === 'Unit') {
    const unitCard = card as UnitCard;
    const myKing = Object.values(newState.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId === playerId);
    const distToKing = myKing ? getHexDistance(myKing.position, targetHex) : 999;
    const isAdjacentToKing = distToKing === 1;

    if (!isInsideBoard(targetHex)) throw new Error("Cannot summon outside the board!");
    if (!newState.sandboxMode && !isAdjacentToKing) throw new Error("Invalid placement! Units must be summoned on an adjacent hex to your King.");

    const collision = Object.values(newState.boardUnits).find(u =>
      u.position.q === targetHex.q && u.position.r === targetHex.r && u.position.s === targetHex.s
    );
    if (collision) throw new Error("Hexagon already occupied.");

    const newUnitId = `u_${Math.random().toString(36).substr(2, 5)}_${unitCard.unitClass.toLowerCase()}`;
    newState.boardUnits[newUnitId] = {
      id: newUnitId, playerId, cardId, unitClass: unitCard.unitClass,
      hp: unitCard.baseHp, maxHp: unitCard.baseHp, attack: unitCard.baseAttack,
      position: targetHex, buffs: [], roundsInField: 0,
      summoningSickness: true, canMove: false, canAttack: false, 
      abilityCooldown: 0, equippedArtifacts: []
    };
  }
  // ── Feitiço ──
  else if (card.type === 'Spell') {
    const validCoords = getValidSpawnCoordinates(state, playerId, cardId);
    const isValidTarget = validCoords.some(c => c.q === targetHex.q && c.r === targetHex.r);
    
    if (!isValidTarget) {
      throw new Error("Invalid target for this spell.");
    }

    const handler = SPELL_REGISTRY[card.id];
    if (!handler) throw new Error(`Unknown spell: ${card.id}`);
    handler.execute(newState, playerId, targetHex);

    // Cleanup de mortes após feitiço. Usa handleUnitDeath para que o vencedor seja
    // sempre o adversário do Rei que caiu — inclusive quando o feitiço mata o
    // próprio Rei do conjurador (fogo amigo de Meteoro/Relâmpago).
    cleanupDeaths(newState);
  }
  // ── Artefato ──
  else if (card.type === 'Artifact') {
    const targetUnit = Object.values(newState.boardUnits).find(u =>
      u.position.q === targetHex.q && u.position.r === targetHex.r && u.position.s === targetHex.s
    );
    if (!targetUnit) throw new Error("Select a unit to equip.");
    if (!newState.sandboxMode && targetUnit.playerId !== playerId) throw new Error("Must equip on an allied unit.");
    if ((targetUnit.equippedArtifacts || []).includes(card.id)) {
      throw new Error(newState.language === 'pt'
        ? "Esta unidade já está equipada com este artefato."
        : "This unit already carries this artifact.");
    }
    if ((targetUnit.equippedArtifacts || []).length >= MAX_ARTIFACTS_PER_UNIT) {
      throw new Error(newState.language === 'pt'
        ? `Limite de ${MAX_ARTIFACTS_PER_UNIT} artefatos por unidade atingido.`
        : `Limit of ${MAX_ARTIFACTS_PER_UNIT} artifacts per unit reached.`);
    }

    if (!targetUnit.equippedArtifacts) targetUnit.equippedArtifacts = [];
    targetUnit.equippedArtifacts.push(card.id);

    const handler = ARTIFACT_REGISTRY[card.id];
    if (handler) handler.onEquip(targetUnit);
  }

  // Pagar custo e remover da mão
  player.mana -= card.manaCost;
  const cardIndex = player.hand.indexOf(cardId);
  if (cardIndex !== -1) player.hand.splice(cardIndex, 1);

  return cleanupDeaths(newState);
}

// ══════════════════════════════════════════════
//  Habilidades do Clérigo
// ══════════════════════════════════════════════

export function heal(state: GameState, healerId: string, targetId: string): GameState {
  const newState = cloneGameState(state);
  const healer = newState.boardUnits[healerId];
  const target = newState.boardUnits[targetId];

  if (!healer || !target) throw new Error("Invalid units.");
  if (healer.unitClass !== 'Clerigo') throw new Error("Only Clerics can heal.");
  if (healer.id === target.id) throw new Error("The Cleric cannot heal itself.");
  if (!newState.sandboxMode) {
    if (healer.playerId !== newState.currentTurnPlayerId) {
      throw new Error(newState.language === 'pt' ? "Não é o seu turno." : "Not your turn.");
    }
    if (healer.summoningSickness) {
      throw new Error(newState.language === 'pt' ? "Unidade está com enjoo de invocação." : "Unit has summoning sickness.");
    }
  }
  if (target.playerId !== healer.playerId) throw new Error("You can only heal allied units.");
  if (!healer.canAttack) throw new Error("This unit already acted this turn.");
  if (healer.buffs.some(b => b.type === 'stun')) throw new Error("Unit is stunned!");

  let healAmount = 2;
  if ((healer.equippedArtifacts || []).includes('art_tomo')) healAmount += 1;

  const rangeBonus = (healer.equippedArtifacts || []).includes('art_anel') ? 1 : 0;
  if (getHexDistance(healer.position, target.position) > 1 + rangeBonus) throw new Error("Target out of range to heal.");

  target.hp = Math.min(target.maxHp, target.hp + healAmount);
  if (checkEffectTrigger(healer)) target.buffs.push({ type: 'shield', duration: 1 });

  healer.canAttack = false;
  return newState;
}

export function convert(state: GameState, healerId: string, targetId: string): GameState {
  const newState = cloneGameState(state);
  const healer = newState.boardUnits[healerId];
  const target = newState.boardUnits[targetId];

  if (!healer || !target) throw new Error("Invalid units.");
  if (healer.unitClass !== 'Clerigo') throw new Error("Only Clerics can convert.");
  if (healer.playerId !== newState.currentTurnPlayerId) throw new Error("Not your turn.");
  if (healer.summoningSickness) throw new Error("Unit has summoning sickness.");
  if (!healer.canAttack) throw new Error("This unit already acted.");
  if (target.playerId === healer.playerId) throw new Error("Cannot convert allies.");
  if (target.unitClass === 'Rei') throw new Error("The King cannot be converted.");
  if ((target.equippedArtifacts || []).includes('art_corcel') && target.unitClass === 'Cavaleiro') throw new Error("Knight with Steed is immune to conversion.");

  const rangeBonus = (healer.equippedArtifacts || []).includes('art_anel') ? 1 : 0;
  const dist = getHexDistance(healer.position, target.position);
  if (dist > 1 + rangeBonus) throw new Error(newState.language === 'en' ? "Conversion: Target must be in range." : "Conversão: Alvo deve estar ao alcance.");

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

  if (playerId !== newState.currentTurnPlayerId) throw new Error("Not your turn.");
  if (!player.canOfferCard) throw new Error("You already made an offering this turn.");
  if (!player.hand.includes(cardId)) throw new Error("Card not in hand.");

  player.hand = player.hand.filter(id => id !== cardId);
  player.maxMana = Math.min(player.maxMana + 1, 6);
  player.canOfferCard = false;

  return newState;
}
// ══════════════════════════════════════════════
//  Utilitários de Aura (Medo)
// ══════════════════════════════════════════════

export function getFearStatus(unit: Unit, state: GameState): { inRange: boolean, chance: number, radius: number } {
  const enemyKing = Object.values(state.boardUnits).find(u => u.unitClass === 'Rei' && u.playerId !== unit.playerId);
  if (!enemyKing) return { inRange: false, chance: 0, radius: 0 };

  // Coroa do Regente dobra o raio da aura (1 -> 2).
  const radius = (enemyKing.equippedArtifacts || []).includes('art_coroa') ? 2 : 1;
  const inRange = getHexDistance(unit.position, enemyKing.position) <= radius;

  // Fórmula: 5% base + 1% por turno que o rei sobreviveu (roundsInField), teto de 30%
  const chance = Math.min(0.05 + (enemyKing.roundsInField * 0.01), 0.30);
  return { inRange, chance, radius };
}

// ══════════════════════════════════════════════
//  Verificador de Ações Válidas (Auto-Pass)
// ══════════════════════════════════════════════

export function hasAnyValidAction(state: GameState, playerId: string): boolean {
  if (state.sandboxMode || state.currentPhase !== 'MAIN_PHASE') return true;
  const player = state.players[playerId];
  if (!player) return false;

  // 1. Oferenda (sacrifício) NÃO é considerada aqui.
  // offerCard aumenta apenas maxMana — a mana utilizável só chega no próximo
  // turno —, então sacrificar nunca destrava uma jogada no turno corrente e não
  // deve impedir o auto-pass.

  // 2. O jogador pode jogar alguma carta da mão com a mana ATUAL?
  for (const cardId of player.hand) {
    const cardCost = getCardManaCost(cardId);
    if (player.mana >= cardCost) {
      const validSpawns = getValidSpawnCoordinates(state, playerId, cardId);
      if (validSpawns.length > 0) return true;
    }
  }

  // 3. Alguma unidade pode mover ou atacar?
  const myUnits = Object.values(state.boardUnits).filter(u => u.playerId === playerId);
  for (const unit of myUnits) {
    if (unit.canMove && !unit.summoningSickness) {
      const validMoves = getValidMoveCoordinates(state, unit.id, false);
      if (validMoves.length > 0) return true;
    }
    if (unit.canAttack && !unit.summoningSickness) {
      const validAttacks = getValidAttackTargets(state, unit.id, false);
      if (validAttacks.length > 0) return true;
      
      if (unit.unitClass === 'Clerigo') {
         // Prece de Esperança / Chamado da Fé: alcance 1 (+1 com Anel do Arquimago).
         const clericRange = 1 + ((unit.equippedArtifacts || []).includes('art_anel') ? 1 : 0);
         const friends = myUnits.filter(u => u.id !== unit.id && getHexDistance(unit.position, u.position) <= clericRange);
         if (friends.some(f => f.hp < f.maxHp)) return true;
         const enemies = Object.values(state.boardUnits).filter(u =>
           u.playerId !== playerId && u.unitClass !== 'Rei' && getHexDistance(unit.position, u.position) <= clericRange);
         if (enemies.length > 0) return true;
      }
    }
  }

  return false;
}

/** Custo de mana de qualquer carta; Infinity quando o id é desconhecido. */
export function getCardManaCost(cardId: string): number {
  const unit = tryGetUnitCard(cardId);
  if (unit) return unit.manaCost;
  const art = ARTIFACTS.find(a => a.id === cardId);
  if (art) return art.manaCost;
  const spl = SPELLS.find(sp => sp.id === cardId);
  if (spl) return spl.manaCost;
  return Number.POSITIVE_INFINITY;
}

export function cleanupDeaths(state: GameState): GameState {
  for (const unitId in state.boardUnits) {
    const unit = state.boardUnits[unitId];
    if (unit.hp <= 0) {
      handleUnitDeath(state, unit);
    }
  }
  return state;
}

