import { UnitCard, Card } from './types';

export const UNIT_DESCRIPTIONS: Record<string, { en: string, pt: string }> = {
  'Rei': {
    en: 'Aura of Fear — Adjacent enemies have a chance to miss their attacks. Chance increases by +1% per round in the field.',
    pt: 'Aura de Medo — Inimigos adjacentes têm chance de errar seus ataques. A chance aumenta em +1% por turno no campo.'
  },
  'Cavaleiro': {
    en: 'Iron Charge (3 Mana) — Charges in a straight line and attacks with +2 Damage. Chance to Stun. (Cooldown: 2 Cycles)',
    pt: 'Investida de Ferro (3 Mana) — Avança em linha reta e ataca com +2 de Dano. Chance de Atordoar. (Recarga: 2 Ciclos)'
  },
  'Lanceiro': {
    en: 'Phalanx Impact — On hit, has a chance to push the target 1 hex back in the same direction.',
    pt: 'Impacto de Falange — Ao atingir, tem chance de empurrar o alvo 1 hexágono para trás na mesma direção.'
  },
  'Arqueiro': {
    en: 'Precision Shot — Ranged attack (range 3). Chance to Stun the target.',
    pt: 'Tiro Preciso — Ataque à distância (alcance 3). Chance de Atordoar o alvo.'
  },
  'Assassino': {
    en: 'Lethal Touch — Every attack applies Bleed (1 dmg/turn, 2 turns).\\nEthereal Shift (3 Mana) — Leaps 2 hexes and attacks with +2 Bonus Damage. (Cooldown: 2 Cycles)',
    pt: 'Toque Letal — Todo ataque aplica Sangramento (1 dano/turno, 2 turnos).\\nDeslocamento Etéreo (3 Mana) — Salta 2 hexágonos e ataca com +2 de Dano Bônus. (Recarga: 2 Ciclos)'
  },
  'Alquimista': {
    en: 'Arcane Cataclysm — AoE Damage on target and adjacent hexes (radius 1). Chance to apply Burn (1 dmg/turn, 2 turns).',
    pt: 'Cataclismo Arcano — Dano em área no alvo e hexágonos adjacentes (raio 1). Chance de aplicar Queimadura (1 dano/turno, 2 turnos).'
  },
  'Clerigo': {
    en: 'Prayer of Hope — Restores 2 HP to an adjacent ally. Chance to grant Holy Shield.\\nCall of Faith — Attempts to convert an adjacent enemy (chance scales per round).',
    pt: 'Prece de Esperança — Restaura 2 de HP para um aliado adjacente. Chance de conceder Escudo Sagrado.\\nChamado da Fé — Tenta converter um inimigo adjacente (chance escala por turno).'
  }
};

export const UNIT_STATS: Record<string, { class: string, name: { en: string, pt: string }, hp: number, attack: number, mana: number }> = {
  'unit_rei': { class: 'Rei', name: { en: 'King', pt: 'Rei' }, hp: 6, attack: 1, mana: 0 },
  'unit_cavaleiro': { class: 'Cavaleiro', name: { en: 'Knight', pt: 'Cavaleiro' }, hp: 5, attack: 3, mana: 4 },
  'unit_lanceiro': { class: 'Lanceiro', name: { en: 'Lancer', pt: 'Lanceiro' }, hp: 4, attack: 1, mana: 1 },
  'unit_arqueiro': { class: 'Arqueiro', name: { en: 'Archer', pt: 'Arqueiro' }, hp: 2, attack: 1, mana: 1 },
  'unit_assassino': { class: 'Assassino', name: { en: 'Assassin', pt: 'Assassino' }, hp: 3, attack: 2, mana: 2 },
  'unit_alquimista': { class: 'Alquimista', name: { en: 'Alchemist', pt: 'Alquimista' }, hp: 3, attack: 1, mana: 3 },
  'unit_clerigo': { class: 'Clerigo', name: { en: 'Cleric', pt: 'Clérigo' }, hp: 4, attack: 0, mana: 3 }
};

export const ARTIFACTS: Card[] = [
  { id: 'art_carvalho', name: 'Oak Shield', type: 'Artifact', manaCost: 2 },
  { id: 'art_lamina', name: 'Executioner Blade', type: 'Artifact', manaCost: 3 },
  { id: 'art_arco', name: 'Elven Longbow', type: 'Artifact', manaCost: 2 },
  { id: 'art_adagas', name: 'Poisoned Daggers', type: 'Artifact', manaCost: 2 },
  { id: 'art_anel', name: 'Archmage Ring', type: 'Artifact', manaCost: 3 },
  { id: 'art_corcel', name: 'War Steed', type: 'Artifact', manaCost: 2 },
  { id: 'art_coroa', name: 'Regent Crown', type: 'Artifact', manaCost: 3 },
  { id: 'art_tomo', name: 'Holy Tome', type: 'Artifact', manaCost: 1 },
  { id: 'art_amuleto', name: 'Amulet of Illusion', type: 'Artifact', manaCost: 2 },
  { id: 'art_estandarte', name: 'Banner of Courage', type: 'Artifact', manaCost: 3 },
];

export const ARTIFACT_NAMES: Record<string, { en: string, pt: string }> = {
  'art_carvalho': { en: 'Oak Shield', pt: 'Escudo de Carvalho' },
  'art_lamina': { en: 'Executioner Blade', pt: 'Lâmina do Carrasco' },
  'art_arco': { en: 'Elven Longbow', pt: 'Arco Longo Élfico' },
  'art_adagas': { en: 'Poisoned Daggers', pt: 'Adagas Envenenadas' },
  'art_anel': { en: 'Archmage Ring', pt: 'Anel do Arquimago' },
  'art_corcel': { en: 'War Steed', pt: 'Corcel de Guerra' },
  'art_coroa': { en: 'Regent Crown', pt: 'Coroa do Regente' },
  'art_tomo': { en: 'Holy Tome', pt: 'Tomo Sagrado' },
  'art_amuleto': { en: 'Amulet of Illusion', pt: 'Amuleto da Ilusão' },
  'art_estandarte': { en: 'Banner of Courage', pt: 'Estandarte da Coragem' },
};

export const ARTIFACT_DESCRIPTIONS: Record<string, { en: string, pt: string }> = {
  'art_carvalho': {
    en: 'Grants +1 Max HP and a permanent Shield that absorbs 3 damage on the next attack, 2 damage on the second, and 1 damage on the third.',
    pt: 'Concede +1 de HP Máximo e um Escudo permanente que absorve 3 de dano no próximo ataque, 2 no segundo e 1 no terceiro.'
  },
  'art_lamina': { en: 'Increases Attack by +2.', pt: 'Aumenta o Ataque em +2.' },
  'art_arco': { en: 'Increases attack range by +1.', pt: 'Aumenta o alcance do ataque em +1.' },
  'art_adagas': { en: 'Attacks deal +1 true damage and apply Poison.', pt: 'Ataques causam +1 de dano real e aplicam Veneno.' },
  'art_anel': { en: 'Increases spell/heal range and the Mage blast radius.', pt: 'Aumenta o alcance de feitiços/curas e o raio de explosão do Alquimista.' },
  'art_corcel': { en: 'Allows moving 2 hexes. Knights gain immunity to conversion.', pt: 'Permite mover 2 hexágonos. Cavaleiros ganham imunidade a conversão.' },
  'art_coroa': { en: 'Grants +3 Max HP and doubles the King Aura of Fear radius.', pt: 'Concede +3 de HP Máximo e dobra o raio da Aura de Medo do Rei.' },
  'art_tomo': { en: 'Increases healing by +1 and removes negative effects at the start of the turn.', pt: 'Aumenta a cura em +1 e remove efeitos negativos no início do turno.' },
  'art_amuleto': { en: 'The unit becomes invulnerable to damage. Attacking removes this effect.', pt: 'A unidade fica invulnerável a danos. Atacar remove este efeito.' },
  'art_estandarte': { en: 'The unit gains Taunt, forcing nearby enemies (2 hexes) to attack it.', pt: 'A unidade ganha Provocar, forçando inimigos próximos (2 hexágonos) a atacá-la.' },
};

export const SPELLS: Card[] = [
  { id: 'spl_aurarunica', name: 'Runic Aura', type: 'Spell', manaCost: 2 },
  { id: 'spl_raio', name: 'Chain Lightning', type: 'Spell', manaCost: 3 },
  { id: 'spl_transfusao', name: 'Shadow Transfusion', type: 'Spell', manaCost: 2 },
  { id: 'spl_nevoa', name: 'Thick Fog', type: 'Spell', manaCost: 2 },
  { id: 'spl_muralha', name: 'Ice Wall', type: 'Spell', manaCost: 2 },
  { id: 'spl_passos', name: 'Wind Steps', type: 'Spell', manaCost: 1 },
  { id: 'spl_meteoro', name: 'Meteor Shower', type: 'Spell', manaCost: 4 },
  { id: 'spl_bencao', name: 'Divine Blessing', type: 'Spell', manaCost: 3 },
  { id: 'spl_raizes', name: 'Earth Roots', type: 'Spell', manaCost: 2 },
  { id: 'spl_furia', name: 'Battle Fury', type: 'Spell', manaCost: 1 },
  { id: 'spl_reforcos', name: 'Call for Reinforcements', type: 'Spell', manaCost: 3 },
];

export const SPELL_NAMES: Record<string, { en: string, pt: string }> = {
  'spl_aurarunica': { en: 'Runic Aura', pt: 'Aura Rúnica' },
  'spl_raio': { en: 'Chain Lightning', pt: 'Cadeia de Relâmpagos' },
  'spl_transfusao': { en: 'Shadow Transfusion', pt: 'Transfusão Sombria' },
  'spl_nevoa': { en: 'Thick Fog', pt: 'Névoa Espessa' },
  'spl_muralha': { en: 'Ice Wall', pt: 'Muralha de Gelo' },
  'spl_passos': { en: 'Wind Steps', pt: 'Passos de Vento' },
  'spl_meteoro': { en: 'Meteor Shower', pt: 'Chuva de Meteoros' },
  'spl_bencao': { en: 'Divine Blessing', pt: 'Bênção Divina' },
  'spl_raizes': { en: 'Earth Roots', pt: 'Raízes da Terra' },
  'spl_furia': { en: 'Battle Fury', pt: 'Fúria de Batalha' },
  'spl_reforcos': { en: 'Call for Reinforcements', pt: 'Chamado dos Reforços' },
};

export const SPELL_DESCRIPTIONS: Record<string, { en: string, pt: string }> = {
  'spl_aurarunica': { en: 'Grants +2 Max HP and a shield that protects against the next incoming attack.', pt: 'Concede +2 de HP Máximo e um escudo que protege contra o próximo ataque recebido.' },
  'spl_raio': { en: 'Deals 2 damage to a target and 1 damage to an adjacent enemy.', pt: 'Causa 2 de dano a um alvo e 1 de dano a um inimigo adjacente.' },
  'spl_transfusao': { en: 'Drains 2 HP from a unit to heal 2 HP of your King.', pt: 'Drena 2 de HP de uma unidade para curar 2 de HP do seu Rei.' },
  'spl_nevoa': { en: 'Makes an ally immune to ranged attacks for 1 turn.', pt: 'Torna um aliado imune a ataques à distância por 1 turno.' },
  'spl_muralha': { en: 'Summons up to 3 ice barriers with 6 HP each in empty hexes (center + adjacent).', pt: 'Invoca até 3 barreiras de gelo com 6 de HP cada em hexágonos vazios (centro + adjacentes).' },
  'spl_passos': { en: 'Allows a unit to act again (resets movement/attack).', pt: 'Permite que uma unidade aja novamente (reinicia movimento/ataque).' },
  'spl_meteoro': { en: 'Deals 2 damage to the center and 1 damage to all adjacent hexes.', pt: 'Causa 2 de dano no centro e 1 de dano a todos os hexágonos adjacentes.' },
  'spl_bencao': { en: 'Heals 3 HP and removes all negative effects from an ally.', pt: 'Cura 3 de HP e remove todos os efeitos negativos de um aliado.' },
  'spl_raizes': { en: 'Roots an enemy unit for 1 turn (prevents movement and impact abilities).', pt: 'Enraíza uma unidade inimiga por 1 turno (impede movimento e habilidades de impacto).' },
  'spl_furia': { en: 'The unit gains +2 Attack, but loses 1 HP when attacking.', pt: 'A unidade ganha +2 de Ataque, mas perde 1 de HP ao atacar.' },
  'spl_reforcos': { en: 'Adds 2 Lancer cards to your deck and hand.', pt: 'Adiciona 2 cartas de Lanceiro ao seu baralho e mão.' },
};

/**
 * Versão tolerante de getUnitCard: devolve undefined em vez de lançar quando o id
 * não é de unidade. Use sempre que o id puder ser de feitiço/artefato.
 */
export function tryGetUnitCard(idOrClass: string, lang: 'en' | 'pt' = 'en'): UnitCard | undefined {
  try {
    return getUnitCard(idOrClass, lang);
  } catch {
    return undefined;
  }
}

/**
 * Nome da classe no idioma pedido ("Lanceiro" -> "Lancer").
 * Os logs usavam `unit.unitClass` cru, que é sempre o identificador interno em
 * português e destoava no modo inglês.
 */
export function getClassDisplayName(unitClass: string, lang: 'en' | 'pt' = 'en'): string {
  return tryGetUnitCard(unitClass, lang)?.name ?? unitClass;
}

export function getUnitCard(idOrClass: string, lang: 'en' | 'pt' = 'en'): UnitCard {
  // Retro-compatibilidade se a chamada vier pela classe crua (ex: "Cavaleiro" na Forja/UI)
  const rawClassFallback: Record<string, string> = {
    'Rei': 'unit_rei',
    'Cavaleiro': 'unit_cavaleiro',
    'Lanceiro': 'unit_lanceiro',
    'Arqueiro': 'unit_arqueiro',
    'Assassino': 'unit_assassino',
    'Mago': 'unit_alquimista',
    'Alquimista': 'unit_alquimista',
    'Clerigo': 'unit_clerigo'
  };

  if (rawClassFallback[idOrClass]) {
    idOrClass = rawClassFallback[idOrClass];
  }

  // Se passarem um hero_ id antigo, tenta mapear para o genérico
  if (idOrClass.startsWith('hero_')) {
    const heroToGeneric: Record<string, string> = {
      'hero_balduino': 'unit_rei',
      'hero_leonidas': 'unit_rei',
      'hero_joana': 'unit_cavaleiro',
      'hero_marshall': 'unit_cavaleiro',
      'hero_elcid': 'unit_lanceiro',
      'hero_landsknecht': 'unit_lanceiro',
      'hero_robin': 'unit_arqueiro',
      'hero_nasu': 'unit_arqueiro',
      'hero_hassan': 'unit_assassino',
      'hero_hanzo': 'unit_assassino',
      'hero_bacon': 'unit_alquimista',
      'hero_simiao': 'unit_alquimista',
      'hero_richelieu': 'unit_clerigo',
      'hero_urbano': 'unit_clerigo'
    };
    idOrClass = heroToGeneric[idOrClass] || 'unit_rei';
  }

  const unit = UNIT_STATS[idOrClass];
  if (!unit) {
    throw new Error(`Unidade não encontrada: ${idOrClass}`);
  }

  return {
    id: idOrClass,
    name: lang === 'pt' ? unit.name.pt : unit.name.en,
    type: 'Unit',
    unitClass: unit.class as any,
    baseHp: unit.hp,
    baseAttack: unit.attack,
    manaCost: unit.mana
  };
}
