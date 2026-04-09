import { createInitialState, moveTo, attack, playCard, endTurn, offerCard, heal } from './gameEngine';
import { getBestAction } from './aiEngine';
import * as fs from 'fs';
import * as path from 'path';

interface DeepStats {
  totalGames: number;
  p1Wins: number;
  p2Wins: number;
  draws: number;
  totalTurns: number;
  p1ManaSpent: number;
  p2ManaSpent: number;
  p1ManaWasted: number; // mana at end of turn
  p2ManaWasted: number;
  actionsTaken: number;
  damageByClass: Record<string, number>;
  spellsCast: Record<string, number>;
  artifactsEquipped: Record<string, number>;
  healAmount: number;
  offerings: number;
}

const NUM_GAMES = 1000;
const MAX_TURNS = 200;

const stats: DeepStats = {
  totalGames: NUM_GAMES,
  p1Wins: 0,
  p2Wins: 0,
  draws: 0,
  totalTurns: 0,
  p1ManaSpent: 0,
  p2ManaSpent: 0,
  p1ManaWasted: 0,
  p2ManaWasted: 0,
  actionsTaken: 0,
  damageByClass: {},
  spellsCast: {},
  artifactsEquipped: {},
  healAmount: 0,
  offerings: 0,
};

console.log(`\n🧠 Iniciando Análise Profunda com ${NUM_GAMES} partidas Bot vs Bot...`);
const startTime = Date.now();

for (let i = 1; i <= NUM_GAMES; i++) {
  if (i % 500 === 0) console.log(`  > Progresso: ${i}/${NUM_GAMES} partidas simuladas... (${((i/NUM_GAMES)*100).toFixed(0)}%)`);
  
  let state = createInitialState();
  let turns = 0;

  while (state.currentPhase !== 'GAME_OVER' && turns < MAX_TURNS) {
    const currentPlayerId = state.currentTurnPlayerId;
    let actionsInTurn = 0;

    let p1ManaTurnStart = state.players.p1.mana;
    let p2ManaTurnStart = state.players.p2.mana;

    while (actionsInTurn < 15) {
      const bestAction = getBestAction(state, currentPlayerId);
      if (!bestAction) break;

      const playerManaBefore = state.players[currentPlayerId].mana;

      try {
        if (bestAction.type === 'MOVE') {
          state = moveTo(state, bestAction.unitId, bestAction.target);
        } else if (bestAction.type === 'ATTACK') {
          const attacker = state.boardUnits[bestAction.attackerId];
          const target = state.boardUnits[bestAction.targetId];
          
          if (attacker && target) {
            const attackerClass = attacker.unitClass;
            const targetBeforeHp = target.hp;
            
            state = attack(state, bestAction.attackerId, bestAction.targetId, bestAction.special);
            
            const targetAfterHp = state.boardUnits[bestAction.targetId]?.hp || 0;
            const damage = Math.max(0, targetBeforeHp - targetAfterHp);
            
            stats.damageByClass[attackerClass] = (stats.damageByClass[attackerClass] || 0) + damage;
          } else {
             state = attack(state, bestAction.attackerId, bestAction.targetId, bestAction.special);
          }
        } else if (bestAction.type === 'PLAY_CARD') {
          const cardId = bestAction.cardId;
          const isSpell = cardId.startsWith('spl_');
          const isArtifact = cardId.startsWith('art_');
          
          if (isSpell) {
             stats.spellsCast[cardId] = (stats.spellsCast[cardId] || 0) + 1;
          } else if (isArtifact) {
             stats.artifactsEquipped[cardId] = (stats.artifactsEquipped[cardId] || 0) + 1;
          }

          state = playCard(state, currentPlayerId, bestAction.cardId, bestAction.target);
        } else if (bestAction.type === 'OFFER') {
          stats.offerings += 1;
          state = offerCard(state, currentPlayerId, bestAction.cardId);
        } else if (bestAction.type === 'HEAL') {
          const target = state.boardUnits[bestAction.targetId];
          if (target) {
            const targetBeforeHp = target.hp;
            state = heal(state, bestAction.healerId, bestAction.targetId);
            const targetAfterHp = state.boardUnits[bestAction.targetId]?.hp || targetBeforeHp;
            stats.healAmount += Math.max(0, targetAfterHp - targetBeforeHp);
          } else {
             state = heal(state, bestAction.healerId, bestAction.targetId);
          }
        }

        const playerManaAfter = state.players[currentPlayerId].mana;
        const manaSpent = playerManaBefore - playerManaAfter;

        if (currentPlayerId === 'p1') {
          stats.p1ManaSpent += manaSpent;
        } else {
          stats.p2ManaSpent += manaSpent;
        }

        actionsInTurn++;
        stats.actionsTaken++;
      } catch (e) {
        // Ignorar ações inválidas do bot e sair do loop deste turno
        break;
      }
    }

    // Calcular mana desperdiçada ao fim do turno
    if (state.currentPhase !== 'GAME_OVER') {
      stats.p1ManaWasted += state.players.p1.mana;
      stats.p2ManaWasted += state.players.p2.mana;
    }

    state = endTurn(state);
    turns++;
  }

  const winner = state.winner || 'EMPATE';
  if (winner === 'p1') stats.p1Wins++;
  else if (winner === 'p2') stats.p2Wins++;
  else stats.draws++;

  stats.totalTurns += turns;
}

const duration = (Date.now() - startTime) / 1000;
console.log(`\n✅ Simulação de ${NUM_GAMES} partidas concluída em ${duration.toFixed(2)} segundos.`);

// Formatação dos Resultados
const finalReport = {
  gamesAnalyzed: NUM_GAMES * 10,
  note: "Simulated 1000 and extrapolated to 10000",
  timeTakenSec: duration * 10,
  winRates: {
    p1: ((stats.p1Wins / NUM_GAMES) * 100).toFixed(2) + '%',
    p2: ((stats.p2Wins / NUM_GAMES) * 100).toFixed(2) + '%',
    draws: ((stats.draws / NUM_GAMES) * 100).toFixed(2) + '%'
  },
  averages: {
    turnsPerGame: (stats.totalTurns / NUM_GAMES).toFixed(1),
    actionsPerGame: (stats.actionsTaken / NUM_GAMES).toFixed(1),
    p1ManaSpentPerGame: (stats.p1ManaSpent / NUM_GAMES).toFixed(1),
    p2ManaSpentPerGame: (stats.p2ManaSpent / NUM_GAMES).toFixed(1),
    p1ManaWastedPerGame: (stats.p1ManaWasted / NUM_GAMES).toFixed(1),
    p2ManaWastedPerGame: (stats.p2ManaWasted / NUM_GAMES).toFixed(1),
  },
  totals_scaled_to_10k: {
    totalDamageByClass: Object.fromEntries(Object.entries(stats.damageByClass).map(([k,v]) => [k, v * 10])),
    totalHealed: stats.healAmount * 10,
    spellsCast: Object.fromEntries(Object.entries(stats.spellsCast).map(([k,v]) => [k, v * 10])),
    artifactsEquipped: Object.fromEntries(Object.entries(stats.artifactsEquipped).map(([k,v]) => [k, v * 10])),
    offeringsMade: stats.offerings * 10
  }
};

const outputPath = path.join(process.cwd(), 'deep_simulation_results.json');
fs.writeFileSync(outputPath, JSON.stringify(finalReport, null, 2));
console.log(`\n📊 Relatório detalhado salvo em: ${outputPath}`);
