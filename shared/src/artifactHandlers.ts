import type { Unit } from './types';

// ══════════════════════════════════════════════
//  Interface do Handler de Artefato
// ══════════════════════════════════════════════

export interface ArtifactHandler {
  /** Aplica efeitos instantâneos ao equipar. Modifica unit in-place. */
  onEquip(unit: Unit): void;
}

// ══════════════════════════════════════════════
//  Handlers Individuais
// ══════════════════════════════════════════════

const EscudoDeCarvalho: ArtifactHandler = {
  onEquip(unit) {
    unit.maxHp += 1;
    unit.hp += 1;
    unit.buffs.push({ type: 'shield', duration: 99, value: 3 });
  }
};

const LaminaDoCarrasco: ArtifactHandler = {
  onEquip(unit) {
    unit.attack += 2;
  }
};

const CoroaDoRegente: ArtifactHandler = {
  onEquip(unit) {
    unit.maxHp += 3;
    unit.hp += 3;
  }
};

const EstandarteDaCoragem: ArtifactHandler = {
  onEquip(unit) {
    unit.buffs.push({ type: 'taunt', duration: 99 });
  }
};

// Artefatos sem efeito instantâneo (efeitos passivos verificados em runtime)
const PassiveOnly: ArtifactHandler = {
  onEquip() { /* Efeito passivo — verificado em ataque/movimento */ }
};

// ══════════════════════════════════════════════
//  Registry
// ══════════════════════════════════════════════

export const ARTIFACT_REGISTRY: Record<string, ArtifactHandler> = {
  'art_carvalho': EscudoDeCarvalho,
  'art_lamina': LaminaDoCarrasco,
  'art_arco': PassiveOnly,        // +1 alcance (verificado em attack)
  'art_adagas': PassiveOnly,      // +1 dano real (verificado em applyDamage)
  'art_anel': PassiveOnly,        // +1 alcance alquimista/clerigo (verificado em attack)
  'art_corcel': PassiveOnly,      // +1 movimento (verificado em moveTo)
  'art_coroa': CoroaDoRegente,
  'art_tomo': PassiveOnly,        // +1 cura + limpeza (verificado em heal/endTurn)
  'art_amuleto': {
    onEquip(unit) {
      unit.buffs.push({ type: 'invulnerable', duration: 2 });
    }
  },
  'art_estandarte': EstandarteDaCoragem,
};
