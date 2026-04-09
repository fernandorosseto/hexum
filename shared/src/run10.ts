import { createInitialState, moveTo, attack, playCard, endTurn, offerCard, heal } from './gameEngine';
import { getBestAction } from './aiEngine';

const NUM_GAMES = 10;

console.log(`\n⚔️  Rodando ${NUM_GAMES} partidas Bot vs Bot...\n`);

for (let i = 1; i <= NUM_GAMES; i++) {
  let state = createInitialState();
  let turns = 0;

  while (state.currentPhase !== 'GAME_OVER' && turns < 200) {
    const currentPlayerId = state.currentTurnPlayerId;
    let actionsInTurn = 0;

    while (actionsInTurn < 10) {
      const bestAction = getBestAction(state, currentPlayerId);
      if (!bestAction) break;

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
        actionsInTurn++;
      } catch (e) {
        break;
      }
    }

    state = endTurn(state);
    turns++;
  }

  const winner = state.winner || 'EMPATE';
  const winnerLabel = winner === 'p1' ? '🔵 P1' : winner === 'p2' ? '🔴 P2' : '🤝 Empate';
  console.log(`  Jogo ${String(i).padStart(2, ' ')} | Vencedor: ${winnerLabel} | Turnos: ${turns}`);
}

console.log(`\n✅ Simulação concluída!\n`);
