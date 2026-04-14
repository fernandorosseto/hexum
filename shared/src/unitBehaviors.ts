import type { GameState, Unit, UnitClass } from './types';
import { getHexDistance, getHexNeighbors, isLine, getLineOfSight, isDiagonal, isInsideBoard } from './hexMath';
import type { HexCoordinates } from './hexMath';

// ══════════════════════════════════════════════
//  Utilitários Compartilhados
// ══════════════════════════════════════════════

export function isPathBlocked(state: GameState, start: HexCoordinates, end: HexCoordinates): boolean {
  const line = getLineOfSight(start, end);
  for (const step of line.slice(1, -1)) {
    const obstacle = Object.values(state.boardUnits).find(u =>
      u.position.q === step.q && u.position.r === step.r
    );
    if (obstacle) return true;
  }
  return false;
}

export function checkEffectTrigger(unit: Unit): boolean {
  const chance = (1 + unit.roundsInField) / 100;
  return Math.random() < chance;
}

function checkTrajectory(state: GameState, attacker: Unit, target: Unit, startIndex: number): void {
  const dist = getHexDistance(attacker.position, target.position);
  if (dist <= 1) return;
  const line = getLineOfSight(attacker.position, target.position);
  for (const step of line.slice(startIndex, -1)) {
    const obstacle = Object.values(state.boardUnits).find(u =>
      u.position.q === step.q && u.position.r === step.r
    );
    if (obstacle) throw new Error("Trajetória bloqueada!");
  }
}

function applyArtifactDamageEffects(attacker: Unit, target: Unit): number {
  let extraDamage = 0;
  if ((attacker.equippedArtifacts || []).includes('art_adagas')) {
    target.hp -= 1;
    extraDamage += 1;
    applyDoT(target, 'poison', 1, 1);
  }
  return extraDamage;
}

/**
 * Função centralizada para aplicação de dano com lógica de escudo.
 * Se a unidade tem o buff 'shield', o mesmo absorve TODO o dano e é destruído.
 */
export function applyFinalDamage(target: Unit, damage: number, state: GameState): void {
  if (target.buffs.some(b => b.type === 'invulnerable')) {
    addCombatLog(state, `🛡️ Alvo Invulnerável! (Dano Anulado)`);
    return;
  }

  const shieldIndex = target.buffs.findIndex(b => b.type === 'shield');
  
  if (shieldIndex !== -1) {
    const shield = target.buffs[shieldIndex];
    
    // Escudo de Carvalho (ou outros escudos com 'value')
    if (shield.value !== undefined) {
      const absorbed = Math.min(damage, shield.value);
      const remainingDamage = damage - absorbed;
      
      addCombatLog(state, `🛡️ Escudo absorveu ${absorbed} de dano!`);
      
      // Decai a proteção: 3 -> 2 -> 1 -> remove
      if (shield.value > 1) {
        shield.value -= 1;
      } else {
        target.buffs.splice(shieldIndex, 1);
        addCombatLog(state, `🛡️ O escudo não resistiu e se quebrou!`);
      }
      
      if (remainingDamage > 0) {
        target.hp -= remainingDamage;
      }
      return;
    }

    // Escudo padrão (Aura Rúnica / Escudo Sagrado) - Absorve 1 hit total
    target.buffs.splice(shieldIndex, 1);
    addCombatLog(state, `🛡️ Proteção Divina! O escudo absorveu todo o impacto.`);
    return;
  }

  target.hp -= damage;
}

export function applyDoT(target: Unit, type: 'poison' | 'burn' | 'bleed', duration: number, value: number): void {
  const existing = target.buffs.find(b => b.type === type);
  if (existing) {
    existing.duration = Math.max(existing.duration, duration);
    existing.value = Math.max(existing.value || 0, value);
  } else {
    target.buffs.push({ type, duration, value });
  }
}

function applyFuryEffect(attacker: Unit, state: GameState): void {
  if (attacker.buffs.some(b => b.type === 'fury')) {
    attacker.hp -= 1;
    addCombatLog(state, `🩸 Fúria de Batalha: ${attacker.unitClass} perdeu 1 HP.`);
  }
}

function checkAndConsumeInvulnerability(attacker: Unit, state: GameState): void {
  if (attacker.buffs.some(b => b.type === 'invulnerable')) {
    attacker.buffs = attacker.buffs.filter(b => b.type !== 'invulnerable');
    addCombatLog(state, `⚖️ Sacrifício! Invulnerabilidade consumida pelo ataque.`);
  }
}

export function addCombatLog(state: GameState, log: string): void {
  if (!state.combatLogs) state.combatLogs = [];
  state.combatLogs.push(log);
}

function handleUnitDeath(state: GameState, unit: Unit, killerPlayerId: string): void {
  if (unit.hp <= 0) {
    if (unit.unitClass === 'Rei' && !state.sandboxMode) {
      state.currentPhase = 'GAME_OVER';
      state.winner = killerPlayerId;
    }
    delete state.boardUnits[unit.id];
    addCombatLog(state, `💀 O ${unit.unitClass} sucumbiu e foi removido do campo.`);
  }
}

function hasAmuleto(unit: Unit): boolean {
  return (unit.equippedArtifacts || []).includes('art_amuleto');
}

// ══════════════════════════════════════════════
//  Interface do Comportamento de Unidade
// ══════════════════════════════════════════════

export interface UnitBehavior {
  validateMove(unit: Unit, target: HexCoordinates, dist: number, maxMoveDist: number, state: GameState, useSpecial?: boolean): void;
  isValidMovePosition(unit: Unit, targetPos: HexCoordinates, dist: number, state: GameState, useSpecial?: boolean): boolean;
  validateAttack(attacker: Unit, target: Unit, dist: number, rangeBonus: number, useSpecial: boolean, state: GameState): void;
  applyDamage(attacker: Unit, target: Unit, state: GameState, dist: number, useSpecial: boolean, rangeBonus: number): void;
}

// ══════════════════════════════════════════════
//  Rei
// ══════════════════════════════════════════════

const ReiBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist) {
    if (dist > maxMoveDist) throw new Error("Rei só move 1 casa.");
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist === 1;
  },
  validateAttack(attacker, target, dist, rangeBonus) {
    if (dist > 1 + rangeBonus) throw new Error("Rei só ataca adjacente.");
  },
  applyDamage(attacker, target, state) {
    if (attacker.buffs.some(b => b.type === 'invulnerable')) {
      attacker.buffs = attacker.buffs.filter(b => b.type !== 'invulnerable');
      addCombatLog(state, `⚖️ Invulnerabilidade consumida pelo ataque!`);
    }

    addCombatLog(state, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artefatos: +${extra}`);
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target, attacker.playerId);
  }
};

// ══════════════════════════════════════════════
//  Cavaleiro
// ══════════════════════════════════════════════

const CavaleiroBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist, state, useSpecial) {
    if (useSpecial) {
      if (dist > 3 || !isLine(unit.position, target)) {
        throw new Error("Rompante de Ferro deve ser em linha reta de até 3 de distância.");
      }
    } else {
      if (dist > maxMoveDist) throw new Error(`Cavaleiro só move até ${maxMoveDist} casa(s).`);
      if (!isLine(unit.position, target)) throw new Error("Cavaleiro só se move em linha reta.");
    }
  },
  isValidMovePosition(unit, targetPos, dist, state, useSpecial) {
    if (useSpecial) return dist <= 3 && isLine(unit.position, targetPos);
    
    // Movimento normal: até dist 2 (ou 3 com corcel) mas SEMPRE em linha reta
    const bonus = (unit.equippedArtifacts || []).includes('art_corcel') ? 1 : 0;
    return dist <= (2 + bonus) && isLine(unit.position, targetPos);
  },
  validateAttack(attacker, target, dist, rangeBonus, useSpecial, state) {
    if (useSpecial) {
      if (dist > 3 || !isLine(attacker.position, target.position)) {
        throw new Error("Rompante de Ferro em linha reta de até 3 de distância.");
      }
    } else {
      if (dist > 1 + rangeBonus) throw new Error("Cavaleiro só ataca colado.");
    }

    // Validação de Pouso do Rompante de Ferro
    if (useSpecial && dist > 1) {
      const line = getLineOfSight(attacker.position, target.position);
      const landingPos = line[line.length - 2];
      const collision = Object.values(state.boardUnits).some(u => 
        u.position.q === landingPos.q && u.position.r === landingPos.r
      );
      if (collision) {
        throw new Error("Local de pouso do Rompante está ocupado!");
      }
    }
  },
  applyDamage(attacker, target, state, dist, useSpecial) {
    checkAndConsumeInvulnerability(attacker, state);
    let damage = attacker.attack;
    addCombatLog(state, `Base: ${attacker.attack}`);

    if (useSpecial) {
      damage += 2;
      addCombatLog(state, `🐎 Rompante de Ferro: +2 de impacto extra!`);
      const line = getLineOfSight(attacker.position, target.position);
      if (line.length > 2) {
        const landingPos = line[line.length - 2];
        const collision = Object.values(state.boardUnits).some(u => 
          u.position.q === landingPos.q && u.position.r === landingPos.r
        );
        if (!collision) {
          attacker.position = landingPos;
        } else {
          addCombatLog(state, `⚠️ Rompante: Local de pouso obstruído no momento do impacto!`);
        }
      }
    }
    
    applyFinalDamage(target, damage, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artefatos: +${extra}`);

    if ((dist > 1 || useSpecial) && checkEffectTrigger(attacker)) {
      target.buffs.push({ type: 'stun', duration: 1 });
      addCombatLog(state, `💫 O alvo ficou atordoado pelo choque!`);
    }
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target, attacker.playerId);
  }
};

// ══════════════════════════════════════════════
//  Lanceiro
// ══════════════════════════════════════════════

const LanceiroBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist, state) {
    if (dist > maxMoveDist || unit.position.r === target.r) {
      throw new Error("Lanceiro: Move apenas para frente/trás.");
    }
    if (dist > 1 && !hasAmuleto(unit) && isPathBlocked(state, unit.position, target)) {
      throw new Error("Caminho bloqueado!");
    }
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist === 1 && unit.position.r !== targetPos.r;
  },
  validateAttack(attacker, target, dist, rangeBonus, useSpecial, state) {
    if (!isLine(attacker.position, target.position) || attacker.position.r === target.position.r) {
      throw new Error("Lanceiro: Ataca apenas em linha vertical.");
    }
    if (dist > 2 + rangeBonus) throw new Error("Lanceiro: Alcance máximo 2.");
    if (dist > 1) checkTrajectory(state, attacker, target, 1);
  },
  applyDamage(attacker, target, state, dist) {
    checkAndConsumeInvulnerability(attacker, state);
    addCombatLog(state, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);

    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artefatos: +${extra}`);

    if (checkEffectTrigger(attacker)) {
      const dq = (target.position.q - attacker.position.q) / dist;
      const dr = (target.position.r - attacker.position.r) / dist;
      const pushTarget = { q: target.position.q + dq, r: target.position.r + dr, s: -(target.position.q + dq) - (target.position.r + dr) };
      const collision = Object.values(state.boardUnits).some(u => u.position.q === pushTarget.q && u.position.r === pushTarget.r);
      if (isInsideBoard(pushTarget) && !collision) {
        target.position = pushTarget;
        addCombatLog(state, `💨 Impacto de Falange: Empurrou o alvo!`);
      }
    }
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target, attacker.playerId);
  }
};

// ══════════════════════════════════════════════
//  Arqueiro
// ══════════════════════════════════════════════

const ArqueiroBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist, state) {
    if (dist > maxMoveDist) throw new Error("Arqueiro: Move apenas 1.");
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist <= 1;
  },
  validateAttack(attacker, target, dist, rangeBonus) {
    if (dist > 3 + rangeBonus) throw new Error("Arqueiro: Alcance 3.");
  },
  applyDamage(attacker, target, state) {
    checkAndConsumeInvulnerability(attacker, state);
    addCombatLog(state, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artefatos: +${extra}`);
    if (checkEffectTrigger(attacker)) {
      target.buffs.push({ type: 'stun', duration: 1 });
      addCombatLog(state, `🎯 Tiro Preciso! O alvo foi paralisado.`);
    }
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target, attacker.playerId);
  }
};

// ══════════════════════════════════════════════
//  Assassino
// ══════════════════════════════════════════════

const AssassinoBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist, state, useSpecial) {
    if (useSpecial) {
      const isLeap = dist === 2 && isDiagonal(unit.position, target);
      if (!isLeap) throw new Error("Transposição Etérea: Apenas diagonal de 2 casas.");
    } else {
      if (dist !== 1) throw new Error("Assassino (Normal): Move apenas 1 casa.");
    }
  },
  isValidMovePosition(unit, targetPos, dist, state, useSpecial) {
    if (useSpecial) return dist === 2 && isDiagonal(unit.position, targetPos);
    return dist === 1;
  },
  validateAttack(attacker, target, dist, rangeBonus, useSpecial) {
    if (useSpecial) {
      const isLeap = dist === 2 && isDiagonal(attacker.position, target.position);
      if (!isLeap) throw new Error("Transposição Etérea: Requer destino a 2 casas diagonais.");
    } else {
      if (dist > 1 + rangeBonus) throw new Error("Assassino (Normal): Ataca apenas colado.");
    }
  },
  applyDamage(attacker, target, state, dist, useSpecial) {
    checkAndConsumeInvulnerability(attacker, state);
    const originalPos = { ...attacker.position };
    const targetPos = { ...target.position };

    addCombatLog(state, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    
    applyDoT(target, 'bleed', 2, 1);
    addCombatLog(state, `🩸 Toque Letal Aplicado! (Sangramento)`);
    
    if (useSpecial) {
      applyFinalDamage(target, 2, state);
      addCombatLog(state, `🦘 Salto Etéreo: +2 de dano bônus!`);
    }
    
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artefatos: +${extra}`);

    applyFuryEffect(attacker, state);
    const targetDied = target.hp <= 0;
    handleUnitDeath(state, target, attacker.playerId);

    if (useSpecial) {
      if (targetDied) {
        attacker.position = targetPos;
        addCombatLog(state, `🦘 Transposição: Ocupou lugar do alvo.`);
      } else {
        const neighbors = getHexNeighbors(targetPos);
        let landed = false;
        for (const n of neighbors) {
          const collision = Object.values(state.boardUnits).some(u => u.position.q === n.q && u.position.r === n.r);
          if (isInsideBoard(n) && !collision) {
            attacker.position = n;
            landed = true;
            addCombatLog(state, `🦘 Transposição: Aterrizou ao lado.`);
            break;
          }
        }
        if (!landed) {
          attacker.position = originalPos;
          addCombatLog(state, `🦘 Sem espaço para transpor! Voltou à origem.`);
        }
      }
    }
  }
};

// ══════════════════════════════════════════════
//  Mago
// ══════════════════════════════════════════════

const MagoBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist) {
    if (dist > maxMoveDist) throw new Error("Mago só move 1.");
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist === 1;
  },
  validateAttack(attacker, target, dist, rangeBonus) {
    if (dist > 3 + rangeBonus) throw new Error("Mago: Alcance 3.");
  },
  applyDamage(attacker, target, state) {
    checkAndConsumeInvulnerability(attacker, state);
    const splashRadius = (attacker.equippedArtifacts || []).includes('art_anel') ? 2 : 1;
    addCombatLog(state, `🔮 Cataclismo Arcano: Iníciando explosão!`);
    
    // Lista de unidades a serem afetadas ANTES de modificar o HP (para evitar problemas de iteração)
    const affectedUnits: Unit[] = [];
    for (const uId in state.boardUnits) {
      const u = state.boardUnits[uId];
      if (getHexDistance(target.position, u.position) <= splashRadius) {
        affectedUnits.push(u);
      }
    }

    affectedUnits.forEach(u => {
      applyFinalDamage(u, attacker.attack, state);
      if (u.id === target.id) {
        addCombatLog(state, `Alvo Principal: ${attacker.attack}`);
      } else {
        addCombatLog(state, `Dano em Área em ${u.unitClass}: ${attacker.attack}`);
      }
      if (Math.random() < 0.3) {
        applyDoT(u, 'burn', 2, 1);
        addCombatLog(state, `🔥 Chama Rúnica: Incendiou o ${u.unitClass}!`);
      }
      handleUnitDeath(state, u, attacker.playerId);
    });
    applyFuryEffect(attacker, state);
  }
};

// ══════════════════════════════════════════════
//  Clérigo
// ══════════════════════════════════════════════

const ClerigoBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist) {
    if (dist > maxMoveDist) throw new Error("Clérigo só move 1.");
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist === 1;
  },
  validateAttack(attacker, target, dist, rangeBonus) {
    if (dist > 1 + rangeBonus) throw new Error("Clérigo: Alcance 1.");
  },
  applyDamage(attacker, target, state) {
    checkAndConsumeInvulnerability(attacker, state);
    addCombatLog(state, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artefatos: +${extra}`);
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target, attacker.playerId);
  }
};

// ══════════════════════════════════════════════
//  Estrutura (Muralhas, etc)
// ══════════════════════════════════════════════

const EstruturaBehavior: UnitBehavior = {
  validateMove() { throw new Error("Estruturas não podem se mover."); },
  isValidMovePosition() { return false; },
  validateAttack() { throw new Error("Estruturas não podem atacar."); },
  applyDamage(attacker, target, state) {
    // Apenas aplica o dano no alvo (muralha), sem contra-ataque ou lógica complexa
    addCombatLog(state, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artefatos: +${extra}`);
    handleUnitDeath(state, target, attacker.playerId);
  }
};

// ══════════════════════════════════════════════
//  Registry
// ══════════════════════════════════════════════

export const UNIT_BEHAVIORS: Record<UnitClass, UnitBehavior> = {
  Rei: ReiBehavior,
  Cavaleiro: CavaleiroBehavior,
  Lanceiro: LanceiroBehavior,
  Arqueiro: ArqueiroBehavior,
  Assassino: AssassinoBehavior,
  Mago: MagoBehavior,
  Clerigo: ClerigoBehavior,
  Estrutura: EstruturaBehavior,
};
