import React from 'react';
import { useGameStore } from '../store/gameStore';
import { UNIT_DESCRIPTIONS, UNIT_STATS, ARTIFACTS, SPELLS, ARTIFACT_DESCRIPTIONS, SPELL_DESCRIPTIONS, getFearStatus, buffLabels } from 'shared';
import { motion } from 'framer-motion';
import reiIcon from '../assets/rei.png';
import arqueiroIcon from '../assets/arqueiro.png';
import assassinoIcon from '../assets/assassino.png';
import cavaleiroIcon from '../assets/cavaleiro.png';
import clerigoIcon from '../assets/clerigo.png';
import lanceiroIcon from '../assets/lanceiro.png';
import magoIcon from '../assets/mago.png';
import escudoIcon from '../assets/escudo.png';

const UNIT_ICONS: Record<string, string> = {
  Rei: reiIcon, 
  Cavaleiro: cavaleiroIcon, 
  Lanceiro: lanceiroIcon, 
  Arqueiro: arqueiroIcon,
  Assassino: assassinoIcon, 
  Mago: magoIcon, 
  Clerigo: clerigoIcon, 
};

const UNIT_ART_COLORS: Record<string, { bg: string, glow: string, border: string }> = {
  Rei:       { bg: 'from-yellow-900/60 to-amber-950/80', glow: 'shadow-[0_0_40px_rgba(250,204,21,0.15)]', border: 'border-yellow-600/60' },
  Cavaleiro: { bg: 'from-slate-700/60 to-zinc-900/80',   glow: 'shadow-[0_0_40px_rgba(148,163,184,0.15)]', border: 'border-slate-500/60' },
  Lanceiro:  { bg: 'from-teal-900/60 to-emerald-950/80', glow: 'shadow-[0_0_40px_rgba(20,184,166,0.15)]', border: 'border-teal-600/60' },
  Arqueiro:  { bg: 'from-green-900/60 to-lime-950/80',   glow: 'shadow-[0_0_40px_rgba(132,204,22,0.15)]', border: 'border-green-600/60' },
  Assassino: { bg: 'from-violet-900/60 to-purple-950/80',glow: 'shadow-[0_0_40px_rgba(139,92,246,0.15)]', border: 'border-violet-500/60' },
  Mago:      { bg: 'from-blue-900/60 to-indigo-950/80',  glow: 'shadow-[0_0_40px_rgba(99,102,241,0.15)]', border: 'border-blue-500/60' },
  Clerigo:   { bg: 'from-amber-900/60 to-orange-950/80', glow: 'shadow-[0_0_40px_rgba(217,119,6,0.15)]', border: 'border-amber-500/60' },
};

const SPELL_ICONS: Record<string, string> = {
  spl_raio: '⚡', spl_transfusao: '💉', spl_nevoa: '☁️', spl_muralha: '🛡️',
  spl_passos: '👟', spl_meteoro: '🔥', spl_bencao: '✝️', spl_raizes: '🔗',
  spl_furia: '⚔️', spl_reforcos: '📯'
};

const ARTIFACT_ICONS: Record<string, string> = {
  art_escudo: escudoIcon, 
  art_montante: '⚔️', 
  art_arco: '🏹', 
  art_adagas: '🗡️',
  art_anel: '💍', 
  art_corcel: '🐎', 
  art_coroa: '👑', 
  art_tomo: '📖',
  art_amuleto: '🧿', 
  art_estandarte: '🚩'
};

export const CardDetailsUI: React.FC = () => {
  const selectedCardId = useGameStore(state => state.selectedCard);
  const selectedHex = useGameStore(state => state.selectedHex);
  const boardUnits = useGameStore(state => state.boardUnits);
  const selectedAbility = useGameStore(state => state.selectedAbility);
  const setSelectedAbility = useGameStore(state => state.setSelectedAbility);
  const currentPlayerId = useGameStore(state => state.currentTurnPlayerId);
  const sandboxMode = useGameStore(state => state.sandboxMode);
  const activePlayer = useGameStore(state => state.players[currentPlayerId]);
  const setSelectedHex = useGameStore(state => state.setSelectedHex);
  const setSelectedCard = useGameStore(state => state.setSelectedCard);

  // ── Data Resolution ──
  type CardData = {
    kind: 'unit' | 'spell' | 'artifact';
    title: string;
    icon: string;
    manaCost: number;
    atk?: number;
    hp?: string;
    role?: string;
    ability: string;
    flavor?: string;
    unitClass?: string;
    unitOwner?: string;
    colors: { bg: string; glow: string; border: string };
    buffs?: Array<{type: string; duration: number; value?: number}>;
    artifacts?: string[];
  };

  let data: CardData | null = null;

  // 1. Try from selected card in hand
  if (selectedCardId) {
    if (selectedCardId.startsWith('unit_')) {
      const unitClass = selectedCardId.replace('unit_', '');
      const cap = unitClass.charAt(0).toUpperCase() + unitClass.slice(1);
      const stats = UNIT_STATS[cap];
      const desc = UNIT_DESCRIPTIONS[cap];
      if (stats && desc) {
        data = {
          kind: 'unit', title: cap, icon: UNIT_ICONS[cap] || '👤',
          manaCost: stats.mana, atk: stats.attack, hp: `${stats.hp}`,
          role: desc.role, ability: desc.ability, flavor: desc.flavor,
          unitClass: cap,
          colors: UNIT_ART_COLORS[cap] || UNIT_ART_COLORS['Rei'],
        };
      }
    } else {
      const art = ARTIFACTS.find(a => a.id === selectedCardId);
      if (art) {
        data = {
          kind: 'artifact', title: art.name, icon: ARTIFACT_ICONS[art.id] || '⚔️',
          manaCost: art.manaCost,
          ability: ARTIFACT_DESCRIPTIONS[art.id] || 'Equipamento permanente.',
          colors: { bg: 'from-amber-900/60 to-yellow-950/80', glow: 'shadow-[0_0_40px_rgba(217,119,6,0.15)]', border: 'border-amber-500/60' },
        };
      } else {
        const spl = SPELLS.find(s => s.id === selectedCardId);
        if (spl) {
          data = {
            kind: 'spell', title: spl.name, icon: SPELL_ICONS[spl.id] || '✨',
            manaCost: spl.manaCost,
            ability: SPELL_DESCRIPTIONS[spl.id] || 'Efeito mágico instantâneo.',
            colors: { bg: 'from-purple-900/60 to-indigo-950/80', glow: 'shadow-[0_0_40px_rgba(139,92,246,0.15)]', border: 'border-purple-500/60' },
          };
        }
      }
    }
  }
  // 2. Try from selected hex on board
  else if (selectedHex) {
    const unitOnHex = Object.values(boardUnits).find(
      u => u.position.q === selectedHex.q && u.position.r === selectedHex.r
    );
    if (unitOnHex) {
      const cap = unitOnHex.unitClass;
      const stats = UNIT_STATS[cap];
      const desc = UNIT_DESCRIPTIONS[cap];
      if (stats && desc) {
        data = {
          kind: 'unit', title: cap, icon: UNIT_ICONS[cap] || '👤',
          manaCost: stats.mana, atk: unitOnHex.attack, hp: `${unitOnHex.hp}`,
          role: desc.role, ability: desc.ability, flavor: desc.flavor,
          unitClass: cap, unitOwner: unitOnHex.playerId,
          colors: UNIT_ART_COLORS[cap] || UNIT_ART_COLORS['Rei'],
          buffs: unitOnHex.buffs,
          artifacts: unitOnHex.equippedArtifacts,
        };
      }
    }
  }

  if (!data) return null;

  const typeLabel = data.kind === 'unit' ? 'Unidade' : data.kind === 'artifact' ? 'Artefato' : 'Mágica';
  const typeBadgeColor = data.kind === 'unit' ? 'bg-[#0b622f]/80 text-[#a7f3d0]' : data.kind === 'artifact' ? 'bg-amber-700/80 text-amber-100' : 'bg-[#602471]/80 text-[#f5d0f9]';


  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
      style={{ 
        maxWidth: '100%', 
        height: typeof window !== 'undefined' && window.innerWidth < 768 ? 'auto' : '360px',
        maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '200px' : 'none'
      }}
    >
      <button 
        onClick={() => { setSelectedHex(null); setSelectedCard(null); }}
        className="md:hidden absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white/70 z-30"
      >
        ✕
      </button>

      <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-white/5">
        <h2 className="text-sm font-black text-white tracking-tight truncate">{data.title}</h2>
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-6 h-6 rounded-full bg-[#0b622f]/90 border border-[#0b622f]/50 flex items-center justify-center text-[11px] font-black text-white shadow-[0_0_8px_rgba(11,98,47,0.4)]">
            {data.manaCost}
          </div>
        </div>
      </div>

      <div className="relative h-20 md:h-32 bg-slate-950/50 flex items-center justify-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1),_transparent_70%)]" />
        </div>
        <div className="flex items-center justify-center z-10 w-full h-full">
          {(data.icon.includes('/') || data.icon.includes('.') || data.icon.startsWith('data:')) ? (
            <img src={data.icon} alt={data.title} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          ) : (
            <span className="text-4xl md:text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {data.icon || '❓'}
            </span>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5 pointer-events-none" />
      </div>

      <div className="px-3 py-1.5 bg-black/20 border-b border-white/5 flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider ${typeBadgeColor}`}>
          {typeLabel}
        </span>
        {data.role && (
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.role}</span>
        )}
      </div>

      <div className="flex-1 bg-slate-900/50 overflow-y-auto flex flex-col">
        
        {/* TEXT BOX */}
        <div className="px-3 py-3 space-y-2">
          {/* Ability text */}
          <div className="text-[11px] text-slate-200 leading-relaxed">
            {data.ability.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-slate-800/60' : ''}>
                {line.split('—').length > 1 ? (
                  <>
                    <span className="font-black text-white">{line.split('—')[0]}—</span>
                    <span>{line.split('—').slice(1).join('—')}</span>
                  </>
                ) : line}
              </p>
            ))}
          </div>

          {/* Flavor text (MTG italic flavor) */}
          {data.flavor && (
            <div className="pt-2">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-2" />
              <p className="text-[10px] italic text-slate-400/80 leading-snug px-1">
                "{data.flavor}"
              </p>
            </div>
          )}
        </div>

        {/* Spacer to push buffs/artifacts down gracefully if small text */}
        <div className="flex-1"></div>

        {/* ═══ ACTIVE BUFFS (only when viewing unit on board) ═══ */}
        {selectedHex && (
          <div className="px-3 pb-2 pt-1 border-t border-slate-800/40">
            <div className="flex flex-wrap gap-1">
              {/* Buffs persistentes */}
              {data.buffs && data.buffs.map((buff, i) => {
                const info = buffLabels[buff.type];
                if (!info) return null;
                return (
                  <span key={i} className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${info.color}`}>
                    {info.label} ({buff.duration}t)
                  </span>
                );
              })}

              {/* Aura de Medo Dinâmica */}
              {(() => {
                const unitOnHex = Object.values(boardUnits).find(u => u.position.q === selectedHex.q && u.position.r === selectedHex.r);
                if (unitOnHex) {
                  const fearInfo = getFearStatus(unitOnHex, { boardUnits } as any);
                  if (fearInfo.inRange) {
                    return (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border bg-purple-900/80 text-purple-300 border-purple-700/50">
                        💀 Medo ({(fearInfo.chance * 100).toFixed(0)}%)
                      </span>
                    );
                  }
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* ═══ EQUIPPED ARTIFACTS (only on board view) ═══ */}
        {data.artifacts && data.artifacts.length > 0 && (
          <div className="px-3 pb-2 pt-1 border-t border-slate-800/40">
            <div className="flex flex-wrap gap-1">
              {data.artifacts.map((artId, i) => {
                const art = ARTIFACTS.find(a => a.id === artId);
                return (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[8px] font-bold border bg-amber-950/60 text-amber-300 border-amber-700/40">
                    {ARTIFACT_ICONS[artId] || '⚔️'} {art?.name || artId}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ BOTTOM BAR: P/T stats (MTG P/T box) ═══ */}
      {data.kind === 'unit' && data.atk !== undefined && data.hp && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-black/60 border-t border-white/5 mt-auto">
          {/* Alinhamento de botões de teste (Sandbox) */}
          <div className="flex-1 flex gap-2">
            {/* Special ability button */}
            {!selectedCardId && selectedHex && (data.unitClass === 'Cavaleiro' || data.unitClass === 'Assassino') && (sandboxMode || data.unitOwner === currentPlayerId) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const abilityName = data!.unitClass === 'Cavaleiro' ? 'choque' : 'salto';
                  setSelectedAbility(selectedAbility === abilityName ? null : abilityName);
                }}
                className={`
                  flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider
                  transition-all duration-200 truncate
                  ${(selectedAbility === 'choque' || selectedAbility === 'salto')
                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                    : 'bg-slate-800 text-slate-100 border border-white/10 hover:bg-slate-700'
                  }
                  ${(!sandboxMode && activePlayer.mana < 3) ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span>{selectedAbility ? '✕' : (data!.unitClass === 'Cavaleiro' ? '⚡' : '🗡️')}</span>
                <span className="truncate">
                  {selectedAbility ? 'Parar' : (data!.unitClass === 'Cavaleiro' ? 'Rompante' : 'Mover')}
                </span>
              </button>
            )}

            {/* Spacer if no button */}
            {(selectedCardId || !selectedHex || (data.unitClass !== 'Cavaleiro' && data.unitClass !== 'Assassino') || (!sandboxMode && data.unitOwner !== currentPlayerId)) && (
              <div className="flex-1" />
            )}
          </div>

          {/* Badge Padronizada (P/T style) */}
          <div className={`
             shrink-0 min-w-[65px] flex items-center justify-center gap-2 bg-slate-950 rounded-lg border-2 px-3 py-1.5 shadow-lg
             ${data.unitOwner === 'p1' ? 'border-[#0b622f]/50' : data.unitOwner === 'p2' ? 'border-[#602471]/50' : 'border-slate-600'}
             ${data.unitOwner === 'p2' && sandboxMode ? 'grayscale opacity-50' : ''}
          `}>
             <span className="text-[13px] font-black text-yellow-300 drop-shadow-sm">
                ⚔{data.unitOwner === 'p2' && sandboxMode ? 0 : data.atk}
             </span>
             <span className="text-slate-600 font-bold">|</span>
             <span className="text-[13px] font-black text-green-400 drop-shadow-sm">
                ♥{data.hp}
             </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
