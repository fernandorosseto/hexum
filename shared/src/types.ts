import type { HexCoordinates } from './hexMath';

export type CardType = 'Unit' | 'Spell' | 'Artifact';
export type UnitClass = 'Rei' | 'Clerigo' | 'Cavaleiro' | 'Lanceiro' | 'Arqueiro' | 'Mago' | 'Assassino' | 'Estrutura';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  manaCost: number;
}

export interface UnitCard extends Card {
  type: 'Unit';
  unitClass: UnitClass;
  baseHp: number;
  baseAttack: number;
}

export interface Buff {
  type: 'poison' | 'burn' | 'stun' | 'shield' | 'taunt' | 'fury' | 'immune_ranged' | 'bleed' | 'fear' | 'invulnerable' | 'rooted';
  duration: number; // turnos sobrando
  value?: number;
}

export interface Unit {
  id: string; // unique instance in match
  playerId: string;
  cardId: string;
  unitClass: UnitClass;
  hp: number;
  maxHp: number;
  attack: number;
  position: HexCoordinates;
  buffs: Buff[];
  roundsInField: number; // Quantas rodadas sobreviveu (para o scaling de 1% + 1%/rodada)
  summoningSickness: boolean;
  canMove: boolean;
  canAttack: boolean;
  abilityCooldown: number; // Turnos até que a habilidade especial possa ser usada novamente
  equippedArtifacts?: string[]; // IDs dos artefatos equipados (ex: 'art_escudo')
}

export type Phase = 'DRAW_PHASE' | 'MAIN_PHASE' | 'END_PHASE' | 'GAME_OVER';

export interface PlayerState {
  id: string;
  mana: number;
  maxMana: number;
  canOfferCard: boolean; // Se já descartou por mana este turno
  hand: string[];
  deck: string[];
  graveyard: string[];
}

export const buffLabels: Record<string, {label: string, color: string}> = {
  poison: { label: '🐍 Veneno', color: 'bg-green-900/80 text-green-300 border-green-700/50' },
  burn:   { label: '🔥 Queimadura', color: 'bg-orange-900/80 text-orange-300 border-orange-700/50' },
  stun:   { label: '💫 Atordoado', color: 'bg-yellow-900/80 text-yellow-300 border-yellow-700/50' },
  shield: { label: '🛡️ Escudo', color: 'bg-cyan-900/80 text-cyan-300 border-cyan-700/50' },
  fury:   { label: '⚔️ Fúria', color: 'bg-red-900/80 text-red-300 border-red-700/50' },
  taunt:  { label: '🚩 Provocar', color: 'bg-amber-900/80 text-amber-300 border-amber-700/50' },
  immune_ranged: { label: '☁️ Proteção', color: 'bg-slate-800/80 text-slate-300 border-slate-600/50' },
  bleed: { label: '🩸 Sangramento', color: 'bg-red-950/80 text-red-300 border-red-700/50' },
  fear: { label: '💀 Medo', color: 'bg-purple-900/80 text-purple-300 border-purple-700/50' },
  invulnerable: { label: '✨ Invulnerável', color: 'bg-yellow-900/80 text-yellow-200 border-yellow-600/50' },
  rooted: { label: '🌿 Enraizado', color: 'bg-emerald-900/80 text-emerald-300 border-emerald-700/50' },
};

export interface GameState {
  matchId: string;
  turnNumber: number;
  currentPhase: Phase;
  currentTurnPlayerId: string;
  sandboxMode?: boolean;
  winner?: string; // Player que ganhou
  players: Record<string, PlayerState>;
  boardUnits: Record<string, Unit>; // O Id da Unidade aponta pro objeto dela
  combatLogs?: string[]; // Trilha de log detalhada gerada no último combate
}
