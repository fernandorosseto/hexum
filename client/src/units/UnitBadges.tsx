import React from 'react';

interface Props {
  unit: {
    attack: number;
    hp: number;
    maxHp: number;
    playerId: string;
  };
  isAttackSpent: boolean;
}

export const UnitBadges: React.FC<Props> = ({ unit, isAttackSpent }) => {
  const isP1 = unit.playerId === 'p1';
  const hpPercent = Math.max(0, (unit.hp / unit.maxHp) * 100);

  return (
    <div className={`
      absolute -bottom-5 flex items-center gap-2 font-black text-base bg-slate-950 rounded-lg px-3 py-1 border-2 shadow-[0_2px_8px_rgba(0,0,0,0.8)] z-10 transition-all
      ${isP1 ? 'border-[#0b622f]' : 'border-[#602471]'}
    `}>
      <span className={`drop-shadow-sm transition-all duration-1000 ease-in-out ${!isAttackSpent ? 'text-yellow-300' : 'text-slate-500 opacity-40 grayscale'}`}>
        ⚔{unit.attack}
      </span>
      <span className="text-slate-500">|</span>
      <span className={`drop-shadow-sm ${hpPercent > 60 ? 'text-green-400' : hpPercent > 30 ? 'text-yellow-300' : 'text-red-400'}`}>
        ♥{unit.hp}
      </span>
    </div>
  );
};
