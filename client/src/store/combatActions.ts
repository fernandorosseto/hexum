import type { HexCoordinates, Unit } from 'shared';
import { 
  moveTo, attack, heal, playCard, offerCard, getHexDistance, getHexNeighbors, 
  hasAnyValidAction, getUnitCard, ARTIFACT_NAMES, SPELL_NAMES
} from 'shared';
import { 
  scheduleProjectileAnimation, scheduleThrustAnimation, scheduleMeleeAnimation, 
  scheduleMageAttack, scheduleAssassinAttack, scheduleHeavyMelee, scheduleCleaveAttack,
  AnimationType 
} from './animationActions';
import { beginAction } from './actionGuard';

/** Janela máxima de animação; depois dela a UI volta a aceitar cliques. */
const RESOLVE_WINDOW_MS = 1400;

export const createCombatActions = (set: any, get: any) => {
  const checkAutoPass = () => {
    const state = get();
    // No modo Sandbox ou se já acabou o jogo, não fazemos auto-pass
    if (state.sandboxMode || state.currentPhase !== 'MAIN_PHASE') return;
    
    // Se não houver mais NENHUMA ação válida possível para o jogador atual
    if (!hasAnyValidAction(state, state.currentTurnPlayerId)) {
      // Pequeno delay para o jogador ver o resultado da última ação antes de passar
      setTimeout(() => {
        const latestState = get();
        // Verifica novamente se ainda é o mesmo turno e se ainda não tem ações (segurança anti-race condition)
        if (latestState.currentTurnPlayerId === state.currentTurnPlayerId && !hasAnyValidAction(latestState, latestState.currentTurnPlayerId)) {
          get().triggerEndTurn();
        }
      }, 1500);
    }
  };

  return {
  attemptMove: (unitId: string, targetHex: HexCoordinates, useSpecial = false) => {
    const action = beginAction(set, get);
    try {
      const currentGameState = get();
      const unit = currentGameState.boardUnits[unitId];
      if (!unit) return;

      let effectiveState = currentGameState;
      if (currentGameState.sandboxMode) {
        effectiveState = {
          ...currentGameState,
          boardUnits: {
            ...currentGameState.boardUnits,
            [unitId]: { ...unit, canMove: true, summoningSickness: false }
          },
          players: {
            ...currentGameState.players,
            [unit.playerId]: { ...currentGameState.players[unit.playerId], mana: 99 }
          }
        };
      }

      const finalUseSpecial = useSpecial || !!currentGameState.selectedAbility;
      const newState = moveTo(effectiveState, unitId, targetHex, finalUseSpecial);
      action.set({ 
        ...newState, 
        selectedHex: null, 
        selectedAbility: null,
        lastActionVfx: { type: 'MOVE', sourceId: unitId, sourcePos: unit.position, targetPos: targetHex, timestamp: Date.now() }
      });

      const lang: 'en' | 'pt' = (get().language || 'pt') as 'en' | 'pt';
      const moveTemplates = lang === 'pt' ? [
        `O ${unit.unitClass} marchou pelo campo de batalha.`,
        `O ${unit.unitClass} se posicionou estrategicamente.`,
        `O ${unit.unitClass} avançou em direção ao objetivo.`
      ] : [
        `The ${unit.unitClass} marched across the battlefield.`,
        `${unit.unitClass} positioned strategically.`,
        `The ${unit.unitClass} advanced toward the objective.`
      ];
      const moveMsg = moveTemplates[Math.floor(Math.random() * moveTemplates.length)];
      get().addLog(moveMsg, unit.playerId);
      checkAutoPass();
    } catch (err) {
      console.warn("Erro de Regra:", err instanceof Error ? err.message : err);
      action.set({ selectedHex: null, selectedAbility: null });
    }
  },

  attemptAttack: (attackerId: string, targetId: string, useSpecial = false) => {
    const action = beginAction(set, get);
    try {
      const currentGameState = get();
      const attacker = currentGameState.boardUnits[attackerId];
      const target = currentGameState.boardUnits[targetId];

      if (!attacker || !target) return;
      const hpBefore = target.hp;
      const finalUseSpecial = useSpecial || !!currentGameState.selectedAbility;

      let effectiveState = currentGameState;
      if (currentGameState.sandboxMode) {
        effectiveState = {
          ...currentGameState,
          currentTurnPlayerId: attacker.playerId,
          boardUnits: {
            ...currentGameState.boardUnits,
            [attackerId]: { ...attacker, canAttack: true, summoningSickness: false }
          },
          players: { ...currentGameState.players, [attacker.playerId]: { ...currentGameState.players[attacker.playerId], mana: 99 } }
        };
      }

      const newState = attack(effectiveState, attackerId, targetId, finalUseSpecial);
      newState.currentTurnPlayerId = currentGameState.currentTurnPlayerId;

      const updatedTarget = newState.boardUnits[targetId];
      const damageDealt = hpBefore - (updatedTarget ? updatedTarget.hp : 0);
      const targetDied = !updatedTarget && !!target;

      const animations: Record<string, AnimationType> = { [attackerId]: 'attacking' };
      if (target) animations[targetId] = 'damaged';

      if (targetDied) {
        newState.boardUnits[targetId] = { ...target, hp: 0 };
      }

      const details = (newState.combatLogs && newState.combatLogs.length > 0) ? `. ${newState.combatLogs.join('. ')}` : '';
      const lang: 'en' | 'pt' = (get().language || 'pt') as 'en' | 'pt';
      const attackTemplates = lang === 'pt' ? [
        `O ${attacker.unitClass} golpeou o ${target.unitClass} com um ataque preciso, causando ${damageDealt} de dano!`,
        `O ${attacker.unitClass} atacou o ${target.unitClass} infligindo ${damageDealt} de dano.`,
        `O impacto do ${attacker.unitClass} atingiu o ${target.unitClass} com força: ${damageDealt} de dano.`
      ] : [
        `The ${attacker.unitClass} struck ${target.unitClass} with a precise blow dealing ${damageDealt} damage!`,
        `${attacker.unitClass} attacked ${target.unitClass} inflicting ${damageDealt} damage.`,
        `The impact from ${attacker.unitClass} hit ${target.unitClass} hard: ${damageDealt} damage.`
      ];
      const attackMsg = attackTemplates[Math.floor(Math.random() * attackTemplates.length)] + details;

      // Adiciona o gatilho de VFX para sincronização PvP
      newState.lastActionVfx = { 
        type: 'ATTACK', 
        sourceId: attackerId, 
        sourcePos: attacker.position,
        targetId: targetId, 
        targetPos: target.position,
        timestamp: Date.now() 
      };

      // Bloqueia a entrada enquanto a animação resolve o estado final.
      action.set({ isResolving: true });
      setTimeout(() => action.set({ isResolving: false }), RESOLVE_WINDOW_MS);

      const set_ = action.set;
      if (attacker.unitClass === 'Arqueiro') {
        scheduleProjectileAnimation(set_, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Lanceiro') {
        scheduleThrustAnimation(set_, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Mago' || attacker.unitClass === 'Alquimista') {
        scheduleMageAttack(set_, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Assassino') {
        scheduleAssassinAttack(set_, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Cavaleiro') {
        scheduleHeavyMelee(set_, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Rei') {
        scheduleCleaveAttack(set_, get, attacker, target, newState, animations, attackMsg, targetDied, 'gold');
      } else if (attacker.unitClass === 'Clerigo') {
        scheduleCleaveAttack(set, get, attacker, target, newState, animations, attackMsg, targetDied, 'cyan');
      } else {
        scheduleMeleeAnimation(set_, get, attacker, target, newState, animations, attackMsg, targetDied);
      }
      checkAutoPass();
    } catch (err) {
      console.warn("Erro de Ataque:", err instanceof Error ? err.message : err);
      action.set({ selectedHex: null, targetHex: null, selectedAbility: null, isResolving: false });
    }
  },

  attemptHeal: (healerId: string, targetId: string) => {
    const action = beginAction(set, get);
    try {
      const currentGameState = get();
      const healer = currentGameState.boardUnits[healerId];
      const target = currentGameState.boardUnits[targetId];

      let effectiveState = currentGameState;
      if (currentGameState.sandboxMode) {
        effectiveState = {
          ...currentGameState,
          boardUnits: {
            ...currentGameState.boardUnits,
            [healerId]: { ...healer, canAttack: true, summoningSickness: false }
          }
        };
      }

      const newState = heal(effectiveState, healerId, targetId);
      action.set({ 
        ...newState, 
        selectedHex: null, 
        animatingUnits: { [targetId]: 'healing' },
        lastActionVfx: { type: 'HEAL', sourceId: healerId, sourcePos: healer.position, targetId: targetId, targetPos: target.position, timestamp: Date.now() }
      });
      const lang: 'en' | 'pt' = (get().language || 'pt') as 'en' | 'pt';
      const msg = lang === 'pt'
        ? `O ${healer.unitClass} usou preces divinas para curar o ${target.unitClass}!`
        : `The ${healer.unitClass} used divine prayers to heal ${target.unitClass}!`;
      get().addLog(msg, healer.playerId);
      setTimeout(() => action.set({ animatingUnits: {} }), 600);
      checkAutoPass();
    } catch (err) {
      console.warn("Erro de Cura:", err instanceof Error ? err.message : err);
      action.set({ selectedHex: null });
    }
  },

  attemptPlayCard: (cardId: string, targetHex: HexCoordinates) => {
    const action = beginAction(set, get);
    try {
      const currentGameState = get();

      let effectiveState = currentGameState;
      if (currentGameState.sandboxMode && currentGameState.currentTurnPlayerId === 'p1') {
        effectiveState = {
          ...currentGameState,
          players: { ...currentGameState.players, p1: { ...currentGameState.players.p1, mana: 99 } }
        };
      }

      const newState = playCard(effectiveState, currentGameState.currentTurnPlayerId, cardId, targetHex);

      if (currentGameState.sandboxMode) {
        newState.players['p1'].mana = 99;
        newState.players['p1'].maxMana = 99;
      }
      const deadUnitIds = Object.keys(currentGameState.boardUnits).filter(id => !newState.boardUnits[id]);
      let hasCustomAnimation = false;
      let animationDuration = 0;
      let setupAnimations = () => {};
      const boardUnitsArr = Object.values(currentGameState.boardUnits) as Unit[];

      if (cardId === 'spl_raio') {
        const targetUnitId = Object.keys(currentGameState.boardUnits).find(id => {
          const u = currentGameState.boardUnits[id];
          return u.position.q === targetHex.q && u.position.r === targetHex.r;
        });

        if (targetUnitId) {
          hasCustomAnimation = true;
          animationDuration = 800;
          setupAnimations = () => {
            const animations: Record<string, AnimationType> = { [targetUnitId]: 'lightning' };
            const myKing = boardUnitsArr.find(u => u.unitClass === 'Rei' && u.playerId === currentGameState.currentTurnPlayerId);
            const neighbors = getHexNeighbors(targetHex);
            const neighborUnits = boardUnitsArr.filter(u =>
              u.playerId !== currentGameState.currentTurnPlayerId &&
              u.id !== targetUnitId &&
              neighbors.some(n => n.q === u.position.q && n.r === u.position.r)
            );

            if (neighborUnits.length > 0) {
              neighborUnits.sort((a, b) => {
                if (a.hp !== b.hp) return a.hp - b.hp;
                if (!myKing) return 0;
                const distA = getHexDistance(a.position, myKing.position);
                const distB = getHexDistance(b.position, myKing.position);
                return distA - distB;
              });
              animations[neighborUnits[0].id] = 'lightning';
            }
            set({ animatingUnits: animations });
          };
        }
      } else if (cardId === 'spl_transfusao') {
        const myKing = boardUnitsArr.find(u => u.unitClass === 'Rei' && u.playerId === currentGameState.currentTurnPlayerId);
        if (myKing) {
          hasCustomAnimation = true;
          animationDuration = 1000;
          setupAnimations = () => {
            set({ activeTransfusion: { source: targetHex, target: myKing.position } });
          };
        }
      } else if (cardId === 'spl_meteoro') {
        hasCustomAnimation = true;
        animationDuration = 1000;
        setupAnimations = () => {
          set({ activeMeteor: targetHex });
          const neighbors = getHexNeighbors(targetHex);
          const affectedUnitIds = Object.keys(currentGameState.boardUnits).filter(id => {
            const u = currentGameState.boardUnits[id];
            return (u.position.q === targetHex.q && u.position.r === targetHex.r) ||
              neighbors.some(n => n.q === u.position.q && n.r === u.position.r);
          });

          if (affectedUnitIds.length > 0) {
            const animations: Record<string, AnimationType> = {};
            affectedUnitIds.forEach(id => { animations[id] = 'damaged'; });
            set({ animatingUnits: animations });
          }
        };
      } else if (cardId === 'spl_aurarunica') {
        hasCustomAnimation = true;
        animationDuration = 800;
        setupAnimations = () => { set({ activeAuraRunica: targetHex }); };
      } else if (cardId === 'spl_nevoa') {
        hasCustomAnimation = true;
        animationDuration = 800;
        setupAnimations = () => { set({ activeMistImpact: targetHex }); };
      } else if (cardId === 'spl_muralha') {
        hasCustomAnimation = true;
        animationDuration = 800;
        setupAnimations = () => {
          const wallTargets = [targetHex, ...getHexNeighbors(targetHex)];
          set({ activeWallFormation: wallTargets });
        };
      } else if (cardId === 'spl_passos') {
        hasCustomAnimation = true;
        animationDuration = 800;
        setupAnimations = () => { set({ activeWindTrail: targetHex }); };
      } else if (cardId === 'spl_bencao') {
        hasCustomAnimation = true;
        animationDuration = 800;
        setupAnimations = () => { set({ activeDivineBlessing: targetHex }); };
      } else if (cardId === 'spl_raizes') {
        hasCustomAnimation = true;
        animationDuration = 800;
        setupAnimations = () => { set({ activeEarthRoots: targetHex }); };
      } else if (cardId === 'spl_furia') {
        hasCustomAnimation = true;
        animationDuration = 800;
        setupAnimations = () => { set({ activeFuryPulse: targetHex }); };
      }

      // Prepara a mensagem de log
      const lang: 'en' | 'pt' = (get().language || 'pt') as 'en' | 'pt';
      let cardName = cardId.replace('unit_', '').replace('spl_', '').replace('art_', '').toUpperCase();
      try {
        if (cardId.startsWith('unit_')) {
          cardName = getUnitCard(cardId, lang).name;
        } else if (cardId.startsWith('art_')) {
          cardName = ARTIFACT_NAMES[cardId]?.[lang] || cardName;
        } else if (cardId.startsWith('spl_')) {
          cardName = SPELL_NAMES[cardId]?.[lang] || cardName;
        }
      } catch (e) {}

      let playMsg = lang === 'pt' ? `Jogou ${cardName}` : `Played ${cardName}`;
      if (cardId.startsWith('unit_')) {
        const pName = currentGameState.currentTurnPlayerId === 'p1'
          ? (lang === 'pt' ? 'Azul' : 'Blue')
          : (lang === 'pt' ? 'Roxo' : 'Purple');
        playMsg = lang === 'pt'
          ? `O jogador ${pName} invocou o ${cardName} no campo de batalha!`
          : `${pName} summoned ${cardName} to the battlefield!`;
      } else if (cardId.startsWith('spl_')) {
        playMsg = lang === 'pt'
          ? `Um feitiço poderoso foi conjurado: ${cardName}!`
          : `A powerful spell was cast: ${cardName}!`;
      } else if (cardId.startsWith('art_')) {
        playMsg = lang === 'pt'
          ? `O artefato sagrado ${cardName} foi revelado.`
          : `The sacred artifact ${cardName} was revealed.`;
      }

      const applyFinalState = () => {
        action.set({
          ...newState,
          isResolving: false,
          selectedCard: null,
          selectedHex: null,
          activeTransfusion: null,
          activeMeteor: null,
          activeAuraRunica: null,
          activeMistImpact: null,
          activeWallFormation: null,
          activeWindTrail: null,
          activeDivineBlessing: null,
          activeEarthRoots: null,
          activeFuryPulse: null,
          animatingUnits: {},
          lastActionVfx: { 
            type: 'SPELL', 
            sourceId: cardId === 'spl_transfusao' ? boardUnitsArr.find(u => u.unitClass === 'Rei' && u.playerId === currentGameState.currentTurnPlayerId)?.id : undefined,
            sourcePos: cardId === 'spl_transfusao' ? boardUnitsArr.find(u => u.unitClass === 'Rei' && u.playerId === currentGameState.currentTurnPlayerId)?.position : undefined,
            targetPos: targetHex, 
            abilityId: cardId, 
            timestamp: Date.now() 
          }
        });
        get().addLog(playMsg, currentGameState.currentTurnPlayerId);
        checkAutoPass();
      };

      if (hasCustomAnimation) {
        // Atualiza imediatamente mão e mana do jogador para responsividade na UI.
        // O tabuleiro só muda ao final da animação, por isso a entrada fica
        // bloqueada (isResolving) até lá — antes, um clique nessa janela era
        // desfeito quando o timer aplicava o estado pré-calculado.
        action.set({
          ...newState,
          boardUnits: currentGameState.boardUnits,
          selectedCard: null,
          selectedHex: null,
          isResolving: true
        });

        // Dispara os estados de animação específicos
        setupAnimations();

        // Executa a transição para o estado final após a duração
        setTimeout(() => {
          applyFinalState();
        }, animationDuration);
      } else {
        applyFinalState();
      }
    } catch (err) {
      console.warn("Erro ao jogar carta:", err instanceof Error ? err.message : err);
      action.set({ selectedCard: null, selectedHex: null, isResolving: false });
    }
  },

  offerCard: (cardId: string) => {
    try {
      const currentGameState = get();
      let effectiveState = currentGameState;
      if (currentGameState.sandboxMode) {
        const pId = currentGameState.currentTurnPlayerId;
        effectiveState = {
          ...currentGameState,
          players: { ...currentGameState.players, [pId]: { ...currentGameState.players[pId], canOfferCard: true } }
        };
      }

      const newState = offerCard(effectiveState, currentGameState.currentTurnPlayerId, cardId);

      if (currentGameState.sandboxMode && currentGameState.currentTurnPlayerId === 'p1') {
        newState.players['p1'].mana = 99;
        newState.players['p1'].maxMana = 99;
        newState.players['p1'].canOfferCard = true;
      }

      set({ ...newState });
      const lang: 'en' | 'pt' = (get().language || 'pt') as 'en' | 'pt';
      const pName = currentGameState.currentTurnPlayerId === 'p1'
        ? (lang === 'pt' ? 'Azul' : 'Blue')
        : (lang === 'pt' ? 'Roxo' : 'Purple');
      const offeringMsg = lang === 'pt'
        ? `Uma oferta de mana foi feita pelo ${pName}.`
        : `A mana offering was made by ${pName}.`;
      get().addLog(offeringMsg, currentGameState.currentTurnPlayerId);
      checkAutoPass();
    } catch (err) {
      console.warn("Erro ao oferecer carta:", err instanceof Error ? err.message : err);
    }
  },

  healUnit: (healerId: string, targetId: string) => {
    try {
      const currentGameState = get();
      const healer = currentGameState.boardUnits[healerId];
      const target = currentGameState.boardUnits[targetId];
      const newState = heal(currentGameState, healerId, targetId);
      set({ ...newState, animatingUnits: { [targetId]: 'healing' } });
      const lang: 'en' | 'pt' = (get().language || 'pt') as 'en' | 'pt';
      const msg = lang === 'pt'
        ? `O ${healer.unitClass} curou o ${target.unitClass}`
        : `${healer.unitClass} healed ${target.unitClass}`;
      get().addLog(msg, healer.playerId);
      setTimeout(() => set({ animatingUnits: {} }), 600);
      checkAutoPass();
    } catch (err) {
      console.warn("Erro ao curar:", err instanceof Error ? err.message : err);
    }
  }
}
};
