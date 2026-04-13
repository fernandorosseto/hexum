import type { HexCoordinates, Unit } from 'shared';
import { moveTo, attack, heal, playCard, offerCard, getHexDistance, getHexNeighbors } from 'shared';
import { 
  scheduleProjectileAnimation, scheduleThrustAnimation, scheduleMeleeAnimation, 
  scheduleMageAttack, scheduleAssassinAttack, scheduleHeavyMelee, scheduleCleaveAttack,
  scheduleSpellCardAnimation, AnimationType 
} from './animationActions';

export const createCombatActions = (set: any, get: any) => ({
  attemptMove: (unitId: string, targetHex: HexCoordinates, useSpecial = false) => {
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
      set({ ...newState, selectedHex: null, selectedAbility: null });

      const moveTemplates = [
        `O ${unit.unitClass} marchou pelo campo de batalha.`,
        `${unit.unitClass} se posicionou estrategicamente.`,
        `O ${unit.unitClass} avançou em direção ao objetivo.`
      ];
      const moveMsg = moveTemplates[Math.floor(Math.random() * moveTemplates.length)];
      get().addLog(moveMsg, unit.playerId);
    } catch (err: any) {
      console.warn("Erro de Regra:", err.message);
      set({ selectedHex: null, selectedAbility: null });
    }
  },

  attemptAttack: (attackerId: string, targetId: string, useSpecial = false) => {
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
      const attackTemplates = [
        `O ${attacker.unitClass} desferiu um golpe certeiro em ${target.unitClass} causando ${damageDealt} de dano!`,
        `${attacker.unitClass} atacou ${target.unitClass} infligindo ${damageDealt} de dano.`,
        `O impacto de ${attacker.unitClass} atingiu ${target.unitClass} com força: ${damageDealt} de dano.`
      ];
      const attackMsg = attackTemplates[Math.floor(Math.random() * attackTemplates.length)] + details;

      if (attacker.unitClass === 'Arqueiro') {
        scheduleProjectileAnimation(set, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Lanceiro') {
        scheduleThrustAnimation(set, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Mago') {
        scheduleMageAttack(set, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Assassino') {
        scheduleAssassinAttack(set, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Cavaleiro') {
        scheduleHeavyMelee(set, get, attacker, target, newState, animations, attackMsg, targetDied);
      } else if (attacker.unitClass === 'Rei') {
        scheduleCleaveAttack(set, get, attacker, target, newState, animations, attackMsg, targetDied, 'gold');
      } else if (attacker.unitClass === 'Clerigo') {
        scheduleCleaveAttack(set, get, attacker, target, newState, animations, attackMsg, targetDied, 'cyan');
      } else {
        scheduleMeleeAnimation(set, get, attacker, target, newState, animations, attackMsg, targetDied);
      }
    } catch (err: any) {
      console.warn("Erro de Ataque:", err.message);
      set({ selectedHex: null, targetHex: null, selectedAbility: null });
    }
  },

  attemptHeal: (healerId: string, targetId: string) => {
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
      set({ ...newState, selectedHex: null, animatingUnits: { [targetId]: 'healing' } });
      get().addLog(`O ${healer.unitClass} usou preces divinas para curar o ${target.unitClass}!`, healer.playerId);
      setTimeout(() => set({ animatingUnits: {} }), 600);
    } catch (err: any) {
      console.warn("Erro de Cura:", err.message);
      set({ selectedHex: null });
    }
  },

  attemptPlayCard: (cardId: string, targetHex: HexCoordinates) => {
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
      const boardUnitsArr = Object.values(currentGameState.boardUnits) as Unit[];

      if (cardId === 'spl_raio') {
        const targetUnitId = Object.keys(currentGameState.boardUnits).find(id => {
          const u = currentGameState.boardUnits[id];
          return u.position.q === targetHex.q && u.position.r === targetHex.r;
        });

        if (targetUnitId) {
          hasCustomAnimation = true;
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
        }
      }

      if (cardId === 'spl_transfusao') {
        const myKing = boardUnitsArr.find(u => u.unitClass === 'Rei' && u.playerId === currentGameState.currentTurnPlayerId);
        if (myKing) {
          set({ activeTransfusion: { source: targetHex, target: myKing.position } });
          setTimeout(() => set({ activeTransfusion: null }), 1000);
        }
      }

      if (cardId === 'spl_meteoro') {
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
        setTimeout(() => set({ activeMeteor: null, animatingUnits: {} }), 1000);
        hasCustomAnimation = true;
      }

      if (cardId === 'spl_aurarunica') {
        scheduleSpellCardAnimation(set, 'activeAuraRunica', targetHex, newState);
      }
      if (cardId === 'spl_nevoa') {
        scheduleSpellCardAnimation(set, 'activeMistImpact', targetHex, newState);
      }
      if (cardId === 'spl_muralha') {
        const wallTargets = [targetHex, ...getHexNeighbors(targetHex)];
        scheduleSpellCardAnimation(set, 'activeWallFormation', wallTargets, newState);
      }
      if (cardId === 'spl_passos') {
        scheduleSpellCardAnimation(set, 'activeWindTrail', targetHex, newState);
      }
      if (cardId === 'spl_bencao') {
        scheduleSpellCardAnimation(set, 'activeDivineBlessing', targetHex, newState);
      }
      if (cardId === 'spl_raizes') {
        scheduleSpellCardAnimation(set, 'activeEarthRoots', targetHex, newState);
      }
      if (cardId === 'spl_furia') {
        scheduleSpellCardAnimation(set, 'activeFuryPulse', targetHex, newState);
      }

      if (deadUnitIds.length > 0) {
        deadUnitIds.forEach(id => {
          newState.boardUnits[id] = { ...currentGameState.boardUnits[id], hp: 0 };
          if (!get().animatingUnits[id]) {
            set((state: any) => ({ animatingUnits: { ...state.animatingUnits, [id]: 'damaged' } }));
          }
        });
      }

      set({ ...newState, selectedCard: null, selectedHex: null });

      if (deadUnitIds.length > 0 || hasCustomAnimation) {
        setTimeout(() => {
          set((state: any) => {
            const cleanBoard = { ...state.boardUnits };
            deadUnitIds.forEach(id => delete cleanBoard[id]);
            return { boardUnits: cleanBoard, animatingUnits: {} };
          });
        }, 800);
      }

      const cardName = cardId.replace('unit_', '').replace('spl_', '').replace('art_', '').toUpperCase();
      let playMsg = `Jogou ${cardName}`;
      if (cardId.startsWith('unit_')) playMsg = `O ${currentGameState.currentTurnPlayerId === 'p1' ? 'Azul' : 'Roxo'} convocou o ${cardName} para o campo de batalha!`;
      else if (cardId.startsWith('spl_')) playMsg = `Uma poderosa magia foi conjurada: ${cardName}!`;
      else if (cardId.startsWith('art_')) playMsg = `O artefato sagrado ${cardName} foi revelado.`;

      get().addLog(playMsg, currentGameState.currentTurnPlayerId);
    } catch (err: any) {
      console.warn("Erro ao jogar carta:", err.message);
      set({ selectedCard: null, selectedHex: null });
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
      get().addLog(`Uma oferenda de mana foi feita por ${currentGameState.currentTurnPlayerId === 'p1' ? 'Azul' : 'Roxo'}.`, currentGameState.currentTurnPlayerId);
    } catch (err: any) {
      console.warn("Erro ao oferecer carta:", err.message);
    }
  },

  healUnit: (healerId: string, targetId: string) => {
    try {
      const currentGameState = get();
      const healer = currentGameState.boardUnits[healerId];
      const target = currentGameState.boardUnits[targetId];
      const newState = heal(currentGameState, healerId, targetId);
      set({ ...newState, animatingUnits: { [targetId]: 'healing' } });
      get().addLog(`${healer.unitClass} curou ${target.unitClass}`, healer.playerId);
      setTimeout(() => set({ animatingUnits: {} }), 600);
    } catch (err: any) {
      console.warn("Erro ao curar:", err.message);
    }
  }
});
