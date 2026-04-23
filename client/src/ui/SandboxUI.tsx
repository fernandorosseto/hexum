import React, { useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { HERO_ROSTER, ARTIFACTS, SPELLS } from 'shared';

// ══════════════════════════════════════════════
//  Janela 1: Arsenal do Jogador (P1)
// ══════════════════════════════════════════════

const ArsenalBoxP1: React.FC = () => {
  const { spawnUnit, addCardToHand, sandboxPlayCard, purifyArena, selectedHex, triggerEndTurn, toggleAutoPlay, isAutoPlay } = useGameStore();
  const [activeTab, setActiveTab] = useState<'unidades' | 'cartas'>('unidades');
  const [selectedPlayer, setSelectedPlayer] = useState<'p1' | 'p2'>('p1');
  const [size, setSize] = useState({ width: 260, height: 420 });
  const dragControls = useDragControls();

  const unitNames = Object.keys(HERO_ROSTER);

  return (
    <motion.div 
      drag dragControls={dragControls} dragListener={false} dragMomentum={false}
      initial={{ x: 16, y: 90 }}
      style={{ width: size.width, height: size.height }}
      className="fixed z-[100] bg-slate-900/95 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col cursor-default select-none"
    >
      {/* Header */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="p-3 border-b border-white/10 flex items-center justify-between bg-blue-500/5 cursor-move active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${selectedPlayer === 'p1' ? 'bg-blue-400' : 'bg-red-400'}`} />
          <h2 className="text-white/90 font-black tracking-widest text-[11px] uppercase">Simulador de Guerra</h2>
        </div>
        <div className="flex gap-1">
           <button onClick={() => setSelectedPlayer('p1')} className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-tighter transition-all ${selectedPlayer === 'p1' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>P1</button>
           <button onClick={() => setSelectedPlayer('p2')} className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-tighter transition-all ${selectedPlayer === 'p2' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>P2</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        <button onClick={() => setActiveTab('unidades')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'unidades' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-white/40 hover:bg-white/5'}`}>Unidades</button>
        <button onClick={() => setActiveTab('cartas')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'cartas' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-white/40 hover:bg-white/5'}`}>Cartas</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {activeTab === 'unidades' ? (
          <div className="grid grid-cols-2 gap-2">
            {unitNames.map(name => (
              <button key={name} disabled={!selectedHex} onClick={() => selectedHex && spawnUnit(name, selectedHex, selectedPlayer)} className={`p-3 bg-white/5 hover:bg-blue-600/20 disabled:opacity-20 border border-white/5 rounded-xl text-left transition-all text-[9px] text-white/50 hover:text-white font-bold uppercase ${selectedPlayer === 'p2' ? 'hover:bg-red-600/20' : ''}`}>{name}</button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
             {/* Spells & Artifacts (simplificado para P1) */}
             <div className="space-y-1.5">
                 {SPELLS.map(spell => (
                   <div key={spell.id} className="flex gap-1">
                     <button disabled={!selectedHex} onClick={() => selectedHex && sandboxPlayCard(spell.id, selectedHex, selectedPlayer)} className={`flex-1 p-2 bg-white/5 disabled:opacity-20 border border-white/5 rounded-lg text-left text-[10px] text-white/70 hover:text-white font-medium flex justify-between items-center group ${selectedPlayer === 'p2' ? 'hover:bg-red-600/20' : 'hover:bg-blue-600/20'}`}>
                       <span>{spell.name}</span>
                       <span className={`text-[7px] px-1 py-0.5 rounded uppercase font-black ${selectedPlayer === 'p1' ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>Lançar</span>
                     </button>
                     <button onClick={() => addCardToHand(spell.id)} className="px-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/30 hover:text-white transition-colors" title="Para a Mão">🎴</button>
                   </div>
                 ))}
                 {ARTIFACTS.map(art => (
                   <div key={art.id} className="flex gap-1">
                     <button disabled={!selectedHex} onClick={() => selectedHex && sandboxPlayCard(art.id, selectedHex, selectedPlayer)} className={`flex-1 p-2 bg-white/5 disabled:opacity-20 border border-white/5 rounded-lg text-left text-[10px] text-white/70 hover:text-white font-medium flex justify-between items-center group ${selectedPlayer === 'p2' ? 'hover:bg-red-600/20' : 'hover:bg-blue-600/20'}`}>
                       <span>{art.name}</span>
                       <span className={`text-[7px] px-1 py-0.5 rounded uppercase font-black ${selectedPlayer === 'p1' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>Equipar</span>
                     </button>
                     <button onClick={() => addCardToHand(art.id)} className="px-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/30 hover:text-white transition-colors" title="Para a Mão">🎴</button>
                   </div>
                 ))}
             </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-black/40 border-t border-white/10 shrink-0 relative flex gap-2">
        <button 
          onClick={triggerEndTurn} 
          className="flex-1 py-2 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-400 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95"
        >
          Finalizar Turno
        </button>
        <button 
          onClick={purifyArena} 
          className="flex-[0.6] py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95 shadow-inner"
        >
          Purificar
        </button>
        {import.meta.env.DEV && (
          <button 
            onClick={toggleAutoPlay} 
            className={`flex-[0.8] py-2 border text-[8px] font-black uppercase tracking-[0.1em] rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 ${isAutoPlay ? 'bg-amber-500/80 border-amber-400 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800/40 hover:bg-slate-700/60 border-white/10 text-white/60'}`}
          >
            {isAutoPlay ? '🛑 Parar' : '🤖 Simular'}
          </button>
        )}
        {/* Resize Handle */}
        <motion.div drag dragMomentum={false} dragConstraints={{ left: 0, top: 0 }} onDrag={(_e, info) => { setSize(prev => ({ width: Math.max(180, prev.width + info.delta.x), height: Math.max(200, prev.height + info.delta.y) })); }} onDragEnd={(e) => { (e.target as any).style.transform = 'none'; }} className="absolute bottom-1 right-1 w-3 h-3 cursor-nwse-resize flex items-center justify-center group"><div className="w-1 h-1 bg-white/20 rounded-full group-hover:bg-blue-500 transition-colors" /></motion.div>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════
//  Janela 2: Drop de Manequins (P2)
// ══════════════════════════════════════════════

export const SandboxUI: React.FC = () => {
  const sandboxMode = useGameStore(state => state.sandboxMode);
  if (!sandboxMode) return null;

  return (
    <>
      <ArsenalBoxP1 />
    </>
  );
};
