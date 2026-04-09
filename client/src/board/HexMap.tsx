import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { generateHexMap, hexToPixel, HEX_SIZE } from './HexUtils';
import { getValidMoveCoordinates, getValidSpawnCoordinates, getValidAttackTargets, getLineOfSight, BOARD_RADIUS } from 'shared';
import type { HexCoordinates } from 'shared';
import { UnitSprite } from './UnitSprite';
import { useGameStore } from '../store/gameStore';

const hexPolygonPoints = () => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    points.push(`${HEX_SIZE * Math.cos(angle_rad)},${HEX_SIZE * Math.sin(angle_rad)}`);
  }
  return points.join(' ');
};

export const HexMap: React.FC = () => {
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

  const getUnitAt = (q: number, r: number) => {
    return Object.values(boardUnits).find(u => u.position.q === q && u.position.r === r);
  };

  const sandboxMode = useGameStore(state => state.sandboxMode);

  const validMoves = useMemo(() => {
    if (!selectedHex) return [];
    const unit = getUnitAt(selectedHex.q, selectedHex.r);
    if (!unit) return [];
    if (!sandboxMode && unit.playerId !== currentTurnPlayerId) return [];

    // HACK: No sandbox passamos um mock da unidade para liberar todos os movimentos possíveis
    const unitToVal = sandboxMode ? { ...unit, canMove: true, summoningSickness: false } : unit;
    const mockBoard = { ...boardUnits, [unit.id]: unitToVal };
    const isUsingSpecial = !!selectedAbility;
    return getValidMoveCoordinates({ boardUnits: mockBoard, currentTurnPlayerId: unit.playerId, currentPhase: 'MAIN_PHASE' } as any, unit.id, isUsingSpecial);
  }, [selectedHex, boardUnits, currentTurnPlayerId, sandboxMode, selectedAbility]);

  // NOVO: Indicadores de Ataque
  const validAttacks = useMemo(() => {
    if (!selectedHex) return [];
    const unit = getUnitAt(selectedHex.q, selectedHex.r);
    if (!unit) return [];
    if (!sandboxMode && unit.playerId !== currentTurnPlayerId) return [];

    // HACK: No sandbox passamos um mock da unidade para liberar todos os ataques possíveis (incluindo Choque)
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
      // No sandbox, permitimos selecionar qualquer hex mesmo vazio
      if (clickedUnit || sandboxMode) {
        setSelectedHex(hex);
      }
      return;
    }

    const isSameSelected = selectedHex.q === hex.q && selectedHex.r === hex.r;
    if (isSameSelected) {
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
        if (clickedUnit.playerId !== selectedUnit.playerId) {
          attemptAttack(selectedUnit.id, clickedUnit.id);
        }
      } else {
        if (!selectedAbility || selectedAbility === 'salto') attemptMove(selectedUnit.id, hex);
      }
    } else if (sandboxMode) {
        // Se já tiver algo selecionado mas não for uma unidade minha (ex: hex vazio)
        // apenas mudamos a seleção do sandbox
        setSelectedHex(hex);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-transparent overflow-hidden select-none font-[Inter]">
      {/* Background effects (Suavizados para o novo BG global) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,58,138,0.3),_transparent_70%)]" />
      </div>
      
      <div className="absolute inset-0 pointer-events-auto">
        <svg 
          viewBox="-800 -800 1600 1600" 
          className="w-full h-full"
          style={{ touchAction: 'none' }}
          onClick={() => { setSelectedHex(null); setTargetHex(null); }}
        >
          {/* 1. Camada do Grid (Hexágonos) */}
          <g>
            {hexes.map((hex) => {
              const { x, y } = hexToPixel(hex);
              const isSelected = selectedHex?.q === hex.q && selectedHex?.r === hex.r;
              const isTarget = targetHex?.q === hex.q && targetHex?.r === hex.r;
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
                    className={`
                      transition-all duration-150 stroke-[2px]
                      ${isSelected 
                        ? 'stroke-yellow-400 fill-yellow-500/15 stroke-[4px]'
                        : isTarget
                          ? 'stroke-[#602471] fill-[#602471]/25 stroke-[4px]'
                          : isAttackTarget
                            ? 'stroke-[#602471]/60 fill-[#602471]/15 stroke-[3px]'
                            : isMoveTarget
                              ? 'stroke-[#0b622f]/50 fill-[#0b622f]/10 stroke-[2.5px]'
                              : isSpawnTarget
                                ? 'stroke-cyan-400/50 fill-cyan-900/10 stroke-[2.5px]'
                                : isHovered
                                  ? 'fill-slate-700/50 stroke-slate-500/80'
                                  : 'fill-slate-800/30 stroke-slate-700/40'
                      }
                    `}
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

                  {isAttackTarget && unit && (
                    <g className="pointer-events-none">
                      <circle r="12" className="fill-none stroke-[#602471]/60 stroke-[2px]">
                        <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      <line x1="-18" y1="0" x2="-8" y2="0" className="stroke-[#602471]/70 stroke-[2px]" />
                      <line x1="8" y1="0" x2="18" y2="0" className="stroke-[#602471]/70 stroke-[2px]" />
                      <line x1="0" y1="-18" x2="0" y2="-8" className="stroke-[#602471]/70 stroke-[2px]" />
                      <line x1="0" y1="8" x2="0" y2="18" className="stroke-[#602471]/70 stroke-[2px]" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 2. Camada das Unidades (Separada para compatibilidade com iOS/WebKit) */}
          <g className="units-layer">
            <AnimatePresence>
              {Object.values(boardUnits).map((unit) => {
                const { x, y } = hexToPixel(unit.position);
                const isSelected = selectedHex?.q === unit.position.q && selectedHex?.r === unit.position.r;
                
                // Destaque de Ataque (Sempre vermelho)
                const isAttackTarget = validAttacks.some(at => at.q === unit.position.q && at.r === unit.position.r);
                
                // Destaque de Carta (Pode ser verde ou vermelho)
                const isCardTarget = validSpawns.some(at => at.q === unit.position.q && at.r === unit.position.r);
                
                let targetColor: 'red' | 'green' = 'red';
                if (selectedCard) {
                  const isArtifact = selectedCard.startsWith('art_');
                  const supportSpells = ['spl_aurarunica', 'spl_nevoa', 'spl_passos', 'spl_bencao', 'spl_furia'];
                  const isSupportSpell = supportSpells.includes(selectedCard);
                  if (isArtifact || isSupportSpell) targetColor = 'green';
                }

                return (
                  <foreignObject 
                    key={`unit-${unit.id}`}
                    x={x - HEX_SIZE} 
                    y={y - HEX_SIZE} 
                    width={HEX_SIZE * 2} 
                    height={HEX_SIZE * 2} 
                    className="pointer-events-none"
                    style={{ overflow: 'visible' }}
                  >
                    <div 
                      {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                      className="w-full h-full flex items-center justify-center"
                      style={{ WebkitBackfaceVisibility: 'hidden' }}
                    >
                      <UnitSprite 
                        unit={unit} 
                        isSelected={isSelected} 
                        isTargetable={isAttackTarget || isCardTarget}
                        targetColor={targetColor}
                        animation={animatingUnits[unit.id]}
                      />
                    </div>
                  </foreignObject>
                );
              })}
            </AnimatePresence>
          </g>
        </svg>

      </div>
    </div>
  );
};
