import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { generateHexMap, hexToPixel, HEX_SIZE } from './HexUtils';
import { getValidMoveCoordinates, getValidSpawnCoordinates, getValidAttackTargets, getLineOfSight, getHexNeighbors, BOARD_RADIUS } from 'shared';
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
  const activeTransfusion = useGameStore(state => state.activeTransfusion);
  const activeMeteor = useGameStore(state => state.activeMeteor);

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
          <defs>
            <linearGradient id="blood-gradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="1.0" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.7" />
              <animateTransform 
                attributeName="gradientTransform" 
                type="translate" 
                from="-1 0" 
                to="1 0" 
                dur="1.5s" 
                repeatCount="indefinite" 
              />
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
              <stop offset="25%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="75%" stopColor="#7dd3fc" />
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
            <linearGradient id="ice-glare" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="mist-filter">
              <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
            </filter>
          </defs>

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
                            : isMoveTarget && !unit
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
                const hasMist = unit.buffs.some(b => b.type === 'immune_ranged');
                 
                let targetColor: 'red' | 'green' = 'red';
                if (selectedCard) {
                  const isArtifact = selectedCard.startsWith('art_');
                  const supportSpells = ['spl_aurarunica', 'spl_nevoa', 'spl_passos', 'spl_bencao', 'spl_furia'];
                  const isSupportSpell = supportSpells.includes(selectedCard);
                  if (isArtifact || isSupportSpell) targetColor = 'green';
                }

                return (
                  <g key={`unit-group-${unit.id}`}>
                    {/* Efeito de Névoa Espessa (Persistent Aura) */}
                    {hasMist && (
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transform={`translate(${x}, ${y})`}
                        className="pointer-events-none"
                      >
                        {[0, 72, 144, 216, 288].map((angle, i) => (
                          <motion.circle
                            key={`mist-${unit.id}-${i}`}
                            r={HEX_SIZE * 0.8}
                            fill="url(#mist-radial)"
                            filter="url(#mist-filter)"
                            animate={{ 
                              x: [
                                Math.cos(angle * Math.PI / 180) * 10, 
                                Math.cos((angle + 40) * Math.PI / 180) * 30, 
                                Math.cos(angle * Math.PI / 180) * 10
                              ],
                              y: [
                                Math.sin(angle * Math.PI / 180) * 10, 
                                Math.sin((angle + 40) * Math.PI / 180) * 30, 
                                Math.sin(angle * Math.PI / 180) * 10
                              ],
                              scale: [1, 1.4, 1],
                              opacity: [0.25, 0.45, 0.25]
                            }}
                            transition={{ 
                              duration: 6 + i, 
                              repeat: Infinity, 
                              ease: "easeInOut" 
                            }}
                          />
                        ))}
                        {/* Core densa da névoa */}
                        <motion.circle
                          r={HEX_SIZE * 1.1}
                          fill="url(#mist-radial)"
                          animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.95, 1.1, 0.95] }}
                          transition={{ duration: 5, repeat: Infinity }}
                        />
                      </motion.g>
                    )}

                    <foreignObject 
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

                     {/* Camada Frontal de Névoa (Cobre parcialmente a unidade) */}
                     {hasMist && (
                       <motion.g
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transform={`translate(${x}, ${y})`}
                         className="pointer-events-none"
                       >
                         {[36, 108, 180, 252, 324].map((angle, i) => (
                           <motion.circle
                             key={`mist-front-${unit.id}-${i}`}
                             r={HEX_SIZE * 0.9}
                             fill="url(#mist-radial)"
                             filter="url(#mist-filter)"
                             animate={{ 
                               x: [
                                 Math.cos(angle * Math.PI / 180) * 15, 
                                 Math.cos((angle + 20) * Math.PI / 180) * 40, 
                                 Math.cos(angle * Math.PI / 180) * 15
                               ],
                               y: [
                                 Math.sin(angle * Math.PI / 180) * 15, 
                                 Math.sin((angle + 20) * Math.PI / 180) * 40, 
                                 Math.sin(angle * Math.PI / 180) * 15
                               ],
                               scale: [0.8, 1.3, 0.8],
                               opacity: [0.2, 0.5, 0.2]
                             }}
                             transition={{ 
                               duration: 5 + i * 2, 
                               repeat: Infinity, 
                               ease: "easeInOut" 
                             }}
                           />
                         ))}
                       </motion.g>
                     )}
                   </g>
                 );
              })}
            </AnimatePresence>
          </g>

          {/* 3. Camada de Efeitos Especiais (Transfusão) */}
          <AnimatePresence>
            {activeTransfusion && (
               <motion.g
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 key="transfusion-animation"
                 className="pointer-events-none"
               >
                 {(() => {
                   const start = hexToPixel(activeTransfusion.source);
                   const end = hexToPixel(activeTransfusion.target);
                   return (
                     <>
                        {/* Fluxo totalmente contínuo com gradiente animado */}
                        <motion.path
                          d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                          fill="none"
                          stroke="url(#blood-gradient)"
                          strokeWidth="12"
                          strokeLinecap="round"
                          animate={{ 
                            strokeWidth: [10, 14, 10],
                            strokeOpacity: [0.6, 0.9, 0.6] 
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Núcleo de brilho fino (contínuo) */}
                        <motion.path
                          d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.4)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                        
                        {/* Brilho nos nós de conexão */}
                        <circle cx={start.x} cy={start.y} r={10} fill="url(#blood-glow)" opacity="0.5" />
                        <circle cx={end.x} cy={end.y} r={12} fill="url(#blood-glow)" opacity="0.5" />
                     </>
                   );
                 })()}
               </motion.g>
            )}

            {activeMeteor && (
                <motion.g
                  key="meteor-animation"
                  className="pointer-events-none"
                >
                  {(() => {
                    const epicenterPos = hexToPixel(activeMeteor);
                    const neighborHexes = getHexNeighbors(activeMeteor);
                    
                    // Definimos os meteoros: 4 no centro, 6 nas bordas (total 10)
                    // Usamos offsets fixos para evitar que o Math.random re-calcule e faça os meteoros "pularem" em re-renderizações
                    const epicenterOffsets = [
                      { dx: 15, dy: 10 }, { dx: -10, dy: -20 }, 
                      { dx: -20, dy: 5 }, { dx: 10, dy: -15 }
                    ];

                    const meteorData = [
                      // Epicentro (4 meteoros com offsets estáveis)
                      ...epicenterOffsets.map((off, i) => ({
                         target: { x: epicenterPos.x + off.dx, y: epicenterPos.y + off.dy },
                         delay: i * 0.05,
                         isEpicenter: true
                      })),
                      // Vizinhos (Todos os 6 agora, ordem estável vinda do getHexNeighbors)
                      ...neighborHexes.map((n, i) => ({
                         target: hexToPixel(n),
                         delay: 0.1 + i * 0.05,
                         isEpicenter: false
                      }))
                    ];

                    return (
                      <>
                        {meteorData.map((m, idx) => (
                          <motion.g key={`meteor-drop-${idx}`}>
                            {/* O Meteoro Caindo */}
                            <motion.g 
                              initial={{ x: m.target.x - 150, y: m.target.y - 300, opacity: 0 }}
                              animate={{ 
                                x: m.target.x, 
                                y: m.target.y, 
                                opacity: [0, 1, 1, 0] // Desaparece no exato momento do impacto
                              }}
                              transition={{ 
                                duration: 0.2, 
                                delay: m.delay, 
                                ease: "easeIn",
                                times: [0, 0.2, 0.95, 1] 
                              }}
                            >
                               <line x1="-10" y1="-40" x2="0" y2="0" stroke="url(#meteor-trail)" strokeWidth="6" strokeLinecap="round" />
                               <circle r={m.isEpicenter ? 8 : 6} fill="#ef4444" />
                               <circle r={m.isEpicenter ? 4 : 3} fill="#fef08a" />
                            </motion.g>

                            {/* Impacto Individual */}
                            <motion.g
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: m.delay + 0.2 }}
                              transform={`translate(${m.target.x}, ${m.target.y})`}
                            >
                               <motion.circle 
                                 r={m.isEpicenter ? HEX_SIZE * 1.2 : HEX_SIZE * 0.8} 
                                 fill="url(#explosion-glow)"
                                 initial={{ scale: 0 }}
                                 animate={{ scale: [1, 1.2, 0], opacity: [0.8, 1, 0] }}
                                 transition={{ duration: 0.3 }}
                               />
                            </motion.g>
                          </motion.g>
                        ))}

                        {/* Onda de Choque Global (Epicentro) */}
                        <motion.circle 
                          cx={epicenterPos.x}
                          cy={epicenterPos.y}
                          r={HEX_SIZE * 2.5} 
                          fill="none" 
                          stroke="#f97316" 
                          strokeWidth="4"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.5], opacity: [0.8, 0] }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        />
                      </>
                    );
                  })()}
                </motion.g>
             )}
          </AnimatePresence>
        </svg>

      </div>
    </div>
  );
};
