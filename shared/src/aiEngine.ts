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

/**
 * Avalia o quão favorável está o estado do jogo para um jogador específico.
 * Agora utiliza uma abordagem Zero-Sum (Vantagem Aliada - Vantagem Inimiga).
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
  
  const myUnits = boardUnits.filter(u => u.playerId === playerId);
  const oppUnits = boardUnits.filter(u => u.playerId === opponentId);
  
  const oppKing = oppUnits.find(u => u.unitClass === 'Rei');
  const myKing = myUnits.find(u => u.unitClass === 'Rei');

  // 1. Recursos (Mana e Mão)
  value += player.mana * 15;
  value += player.maxMana * 50; 
  value += player.hand.length * 25;

  // 2. Unidades no Tabuleiro
  for (const unit of myUnits) {
    let unitValue = 0;
    
    // Valor base por Classe (Pesos Estratégicos)
    const classWeights: Record<string, number> = {
      'Rei': 20000,
      'Mago': 800,
      'Cavaleiro': 700,
      'Assassino': 750,
      'Clerigo': 650,
      'Arqueiro': 500,
      'Lanceiro': 400,
      'Estrutura': 300
    };
    
    const baseVal = classWeights[unit.unitClass] || 400;
    // Valor escalado pelo HP (Unidades feridas valem menos, mas não linearmente para o Rei)
    const hpPercent = unit.hp / unit.maxHp;
    unitValue += baseVal * (0.4 + 0.6 * hpPercent);

    // Controle de Mapa (Bônus por proximidade ao centro 0,0,0)
    const distToCenter = getHexDistance(unit.position, { q: 0, r: 0, s: 0 });
    unitValue += Math.max(0, (5 - distToCenter) * 20);

    // Pressão Offensiva (Proximidade ao Rei Inimigo)
    if (oppKing) {
      const distToEnemyKing = getHexDistance(unit.position, oppKing.position);
      // Bônus agressivo: Unidades perto do Rei inimigo são valiosas
      unitValue += Math.max(0, (10 - distToEnemyKing) * 30);
      
      // Se puder atacar o Rei no próximo turno (distância <= alcance)
      const range = (unit.unitClass === 'Arqueiro' || unit.unitClass === 'Mago') ? 3 : 1;
      if (distToEnemyKing <= range + 1) unitValue += 200;
    }

    // Segurança do Rei (Defesa)
    if (myKing && unit.unitClass !== 'Rei') {
      const distToMyKing = getHexDistance(unit.position, myKing.position);
      // Unidades aliadas perto do rei agem como guarda-costas
      if (distToMyKing <= 2) unitValue += 100;
      
      // Penalidade se o Rei estiver cercado de inimigos
      const enemiesNearKing = oppUnits.filter(u => getHexDistance(u.position, myKing.position) <= 3);
      if (enemiesNearKing.length > 0 && distToMyKing <= 2) {
          unitValue += 150; // Valor extra para defensores quando sob ataque
      }
    }

    // Sinergia de Classes
    if (unit.unitClass === 'Clerigo') {
      const woundedNear = myUnits.filter(u => u.hp < u.maxHp && getHexDistance(unit.position, u.position) <= 2);
      unitValue += woundedNear.length * 100; // Clérigo é mais valioso perto de feridos
    }

    // Buffs e Equipamentos
    unitValue += unit.buffs.length * 40;
    if (unit.buffs.some(b => b.type === 'shield' || b.type === 'invulnerable')) unitValue += 150;
    if (unit.equippedArtifacts) unitValue += unit.equippedArtifacts.length * 200;

    value += unitValue;
  }

  // 3. Ameaça e Vulnerabilidade (Aproximação de Danger Zone)
  // Penaliza se unidades inimigas fortes puderem alcançar nosso rei
  if (myKing) {
    for (const opp of oppUnits) {
       const dist = getHexDistance(opp.position, myKing.position);
       if (dist <= 4) value -= 200; // Alerta de perigo
       if (dist <= 2) value -= 500; // Perigo crítico
    }
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
 * Implementa um Minimax simplificado de Profundidade 2.
 */
export function getBestAction(state: GameState, playerId: string): AIAction | null {
  const possibleActions = getPossibleActions(state, playerId);
  if (possibleActions.length === 0) return null;

  const opponentId = playerId === 'p1' ? 'p2' : 'p1';
  let bestAction: AIAction | null = null;
  let bestScore = -Infinity;

  // Para cada ação da IA...
  for (const action of possibleActions) {
    try {
      const stateAfterAi = simulateAction(state, playerId, action);
      if (!stateAfterAi) continue;

      // ...prever a melhor resposta do oponente (Minimax Depth 2)
      const oppActions = getPossibleActions(stateAfterAi, opponentId);
      let worstCaseOpponentScore = -Infinity;

      if (oppActions.length > 0) {
        // Para performance, ordenamos as ações do oponente por score imediato
        // e pegamos as 10 melhores para ver qual delas mais prejudica a IA
        const sortedOppActions = oppActions
          .map(a => ({ action: a, score: evaluateState(simulateAction(stateAfterAi, opponentId, a) || stateAfterAi, opponentId) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        for (const item of sortedOppActions) {
          const stateAfterOpp = simulateAction(stateAfterAi, opponentId, item.action);
          if (!stateAfterOpp) continue;
          
          if (item.score > worstCaseOpponentScore) {
            worstCaseOpponentScore = item.score;
          }
        }
      } else {
        worstCaseOpponentScore = evaluateState(stateAfterAi, opponentId);
      }

      // O score da IA é (Meu Valor - Pior Valor que o oponente pode me deixar)
      // Como evaluateState já é Zero-Sum (Aliado - Inimigo), podemos apenas usar a negativa
      // do melhor score do oponente.
      const aiScore = evaluateState(stateAfterAi, playerId) - worstCaseOpponentScore / 2; // Peso menor para a previsão futura

      if (aiScore > bestScore) {
        bestScore = aiScore;
        bestAction = action;
      }
    } catch (e) {
      continue;
    }
  }

  return bestAction;
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
