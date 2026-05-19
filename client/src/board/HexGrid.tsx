import React, { useMemo, useState } from 'react';
import { generateHexMap, hexToPixel, HEX_SIZE } from './HexUtils';
import { BOARD_RADIUS, HexCoordinates } from 'shared';
import { useGameStore } from '../store/gameStore';

interface HexGridProps {
  validMoves: HexCoordinates[];
  validAttacks: HexCoordinates[];
  validSpawns: HexCoordinates[];
  chargePathHexes: HexCoordinates[];
  handleHexClick: (hex: HexCoordinates) => void;
}

const hexPolygonPoints = () => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30; // Pointy top
    const angle_rad = Math.PI / 180 * angle_deg;
    points.push(`${HEX_SIZE * Math.cos(angle_rad)},${HEX_SIZE * Math.sin(angle_rad)}`);
  }
  return points.join(' ');
};

export const HexGrid: React.FC<HexGridProps> = ({ 
  validMoves, validAttacks, validSpawns, chargePathHexes, handleHexClick 
}) => {
  const hexes = useMemo(() => generateHexMap(BOARD_RADIUS), []);
  const [hoveredHex, setHoveredHex] = useState<HexCoordinates | null>(null);

  const selectedHex = useGameStore(state => state.selectedHex);
  const selectedAbility = useGameStore(state => state.selectedAbility);
  const boardUnits = useGameStore(state => state.boardUnits);

  const getUnitAt = (q: number, r: number) => {
    return Object.values(boardUnits).find(u => u.position.q === q && u.position.r === r);
  };

  return (
    <g className="pointer-events-auto">
      {hexes.map((hex) => {
        const { x, y } = hexToPixel(hex);
        const isSelected = selectedHex?.q === hex.q && selectedHex?.r === hex.r;
        const unit = getUnitAt(hex.q, hex.r);
        const isMoveTarget = ((!selectedAbility || selectedAbility === 'salto') && validMoves.some(mv => mv.q === hex.q && mv.r === hex.r))
                             || chargePathHexes.some(mv => mv.q === hex.q && mv.r === hex.r);
        const isAttackTarget = validAttacks.some(at => at.q === hex.q && at.r === hex.r);
        const isSpawnTarget = validSpawns.some(mv => mv.q === hex.q && mv.r === hex.r);
        const isHovered = hoveredHex?.q === hex.q && hoveredHex?.r === hex.r;

        return (
          <g 
            key={`hex-${hex.q}-${hex.r}`}
            transform={`translate(${x}, ${y})`}
            onMouseEnter={() => setHoveredHex(hex)}
            onMouseLeave={() => setHoveredHex(null)}
            onClick={(e) => { e.stopPropagation(); handleHexClick(hex); }}
            className="cursor-pointer"
          >
            <polygon
              points={hexPolygonPoints()}
              className={`transition-all duration-150 stroke-[2.5px] ${
                isSelected ? 'stroke-yellow-400 fill-yellow-200/30 stroke-[4.5px]' :
                isAttackTarget ? 'stroke-red-500 fill-red-500/20 stroke-[3.5px]' :
                isMoveTarget && !unit ? 'stroke-emerald-500 fill-emerald-500/20 stroke-[3px]' :
                isSpawnTarget ? 'stroke-cyan-500 fill-cyan-500/20 stroke-[3px]' :
                isHovered ? 'fill-white/40 stroke-white/80' : 'fill-slate-100/20 stroke-white/35'
              }`}
            />
            {isMoveTarget && !unit && (
              <circle r="7" className="fill-emerald-400/60 pointer-events-none">
                <animate attributeName="r" values="5;8;5" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            {isSpawnTarget && !unit && (
              <circle r="8" className="fill-cyan-400/40 stroke-cyan-300/60 stroke-1 pointer-events-none">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </g>
  );
};
