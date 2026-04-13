import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from './HexUtils';
import { HexCoordinates } from 'shared';
import { useGameStore } from '../store/gameStore';
import { UnitSprite } from './UnitSprite';

interface UnitLayerProps {
  validAttacks: HexCoordinates[];
  validSpawns: HexCoordinates[];
}

export const UnitLayer: React.FC<UnitLayerProps> = ({ validAttacks, validSpawns }) => {
  const boardUnits = useGameStore(state => state.boardUnits);
  const selectedHex = useGameStore(state => state.selectedHex);
  const selectedCard = useGameStore(state => state.selectedCard);
  const animatingUnits = useGameStore(state => state.animatingUnits);
  const activeThrust = useGameStore(state => state.activeThrust);

  const sortedUnits = useMemo(() => {
    const units = Object.values(boardUnits);
    // Ordenação estrita por ID para congelar a árvore DOM.
    // Isso evita o repensamento (repaint flash) pesado do Chromium ao reordenar
    return [...units].sort((a, b) => a.id.localeCompare(b.id));
  }, [boardUnits]);

  return (
    <g>
      {sortedUnits.map((unit) => {
        const { x, y } = hexToPixel(unit.position);
        const isSelected = selectedHex?.q === unit.position.q && selectedHex?.r === unit.position.r;
        const isAttackTarget = validAttacks.some(at => at.q === unit.position.q && at.r === unit.position.r);
        const isCardTarget = validSpawns.some(at => at.q === unit.position.q && at.r === unit.position.r);
        
        let targetColor: 'red' | 'green' = 'red';
        if (selectedCard) {
          const isArtifact = selectedCard.startsWith('art_');
          const supportSpells = ['spl_aurarunica', 'spl_nevoa', 'spl_passos', 'spl_bencao', 'spl_furia'];
          if (isArtifact || supportSpells.includes(selectedCard)) targetColor = 'green';
        }

        const isThrusting = activeThrust?.attackerId === unit.id;
        let thrustOffset = { x: 0, y: 0 };
        let thrustDistance = 0;
        let thrustAngle = 0;

        if (isThrusting && activeThrust) {
          const targetPx = hexToPixel(activeThrust.target);
          const dx = targetPx.x - x;
          const dy = targetPx.y - y;
          thrustOffset = { x: dx * 0.05, y: dy * 0.05 };
          thrustDistance = Math.hypot(dx, dy);
          thrustAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        }

        return (
          <motion.g 
            key={`unit-group-${unit.id}`} 
            animate={{ x: x + thrustOffset.x, y: y + thrustOffset.y }}
            transition={isThrusting ? {
              duration: 0.15, // Estocada rápida
              repeat: 1,
              repeatType: "reverse",
              ease: "easeOut"
            } : { type: 'spring', stiffness: 300, damping: 30 }}
          >
            <foreignObject 
              x={-HEX_SIZE} 
              y={-HEX_SIZE} 
              width={HEX_SIZE * 2} 
              height={HEX_SIZE * 2}
              className="overflow-visible pointer-events-none"
            >
              <div className="w-full h-full flex items-center justify-center pointer-events-none">
                <UnitSprite 
                  unit={unit} 
                  isSelected={isSelected} 
                  isTargetable={isAttackTarget || isCardTarget}
                  targetColor={targetColor}
                  animation={isThrusting ? 'attacking' : animatingUnits[unit.id]}
                  thrustTarget={isThrusting ? activeThrust!.target : undefined}
                  thrustDistance={isThrusting ? thrustDistance : undefined}
                  thrustAngle={isThrusting ? thrustAngle : undefined}
                />
              </div>
            </foreignObject>
          </motion.g>
        );
      })}
    </g>
  );
};
