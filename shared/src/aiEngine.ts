import type { GameState } from './types';
import { getHexDistance, getHexNeighbors, isInsideBoard, BOARD_RADIUS, type HexCoordinates } from './hexMath';
import {
  moveTo, attack, playCard, offerCard, heal, endTurn,
  getValidSpawnCoordinates, getValidMoveCoordinates, getCardManaCost,
} from './gameEngine';
import { getValidAttackTargets } from './getValidAttackTargets';

export type AIAction =
  | { type: 'MOVE'; unitId: string; target: HexCoordinates }
  | { type: 'ATTACK'; attackerId: string; targetId: string; special: boolean }
  | { type: 'PLAY_CARD'; cardId: string; target: HexCoordinates }
  | { type: 'OFFER'; cardId: string }
  | { type: 'HEAL'; healerId: string; targetId: string }
  | { type: 'END_TURN' };

export interface SearchOptions {
  /** Profundidade máxima em PLIES DE AÇÃO (não de turno). */
  maxDepth?: number;
  /** Orçamento de tempo em ms. A busca devolve o melhor resultado já obtido. */
  timeBudgetMs?: number;
}

const WIN_SCORE = 500_000;
const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_TIME_BUDGET_MS = 1200;
const ROOT_BREADTH = 24;
const INNER_BREADTH = 12;

function otherPlayer(playerId: string): string {
  return playerId === 'p1' ? 'p2' : 'p1';
}

// ══════════════════════════════════════════════
//  Avaliação (SOMA-ZERO)
// ══════════════════════════════════════════════

/**
 * Nota do tabuleiro do ponto de vista de `playerId`.
 *
 * Precisa ser estritamente soma-zero — `evaluateState(s, a) === -evaluateState(s, b)` —
 * senão a poda alfa-beta compara notas de escalas diferentes e a busca perde o sentido.
 */
export function evaluateState(state: GameState, playerId: string): number {
  const opponentId = otherPlayer(playerId);
  if (state.currentPhase === 'GAME_OVER') {
    if (!state.winner) return 0;
    return state.winner === playerId ? WIN_SCORE : -WIN_SCORE;
  }
  return calculateSideValue(state, playerId, opponentId) - calculateSideValue(state, opponentId, playerId);
}

const CLASS_WEIGHTS: Record<string, number> = {
  Rei: 500_000, Alquimista: 1500, Assassino: 1400, Cavaleiro: 1300,
  Clerigo: 1100, Arqueiro: 1000, Lanceiro: 800, Estrutura: 400,
};

function calculateSideValue(state: GameState, playerId: string, opponentId: string): number {
  const player = state.players[playerId];
  const boardUnits = Object.values(state.boardUnits);
  const myUnits = boardUnits.filter(u => u.playerId === playerId);
  const oppUnits = boardUnits.filter(u => u.playerId === opponentId);
  const oppKing = oppUnits.find(u => u.unitClass === 'Rei');
  const myKing = myUnits.find(u => u.unitClass === 'Rei');

  let value = 0;

  // Economia: mana parada é recurso desperdiçado; mana máxima e cartas são potencial.
  if (player) {
    value -= player.mana * 100;
    value += player.maxMana * 100 + player.hand.length * 10;
  }

  for (const unit of myUnits) {
    const baseVal = CLASS_WEIGHTS[unit.unitClass] ?? 600;
    const hpFactor = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
    value += baseVal * (0.3 + 0.7 * hpFactor);

    if (oppKing) {
      const dKing = getHexDistance(unit.position, oppKing.position);
      if (unit.unitClass === 'Arqueiro' || unit.unitClass === 'Alquimista') {
        // Atiradores querem alcance máximo útil, não o corpo a corpo.
        if (dKing === 3) value += 1500;
      } else {
        value += (10 - dKing) * 200;
        if (dKing === 1) value += 10_000;
      }
    }
  }

  if (myKing) {
    const threats = oppUnits.filter(u => getHexDistance(u.position, myKing.position) < 3);
    value -= threats.length * 2000;
  }

  value += calculateInfluenceBonus(state, playerId, opponentId);
  return value;
}

function calculateInfluenceBonus(state: GameState, playerId: string, opponentId: string): number {
  const boardUnits = Object.values(state.boardUnits);
  const oppKing = boardUnits.find(u => u.playerId === opponentId && u.unitClass === 'Rei');
  let bonus = 0;

  for (const unit of boardUnits) {
    if (unit.playerId !== playerId) continue;
    for (const n of getHexNeighbors(unit.position)) {
      if (!isInsideBoard(n)) continue;
      if (oppKing && getHexDistance(n, oppKing.position) === 1) bonus += 200;
      // p1 avança para -r, p2 para +r. BOARD_RADIUS mantém a escala colada ao tabuleiro.
      const progress = playerId === 'p1' ? (BOARD_RADIUS - n.r) : (BOARD_RADIUS + n.r);
      bonus += progress * 20;
    }
  }
  return bonus;
}

// ══════════════════════════════════════════════
//  Geração de ações
// ══════════════════════════════════════════════

export function getPossibleActions(state: GameState, playerId: string): AIAction[] {
  const player = state.players[playerId];
  if (!player) return [];
  // Depois que playCard passou a validar o turno, nenhuma ação de quem não tem a
  // vez é legal — gerar essas ações só produziria ramos mortos na busca.
  if (!state.sandboxMode && state.currentTurnPlayerId !== playerId) return [];
  if (state.currentPhase === 'GAME_OVER') return [];

  const actions: AIAction[] = [];
  const boardUnits = Object.values(state.boardUnits);
  const myUnits = boardUnits.filter(u => u.playerId === playerId);
  const oppUnits = boardUnits.filter(u => u.playerId !== playerId);
  const oppKing = oppUnits.find(u => u.unitClass === 'Rei');

  const unitAt = (pos: HexCoordinates) =>
    boardUnits.find(u => u.position.q === pos.q && u.position.r === pos.r);

  for (const unit of myUnits) {
    if (unit.summoningSickness) continue;

    if (unit.canAttack) {
      for (const tPos of getValidAttackTargets(state, unit.id, false)) {
        const t = unitAt(tPos);
        if (t) actions.push({ type: 'ATTACK', attackerId: unit.id, targetId: t.id, special: false });
      }

      if (player.mana >= 3 && unit.abilityCooldown === 0 &&
          (unit.unitClass === 'Cavaleiro' || unit.unitClass === 'Assassino')) {
        for (const stPos of getValidAttackTargets(state, unit.id, true)) {
          const st = unitAt(stPos);
          if (st) actions.push({ type: 'ATTACK', attackerId: unit.id, targetId: st.id, special: true });
        }
      }

      // Prece de Esperança: o Clérigo tem ataque 0, curar é a jogada dele.
      if (unit.unitClass === 'Clerigo') {
        const range = 1 + ((unit.equippedArtifacts || []).includes('art_anel') ? 1 : 0);
        for (const ally of myUnits) {
          if (ally.id === unit.id || ally.hp >= ally.maxHp) continue;
          if (getHexDistance(unit.position, ally.position) <= range) {
            actions.push({ type: 'HEAL', healerId: unit.id, targetId: ally.id });
          }
        }
      }
    }

    if (unit.canMove && !unit.buffs.some(b => b.type === 'rooted')) {
      for (const m of getValidMoveCoordinates(state, unit.id, false)) {
        actions.push({ type: 'MOVE', unitId: unit.id, target: m });
      }
    }
  }

  for (const cardId of player.hand) {
    if (player.mana < getCardManaCost(cardId)) continue;

    if (cardId.startsWith('unit_') || cardId.startsWith('hero_')) {
      const spawnPoints = getValidSpawnCoordinates(state, playerId, cardId);
      if (oppKing) {
        spawnPoints.sort((a, b) => getHexDistance(a, oppKing.position) - getHexDistance(b, oppKing.position));
      }
      for (const p of spawnPoints.slice(0, 12)) actions.push({ type: 'PLAY_CARD', cardId, target: p });
    } else if (cardId.startsWith('spl_')) {
      const harmful = ['spl_raio', 'spl_transfusao', 'spl_meteoro', 'spl_raizes'];
      const helpful = ['spl_aurarunica', 'spl_nevoa', 'spl_passos', 'spl_bencao', 'spl_furia'];
      if (harmful.includes(cardId)) {
        for (const u of oppUnits) actions.push({ type: 'PLAY_CARD', cardId, target: u.position });
      } else if (helpful.includes(cardId)) {
        for (const u of myUnits) actions.push({ type: 'PLAY_CARD', cardId, target: u.position });
      } else {
        for (const p of getValidSpawnCoordinates(state, playerId, cardId).slice(0, 8)) {
          actions.push({ type: 'PLAY_CARD', cardId, target: p });
        }
      }
    } else if (cardId.startsWith('art_')) {
      for (const u of myUnits) {
        if (u.unitClass !== 'Estrutura' && !(u.equippedArtifacts || []).includes(cardId)) {
          actions.push({ type: 'PLAY_CARD', cardId, target: u.position });
        }
      }
    }
  }

  if (player.canOfferCard && player.hand.length > 0) {
    actions.push({ type: 'OFFER', cardId: player.hand[0] });
  }

  // Passar a vez é sempre legal — e é o que faz o turno trocar dentro da busca.
  actions.push({ type: 'END_TURN' });
  return actions;
}

export function simulateAction(state: GameState, playerId: string, action: AIAction): GameState | null {
  try {
    switch (action.type) {
      case 'MOVE':      return moveTo(state, action.unitId, action.target);
      case 'ATTACK':    return attack(state, action.attackerId, action.targetId, action.special);
      case 'PLAY_CARD': return playCard(state, playerId, action.cardId, action.target);
      case 'OFFER':     return offerCard(state, playerId, action.cardId);
      case 'HEAL':      return heal(state, action.healerId, action.targetId);
      case 'END_TURN':  return endTurn(state);
    }
  } catch {
    return null;
  }
  return null;
}

/** Ordenação barata para a poda alfa-beta ver primeiro as jogadas promissoras. */
function scoreAction(state: GameState, action: AIAction): number {
  switch (action.type) {
    case 'ATTACK': {
      const target = state.boardUnits[action.targetId];
      if (target?.unitClass === 'Rei') return 20_000;
      return 5000 + (target?.attack ?? 0) * 100;
    }
    case 'PLAY_CARD': {
      const cost = getCardManaCost(action.cardId);
      const finiteCost = Number.isFinite(cost) ? cost : 0;
      if (action.cardId.startsWith('unit_') || action.cardId.startsWith('hero_')) return 10_000 + finiteCost * 500;
      if (action.cardId === 'spl_meteoro') return 12_000;
      if (action.cardId === 'spl_raio') return 11_000;
      if (action.cardId.startsWith('art_')) return 9000;
      return 8000;
    }
    case 'HEAL':     return 4000;
    case 'MOVE':     return 1000;
    case 'OFFER':    return 200;
    case 'END_TURN': return 0;
  }
}

// ══════════════════════════════════════════════
//  Busca (alfa-beta com troca de lado explícita)
// ══════════════════════════════════════════════

interface CacheEntry {
  depth: number;
  score: number;
  flag: 'EXACT' | 'UPPER' | 'LOWER';
}

/**
 * Chave completa do estado. A versão anterior usava um Zobrist que só via
 * posição/dono/classe, então tabuleiros com HP, mana ou buffs diferentes
 * colidiam e a busca reaproveitava notas de outra posição.
 */
function stateKey(state: GameState): string {
  const units = Object.values(state.boardUnits)
    .map(u => [
      u.id, u.playerId, u.unitClass,
      `${u.position.q},${u.position.r}`,
      u.hp,
      `${u.canMove ? 1 : 0}${u.canAttack ? 1 : 0}${u.summoningSickness ? 1 : 0}`,
      u.abilityCooldown,
      u.buffs.map(b => `${b.type}${b.duration}${b.value ?? ''}`).sort().join('|'),
      (u.equippedArtifacts ?? []).slice().sort().join('|'),
    ].join(':'))
    .sort()
    .join(';');

  const players = Object.values(state.players)
    .map(p => `${p.id}:${p.mana}/${p.maxMana}:${p.canOfferCard ? 1 : 0}:${p.hand.slice().sort().join(',')}`)
    .sort()
    .join(';');

  return `${state.currentTurnPlayerId}|${state.currentPhase}|${state.winner ?? ''}|${units}|${players}`;
}

class SearchContext {
  readonly table = new Map<string, CacheEntry>();
  readonly deadline: number;
  aborted = false;

  constructor(timeBudgetMs: number) {
    this.deadline = Date.now() + timeBudgetMs;
  }

  outOfTime(): boolean {
    if (this.aborted) return true;
    if (Date.now() >= this.deadline) {
      this.aborted = true;
      return true;
    }
    return false;
  }
}

/**
 * Devolve a nota do ponto de vista de `state.currentTurnPlayerId`.
 *
 * Uma jogada NÃO troca necessariamente o lado a jogar: no Hexum um jogador
 * encadeia várias ações no mesmo turno e só END_TURN passa a vez. Por isso a
 * negação do negamax é condicional — negar sempre (como a versão anterior
 * fazia) inverte o sinal no meio do turno do próprio jogador.
 */
function search(state: GameState, depth: number, alpha: number, beta: number, ctx: SearchContext): number {
  const me = state.currentTurnPlayerId;

  if (state.currentPhase === 'GAME_OVER') return evaluateState(state, me);
  if (depth <= 0 || ctx.outOfTime()) return evaluateState(state, me);

  const key = stateKey(state);
  const cached = ctx.table.get(key);
  if (cached && cached.depth >= depth) {
    if (cached.flag === 'EXACT') return cached.score;
    if (cached.flag === 'LOWER' && cached.score >= beta) return cached.score;
    if (cached.flag === 'UPPER' && cached.score <= alpha) return cached.score;
  }

  const alphaOrig = alpha;
  const actions = getPossibleActions(state, me)
    .sort((a, b) => scoreAction(state, b) - scoreAction(state, a))
    .slice(0, INNER_BREADTH);

  if (actions.length === 0) return evaluateState(state, me);

  let best = -Infinity;
  for (const action of actions) {
    if (ctx.outOfTime()) break;
    const next = simulateAction(state, me, action);
    if (!next) continue;

    // A negação depende SÓ de quem passa a jogar. Um estado terminal mantém o
    // lado a mover, então negar nele inverteria o sinal da própria vitória.
    const score = next.currentTurnPlayerId === me
      ? search(next, depth - 1, alpha, beta, ctx)          // mesmo lado continua jogando
      : -search(next, depth - 1, -beta, -alpha, ctx);      // a vez passou: inverte

    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }

  if (best === -Infinity) return evaluateState(state, me);

  if (!ctx.aborted) {
    const flag: CacheEntry['flag'] =
      best <= alphaOrig ? 'UPPER' : best >= beta ? 'LOWER' : 'EXACT';
    ctx.table.set(key, { depth, score: best, flag });
  }
  return best;
}

/**
 * Melhor ação para `playerId`. Aprofundamento iterativo com orçamento de tempo:
 * se o tempo acabar, devolve a melhor jogada da última profundidade concluída.
 */
export function getBestAction(state: GameState, playerId: string, options: SearchOptions = {}): AIAction | null {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const ctx = new SearchContext(options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS);

  const rootActions = getPossibleActions(state, playerId)
    .sort((a, b) => scoreAction(state, b) - scoreAction(state, a))
    .slice(0, ROOT_BREADTH);

  const legal = rootActions
    .map(action => ({ action, next: simulateAction(state, playerId, action) }))
    .filter((entry): entry is { action: AIAction; next: GameState } => entry.next !== null);

  if (legal.length === 0) return null;

  let bestAction: AIAction = legal[0].action;

  for (let depth = 1; depth <= maxDepth; depth++) {
    let depthBest: AIAction | null = null;
    let depthScore = -Infinity;
    let alpha = -Infinity;

    for (const { action, next } of legal) {
      if (ctx.outOfTime()) break;
      const score = next.currentTurnPlayerId === playerId
        ? search(next, depth - 1, alpha, Infinity, ctx)
        : -search(next, depth - 1, -Infinity, -alpha, ctx);

      if (score > depthScore) {
        depthScore = score;
        depthBest = action;
        if (score > alpha) alpha = score;
      }
    }

    // Uma profundidade interrompida no meio não é confiável; mantém a anterior.
    if (depthBest && !ctx.aborted) {
      bestAction = depthBest;
      // Ordena a próxima iteração pela melhor jogada conhecida.
      legal.sort((a, b) => (a.action === depthBest ? -1 : b.action === depthBest ? 1 : 0));
      if (depthScore >= WIN_SCORE) break;
    }
    if (ctx.aborted) break;
  }

  return bestAction;
}
