import { UnitCard, Card } from './types';

export const UNIT_DESCRIPTIONS: Record<string, string> = {
  'Rei': 'Aura of Fear — Adjacent enemies have a chance to miss their attacks. Chance increases by +1% per round in the field.',
  'Cavaleiro': 'Iron Charge (3 Mana) — Charges in a straight line and attacks with +2 Damage. Chance to Stun. (Cooldown: 2 Cycles)',
  'Lanceiro': 'Phalanx Impact — On hit, has a chance to push the target 1 hex back in the same direction.',
  'Arqueiro': 'Precision Shot — Ranged attack (range 3). Chance to Stun the target.',
  'Assassino': 'Lethal Touch — Every attack applies Bleed (1 dmg/turn, 2 turns).\\nEthereal Shift (3 Mana) — Leaps 2 hexes and attacks with +2 Bonus Damage. (Cooldown: 2 Cycles)',
  'Alquimista': 'Arcane Cataclysm — AoE Damage on target and adjacent hexes (radius 1). Chance to apply Burn (1 dmg/turn, 2 turns).',
  'Clerigo': 'Prayer of Hope — Restores 2 HP to an adjacent ally. Chance to grant Holy Shield.\\nCall of Faith — Attempts to convert an adjacent enemy (chance scales per round).'
};

export const UNIT_STATS: Record<string, { class: string, name: string, hp: number, attack: number, mana: number }> = {
  'unit_rei': { class: 'Rei', name: 'King', hp: 6, attack: 1, mana: 0 },
  'unit_cavaleiro': { class: 'Cavaleiro', name: 'Knight', hp: 5, attack: 3, mana: 4 },
  'unit_lanceiro': { class: 'Lanceiro', name: 'Lancer', hp: 4, attack: 1, mana: 1 },
  'unit_arqueiro': { class: 'Arqueiro', name: 'Archer', hp: 2, attack: 1, mana: 1 },
  'unit_assassino': { class: 'Assassino', name: 'Assassin', hp: 3, attack: 2, mana: 2 },
  'unit_alquimista': { class: 'Alquimista', name: 'Alchemist', hp: 3, attack: 1, mana: 3 },
  'unit_clerigo': { class: 'Clerigo', name: 'Cleric', hp: 4, attack: 0, mana: 3 }
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

export const ARTIFACT_DESCRIPTIONS: Record<string, string> = {
  'art_carvalho': 'Grants +1 Max HP and a permanent Shield that absorbs 3 damage on the next attack, 2 damage on the second, and 1 damage on the third.',
  'art_lamina': 'Increases Attack by +2.',
  'art_arco': 'Increases attack range by +1.',
  'art_adagas': 'Attacks deal +1 true damage and apply Poison.',
  'art_anel': 'Increases spell/heal range and the Mage blast radius.',
  'art_corcel': 'Allows moving 2 hexes. Knights gain immunity to conversion.',
  'art_coroa': 'Grants +3 Max HP and doubles the King Aura of Fear radius.',
  'art_tomo': 'Increases healing by +1 and removes negative effects at the start of the turn.',
  'art_amuleto': 'The unit becomes invulnerable to damage. Attacking removes this effect.',
  'art_estandarte': 'The unit gains Taunt, forcing nearby enemies (2 hexes) to attack it.',
};

export const SPELL_DESCRIPTIONS: Record<string, string> = {
  'spl_aurarunica': 'Grants +2 Max HP and a shield that protects against the next incoming attack.',
  'spl_raio': 'Deals 2 damage to a target and 1 damage to an adjacent enemy.',
  'spl_transfusao': 'Drains 2 HP from a unit to heal 2 HP of your King.',
  'spl_nevoa': 'Makes an ally immune to ranged attacks for 1 turn.',
  'spl_muralha': 'Summons up to 3 ice barriers with 6 HP each in empty hexes (center + adjacent).',
  'spl_passos': 'Allows a unit to act again (resets movement/attack).',
  'spl_meteoro': 'Deals 2 damage to the center and 1 damage to all adjacent hexes.',
  'spl_bencao': 'Heals 3 HP and removes all negative effects from an ally.',
  'spl_raizes': 'Roots an enemy unit for 1 turn (prevents movement and impact abilities).',
  'spl_furia': 'The unit gains +2 Attack, but loses 1 HP when attacking.',
  'spl_reforcos': 'Adds 2 Lancer cards to your deck and hand.',
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

export function getUnitCard(idOrClass: string): UnitCard {
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
    name: unit.name,
    type: 'Unit',
    unitClass: unit.class as any,
    baseHp: unit.hp,
    baseAttack: unit.attack,
    manaCost: unit.mana
  };
}
