import { GameState, Unit } from './types';
import { getHexDistance, getHexNeighbors, isInsideBoard, type HexCoordinates } from './hexMath';
import { moveTo, attack, playCard, offerCard, heal, getValidSpawnCoordinates, getValidMoveCoordinates } from './gameEngine';
import { getValidAttackTargets } from './getValidAttackTargets';

export type AIAction = 
  | { type: 'MOVE', unitId: string, target: HexCoordinates }
  | { type: 'ATTACK', attackerId: string, targetId: string, special: boolean }
  | { type: 'PLAY_CARD', cardId: string, target: HexCoordinates }
  | { type: 'OFFER', cardId: string }
  | { type: 'HEAL', healerId: string, targetId: string };

// ══════════════════════════════════════════════
//  Infraestrutura Zobrist
// ══════════════════════════════════════════════

const ZOBRIST_RANDOM: bigint[] = [];
const ZOBRIST_TURN_P2: bigint = BigInt(Math.floor(Math.random() * 0xFFFFFFFF));

function initZobrist() {
    if (ZOBRIST_RANDOM.length > 0) return;
    for (let i = 0; i < 2000; i++) {
        const val = BigInt(Math.floor(Math.random() * 0xFFFFFFFF)) << 32n | BigInt(Math.floor(Math.random() * 0xFFFFFFFF));
        ZOBRIST_RANDOM.push(val);
    }
}
initZobrist();

function getUnitStateIndex(unit: Unit): number {
    const classMap: Record<string, number> = { 'Rei': 0, 'Cavaleiro': 1, 'Lanceiro': 2, 'Arqueiro': 3, 'Assassino': 4, 'Mago': 5, 'Clerigo': 6, 'Estrutura': 7 };
    const classId = classMap[unit.unitClass] ?? 0;
    const playerId = unit.playerId === 'p1' ? 0 : 1;
    const posId = (unit.position.q + 5) * 11 + (unit.position.r + 5);
    return (posId * 16) + (playerId * 8) + classId;
}

function getGameStateHash(state: GameState): bigint {
    let hash = 0n;
    for (const unit of Object.values(state.boardUnits)) {
        hash ^= ZOBRIST_RANDOM[getUnitStateIndex(unit)];
    }
    if (state.currentTurnPlayerId === 'p2') hash ^= ZOBRIST_TURN_P2;
    return hash;
}

// ══════════════════════════════════════════════
//  Transposição e Heurísticas
// ══════════════════════════════════════════════

interface CacheEntry {
  depth: number;
  score: number;
  flag: 'EXACT' | 'UPPER' | 'LOWER';
}

const TRANSPOSITION_TABLE = new Map<bigint, CacheEntry>();

export function evaluateState(state: GameState, playerId: string): number {
  const opponentId = playerId === 'p1' ? 'p2' : 'p1';
  if (state.currentPhase === 'GAME_OVER') return state.winner === playerId ? 500000 : -500000;

  let score = calculateSideValue(state, playerId, opponentId) - calculateSideValue(state, opponentId, playerId);
  score += calculateInfluenceBonus(state, playerId, opponentId);
  return score;
}

function calculateInfluenceBonus(state: GameState, pId: string, oppId: string): number {
    let bonus = 0;
    const boardUnits = Object.values(state.boardUnits);
    const oppKing = boardUnits.find(u => u.playerId === oppId && u.unitClass === 'Rei');
    const myUnits = boardUnits.filter(u => u.playerId === pId);
    
    for (const unit of myUnits) {
        const neighbors = getHexNeighbors(unit.position);
        for (const n of neighbors) {
            if (!isInsideBoard(n)) continue;
            if (oppKing && getHexDistance(n, oppKing.position) === 1) bonus += 200;
            const row = n.r;
            const progress = pId === 'p1' ? (5 - row) : (5 + row);
            bonus += progress * 20;
        }
    }
    return bonus;
}

function calculateSideValue(state: GameState, playerId: string, opponentId: string): number {
  let value = 0;
  const player = state.players[playerId];
  const boardUnits = Object.values(state.boardUnits);
  const myUnits = boardUnits.filter(u => u.playerId === playerId);
  const oppUnits = boardUnits.filter(u => u.playerId === opponentId);
  const oppKing = oppUnits.find(u => u.unitClass === 'Rei');
  const myKing = myUnits.find(u => u.unitClass === 'Rei');
  const isDeus = state.aiDifficulty === 'DEUS';

  // 1. Economia Ágil: Penalizamos mana sobrando para incentivar o uso total.
  // Gasto total de mana é a estratégia vitoriosa.
  value -= player.mana * 20; 
  value += player.maxMana * 100 + player.hand.length * 10;

  // 2. Unidades e Táticas Berserker
  const classWeights: Record<string, number> = { 
    'Rei': 500000, 'Mago': 1500, 'Cavaleiro': 1300, 'Assassino': 1400, 'Clerigo': 1100, 'Arqueiro': 1000, 'Lanceiro': 800, 'Estrutura': 400 
  };
// ... rest of side value remains same ...


  for (const unit of myUnits) {
    const baseVal = classWeights[unit.unitClass] || 600;
    const hpFactor = unit.hp / unit.maxHp;
    value += baseVal * (0.3 + 0.7 * hpFactor);

    if (isDeus && oppKing) {
        const dKing = getHexDistance(unit.position, oppKing.position);
        if (unit.unitClass === 'Arqueiro' || unit.unitClass === 'Mago') {
            if (dKing === 3) value += 1500;
        } else {
            value += (10 - dKing) * 200;
            if (dKing === 1) value += 10000;
        }
    }
  }

  if (myKing) {
    const threats = oppUnits.filter(u => getHexDistance(u.position, myKing.position) < 3);
    value -= threats.length * 2000;
  }
  return value;
}

// ══════════════════════════════════════════════
//  Motor SOBERANO (Negamax + QS + NMP + Spells)
// ══════════════════════════════════════════════

export function getBestAction(state: GameState, playerId: string): AIAction | null {
  const startActions = getPossibleActions(state, playerId);
  if (startActions.length === 0) return null;

  const sorted = [...startActions].sort((a, b) => scoreAction(state, b) - scoreAction(state, a));
  let depthLimit = state.aiDifficulty === 'DEUS' ? 7 : (state.aiDifficulty === 'GRANDMASTER' ? 3 : 1);
  const oppId = playerId === 'p1' ? 'p2' : 'p1';

  let bestAction: AIAction | null = sorted[0];
  let bestScore = -Infinity;

  if (TRANSPOSITION_TABLE.size > 200000) TRANSPOSITION_TABLE.clear();

  for (let d = 1; d <= depthLimit; d++) {
      let currentBest: AIAction | null = null;
      let currentScore = -Infinity;

      for (const action of sorted) {
          const next = simulateAction(state, playerId, action);
          if (!next) continue;
          
          const score = -negamax(next, d - 1, -Infinity, Infinity, oppId);
          if (score > currentScore) {
              currentScore = score;
              currentBest = action;
          }
      }
      if (currentBest) {
          bestAction = currentBest;
          bestScore = currentScore;
          if (bestScore > 400000) break;
      }
  }
  return bestAction;
}

function negamax(state: GameState, depth: number, alpha: number, beta: number, pId: string): number {
    const hash = getGameStateHash(state);
    const cached = TRANSPOSITION_TABLE.get(hash);
    if (cached && cached.depth >= depth) {
        if (cached.flag === 'EXACT') return cached.score;
        if (cached.flag === 'LOWER') alpha = Math.max(alpha, cached.score);
        if (cached.flag === 'UPPER') beta = Math.min(beta, cached.score);
        if (alpha >= beta) return cached.score;
    }

    if (depth === 0 || state.currentPhase === 'GAME_OVER') {
        return quiesce(state, alpha, beta, pId);
    }

    if (depth >= 3 && state.currentPhase !== 'GAME_OVER') {
        const next = { ...state, currentTurnPlayerId: pId === 'p1' ? 'p2' : 'p1' };
        const score = -negamax(next, depth - 3, -beta, -beta + 1, pId === 'p1' ? 'p2' : 'p1');
        if (score >= beta) return beta;
    }

    const actions = getPossibleActions(state, pId);
    if (actions.length === 0) return evaluateState(state, pId);

    // DEUS explora mais possibilidades (80) que o normal (40)
    const breadth = state.aiDifficulty === 'DEUS' ? 80 : 40;
    const sorted = actions.sort((a, b) => scoreAction(state, b) - scoreAction(state, a)).slice(0, breadth);
    let best = -Infinity;

    const oppId = pId === 'p1' ? 'p2' : 'p1';

    for (let i = 0; i < sorted.length; i++) {
        const next = simulateAction(state, pId, sorted[i]);
        if (!next) continue;

        let score: number;
        if (i === 0) {
            score = -negamax(next, depth - 1, -beta, -alpha, oppId);
        } else {
            score = -negamax(next, depth - 1, -alpha - 1, -alpha, oppId);
            if (score > alpha && score < beta) {
                score = -negamax(next, depth - 1, -beta, -alpha, oppId);
            }
        }
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
        if (alpha >= beta) break;
    }

    let flag: 'EXACT' | 'LOWER' | 'UPPER' = 'EXACT';
    if (best <= alpha) flag = 'UPPER';
    else if (best >= beta) flag = 'LOWER';
    TRANSPOSITION_TABLE.set(hash, { depth, score: best, flag });

    return best;
}

function quiesce(state: GameState, alpha: number, beta: number, pId: string, qDepth: number = 0): number {
    const standPat = evaluateState(state, pId);
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
    if (qDepth > 2) return standPat;

    const boardUnits = Object.values(state.boardUnits);
    const myUnits = boardUnits.filter(u => u.playerId === pId);
    const attacks: AIAction[] = [];

    for (const unit of myUnits) {
        if (!unit.canAttack) continue;
        const targets = getValidAttackTargets(state, unit.id, false);
        for (const tPos of targets) {
            const t = boardUnits.find(u => u.position.q === tPos.q && u.position.r === tPos.r);
            if (t) attacks.push({ type: 'ATTACK', attackerId: unit.id, targetId: t.id, special: false });
        }
    }

    const sorted = attacks.sort((a, b) => scoreAction(state, b) - scoreAction(state, a));
    const oppId = pId === 'p1' ? 'p2' : 'p1';

    for (const action of sorted) {
        const next = simulateAction(state, pId, action);
        if (!next) continue;
        const score = -quiesce(next, -beta, -alpha, oppId, qDepth + 1);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }
    return alpha;
}

export function getPossibleActions(state: GameState, playerId: string): AIAction[] {
  const actions: AIAction[] = [];
  const player = state.players[playerId];
  const boardUnits = Object.values(state.boardUnits);
  const myUnits = boardUnits.filter(u => u.playerId === playerId);
  const oppUnits = boardUnits.filter(u => u.playerId !== playerId);

  for (const unit of myUnits) {
    if (unit.summoningSickness) continue;
    if (unit.canAttack) {
      const targets = getValidAttackTargets(state, unit.id, false);
      for (const tPos of targets) {
        const t = boardUnits.find(u => u.position.q === tPos.q && u.position.r === tPos.r);
        if (t) actions.push({ type: 'ATTACK', attackerId: unit.id, targetId: t.id, special: false });
      }
      if (player.mana >= 3 && unit.abilityCooldown === 0 && (unit.unitClass === 'Cavaleiro' || unit.unitClass === 'Assassino')) {
        const sTargets = getValidAttackTargets(state, unit.id, true);
        for (const stPos of sTargets) {
          const st = boardUnits.find(u => u.position.q === stPos.q && u.position.r === stPos.r);
          if (st) actions.push({ type: 'ATTACK', attackerId: unit.id, targetId: st.id, special: true });
        }
      }
    }
    if (unit.canMove && !unit.buffs.some(b => b.type === 'rooted')) {
      const moves = getValidMoveCoordinates(state, unit.id, false);
      for (const m of moves) actions.push({ type: 'MOVE', unitId: unit.id, target: m });
    }
  }

  for (const cardId of player.hand) {
    const cost = cardId.includes('spl_meteoro') ? 4 : (cardId.includes('unit_') ? 3 : 2);
    if (player.mana < cost) continue;

    if (cardId.startsWith('unit_')) {
      const spawnPoints = getValidSpawnCoordinates(state, playerId, cardId);
      for (const p of spawnPoints.slice(0, 8)) actions.push({ type: 'PLAY_CARD', cardId, target: p });
    } else if (cardId.startsWith('spl_')) {
      const harmful = ['spl_raio', 'spl_transfusao', 'spl_meteoro', 'spl_raizes'];
      const helpful = ['spl_aurarunica', 'spl_nevoa', 'spl_passos', 'spl_bencao', 'spl_furia'];
      if (harmful.includes(cardId)) {
        for (const u of oppUnits) actions.push({ type: 'PLAY_CARD', cardId, target: u.position });
      } else if (helpful.includes(cardId)) {
        for (const u of myUnits) actions.push({ type: 'PLAY_CARD', cardId, target: u.position });
      } else {
        actions.push({ type: 'PLAY_CARD', cardId, target: { q: 0, r: 0, s: 0 } });
      }
    } else if (cardId.startsWith('art_')) {
      for (const u of myUnits) if (u.unitClass !== 'Estrutura') actions.push({ type: 'PLAY_CARD', cardId, target: u.position });
    }
  }

  if (player.canOfferCard && player.hand.length > 0) {
      actions.push({ type: 'OFFER', cardId: player.hand[0] });
  }
  return actions;
}

function simulateAction(state: GameState, pId: string, action: AIAction): GameState | null {
  try {
    if (action.type === 'MOVE') return moveTo(state, action.unitId, action.target);
    if (action.type === 'ATTACK') return attack(state, action.attackerId, action.targetId, action.special);
    if (action.type === 'PLAY_CARD') return playCard(state, pId, action.cardId, action.target);
    if (action.type === 'OFFER') return offerCard(state, pId, action.cardId);
    if (action.type === 'HEAL') return heal(state, action.healerId, action.targetId);
  } catch { return null; }
  return null;
}

function scoreAction(state: GameState, action: AIAction): number {
    if (action.type === 'ATTACK') {
        const target = state.boardUnits[action.targetId];
        if (target?.unitClass === 'Rei') return 20000;
        return 5000 + (target?.attack || 0) * 100;
    }
    if (action.type === 'PLAY_CARD') {
        if (action.cardId.startsWith('spl_meteoro')) return 8000;
        if (action.cardId.startsWith('spl_raio')) return 7000;
        return 4000;
    }
    return 100;
}
