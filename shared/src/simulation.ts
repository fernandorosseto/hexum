import { createInitialState, moveTo, attack, playCard, endTurn, offerCard, heal } from './gameEngine';
import { getBestAction } from './aiEngine';
import * as fs from 'fs';
import * as path from 'path';

interface GameMetrics {
  gameId: number;
  winner: string;
  totalTurns: number;
  manaSpent: { p1: number; p2: number };
  manaRemaining: { p1: number; p2: number };
  totalActions: number;
}

async function runSimulation(numGames: number = 1000) {
  const allResults: GameMetrics[] = [];
  const startTime = Date.now();

  console.log(`🏃 Iniciando maratona de ${numGames} partidas (Bot vs Bot)...`);

  for (let i = 1; i <= numGames; i++) {
    if (i % 100 === 0) console.log(`  > Progresso: ${i}/${numGames} partidas concluídas...`);
    
    let state = createInitialState();
    let turns = 0;
    let p1ManaSpent = 0;
    let p1ManaRem = 0;
    let p2ManaSpent = 0;
    let p2ManaRem = 0;
    let actionsCount = 0;

    // A cada turno
    while (state.currentPhase !== 'GAME_OVER' && turns < 200) {
      const currentPlayerId = state.currentTurnPlayerId;
      const player = state.players[currentPlayerId];
      
      let actionsInTurn = 0;
      while (actionsInTurn < 10) {
        const bestAction = getBestAction(state, currentPlayerId);
        if (!bestAction) break;

        const manaBefore = state.players[currentPlayerId].mana;
        try {
          if (bestAction.type === 'MOVE') {
            state = moveTo(state, bestAction.unitId, bestAction.target);
          } else if (bestAction.type === 'ATTACK') {
            state = attack(state, bestAction.attackerId, bestAction.targetId, bestAction.special);
          } else if (bestAction.type === 'PLAY_CARD') {
            state = playCard(state, currentPlayerId, bestAction.cardId, bestAction.target);
          } else if (bestAction.type === 'OFFER') {
            state = offerCard(state, currentPlayerId, bestAction.cardId);
          } else if (bestAction.type === 'HEAL') {
            state = heal(state, bestAction.healerId, bestAction.targetId);
          }
          
          const manaAfter = state.players[currentPlayerId].mana;
          if (currentPlayerId === 'p1') p1ManaSpent += (manaBefore - manaAfter);
          else p2ManaSpent += (manaBefore - manaAfter);
          
          actionsInTurn++;
          actionsCount++;
        } catch (e) {
          break;
        }
      }

      if (currentPlayerId === 'p1') p1ManaRem += state.players.p1.mana;
      else p2ManaRem += state.players.p2.mana;

      state = endTurn(state);
      turns++;
    }

    allResults.push({
      gameId: i,
      winner: state.winner || 'DRAW',
      totalTurns: turns,
      manaSpent: { p1: p1ManaSpent, p2: p2ManaSpent },
      manaRemaining: { p1: p1ManaRem, p2: p2ManaRem },
      totalActions: actionsCount
    });
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n🏆 Maratona finalizada em ${duration.toFixed(2)} segundos.`);

  // Estatísticas Finais
  const p1Wins = allResults.filter(r => r.winner === 'p1').length;
  const p2Wins = allResults.filter(r => r.winner === 'p2').length;
  const avgTurns = allResults.reduce((acc, r) => acc + r.totalTurns, 0) / numGames;
  
  const summary = {
    totalGames: numGames,
    winRate: { p1: p1Wins / numGames, p2: p2Wins / numGames },
    avgTurns,
    avgManaRemainingPerTurn: {
      p1: allResults.reduce((acc, r) => acc + r.manaRemaining.p1, 0) / (avgTurns * numGames / 2),
      p2: allResults.reduce((acc, r) => acc + r.manaRemaining.p2, 0) / (avgTurns * numGames / 2)
    },
    rawResults: allResults
  };

  const outputPath = path.join(process.cwd(), 'simulation_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(`Resultados salvos em: ${outputPath}`);
}

runSimulation(1000).catch(console.error);
