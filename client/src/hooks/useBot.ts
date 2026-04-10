import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getBestAction } from 'shared';

export function useBot() {
  const currentTurnPlayerId = useGameStore(s => s.currentTurnPlayerId);
  const currentPhase = useGameStore(s => s.currentPhase);
  const triggerEndTurn = useGameStore(s => s.triggerEndTurn);
  const attemptMove = useGameStore(s => s.attemptMove);
  const attemptAttack = useGameStore(s => s.attemptAttack);
  const attemptPlayCard = useGameStore(s => s.attemptPlayCard);
  const offerCard = useGameStore(s => s.offerCard);
  const healUnit = useGameStore(s => s.healUnit);
  
  const isThinking = useRef(false);

  useEffect(() => {
    // Só age se for o turno do P2 e não estiver já processando
    if (currentTurnPlayerId === 'p2' && currentPhase === 'MAIN_PHASE' && !isThinking.current) {
      console.log("IA ativada para turno do P2");
      processBotTurn();
    }
  }, [currentTurnPlayerId, currentPhase]);

  async function processBotTurn() {
    if (isThinking.current) return;
    isThinking.current = true;
    
    console.log("IA Iniciando turno tático...");
    
    // Em jogos de teste (URL ?test=true), removemos os delays para rodar rápido
    const isTestMode = new URLSearchParams(window.location.search).has('test');
    
    // Pequeno delay inicial para processamento
    if (!isTestMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // O bot executa ações enquanto tiver jogadas úteis (IA detecta mana e exaustão)
    let actionsPerformed = 0;
    const startTime = Date.now();
    while (useGameStore.getState().currentTurnPlayerId === 'p2' && 
           useGameStore.getState().currentPhase === 'MAIN_PHASE' &&
           actionsPerformed < 15 &&
           (Date.now() - startTime) < 8000) {  // Timeout de 8 segundos
      
      const currentState = useGameStore.getState();
      const bestAction = getBestAction(currentState, 'p2');

      if (!bestAction) {
        console.log("Bot não encontrou ações úteis.");
        break;
      }

      // Executa a ação
      console.log("Bot executando:", bestAction.type, bestAction);
      
      if (bestAction.type === 'MOVE') {
        attemptMove(bestAction.unitId, bestAction.target);
      } else if (bestAction.type === 'ATTACK') {
        attemptAttack(bestAction.attackerId, bestAction.targetId, bestAction.special);
      } else if (bestAction.type === 'PLAY_CARD') {
        attemptPlayCard(bestAction.cardId, bestAction.target);
      } else if (bestAction.type === 'OFFER') {
        offerCard(bestAction.cardId);
      } else if (bestAction.type === 'HEAL') {
        healUnit(bestAction.healerId, bestAction.targetId);
      }

      // Delay entre ações para o player humano acompanhar (se não for jogo teste)
      if (!isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      actionsPerformed++;
    }

    if ((Date.now() - startTime) >= 8000) {
      console.log("Timeout IA excedido, finalizando turno.");
    }

    // Fim de turno do Bot
    if (useGameStore.getState().currentTurnPlayerId === 'p2') {
      console.log("Bot finalizando turno.");
      triggerEndTurn();
    }
    
    isThinking.current = false;
  }
}
