import React from 'react';
import { HEX_SIZE } from '../board/HexUtils';

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

  // Proporções dinâmicas com base no HEX_SIZE
  const rBase = HEX_SIZE * (70 / 90);
  const badgeY = rBase - 8;
  
  const width = HEX_SIZE * (120 / 90);
  const height = HEX_SIZE * (38 / 90);
  const rx = HEX_SIZE * (12 / 90);
  const strokeWidth = HEX_SIZE * (3 / 90);
  const fontSize = HEX_SIZE * (22 / 90);

  const textXOffset = HEX_SIZE * (30 / 90);
  const textYOffset = HEX_SIZE * (9 / 90);
  const separatorYOffset = HEX_SIZE * (7 / 90);

  return (
    <g transform={`translate(0, ${badgeY})`} className="pointer-events-none" style={{ zIndex: 10 }}>
      <rect 
        x={-width / 2} 
        y={-height / 2} 
        width={width} 
        height={height} 
        rx={rx} 
        fill="#020617" 
        stroke={borderColor} 
        strokeWidth={strokeWidth} 
        filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.8))" 
      />
      <text x={-textXOffset} y={textYOffset} fontSize={fontSize} fontWeight="900" textAnchor="middle" fill={attackColor}>
        ⚔ {unit.attack}
      </text>
      <text x="0" y={separatorYOffset} fontSize={fontSize} textAnchor="middle" fill="#64748b">|</text>
      <text x={textXOffset} y={textYOffset} fontSize={fontSize} fontWeight="900" textAnchor="middle" fill={hpColor}>
        ♥ {unit.hp}
      </text>
    </g>
  );
};
