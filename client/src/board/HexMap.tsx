import React, { useMemo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  getValidMoveCoordinates, 
  getValidSpawnCoordinates, 
  getValidAttackTargets, 
  getLineOfSight, 
} from 'shared';
import type { HexCoordinates } from 'shared';
import { useGameStore } from '../store/gameStore';
import { useZoomPan } from '../hooks/useZoomPan';
import { HexGrid } from './HexGrid';
import { UnitLayer } from './UnitLayer';
import {
  SvgDefs,
  SpearAnimation,
  ProjectileAnimation,
  MeteorAnimation,
  TransfusionAnimation,
  MistEffect,
  CleaveSlash,
  OverheadSlash,
  ArcaneExplosion,
  ShadowSlash,
  AuraRunicaAnimation,
  DivineBlessingAnimation,
  EarthRootsAnimation,
  FuryPulseAnimation,
  WallFormationAnimation,
  MistImpactAnimation,
  WindTrailAnimation
} from '../animations';

export const HexMap: React.FC = () => {
  const { springScale, handlers } = useZoomPan();

  const boardUnits = useGameStore(state => state.boardUnits);
  const selectedHex = useGameStore(state => state.selectedHex);
  const setSelectedHex = useGameStore(state => state.setSelectedHex);
  const setTargetHex = useGameStore(state => state.setTargetHex);
  const currentTurnPlayerId = useGameStore(state => state.currentTurnPlayerId);
  
  const attemptPlayCard = useGameStore(state => state.attemptPlayCard);
  const attemptMove = useGameStore(state => state.attemptMove);
  const attemptAttack = useGameStore(state => state.attemptAttack);
  const attemptHeal = useGameStore(state => state.attemptHeal);
  
  const selectedCard = useGameStore(state => state.selectedCard);
  const selectedAbility = useGameStore(state => state.selectedAbility);
  const activeTransfusion = useGameStore(state => state.activeTransfusion);
  const activeProjectile = useGameStore(state => state.activeProjectile);
  const activeThrust = useGameStore(state => state.activeThrust);
  const activeMeteor = useGameStore(state => state.activeMeteor);
  const activeCleave = useGameStore(state => state.activeCleave);
  const activeOverheadSlash = useGameStore(state => state.activeOverheadSlash);
  const activeShadowSlash = useGameStore(state => state.activeShadowSlash);
  const activeArcaneExplosion = useGameStore(state => state.activeArcaneExplosion);
  const activeAuraRunica = useGameStore(state => state.activeAuraRunica);
  const activeDivineBlessing = useGameStore(state => state.activeDivineBlessing);
  const activeEarthRoots = useGameStore(state => state.activeEarthRoots);
  const activeFuryPulse = useGameStore(state => state.activeFuryPulse);
  const activeWallFormation = useGameStore(state => state.activeWallFormation);
  const activeMistImpact = useGameStore(state => state.activeMistImpact);
  const activeWindTrail = useGameStore(state => state.activeWindTrail);
  const sandboxMode = useGameStore(state => state.sandboxMode);
  const isInspectMode = useGameStore(state => state.isInspectMode);
  const isPvP = useGameStore(state => state.isPvP);
  const myRole = useGameStore(state => state.myRole);

  const [dragConstraints, setDragConstraints] = useState({ left: -400, right: 400, top: -400, bottom: 400 });

  useEffect(() => {
    const updateConstraints = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768) {
          // Mobile: constraints maiores para permitir exploração do board
          setDragConstraints({ left: -180, right: 180, top: -250, bottom: 250 });
        } else {
          setDragConstraints({ left: -400, right: 400, top: -400, bottom: 400 });
        }
      }
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

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
    // Se o modo de inspeção estiver ativo, ignoramos a lógica de combate/movimento
    // e apenas selecionamos o hexágono para ver suas informações.
    if (isInspectMode) {
      setSelectedHex(hex);
      return;
    }

    // No PvP, você só pode interagir no seu turno (a menos que seja inspeção)
    const isMyTurn = isPvP ? (currentTurnPlayerId === myRole) : (currentTurnPlayerId === 'p1');
    if (isPvP && !isMyTurn) return;

    if (selectedCard) {
      attemptPlayCard(selectedCard, hex);
      return;
    }
    const clickedUnit = getUnitAt(hex.q, hex.r);
    const selectedUnit = selectedHex ? getUnitAt(selectedHex.q, selectedHex.r) : null;

    if (!selectedHex) {
      if (clickedUnit || sandboxMode) {
        // No PvP, você só pode selecionar suas próprias unidades para agir
        if (isPvP && clickedUnit && clickedUnit.playerId !== myRole) {
          // Permite apenas "ver" a unidade, mas não selecioná-la para movimento (limpamos a seleção se não for sua)
          setSelectedHex(hex);
          return;
        }
        setSelectedHex(hex);
      }
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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,58,138,0.3),_transparent_70%)]" />
      </div>

      <motion.div 
        className="absolute inset-0 flex items-center justify-center p-4 md:p-20 pt-12 md:pt-20 pb-24 md:pb-20 cursor-grab active:cursor-grabbing touch-none select-none"
        {...handlers}
        style={{ scale: springScale }}
        drag
        dragElastic={0.2}
        dragConstraints={dragConstraints}
        onClick={() => { setSelectedHex(null); setTargetHex(null); }}
      >
        <svg viewBox={typeof window !== 'undefined' && window.innerWidth < 768 ? "-550 -500 1100 1000" : "-700 -650 1400 1300"} className="w-full h-full overflow-visible pointer-events-none">
          <SvgDefs />

          <HexGrid 
            validMoves={validMoves}
            validAttacks={validAttacks}
            validSpawns={validSpawns}
            chargePathHexes={chargePathHexes}
            handleHexClick={handleHexClick}
          />

          <UnitLayer 
            validAttacks={validAttacks}
            validSpawns={validSpawns}
          />

          <AnimatePresence>
            {activeTransfusion && (
              <TransfusionAnimation source={activeTransfusion.source} target={activeTransfusion.target} />
            )}
            {activeMeteor && (
              <MeteorAnimation epicenter={activeMeteor} />
            )}
            {activeThrust && (() => {
              const attacker = boardUnits[activeThrust.attackerId];
              if (!attacker || attacker.unitClass !== 'Lanceiro') return null;
              return (
                <SpearAnimation attackerPosition={attacker.position} target={activeThrust.target} />
              );
            })()}
            {activeProjectile && (
              <ProjectileAnimation
                key={activeProjectile.id}
                source={activeProjectile.source}
                target={activeProjectile.target}
                playerId={activeProjectile.playerId}
              />
            )}
            {activeArcaneExplosion && (
              <ArcaneExplosion key="arcane" epicenter={activeArcaneExplosion.epicenter} />
            )}
            {activeShadowSlash && (
              <ShadowSlash key="shadow" target={activeShadowSlash.target} />
            )}
            {activeCleave && (
              <CleaveSlash key="cleave" source={activeCleave.source} target={activeCleave.target} color={activeCleave.color} />
            )}
            {activeOverheadSlash && (
              <OverheadSlash key="overhead-slash" source={activeOverheadSlash.source} target={activeOverheadSlash.target} />
            )}
            {activeAuraRunica && (
              <AuraRunicaAnimation key="aura-runica" target={activeAuraRunica} />
            )}
            {activeDivineBlessing && (
              <DivineBlessingAnimation key="divine-blessing" target={activeDivineBlessing} />
            )}
            {activeEarthRoots && (
              <EarthRootsAnimation key="earth-roots" target={activeEarthRoots} />
            )}
            {activeFuryPulse && (
              <FuryPulseAnimation key="fury-pulse" target={activeFuryPulse} />
            )}
            {activeWallFormation && (
              <WallFormationAnimation key="wall-formation" targets={activeWallFormation} />
            )}
            {activeMistImpact && (
              <MistImpactAnimation key="mist-impact" target={activeMistImpact} />
            )}
            {activeWindTrail && (
              <WindTrailAnimation key="wind-trail" target={activeWindTrail} />
            )}
            {Object.values(boardUnits).filter(u => u.buffs.some(b => b.type === 'immune_ranged')).map(unit => (
              <MistEffect key={`mist-layer-${unit.id}`} unit={unit} />
            ))}
          </AnimatePresence>
        </svg>
      </motion.div>
    </div>
  );
};
