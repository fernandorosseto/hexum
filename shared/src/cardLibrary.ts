import { UnitCard, Card } from './types';

export const CLASS_ABILITIES: Record<string, string> = {
  'Rei': 'Aura de Medo — Inimigos adjacentes têm chance de errar seus ataques. A chance aumenta +1% a cada rodada em campo.',
  'Cavaleiro': 'Rompante de Ferro (3 Mana) — Avança em linha reta e ataca com +2 de Dano. Chance de Atordoar. (Cooldown: 2 Ciclos)',
  'Lanceiro': 'Impacto de Falange — Ao acertar, tem chance de empurrar o alvo 1 casa para trás na mesma direção.',
  'Arqueiro': 'Tiro Preciso — Ataca a distância (alcance 3). Chance de Atordoar o alvo.',
  'Assassino': 'Toque Letal — Todo ataque aplica Sangramento (1 dano/turno, 2 turnos).\\nTransposição Etérea (3 Mana) — Salta 2 casas e ataca com +2 de Dano Bônus. (Cooldown: 2 Ciclos)',
  'Alquimista': 'Cataclismo Arcano — Dano em Área no alvo e adjacentes (raio 1). Chance de aplicar Queimadura (1 dano/turno, 2 turnos).',
  'Clerigo': 'Prece de Alento — Restaura 2 HP de um aliado adjacente. Chance de conceder Escudo Sagrado.\\nChamado da Fé — Tenta converter um inimigo adjacente (chance escala por rodada).'
};

export const HERO_ROSTER: Record<string, { class: string, name: string, hp: number, attack: number, mana: number, flavor: string, role: string }> = {
  // Rei
  'hero_balduino': { class: 'Rei', name: 'Balduíno IV', hp: 6, attack: 1, mana: 0, flavor: '"Eu sou Jerusalém."', role: 'Líder · Suporte' },
  'hero_leonidas': { class: 'Rei', name: 'Leônidas I', hp: 7, attack: 2, mana: 0, flavor: '"Molon Labe."', role: 'Líder · Resistência' },
  // Cavaleiro
  'hero_joana': { class: 'Cavaleiro', name: "Joana d'Arc", hp: 5, attack: 3, mana: 4, flavor: '"A vitória pertence aos que creem."', role: 'Tanque · Vanguarda' },
  'hero_marshall': { class: 'Cavaleiro', name: 'William Marshall', hp: 6, attack: 2, mana: 4, flavor: '"A lealdade é meu escudo."', role: 'Tanque · Defensor' },
  // Lanceiro
  'hero_elcid': { class: 'Lanceiro', name: 'El Cid', hp: 4, attack: 1, mana: 1, flavor: '"Nem a morte me fará recuar."', role: 'Defensor Vertical' },
  'hero_landsknecht': { class: 'Lanceiro', name: 'Mestre Landsknecht', hp: 3, attack: 2, mana: 1, flavor: '"A guerra é um negócio, e a lança é minha moeda."', role: 'Controle de Área' },
  // Arqueiro
  'hero_robin': { class: 'Arqueiro', name: 'Robin Hood', hp: 2, attack: 1, mana: 1, flavor: '"Uma flecha bem mirada vale mais que cem espadas cegas."', role: 'Suporte · Precisão' },
  'hero_nasu': { class: 'Arqueiro', name: 'Nasu no Yoichi', hp: 2, attack: 2, mana: 2, flavor: '"Meu arco divide as águas e os ventos."', role: 'Sniper' },
  // Assassino
  'hero_hassan': { class: 'Assassino', name: 'Hassan-i Sabbah', hp: 3, attack: 2, mana: 2, flavor: '"Nada é verdade, tudo é permitido."', role: 'Assassino · Mobilidade' },
  'hero_hanzo': { class: 'Assassino', name: 'Hattori Hanzo', hp: 4, attack: 1, mana: 2, flavor: '"Sou a sombra que a lâmina projeta."', role: 'Assassino Furtivo' },
  // Alquimista
  'hero_bacon': { class: 'Alquimista', name: 'Roger Bacon', hp: 3, attack: 1, mana: 3, flavor: '"A pólvora é a fúria da ciência engarrafada."', role: 'AoE · Controle de Área' },
  'hero_simiao': { class: 'Alquimista', name: 'Sun Simiao', hp: 4, attack: 0, mana: 3, flavor: '"O fogo que queima é o mesmo que purifica."', role: 'AoE · Suporte Híbrido' },
  // Clérigo
  'hero_richelieu': { class: 'Clerigo', name: 'Cardeal Richelieu', hp: 4, attack: 0, mana: 3, flavor: '"A vontade do estado e a de Deus são uma só."', role: 'Healer · Estratégia' },
  'hero_urbano': { class: 'Clerigo', name: 'Papa Urbano II', hp: 5, attack: 0, mana: 4, flavor: '"Deus lo vult! (Deus o quer!)"', role: 'Healer · Conversão' }
};

export const ARTIFACTS: Card[] = [
  { id: 'art_carvalho', name: 'Escudo de Carvalho', type: 'Artifact', manaCost: 2 },
  { id: 'art_lamina', name: 'Lâmina do Carrasco', type: 'Artifact', manaCost: 3 },
  { id: 'art_arco', name: 'Arco Longo Élfico', type: 'Artifact', manaCost: 2 },
  { id: 'art_adagas', name: 'Adagas Envenenadas', type: 'Artifact', manaCost: 2 },
  { id: 'art_anel', name: 'Anel do Arquimago', type: 'Artifact', manaCost: 3 },
  { id: 'art_corcel', name: 'Corcel de Guerra', type: 'Artifact', manaCost: 2 },
  { id: 'art_coroa', name: 'Coroa do Regente', type: 'Artifact', manaCost: 3 },
  { id: 'art_tomo', name: 'Tomo Sagrado', type: 'Artifact', manaCost: 1 },
  { id: 'art_amuleto', name: 'Amuleto da Ilusão', type: 'Artifact', manaCost: 2 },
  { id: 'art_estandarte', name: 'Estandarte da Coragem', type: 'Artifact', manaCost: 3 },
];

export const ARTIFACT_DESCRIPTIONS: Record<string, string> = {
  'art_carvalho': 'Concede +1 de HP Máximo e um Escudo protetor permanente que absorve 3 de dano no próximo ataque recebido, 2 de dano no segundo ataque e 1 de dano no terceiro.',
  'art_lamina': 'Aumenta o Ataque em +2.',
  'art_arco': 'Aumenta o alcance de ataque em +1.',
  'art_adagas': 'Ataques causam +1 de dano real e aplicam Veneno.',
  'art_anel': 'Aumenta o alcance de magias/curas e o raio de explosão do Mago.',
  'art_corcel': 'Permite mover 2 casas. Cavaleiros ganham imunidade a conversão.',
  'art_coroa': 'Concede +3 de HP Máximo e dobra o raio da Aura de Medo do Rei.',
  'art_tomo': 'Aumenta a cura em +1 e remove efeitos negativos no início do turno.',
  'art_amuleto': 'A unidade fica invulnerável a dano. Atacar remove este efeito.',
  'art_estandarte': 'A unidade ganha Provocar, forçando inimigos próximos (2 casas) a atacá-la.',
};

export const SPELL_DESCRIPTIONS: Record<string, string> = {
  'spl_aurarunica': 'Concede +2 de HP Máximo e um escudo que protege contra o próximo ataque recebido.',
  'spl_raio': 'Causa 2 de dano a um alvo e 1 de dano a um inimigo adjacente.',
  'spl_transfusao': 'Drena 2 de HP de uma unidade para curar 2 de HP do seu Rei.',
  'spl_nevoa': 'Torna um aliado imune a ataques à distância por 1 turno.',
  'spl_muralha': 'Invoca até 3 barreiras de gelo com 6 HP cada em hexágonos vazios (centro + adjacentes).',
  'spl_passos': 'Permite que uma unidade aja novamente (reset de movimento/ataque).',
  'spl_meteoro': 'Causa 2 de dano no centro e 1 de dano em todos os hexágonos adjacentes.',
  'spl_bencao': 'Cura 3 de HP e remove todos os efeitos negativos de um aliado.',
  'spl_raizes': 'Imobiliza uma unidade inimiga por 1 turno (impede movimento e uso de habilidades de impacto).',
  'spl_furia': 'A unidade ganha +2 de Ataque, mas perde 1 de HP ao atacar.',
  'spl_reforcos': 'Adiciona 2 cartas de Lanceiro ao seu deck e mão.',
};

export const SPELLS: Card[] = [
  { id: 'spl_aurarunica', name: 'Aura Rúnica', type: 'Spell', manaCost: 2 },
  { id: 'spl_raio', name: 'Cadeia de Relâmpagos', type: 'Spell', manaCost: 3 },
  { id: 'spl_transfusao', name: 'Transfusão Sombria', type: 'Spell', manaCost: 2 },
  { id: 'spl_nevoa', name: 'Névoa Espessa', type: 'Spell', manaCost: 2 },
  { id: 'spl_muralha', name: 'Muralha de Gelo', type: 'Spell', manaCost: 2 },
  { id: 'spl_passos', name: 'Passos de Vento', type: 'Spell', manaCost: 1 },
  { id: 'spl_meteoro', name: 'Chuva de Meteoros', type: 'Spell', manaCost: 4 },
  { id: 'spl_bencao', name: 'Bênção Divina', type: 'Spell', manaCost: 3 },
  { id: 'spl_raizes', name: 'Raízes da Terra', type: 'Spell', manaCost: 2 },
  { id: 'spl_furia', name: 'Fúria de Batalha', type: 'Spell', manaCost: 1 },
  { id: 'spl_reforcos', name: 'Chamado dos Reforços', type: 'Spell', manaCost: 3 },
];

export function getUnitCard(heroIdOrClass: string): UnitCard {
  // Retro-compatibilidade se pedirem por unit_...
  if (heroIdOrClass.startsWith('unit_')) {
    const fallbackMap: Record<string, string> = {
      'unit_rei': 'hero_balduino',
      'unit_cavaleiro': 'hero_joana',
      'unit_lanceiro': 'hero_elcid',
      'unit_arqueiro': 'hero_robin',
      'unit_assassino': 'hero_hassan',
      'unit_mago': 'hero_bacon',
      'unit_alquimista': 'hero_bacon',
      'unit_clerigo': 'hero_richelieu'
    };
    heroIdOrClass = fallbackMap[heroIdOrClass] || 'hero_balduino';
  }

  // Retro-compatibilidade se a chamada vier pela classe crua (ex: "Cavaleiro" na Forja/UI)
  const rawClassFallback: Record<string, string> = {
    'Rei': 'hero_balduino',
    'Cavaleiro': 'hero_joana',
    'Lanceiro': 'hero_elcid',
    'Arqueiro': 'hero_robin',
    'Assassino': 'hero_hassan',
    'Mago': 'hero_bacon',
    'Alquimista': 'hero_bacon',
    'Clerigo': 'hero_richelieu'
  };
  if (rawClassFallback[heroIdOrClass]) {
    heroIdOrClass = rawClassFallback[heroIdOrClass];
  }

  const hero = HERO_ROSTER[heroIdOrClass];
  if (!hero) {
    throw new Error(`Herói ou Módulo Base não encontrado: ${heroIdOrClass}`);
  }

  return {
    id: heroIdOrClass,
    name: hero.name,
    type: 'Unit',
    unitClass: hero.class as any,
    baseHp: hero.hp,
    baseAttack: hero.attack,
    manaCost: hero.mana,
    flavor: hero.flavor,
    role: hero.role
  };
}
