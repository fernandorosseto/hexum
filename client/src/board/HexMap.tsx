import React, { useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { generateHexMap, hexToPixel, HEX_SIZE } from './HexUtils';
import { 
  getValidMoveCoordinates, 
  getValidSpawnCoordinates, 
  getValidAttackTargets, 
  getLineOfSight, 
  getHexNeighbors, 
  BOARD_RADIUS 
} from 'shared';
import type { HexCoordinates } from 'shared';
import { UnitSprite } from './UnitSprite';
import { useGameStore } from '../store/gameStore';

const hexPolygonPoints = () => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30; // Pointy top
    const angle_rad = Math.PI / 180 * angle_deg;
    points.push(`${HEX_SIZE * Math.cos(angle_rad)},${HEX_SIZE * Math.sin(angle_rad)}`);
  }
  return points.join(' ');
};

export const HexMap: React.FC = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Controle de Zoom (Pinch/Wheel) e Pan (Drag)
  const scale = useMotionValue(isMobile ? 1.4 : 1.0);
  const springScale = useSpring(scale, { stiffness: 300, damping: 30 });
  const lastPinchDistance = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDistance.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / lastPinchDistance.current;
      const newScale = Math.min(Math.max(scale.get() * delta, 0.4), 2.5);
      scale.set(newScale);
      lastPinchDistance.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastPinchDistance.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale.get() * delta, 0.4), 2.5);
    scale.set(newScale);
  };

  const hexes = useMemo(() => generateHexMap(BOARD_RADIUS), []);
  const [hoveredHex, setHoveredHex] = useState<HexCoordinates | null>(null);

  const boardUnits = useGameStore(state => state.boardUnits);
  const selectedHex = useGameStore(state => state.selectedHex);
  const targetHex = useGameStore(state => state.targetHex);
  const currentTurnPlayerId = useGameStore(state => state.currentTurnPlayerId);
  const setSelectedHex = useGameStore(state => state.setSelectedHex);
  const setTargetHex = useGameStore(state => state.setTargetHex);
  const attemptPlayCard = useGameStore(state => state.attemptPlayCard);
  const attemptMove = useGameStore(state => state.attemptMove);
  const attemptAttack = useGameStore(state => state.attemptAttack);
  const attemptHeal = useGameStore(state => state.attemptHeal);
  const selectedCard = useGameStore(state => state.selectedCard);
  const animatingUnits = useGameStore(state => state.animatingUnits);
  const selectedAbility = useGameStore(state => state.selectedAbility);
  const activeTransfusion = useGameStore(state => state.activeTransfusion);
  const activeMeteor = useGameStore(state => state.activeMeteor);
  const sandboxMode = useGameStore(state => state.sandboxMode);

  const getUnitAt = (q: number, r: number) => {
    return Object.values(boardUnits).find(u => u.position.q === q && u.position.r === r);
  };

  const validMoves = useMemo(() => {
    if (!selectedHex) return [];
    const unit = getUnitAt(selectedHex.q, selectedHex.r);
    if (!unit) return [];
    if (!sandboxMode && unit.playerId !== currentTurnPlayerId) return [];
    const unitToVal = sandboxMode ? { ...unit, canMove: true, summoningSickness: false } : unit;
    const mockBoard = { ...boardUnits, [unit.id]: unitToVal };
    const isUsingSpecial = !!selectedAbility;
    return getValidMoveCoordinates({ boardUnits: mockBoard, currentTurnPlayerId: unit.playerId, currentPhase: 'MAIN_PHASE' } as any, unit.id, isUsingSpecial);
  }, [selectedHex, boardUnits, currentTurnPlayerId, sandboxMode, selectedAbility]);

  const validAttacks = useMemo(() => {
    if (!selectedHex) return [];
    const unit = getUnitAt(selectedHex.q, selectedHex.r);
    if (!unit) return [];
    if (!sandboxMode && unit.playerId !== currentTurnPlayerId) return [];
    const unitToVal = sandboxMode ? { ...unit, canAttack: true, summoningSickness: false } : unit;
    const mockBoard = { ...boardUnits, [unit.id]: unitToVal };
    const isUsingSpecial = !!selectedAbility;
    return getValidAttackTargets({ boardUnits: mockBoard, currentTurnPlayerId: unit.playerId, currentPhase: 'MAIN_PHASE' } as any, unit.id, isUsingSpecial);
  }, [selectedHex, boardUnits, currentTurnPlayerId, sandboxMode, selectedAbility]);

  const validSpawns = useMemo(() => {
    if (!selectedCard) return [];
    const gameState = useGameStore.getState();
    return getValidSpawnCoordinates(gameState, currentTurnPlayerId, selectedCard);
  }, [selectedCard, boardUnits, currentTurnPlayerId]);

  const chargePathHexes = useMemo(() => {
    if ((selectedAbility !== 'choque' && selectedAbility !== 'salto') || !selectedHex) return [];
    const paths: HexCoordinates[] = [];
    validAttacks.forEach(targetPos => {
      const line = getLineOfSight(selectedHex, targetPos);
      for (let i = 1; i < line.length - 1; i++) {
        paths.push(line[i]);
      }
    });
    return paths;
  }, [selectedAbility, selectedHex, validAttacks]);

  const handleHexClick = (hex: HexCoordinates) => {
    if (selectedCard) {
      attemptPlayCard(selectedCard, hex);
      return;
    }
    const clickedUnit = getUnitAt(hex.q, hex.r);
    const selectedUnit = selectedHex ? getUnitAt(selectedHex.q, selectedHex.r) : null;

    if (!selectedHex) {
      if (clickedUnit || sandboxMode) setSelectedHex(hex);
      return;
    }

    if (selectedHex.q === hex.q && selectedHex.r === hex.r) {
      setSelectedHex(null);
      return;
    }

    if (clickedUnit && clickedUnit.playerId === selectedUnit?.playerId) {
      if (selectedUnit?.unitClass === 'Clerigo' && clickedUnit.id !== selectedUnit.id) {
        attemptHeal(selectedUnit.id, clickedUnit.id);
      } else {
        setSelectedHex(hex);
      }
      return;
    }

    if (selectedUnit) {
      if (clickedUnit) {
        if (clickedUnit.playerId !== selectedUnit.playerId) attemptAttack(selectedUnit.id, clickedUnit.id);
      } else {
        if (!selectedAbility || selectedAbility === 'salto') attemptMove(selectedUnit.id, hex);
      }
    } else if (sandboxMode) {
      setSelectedHex(hex);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-transparent overflow-hidden select-none font-[Inter]">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,58,138,0.3),_transparent_70%)]" />
      </div>

      <motion.div 
        className="absolute inset-0 flex items-center justify-center p-20 cursor-grab active:cursor-grabbing touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ scale: springScale }}
        drag
        dragElastic={0.2}
        dragConstraints={{ left: -1000, right: 1000, top: -800, bottom: 800 }}
        onClick={() => { setSelectedHex(null); setTargetHex(null); }}
      >
        <svg 
          viewBox="-800 -800 1600 1600"
          className="w-full h-full overflow-visible pointer-events-none"
        >
          <defs>
            <linearGradient id="blood-gradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="1.0" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.7" />
              <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="1.5s" repeatCount="indefinite" />
            </linearGradient>
            <radialGradient id="blood-glow">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
            </radialGradient>
            <radialGradient id="mist-radial">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
              <stop offset="50%" stopColor="rgba(220, 220, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(200, 200, 255, 0)" />
            </radialGradient>
            <linearGradient id="ice-wall-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
            <linearGradient id="meteor-trail" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <radialGradient id="explosion-glow">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="40%" stopColor="#f97316" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="mist-filter">
              <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
            </filter>
          </defs>

          {/* Grid de Hexágonos */}
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
                    className={`transition-all duration-150 stroke-[2px] ${
                      isSelected ? 'stroke-yellow-400 fill-yellow-500/15 stroke-[4px]' :
                      isAttackTarget ? 'stroke-[#602471]/60 fill-[#602471]/15 stroke-[3px]' :
                      isMoveTarget && !unit ? 'stroke-[#0b622f]/50 fill-[#0b622f]/10 stroke-[2.5px]' :
                      isSpawnTarget ? 'stroke-cyan-400/50 fill-cyan-900/10 stroke-[2.5px]' :
                      isHovered ? 'fill-slate-700/50 stroke-slate-500/80' : 'fill-slate-800/30 stroke-slate-700/40'
                    }`}
                  />
                  {isMoveTarget && !unit && (
                    <circle r="7" className="fill-[#0b622f]/40 pointer-events-none">
                      <animate attributeName="r" values="5;8;5" dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isSpawnTarget && !unit && (
                    <circle r="8" className="fill-cyan-400/30 stroke-cyan-300/40 stroke-1 pointer-events-none">
                      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* Camada de Unidades (Dentro do SVG para sincronização atômica) */}
          <g>
            {Object.values(boardUnits).map((unit) => {
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

              return (
                <g key={`unit-group-${unit.id}`} transform={`translate(${x}, ${y})`}>
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
                        animation={animatingUnits[unit.id]}
                      />
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>

          <AnimatePresence>
            {activeTransfusion && (
               <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none">
                 {(() => {
                   const start = hexToPixel(activeTransfusion.source);
                   const end = hexToPixel(activeTransfusion.target);
                   return (
                     <>
                        <motion.path d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`} fill="none" stroke="url(#blood-gradient)" strokeWidth="12" strokeLinecap="round" />
                        <circle cx={start.x} cy={start.y} r={10} fill="url(#blood-glow)" opacity="0.5" />
                        <circle cx={end.x} cy={end.y} r={12} fill="url(#blood-glow)" opacity="0.5" />
                     </>
                   );
                 })()}
               </motion.g>
            )}

            {activeMeteor && (
                <motion.g key="meteor-animation" className="pointer-events-none">
                  {(() => {
                    const epicenterPos = hexToPixel(activeMeteor);
                    const neighborHexes = getHexNeighbors(activeMeteor);
                    const epicenterOffsets = [{ dx: 15, dy: 10 }, { dx: -10, dy: -20 }, { dx: -20, dy: 5 }, { dx: 10, dy: -15 }];
                    const meteorData = [
                      ...epicenterOffsets.map((off, i) => ({ target: { x: epicenterPos.x + off.dx, y: epicenterPos.y + off.dy }, delay: i * 0.05, isEpicenter: true })),
                      ...neighborHexes.map((n, i) => ({ target: hexToPixel(n), delay: 0.1 + i * 0.05, isEpicenter: false }))
                    ];
                    return (
                      <>
                        {meteorData.map((m, idx) => (
                          <motion.g key={`meteor-drop-${idx}`}>
                            <motion.g initial={{ x: m.target.x - 150, y: m.target.y - 300, opacity: 0 }} animate={{ x: m.target.x, y: m.target.y, opacity: [0, 1, 1, 0] }} transition={{ duration: 0.2, delay: m.delay, ease: "easeIn" }}>
                              <line x1="-10" y1="-40" x2="0" y2="0" stroke="url(#meteor-trail)" strokeWidth="6" strokeLinecap="round" />
                              <circle r={m.isEpicenter ? 8 : 6} fill="#ef4444" />
                            </motion.g>
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: m.delay + 0.2 }} transform={`translate(${m.target.x}, ${m.target.y})`}>
                                <motion.circle r={m.isEpicenter ? HEX_SIZE * 1.2 : HEX_SIZE * 0.8} fill="url(#explosion-glow)" initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 0], opacity: [0.8, 1, 0] }} transition={{ duration: 0.3 }} />
                            </motion.g>
                          </motion.g>
                        ))}
                      </>
                    );
                  })()}
                </motion.g>
            )}

            {Object.values(boardUnits).filter(u => u.buffs.some(b => b.type === 'immune_ranged')).map(unit => {
              const { x, y } = hexToPixel(unit.position);
              return (
                <motion.g key={`mist-layer-${unit.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transform={`translate(${x}, ${y})`} className="pointer-events-none">
                  {[0, 72, 144, 216, 288].map((angle, i) => (
                    <motion.circle
                      key={`mist-${unit.id}-${i}`}
                      r={HEX_SIZE * 0.8}
                      fill="url(#mist-radial)"
                      filter="url(#mist-filter)"
                      animate={{ 
                        x: [Math.cos(angle * Math.PI / 180) * 10, Math.cos((angle + 40) * Math.PI / 180) * 30, Math.cos(angle * Math.PI / 180) * 10],
                        y: [Math.sin(angle * Math.PI / 180) * 10, Math.sin((angle + 40) * Math.PI / 180) * 30, Math.sin(angle * Math.PI / 180) * 10],
                        scale: [1, 1.4, 1],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </motion.div>
    </div>
  );
};
