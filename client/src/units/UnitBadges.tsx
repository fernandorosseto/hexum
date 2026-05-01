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

  const attackColor = !isAttackSpent ? '#fde047' : '#64748b';
  const hpColor = hpPercent > 60 ? '#4ade80' : hpPercent > 30 ? '#fde047' : '#f87171';
  const borderColor = isP1 ? '#0b622f' : '#602471';

  return (
    <g transform="translate(0, 62)" className="pointer-events-none" style={{ zIndex: 10 }}>
      <rect x="-60" y="-18" width="120" height="38" rx="12" fill="#020617" stroke={borderColor} strokeWidth="3" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.8))" />
      <text x="-30" y="9" fontSize="22" fontWeight="900" textAnchor="middle" fill={attackColor}>
        ⚔ {unit.attack}
      </text>
      <text x="0" y="7" fontSize="22" textAnchor="middle" fill="#64748b">|</text>
      <text x="30" y="9" fontSize="22" fontWeight="900" textAnchor="middle" fill={hpColor}>
        ♥ {unit.hp}
      </text>
    </g>
  );
};
