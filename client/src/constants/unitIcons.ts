import {
  reiIcon,
  arqueiroIcon,
  assassinoIcon,
  cavaleiroIcon,
  clerigoIcon,
  lanceiroIcon,
  magoIcon,
  escudoIcon,
} from '../assets/icons';

/**
 * Mapa centralizado de ícones por classe de unidade.
 * Eliminado a duplicação que existia em UnitSprite.tsx e CardDetailsUI.tsx.
 */
export const CLASS_ICONS: Record<string, string> = {
  'Rei': reiIcon,
  'Cavaleiro': cavaleiroIcon,
  'Lanceiro': lanceiroIcon,
  'Arqueiro': arqueiroIcon,
  'Assassino': assassinoIcon,
  'Mago': magoIcon,
  'Clerigo': clerigoIcon,
};

/**
 * Mapa de cores temáticas para arte das cartas (usado em CardDetailsUI).
 */
export const UNIT_ART_COLORS: Record<string, { bg: string, glow: string, border: string }> = {
  Rei:       { bg: 'from-yellow-900/60 to-amber-950/80', glow: 'shadow-[0_0_40px_rgba(250,204,21,0.15)]', border: 'border-yellow-600/60' },
  Cavaleiro: { bg: 'from-slate-700/60 to-zinc-900/80',   glow: 'shadow-[0_0_40px_rgba(148,163,184,0.15)]', border: 'border-slate-500/60' },
  Lanceiro:  { bg: 'from-teal-900/60 to-emerald-950/80', glow: 'shadow-[0_0_40px_rgba(20,184,166,0.15)]', border: 'border-teal-600/60' },
  Arqueiro:  { bg: 'from-green-900/60 to-lime-950/80',   glow: 'shadow-[0_0_40px_rgba(132,204,22,0.15)]', border: 'border-green-600/60' },
  Assassino: { bg: 'from-violet-900/60 to-purple-950/80',glow: 'shadow-[0_0_40px_rgba(139,92,246,0.15)]', border: 'border-violet-500/60' },
  Mago:      { bg: 'from-blue-900/60 to-indigo-950/80',  glow: 'shadow-[0_0_40px_rgba(99,102,241,0.15)]', border: 'border-blue-500/60' },
  Clerigo:   { bg: 'from-amber-900/60 to-orange-950/80', glow: 'shadow-[0_0_40px_rgba(217,119,6,0.15)]', border: 'border-amber-500/60' },
};

/**
 * Ícones de artefatos (emojis ou imagens)
 */
export const ARTIFACT_ICONS: Record<string, string> = {
  art_escudo: escudoIcon,
  art_montante: '⚔️',
  art_arco: '🏹',
  art_adagas: '🗡️',
  art_anel: '💍',
  art_corcel: '🐎',
  art_coroa: '👑',
  art_tomo: '📖',
  art_amuleto: '🧿',
  art_estandarte: '🚩',
};

/**
 * Ícones de feitiços
 */
export const SPELL_ICONS: Record<string, string> = {
  spl_raio: '⚡', spl_transfusao: '💉', spl_nevoa: '☁️', spl_muralha: '🛡️',
  spl_passos: '👟', spl_meteoro: '🔥', spl_bencao: '✝️', spl_raizes: '🔗',
  spl_furia: '⚔️', spl_reforcos: '📯',
};
