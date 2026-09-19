import type { GameState, Unit, UnitClass } from './types';
import { getHexDistance, getHexNeighbors, isLine, getLineOfSight, isDiagonal, isInsideBoard } from './hexMath';
import { getClassDisplayName } from './cardLibrary';
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
    if (obstacle) throw new Error("Trajectory blocked!");
  }
}

/**
 * Dano REAL das Adagas Envenenadas: ignora escudos de propósito (GDD §6), mas
 * respeita `invulnerable`, que nega qualquer dano.
 */
function applyArtifactDamageEffects(attacker: Unit, target: Unit): number {
  let extraDamage = 0;
  if ((attacker.equippedArtifacts || []).includes('art_adagas')) {
    if (target.buffs.some(b => b.type === 'invulnerable')) return 0;
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
    addCombatLog(state, `🛡️ Invulnerable Target! (Damage Negated)`, `🛡️ Alvo Invulnerável! (Dano Negado)`);
    return;
  }

  const shieldIndex = target.buffs.findIndex(b => b.type === 'shield');
  
  if (shieldIndex !== -1) {
    const shield = target.buffs[shieldIndex];
    
    // Escudo de Carvalho (ou outros escudos com 'value')
    if (shield.value !== undefined) {
      const absorbed = Math.min(damage, shield.value);
      const remainingDamage = damage - absorbed;
      
      addCombatLog(state, `🛡️ Shield absorbed ${absorbed} damage!`, `🛡️ Escudo absorveu ${absorbed} de dano!`);
      
      // Decai a proteção: 3 -> 2 -> 1 -> remove
      if (shield.value > 1) {
        shield.value -= 1;
      } else {
        target.buffs.splice(shieldIndex, 1);
        addCombatLog(state, `🛡️ The shield couldn't withstand the hit and broke!`, `🛡️ O escudo não resistiu ao golpe e se quebrou!`);
      }
      
      if (remainingDamage > 0) {
        target.hp -= remainingDamage;
      }
      return;
    }

    // Escudo padrão (Aura Rúnica / Escudo Sagrado) - Absorve 1 hit total
    target.buffs.splice(shieldIndex, 1);
    addCombatLog(state, `🛡️ Divine Protection! The shield absorbed the full impact.`, `🛡️ Proteção Divina! O escudo absorveu todo o impacto.`);
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
    addCombatLog(state, `🩸 Battle Fury: ${attacker.unitClass} lost 1 HP.`, `🩸 Fúria de Batalha: ${attacker.unitClass} perdeu 1 de HP.`);
    handleUnitDeath(state, attacker);
  }
}

function checkAndConsumeInvulnerability(attacker: Unit, state: GameState): void {
  if (attacker.buffs.some(b => b.type === 'invulnerable')) {
    attacker.buffs = attacker.buffs.filter(b => b.type !== 'invulnerable');
    addCombatLog(state, `⚖️ Sacrifice! Invulnerability consumed by the attack.`, `⚖️ Sacrifício! Invulnerabilidade consumida pelo ataque.`);
  }
}

export function addCombatLog(state: GameState, logEn: string, logPt: string): void {
  if (!state.combatLogs) state.combatLogs = [];
  const log = state.language === 'pt' ? logPt : logEn;
  state.combatLogs.push(log);
}

export function handleUnitDeath(state: GameState, unit: Unit): void {
  if (unit.hp <= 0) {
    if (unit.unitClass === 'Rei' && !state.sandboxMode) {
      state.currentPhase = 'GAME_OVER';
      state.winner = unit.playerId === 'p1' ? 'p2' : 'p1';
    }
    delete state.boardUnits[unit.id];
    addCombatLog(
      state,
      `💀 The ${getClassDisplayName(unit.unitClass, 'en')} succumbed and was removed from the field.`,
      `💀 O ${getClassDisplayName(unit.unitClass, 'pt')} sucumbiu e foi removido de campo.`,
    );
  }
}

/**
 * Alcance de movimento da unidade: base da classe + Corcel de Guerra.
 * Usado pelos helpers `isValidMovePosition` para que os realces da UI batam
 * exatamente com o que `moveTo` aceita.
 */
export function maxMoveDistFor(unit: Unit, baseMove: number): number {
  return baseMove + ((unit.equippedArtifacts || []).includes('art_corcel') ? 1 : 0);
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
    if (dist > maxMoveDist) throw new Error(`King only moves up to ${maxMoveDist} hex(es).`);
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist <= maxMoveDistFor(unit, 1);
  },
  validateAttack(attacker, target, dist, rangeBonus) {
    if (dist > 1 + rangeBonus) throw new Error("King only attacks adjacent hexes.");
  },
  applyDamage(attacker, target, state) {
    if (attacker.buffs.some(b => b.type === 'invulnerable')) {
      attacker.buffs = attacker.buffs.filter(b => b.type !== 'invulnerable');
      addCombatLog(state, `⚖️ Invulnerability consumed by the attack!`, `⚖️ Invulnerabilidade consumida pelo ataque!`);
    }

    addCombatLog(state, `Base: ${attacker.attack}`, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artifacts: +${extra}`, `Artefatos: +${extra}`);
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target);
  }
};

// ══════════════════════════════════════════════
//  Cavaleiro
// ══════════════════════════════════════════════

const CavaleiroBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist, state, useSpecial) {
    if (useSpecial) {
      if (dist > 3 || !isLine(unit.position, target)) {
        throw new Error("Iron Charge must be in a straight line up to 3 hexes away.");
      }
    } else {
      if (dist > maxMoveDist) throw new Error(`Knight only moves up to ${maxMoveDist} hex(es).`);
      if (!isLine(unit.position, target)) throw new Error("Knight only moves in a straight line.");
    }
  },
  isValidMovePosition(unit, targetPos, dist, state, useSpecial) {
    if (useSpecial) return dist <= 3 && isLine(unit.position, targetPos);
    // Movimento normal: até dist 2 (ou 3 com corcel) mas SEMPRE em linha reta
    return dist <= maxMoveDistFor(unit, 2) && isLine(unit.position, targetPos);
  },
  validateAttack(attacker, target, dist, rangeBonus, useSpecial, state) {
    if (useSpecial) {
      if (dist > 3 || !isLine(attacker.position, target.position)) {
        throw new Error("Iron Charge in a straight line up to 3 hexes away.");
      }
    } else {
      if (dist > 1 + rangeBonus) throw new Error("Knight only attacks adjacent hexes.");
    }

    // Validação de Pouso do Rompante de Ferro
    if (useSpecial && dist > 1) {
      const line = getLineOfSight(attacker.position, target.position);
      const landingPos = line[line.length - 2];
      const collision = Object.values(state.boardUnits).some(u => 
        u.position.q === landingPos.q && u.position.r === landingPos.r
      );
      if (collision) {
        throw new Error("Charge landing spot is occupied!");
      }
    }
  },
  applyDamage(attacker, target, state, dist, useSpecial) {
    checkAndConsumeInvulnerability(attacker, state);
    let damage = attacker.attack;
    addCombatLog(state, `Base: ${attacker.attack}`, `Base: ${attacker.attack}`);

    if (useSpecial) {
      damage += 2;
      addCombatLog(state, `🐎 Iron Charge: +2 extra impact!`, `🐎 Investida de Ferro: +2 de impacto extra!`);
      const line = getLineOfSight(attacker.position, target.position);
      if (line.length > 2) {
        const landingPos = line[line.length - 2];
        const collision = Object.values(state.boardUnits).some(u => 
          u.position.q === landingPos.q && u.position.r === landingPos.r
        );
        if (!collision) {
          attacker.position = landingPos;
        } else {
          addCombatLog(state, `⚠️ Charge: Landing spot obstructed at the moment of impact!`, `⚠️ Investida: Local de pouso obstruído no momento do impacto!`);
        }
      }
    }
    
    applyFinalDamage(target, damage, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artifacts: +${extra}`, `Artefatos: +${extra}`);

    if ((dist > 1 || useSpecial) && checkEffectTrigger(attacker)) {
      target.buffs.push({ type: 'stun', duration: 1 });
      addCombatLog(state, `💫 The target was stunned by the shock!`, `💫 O alvo foi atordoado pelo choque!`);
    }
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target);
  }
};

// ══════════════════════════════════════════════
//  Lanceiro
// ══════════════════════════════════════════════

const LanceiroBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist, state) {
    if (dist > maxMoveDist || unit.position.r === target.r) {
      throw new Error(state?.language === 'en' ? "Lancer: Moves only forward/backward." : "Lanceiro: Move-se apenas para frente/trás.");
    }
    if (dist > 1 && !hasAmuleto(unit) && isPathBlocked(state, unit.position, target)) {
      throw new Error("Path blocked!");
    }
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist <= maxMoveDistFor(unit, 1) && unit.position.r !== targetPos.r;
  },
  validateAttack(attacker, target, dist, rangeBonus, useSpecial, state) {
    if (!isLine(attacker.position, target.position) || attacker.position.r === target.position.r) {
      throw new Error("Lancer: Attacks only in a vertical line.");
    }
    if (dist > 2 + rangeBonus) throw new Error("Lancer: Maximum range 2.");
    if (dist > 1) checkTrajectory(state, attacker, target, 1);
  },
  applyDamage(attacker, target, state, dist) {
    checkAndConsumeInvulnerability(attacker, state);
    addCombatLog(state, `Base: ${attacker.attack}`, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);

    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artifacts: +${extra}`, `Artefatos: +${extra}`);

    if (checkEffectTrigger(attacker)) {
      const dq = (target.position.q - attacker.position.q) / dist;
      const dr = (target.position.r - attacker.position.r) / dist;
      const pushTarget = { q: target.position.q + dq, r: target.position.r + dr, s: -(target.position.q + dq) - (target.position.r + dr) };
      const collision = Object.values(state.boardUnits).some(u => u.position.q === pushTarget.q && u.position.r === pushTarget.r);
      if (isInsideBoard(pushTarget) && !collision) {
        target.position = pushTarget;
        addCombatLog(state, `💨 Phalanx Impact: Pushed the target!`, `💨 Impacto de Falange: Empurrou o alvo!`);
      }
    }
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target);
  }
};

// ══════════════════════════════════════════════
//  Arqueiro
// ══════════════════════════════════════════════

const ArqueiroBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist) {
    if (dist > maxMoveDist) throw new Error(`Archer moves up to ${maxMoveDist} hex(es).`);
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist <= maxMoveDistFor(unit, 1);
  },
  validateAttack(attacker, target, dist, rangeBonus, useSpecial, state) {
    if (dist > 3 + rangeBonus) throw new Error("Archer: Range 3.");
    // Tiros precisam de linha de visão livre (mesma regra do Lanceiro).
    checkTrajectory(state, attacker, target, 1);
  },
  applyDamage(attacker, target, state) {
    checkAndConsumeInvulnerability(attacker, state);
    addCombatLog(state, `Base: ${attacker.attack}`, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artifacts: +${extra}`, `Artefatos: +${extra}`);
    if (checkEffectTrigger(attacker)) {
      target.buffs.push({ type: 'stun', duration: 1 });
      addCombatLog(state, `🎯 Precision Shot! The target was paralyzed.`, `🎯 Tiro Preciso! O alvo foi paralisado.`);
    }
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target);
  }
};

// ══════════════════════════════════════════════
//  Assassino
// ══════════════════════════════════════════════

const AssassinoBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist, state, useSpecial) {
    if (useSpecial) {
      const isLeap = dist === 2 && isDiagonal(unit.position, target);
      if (!isLeap) throw new Error("Ethereal Shift: Only 2 diagonal hexes.");
    } else {
      if (dist !== 1) throw new Error("Assassin (Normal): Moves only 1 hex.");
    }
  },
  isValidMovePosition(unit, targetPos, dist, state, useSpecial) {
    if (useSpecial) return dist === 2 && isDiagonal(unit.position, targetPos);
    return dist === 1;
  },
  validateAttack(attacker, target, dist, rangeBonus, useSpecial, state) {
    if (useSpecial) {
      const isLeap = dist === 2 && isDiagonal(attacker.position, target.position);
      if (!isLeap) throw new Error(state?.language === 'en' ? "Ethereal Shift: Requires destination 2 diagonal hexes away." : "Salto Diagonal: Requer destino a 2 casas diagonais.");
    } else {
      if (dist > 1 + rangeBonus) throw new Error("Assassin (Normal): Attacks only adjacent hexes.");
    }
  },
  applyDamage(attacker, target, state, dist, useSpecial) {
    checkAndConsumeInvulnerability(attacker, state);
    const originalPos = { ...attacker.position };
    const targetPos = { ...target.position };

    addCombatLog(state, `Base: ${attacker.attack}`, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    
    applyDoT(target, 'bleed', 2, 1);
    addCombatLog(state, `🩸 Lethal Touch Applied! (Bleeding)`, `🩸 Toque Letal Aplicado! (Sangramento)`);
    
    if (useSpecial) {
      applyFinalDamage(target, 2, state);
      addCombatLog(state, `🦘 Ethereal Leap: +2 bonus damage!`, `🦘 Salto Etéreo: +2 de dano bônus!`);
    }
    
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artifacts: +${extra}`, `Artefatos: +${extra}`);

    applyFuryEffect(attacker, state);
    const targetDied = target.hp <= 0;
    handleUnitDeath(state, target);

    if (useSpecial) {
      if (targetDied) {
        attacker.position = targetPos;
        addCombatLog(state, `🦘 Ethereal Shift: Occupied the target's spot.`, `🦘 Deslocamento Etéreo: Ocupou o lugar do alvo.`);
      } else {
        const neighbors = getHexNeighbors(targetPos);
        let landed = false;
        for (const n of neighbors) {
          const collision = Object.values(state.boardUnits).some(u => u.position.q === n.q && u.position.r === n.r);
          if (isInsideBoard(n) && !collision) {
            attacker.position = n;
            landed = true;
            addCombatLog(state, `🦘 Ethereal Shift: Landed nearby.`, `🦘 Deslocamento Etéreo: Pousou por perto.`);
            break;
          }
        }
        if (!landed) {
          attacker.position = originalPos;
          addCombatLog(state, `🦘 No space to shift! Returned to origin.`, `🦘 Sem espaço para se deslocar! Retornou à origem.`);
        }
      }
    }
  }
};

// ══════════════════════════════════════════════
//  Alquimista
// ══════════════════════════════════════════════

const AlquimistaBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist) {
    if (dist > maxMoveDist) throw new Error(`Alchemist moves up to ${maxMoveDist} hex(es).`);
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist <= maxMoveDistFor(unit, 1);
  },
  validateAttack(attacker, target, dist, rangeBonus, useSpecial, state) {
    if (dist > 3 + rangeBonus) throw new Error("Alchemist: Range 3.");
    // O frasco também precisa de linha de visão livre até o alvo.
    checkTrajectory(state, attacker, target, 1);
  },
  applyDamage(attacker, target, state) {
    checkAndConsumeInvulnerability(attacker, state);
    const splashRadius = (attacker.equippedArtifacts || []).includes('art_anel') ? 2 : 1;
    addCombatLog(state, `⚗️ Arcane Cataclysm: Initiating reaction!`, `⚗️ Cataclismo Arcano: Iniciando reação!`);
    
    // Lista de TODAS as unidades afetadas pelo splash (inclui aliados — friendly fire intencional)
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
        addCombatLog(state, `Main Target: ${attacker.attack}`, `Alvo Principal: ${attacker.attack}`);
      } else {
        addCombatLog(state, `AoE Damage on ${u.unitClass}: ${attacker.attack}`, `Dano em Área em ${u.unitClass}: ${attacker.attack}`);
      }
      if (Math.random() < 0.3) {
        applyDoT(u, 'burn', 2, 1);
        addCombatLog(state, `🔥 Alchemical Fire: Ignited the ${u.unitClass}!`, `🔥 Fogo Alquímico: Incendiou o ${u.unitClass}!`);
      }
      handleUnitDeath(state, u);
    });
    applyFuryEffect(attacker, state);
  }
};

// ══════════════════════════════════════════════
//  Clérigo
// ══════════════════════════════════════════════

const ClerigoBehavior: UnitBehavior = {
  validateMove(unit, target, dist, maxMoveDist) {
    if (dist > maxMoveDist) throw new Error(`Cleric moves up to ${maxMoveDist} hex(es).`);
  },
  isValidMovePosition(unit, targetPos, dist) {
    return dist <= maxMoveDistFor(unit, 1);
  },
  validateAttack(attacker, target, dist, rangeBonus) {
    if (dist > 1 + rangeBonus) throw new Error("Cleric: Range 1.");
  },
  applyDamage(attacker, target, state) {
    checkAndConsumeInvulnerability(attacker, state);
    addCombatLog(state, `Base: ${attacker.attack}`, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artifacts: +${extra}`, `Artefatos: +${extra}`);
    applyFuryEffect(attacker, state);
    handleUnitDeath(state, target);
  }
};

// ══════════════════════════════════════════════
//  Estrutura (Muralhas, etc)
// ══════════════════════════════════════════════

const EstruturaBehavior: UnitBehavior = {
  validateMove() { throw new Error("Structures cannot move."); },
  isValidMovePosition() { return false; },
  validateAttack() { throw new Error("Structures cannot attack."); },
  applyDamage(attacker, target, state) {
    // Apenas aplica o dano no alvo (muralha), sem contra-ataque ou lógica complexa
    addCombatLog(state, `Base: ${attacker.attack}`, `Base: ${attacker.attack}`);
    applyFinalDamage(target, attacker.attack, state);
    const extra = applyArtifactDamageEffects(attacker, target);
    if (extra > 0) addCombatLog(state, `Artifacts: +${extra}`, `Artefatos: +${extra}`);
    handleUnitDeath(state, target);
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
  Alquimista: AlquimistaBehavior,
  Mago: AlquimistaBehavior,
  Clerigo: ClerigoBehavior,
  Estrutura: EstruturaBehavior,
};
