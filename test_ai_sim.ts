import { createInitialState, endTurn, cloneGameState } from './shared/src/gameEngine';
import { getBestAction } from './shared/src/aiEngine';
import { playCard, attack, moveTo, offerCard, heal } from './shared/src/gameEngine';

let state = createInitialState();
state.isVsAI = true;
state.isAutoPlay = true;

let turn = 0;
while (state.currentPhase !== 'GAME_OVER' && turn < 100) {
  console.log(`--- Turn ${state.turnNumber} | Player: ${state.currentTurnPlayerId} ---`);
  let continueTurn = true;
  while(continueTurn) {
    try {
      const action = getBestAction(state, state.currentTurnPlayerId);
      if (!action) {
        console.log("No action found, ending turn.");
        continueTurn = false;
        break;
      }
      console.log("AI executing:", action.type);
      if (action.type === 'MOVE') state = moveTo(state, action.unitId, action.target);
      else if (action.type === 'ATTACK') state = attack(state, action.attackerId, action.targetId, action.special);
      else if (action.type === 'PLAY_CARD') state = playCard(state, state.currentTurnPlayerId, action.cardId, action.target);
      else if (action.type === 'OFFER') state = offerCard(state, state.currentTurnPlayerId, action.cardId);
      else if (action.type === 'HEAL') state = heal(state, action.healerId, action.targetId);
    } catch(e) {
      console.error("Simulation error during action:", e);
      continueTurn = false;
    }
  }
  state = endTurn(state);
  turn++;
}
console.log("Game Over or max turns reached. Turns simulated:", turn);
