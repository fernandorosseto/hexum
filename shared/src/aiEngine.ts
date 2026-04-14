import { GameState } from './types';
import { getHexDistance, getHexNeighbors, isLine, isDiagonal, isInsideBoard, type HexCoordinates } from './hexMath';
import { moveTo, attack, playCard, offerCard, heal, getValidSpawnCoordinates, getValidMoveCoordinates } from './gameEngine';
import { getValidAttackTargets } from './getValidAttackTargets';

export type AIAction = 
  | { type: 'MOVE', unitId: string, target: HexCoordinates }
  | { type: 'ATTACK', attackerId: string, targetId: string, special: boolean }
  | { type: 'PLAY_CARD', cardId: string, target: HexCoordinates }
  | { type: 'OFFER', cardId: string }
  | { type: 'HEAL', healerId: string, targetId: string };

// ══════════════════════════════════════════════
//  Infraestrutura Transposição (Cache)
// ══════════════════════════════════════════════

interface CacheEntry {
  depth: number;
  score: number;
  bestAction?: AIAction;
}

const TRANSPOSITION_TABLE = new Map<string, CacheEntry>();

function getGameStateHash(state: GameState): string {
    // Hash simplificado mas único o suficiente para o cache
    const units = Object.values(state.boardUnits).map(u => 
        `${u.id}:${u.position.q},${u.position.r}:${u.hp}:${u.canMove ? 1 : 0}:${u.canAttack ? 1 : 0}`
    ).sort().join('|');
    const players = Object.values(state.players).map(p => `${p.id}:${p.mana}:${p.hand.length}`).join('|');
    return `${units}#${players}#${state.currentTurnPlayerId}`;
}

/**
 * Avalia o quão favorável está o estado do jogo para um jogador específico.
 */
export function evaluateState(state: GameState, playerId: string): number {
  const opponentId = playerId === 'p1' ? 'p2' : 'p1';
  
  if (state.currentPhase === 'GAME_OVER') {
    return state.winner === playerId ? 100000 : -100000;
  }

  const myScore = calculateSideValue(state, playerId, opponentId);
  const oppScore = calculateSideValue(state, opponentId, playerId);

  return myScore - oppScore;
}

function calculateSideValue(state: GameState, playerId: string, opponentId: string): number {
  let value = 0;
  const player = state.players[playerId];
  const boardUnits = Object.values(state.boardUnits);
  const isElite = state.aiDifficulty === 'ELITE';
  
  const myUnits = boardUnits.filter(u => u.playerId === playerId);
  const oppUnits = boardUnits.filter(u => u.playerId === opponentId);
  
  const oppKing = oppUnits.find(u => u.unitClass === 'Rei');
  const myKing = myUnits.find(u => u.unitClass === 'Rei');

  // Precalcula Threat Map se for Elite
  const threatMap: Record<string, number> = {};
  if (isElite) {
    for (const opp of oppUnits) {
       const reach = (opp.unitClass === 'Arqueiro' || opp.unitClass === 'Mago') ? 3 : 1;
       // Simplificação: casas adjacentes ao oponente estão sob ameaça
       const rangeHexes = getHexesInRange(opp.position, reach);
       for (const h of rangeHexes) {
         const key = `${h.q},${h.r}`;
         threatMap[key] = (threatMap[key] || 0) + opp.attack;
       }
    }
  }

  // 1. Recursos (Mana e Mão)
  value += player.mana * 15;
  value += player.maxMana * 50; 
  value += player.hand.length * 25;

  // 2. Unidades no Tabuleiro
  for (const unit of myUnits) {
    let unitValue = 0;
    
    const classWeights: Record<string, number> = {
      'Rei': 25000,
      'Mago': 950,
      'Cavaleiro': 800,
      'Assassino': 850,
      'Clerigo': 750,
      'Arqueiro': 550,
      'Lanceiro': 450,
      'Estrutura': 300
    };
    
    const baseVal = classWeights[unit.unitClass] || 400;
    const hpPercent = unit.hp / unit.maxHp;
    unitValue += baseVal * (0.4 + 0.6 * hpPercent);

    // Controle de Mapa e Mobilidade
    const distToCenter = getHexDistance(unit.position, { q: 0, r: 0, s: 0 });
    unitValue += Math.max(0, (5 - distToCenter) * 20);

    // --- DEUS HEURÍSTICAS (MOBILIDADE) ---
    if (state.aiDifficulty === 'DEUS') {
        const moves = getValidMoveCoordinates(state, unit.id, false).length;
        unitValue += moves * 15; // Unidades móveis são valiosas
        
        // Domínio de Terreno: Proximidade ao Rei inimigo é mais valorizada
        if (oppKing) {
            const d = getHexDistance(unit.position, oppKing.position);
            if (d < 4) unitValue += (4 - d) * 40;
        }
    }

    // Pressão Offensiva
    if (oppKing) {
      const distToEnemyKing = getHexDistance(unit.position, oppKing.position);
      unitValue += Math.max(0, (10 - distToEnemyKing) * 25);
      
      if (isElite || state.aiDifficulty === 'DEUS') {
          const range = (unit.unitClass === 'Arqueiro' || unit.unitClass === 'Mago') ? 3 : 1;
          if (unit.unitClass === 'Arqueiro' || unit.unitClass === 'Mago') {
             if (distToEnemyKing === range) unitValue += 200; 
             if (distToEnemyKing === 1) unitValue -= 150; 
          }
      }
    }

    // Segurança do Rei (Defesa)
    if (myKing && unit.unitClass !== 'Rei') {
      const distToMyKing = getHexDistance(unit.position, myKing.position);
      if (distToMyKing <= 2) unitValue += 120;
    }

    // --- HEURÍSTICAS EXCLUSIVAS ELITE/DEUS ---
    if (isElite || state.aiDifficulty === 'DEUS') {
      const nearbyAllies = myUnits.filter(u => u.id !== unit.id && getHexDistance(u.position, unit.position) === 1);
      unitValue += nearbyAllies.length * 45;

      const threatKey = `${unit.position.q},${unit.position.r}`;
      if (threatMap[threatKey]) {
        if (threatMap[threatKey] >= unit.hp) {
           unitValue -= baseVal * 0.9; 
        } else {
           unitValue -= threatMap[threatKey] * 12;
        }
      }

      if (unit.unitClass === 'Clerigo') {
        const woundedNear = myUnits.filter(u => u.hp < u.maxHp && getHexDistance(unit.position, u.position) <= 2);
        unitValue += woundedNear.length * 200;
      }
    }

    value += unitValue;
  }

  // 3. Ameaça ao Rei
  if (myKing) {
    for (const opp of oppUnits) {
       const dist = getHexDistance(opp.position, myKing.position);
       if (dist <= 4) value -= 300; 
       if (dist <= 2) value -= 800; // Perigo imediato
    }
    // Mobilidade do Rei diminuída? Ruim
    if (state.aiDifficulty === 'DEUS') {
        const freeSpots = getHexNeighbors(myKing.position).filter(h => isInsideBoard(h) && !Object.values(state.boardUnits).some(u => u.position.q === h.q && u.position.r === h.r)).length;
        if (freeSpots < 2) value -= 500; // Rei cercado
    }
  }

  return value;
}

function getHexesInRange(center: HexCoordinates, range: number): HexCoordinates[] {
  const result: HexCoordinates[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
       result.push({ q: center.q + q, r: center.r + r, s: center.s + (-q - r) });
    }
  }
  return result;
}

/**
 * Lista todas as ações possíveis que um jogador pode tomar no estado atual.
 * Nota: Para manter a performance, limitamos as opções de cartas e movimentos.
 */
export function getPossibleActions(state: GameState, playerId: string): AIAction[] {
  const actions: AIAction[] = [];
  const player = state.players[playerId];
  const boardUnits = Object.values(state.boardUnits);

  // 1. Ações de Unidades no Tabuleiro (Mover/Atacar/Curar)
  const myUnits = boardUnits.filter(u => u.playerId === playerId);

  for (const unit of myUnits) {
    if (unit.summoningSickness) continue;

    // --- MOVIMENTOS ---
    const isRooted = unit.buffs.some(b => b.type === 'rooted');
    if (unit.canMove && !isRooted) {
      const validMoves = getValidMoveCoordinates(state, unit.id, false);
      
      for (const move of validMoves) {
        if (unit.unitClass === 'Rei') {
           actions.push({ type: 'MOVE', unitId: unit.id, target: move });
           continue;
        }
        actions.push({ type: 'MOVE', unitId: unit.id, target: move });
      }
    }

    // --- ATAQUES ---
    if (unit.canAttack) {
      // Alvos normais
      const normalTargets = getValidAttackTargets(state, unit.id, false);
      for (const targetPos of normalTargets) {
        const target = boardUnits.find(u => u.position.q === targetPos.q && u.position.r === targetPos.r);
        if (target) {
          actions.push({ type: 'ATTACK', attackerId: unit.id, targetId: target.id, special: false });
        }
      }

      // Alvos especiais (se tiver mana AND sem cooldown AND sem raízes)
      if (player.mana >= 3 && unit.abilityCooldown === 0 && !isRooted && (unit.unitClass === 'Cavaleiro' || unit.unitClass === 'Assassino')) {
        const specialTargets = getValidAttackTargets(state, unit.id, true);
        for (const targetPos of specialTargets) {
          const target = boardUnits.find(u => u.position.q === targetPos.q && u.position.r === targetPos.r);
          if (target) {
            actions.push({ type: 'ATTACK', attackerId: unit.id, targetId: target.id, special: true });
          }
        }
      }
    }

    // --- CURA (Clérigo) ---
    if (unit.unitClass === 'Clerigo' && unit.canAttack) {
      const woundedAllies = myUnits.filter(u => u.hp < u.maxHp && getHexDistance(unit.position, u.position) <= 2);
      for (const target of woundedAllies) {
        actions.push({ type: 'HEAL', healerId: unit.id, targetId: target.id });
      }
    }
  }

  // 2. Jogar Cartas da Mão (Inteligência de Alvos)
  for (const cardId of player.hand) {
    if (cardId.startsWith('unit_')) {
      const unitClass = cardId.replace('unit_', '');
      const cost = player.mana; // Simplificação, pegamos o custo do cardLibrary se necessário
      
      const spawnCoords = getValidSpawnCoordinates(state, playerId, cardId);
      // Prioriza spawn perto do Rei inimigo ou protegendo o próprio Rei
      let filteredSpawn = spawnCoords;
      if (spawnCoords.length > 8) {
        filteredSpawn = spawnCoords.sort((a, b) => {
           const myKingPos = player.id === 'p1' ? {q:-2, r:4, s:-2} : {q:2, r:-4, s:2}; // fallback aproximado
           const distA = getHexDistance(a, myKingPos);
           const distB = getHexDistance(b, myKingPos);
           return distA - distB; // Mais perto do Rei (defensivo)
        }).slice(0, 8);
      }

      for (const hex of filteredSpawn) {
        actions.push({ type: 'PLAY_CARD', cardId, target: hex });
      }
    } 
    else if (cardId.startsWith('spl_')) {
      // Alvos Inteligentes para Feitiços
      const spellTargets = getValidSpawnCoordinates(state, playerId, cardId);
      
      // Se for feitiço de dano (Raio, Meteoro), foca em inimigos
      if (['spl_raio', 'spl_meteoro', 'spl_raizes'].includes(cardId)) {
        const enemyUnits = boardUnits.filter(u => u.playerId !== playerId);
        const bestTargets = spellTargets.filter(pos => enemyUnits.some(e => e.position.q === pos.q && e.position.r === pos.r));
        for (const target of bestTargets) actions.push({ type: 'PLAY_CARD', cardId, target });
      } 
      // Se for feitiço de suporte (Bênção, Aura), foca em aliados feridos ou importantes
      else if (['spl_aurarunica', 'spl_bencao', 'spl_furia', 'spl_passos'].includes(cardId)) {
        const allyUnits = boardUnits.filter(u => u.playerId === playerId);
        const targets = spellTargets.filter(pos => allyUnits.some(a => a.position.q === pos.q && a.position.r === pos.r));
        for (const target of targets) actions.push({ type: 'PLAY_CARD', cardId, target });
      }
      else {
        // Fallback para outros feitiços (como Muralha)
        const sample = spellTargets.sort(() => 0.5 - Math.random()).slice(0, 5);
        for (const target of sample) actions.push({ type: 'PLAY_CARD', cardId, target });
      }
    }
    else if (cardId.startsWith('art_')) {
      // Artefatos: sempre em aliados
      const artifactTargets = getValidSpawnCoordinates(state, playerId, cardId);
      for (const target of artifactTargets) {
        actions.push({ type: 'PLAY_CARD', cardId, target });
      }
    }
  }

  // 3. Oferenda (Se precisar de mana)
  if (player.canOfferCard && player.maxMana < 6) {
    if (player.hand.length > 3 || (player.mana === 0 && player.hand.length > 0)) {
      for (const cardId of player.hand) {
        actions.push({ type: 'OFFER', cardId });
      }
    }
  }

  return actions;
}

/**
 * Escolhe a melhor ação imediata baseada na heurística e previsão de resposta do oponente.
 */
export function getBestAction(state: GameState, playerId: string): AIAction | null {
  const possibleActions = getPossibleActions(state, playerId);
  if (possibleActions.length === 0) return null;

  // BEGINNER Mode: Pequena chance de erro proposital
  if (state.aiDifficulty === 'BEGINNER' && Math.random() < 0.2 && possibleActions.length > 2) {
      return possibleActions[Math.floor(Math.random() * possibleActions.length)];
  }

  // Se for ELITE ou GRANDMASTER, usamos busca mais profunda
  const opponentId = playerId === 'p1' ? 'p2' : 'p1';
  
  // Limpa Cache em estados críticos para não sobrecarregar memória
  if (TRANSPOSITION_TABLE.size > 50000) TRANSPOSITION_TABLE.clear();

  let maxTargetDepth = state.aiDifficulty === 'DEUS' ? 4 : (state.aiDifficulty === 'GRANDMASTER' ? 3 : 2);
  let bestAction: AIAction | null = null;
  let bestScore = -Infinity;

  // Ordena ações (Ataques primeiro)
  const sortedActions = [...possibleActions].sort((a, b) => {
    const scoreA = a.type === 'ATTACK' ? 10 : (a.type === 'PLAY_CARD' ? 5 : 0);
    const scoreB = b.type === 'ATTACK' ? 10 : (b.type === 'PLAY_CARD' ? 5 : 0);
    return scoreB - scoreA;
  });

  // Iterative Deepening para modo DEUS
  for (let d = 1; d <= maxTargetDepth; d++) {
      let currentBestAction: AIAction | null = null;
      let currentBestScore = -Infinity;

      for (const action of sortedActions) {
        try {
          const stateAfterAction = simulateAction(state, playerId, action);
          if (!stateAfterAction) continue;

          const score = minimax(stateAfterAction, d - 1, -Infinity, Infinity, false, playerId, opponentId);

          if (score > currentBestScore) {
            currentBestScore = score;
            currentBestAction = action;
          }
        } catch (e) { continue; }
      }
      
      if (currentBestAction) {
          bestAction = currentBestAction;
          bestScore = currentBestScore;
          // Se encontrou vitória imediata, encerra busca
          if (bestScore > 50000) break;
      }
  }

  return bestAction;
}

/**
 * Algoritmo Minimax com Poda Alfa-Beta e Tabela de Transposição
 */
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayerId: string,
  opponentId: string
): number {
  // Verificação de Tabela de Transposição
  const hash = getGameStateHash(state);
  const cached = TRANSPOSITION_TABLE.get(hash);
  if (cached && cached.depth >= depth) {
      return cached.score;
  }

  if (depth === 0 || state.currentPhase === 'GAME_OVER') {
    // Se for DEUS, usa busca de quietude ao final do depth
    if (state.aiDifficulty === 'DEUS' && depth === 0 && state.currentPhase !== 'GAME_OVER') {
        return quiescenceSearch(state, alpha, beta, aiPlayerId, opponentId, isMaximizing);
    }
    return evaluateState(state, aiPlayerId);
  }

  const currentPlayerId = isMaximizing ? aiPlayerId : opponentId;
  const actions = getPossibleActions(state, currentPlayerId);

  if (actions.length === 0) return evaluateState(state, aiPlayerId);

  const sortedActions = actions.slice(0, 35).sort((a, b) => {
      const typeWeight = (t: string) => (t === 'ATTACK' ? 5 : (t === 'PLAY_CARD' ? 2 : 0));
      return typeWeight(b.type) - typeWeight(a.type);
  });

  let evalScore: number;
  if (isMaximizing) {
    evalScore = -Infinity;
    for (const action of sortedActions) {
      const nextState = simulateAction(state, aiPlayerId, action);
      if (!nextState) continue;
      evalScore = Math.max(evalScore, minimax(nextState, depth - 1, alpha, beta, false, aiPlayerId, opponentId));
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
  } else {
    evalScore = Infinity;
    for (const action of sortedActions) {
      const nextState = simulateAction(state, opponentId, action);
      if (!nextState) continue;
      evalScore = Math.min(evalScore, minimax(nextState, depth - 1, alpha, beta, true, aiPlayerId, opponentId));
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
  }

  // Grava na Tabela de Transposição
  TRANSPOSITION_TABLE.set(hash, { depth, score: evalScore });
  return evalScore;
}

/**
 * Busca de Quietude (Evita efeito horizonte em ataques)
 */
function quiescenceSearch(
    state: GameState, 
    alpha: number, 
    beta: number, 
    aiPlayerId: string, 
    opponentId: string,
    isMaximizing: boolean
): number {
    const standPat = evaluateState(state, aiPlayerId);
    
    if (isMaximizing) {
        if (standPat >= beta) return beta;
        if (standPat > alpha) alpha = standPat;
        
        const attacks = getPossibleActions(state, aiPlayerId).filter(a => a.type === 'ATTACK');
        for (const action of attacks) {
            const nextState = simulateAction(state, aiPlayerId, action);
            if (!nextState) continue;
            const score = quiescenceSearch(nextState, alpha, beta, aiPlayerId, opponentId, false);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return alpha;
    } else {
        if (standPat <= alpha) return alpha;
        if (standPat < beta) beta = standPat;
        
        const attacks = getPossibleActions(state, opponentId).filter(a => a.type === 'ATTACK');
        for (const action of attacks) {
            const nextState = simulateAction(state, opponentId, action);
            if (!nextState) continue;
            const score = quiescenceSearch(nextState, alpha, beta, aiPlayerId, opponentId, true);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
        }
        return beta;
    }
}

/**
 * Utilitário interno para simular uma ação e retornar o novo estado.
 */
function simulateAction(state: GameState, playerId: string, action: AIAction): GameState | null {
  try {
    if (action.type === 'MOVE') {
      return moveTo(state, action.unitId, action.target);
    } else if (action.type === 'ATTACK') {
      return attack(state, action.attackerId, action.targetId, action.special);
    } else if (action.type === 'PLAY_CARD') {
      return playCard(state, playerId, action.cardId, action.target);
    } else if (action.type === 'OFFER') {
      return offerCard(state, playerId, action.cardId);
    } else if (action.type === 'HEAL') {
      return heal(state, action.healerId, action.targetId);
    }
  } catch (e) {
    return null;
  }
  return null;
}
