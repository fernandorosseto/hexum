import type { GameState } from './types';
import type { HexCoordinates } from './hexMath';
import { getHexDistance } from './hexMath';
import { UNIT_BEHAVIORS } from './unitBehaviors';

/**
 * Calcula quais unidades inimigas podem ser atacadas pela unidade selecionada.
 * Retorna as posições dos alvos válidos para indicadores visuais na UI.
 */
export function getValidAttackTargets(state: GameState, unitId: string, useSpecial: boolean = false): HexCoordinates[] {
  const unit = state.boardUnits[unitId];
  if (!unit) return [];
  
  // No sandbox, ignoramos travas de enjoo e ação para permitir testes rápidos
  if (!state.sandboxMode) {
    if (unit.summoningSickness || !unit.canAttack) return [];
  }

  const isStunned = unit.buffs.some(b => b.type === 'stun');
  const isRooted = unit.buffs.some(b => b.type === 'rooted');

  if (isStunned) return [];
  if (useSpecial && (isRooted || unit.abilityCooldown > 0)) return [];

  const targets: HexCoordinates[] = [];

  let rangeBonus = 0;
  if ((unit.equippedArtifacts || []).includes('art_arco')) rangeBonus += 1;
  if ((unit.equippedArtifacts || []).includes('art_anel') && (unit.unitClass === 'Alquimista' || unit.unitClass === 'Clerigo')) rangeBonus += 1;

  const behavior = UNIT_BEHAVIORS[unit.unitClass];

  for (const targetId in state.boardUnits) {
    const target = state.boardUnits[targetId];
    if (target.playerId === unit.playerId) continue;

    const dist = getHexDistance(unit.position, target.position);

    if (target.buffs.some(b => b.type === 'immune_ranged') && dist > 1) continue;

    // Tenta validar o ataque atualizado (normal ou especial dependendo do frontend)
    let valid = false;
    try {
      behavior.validateAttack(unit, target, dist, rangeBonus, useSpecial, state);
      valid = true;
    } catch { /* não é alvo válido */ }

    if (valid) targets.push(target.position);
  }

  // Se houver inimigos com Provocar a até 2 casas, restringir alvos apenas para eles
  const tauntUnits = Object.values(state.boardUnits).filter(u => 
    u.playerId !== unit.playerId && 
    u.buffs.some(b => b.type === 'taunt') && 
    getHexDistance(unit.position, u.position) <= 2
  );

  if (tauntUnits.length > 0) {
    const tauntPositions = tauntUnits.map(u => u.position);
    // Filtrar apenas alvos originais que também possuam Provocar
    return targets.filter(pos => tauntPositions.some(tp => tp.q === pos.q && tp.r === pos.r));
  }

  return targets;
}
