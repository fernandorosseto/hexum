import { createInitialState } from './shared/src/gameEngine';
import { getBestAction } from './shared/src/aiEngine';

const state = createInitialState();
state.currentTurnPlayerId = 'p2';
try {
  const action = getBestAction(state, 'p2');
  console.log("Action found:", action);
} catch(e) {
  console.error("Error in getBestAction:", e);
}
