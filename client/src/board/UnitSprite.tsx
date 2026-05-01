import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Unit, HexCoordinates } from 'shared';
import { getFearStatus } from 'shared';
import { useGameStore } from '../store/gameStore';
import { CLASS_ICONS } from '../constants/unitIcons';
import { HEX_SIZE } from './HexUtils';
import kingImg from '../assets/icons/king.png';
import { LightningAnimation } from '../animations';
import { StructureSprite, UnitBadges, UnitBuffs, ShieldAura, UnitEquipment } from '../units';

interface Props {
  unit: Unit;
  isSelected?: boolean;
  isTargetable?: boolean;
  targetColor?: 'red' | 'green';
  animation?: 'attacking' | 'damaged' | 'healing' | 'lightning';
  thrustTarget?: HexCoordinates;
  thrustDistance?: number;
  thrustAngle?: number;
}

export const UnitSprite: React.FC<Props> = ({ 
  unit, isSelected, isTargetable, targetColor, animation, thrustTarget, thrustDistance, thrustAngle 
}) => {
  const gameState = useGameStore(state => state);
  const fearInfo = getFearStatus(unit, gameState as any);

  const displayBuffs = [...unit.buffs];
  if (fearInfo.inRange) {
    displayBuffs.push({ type: 'fear' as any, duration: 0 });
  }

  if (unit.unitClass === 'Estrutura') {
    return (
      <StructureSprite 
        unit={unit} 
        isSelected={isSelected} 
        isTargetable={isTargetable} 
        targetColor={targetColor} 
        animClass={animation === 'damaged' ? 'animate-shake animate-damage-flash' : ''} 
      />
    );
  }

  const isP1 = unit.playerId === 'p1';
  const isCurrentTurn = unit.playerId === gameState.currentTurnPlayerId;
  const isMovementSpent = isCurrentTurn && !unit.canMove && !unit.summoningSickness;
  const isAttackSpent = isCurrentTurn && !unit.canAttack && !unit.summoningSickness;
  const hasSickness = unit.summoningSickness;
  const hasShield = unit.buffs.some(b => b.type === 'shield');
  const isReiAliado = isP1 && unit.unitClass.toLowerCase() === 'rei';

  // Cores SVG
  const activeGradient = isP1 ? 'url(#unit-p1-bg)' : 'url(#unit-p2-bg)';
  const exhaustedGradient = 'url(#unit-exhausted-bg)';
  const activeStroke = isP1 ? '#22d3ee' : '#fb7185'; // cyan-400 / rose-400
  const exhaustedStroke = '#475569'; // slate-600
  const auraColor = isP1 ? '#0e7490' : '#be123c'; // cyan-700 / rose-700

  let groupFilter = '';
  if (isSelected) groupFilter = 'drop-shadow(0px 0px 20px rgba(250,204,21,0.6))';
  else if (isTargetable) groupFilter = targetColor === 'green' ? 'drop-shadow(0px 0px 16px rgba(34,197,94,0.7))' : 'drop-shadow(0px 0px 16px rgba(239,68,68,0.7))';

  let animClass = '';
  if (animation === 'damaged') animClass = 'animate-shake animate-damage-flash';
  else if (animation === 'attacking') animClass = 'animate-attack-pulse';
  else if (animation === 'healing') animClass = 'animate-heal-glow';
  else if (animation === 'lightning') animClass = 'animate-lightning';

  return (
    <motion.g 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
      className={`pointer-events-none ${animClass}`}
      style={{ filter: groupFilter }}
    >
      {/* Aura de Identificação (Time) */}
      {!isReiAliado && (
        <circle 
          cx="0" cy="0" r="74"
          fill={auraColor}
          opacity={isMovementSpent ? 0.2 : 0.4}
          filter="blur(8px)"
          className={!isMovementSpent ? 'animate-pulse' : ''}
        />
      )}

      {/* Anel pulsante de alvo atacável */}
      {isTargetable && (
        <circle 
          cx="0" cy="0" r="78"
          fill="none"
          stroke={targetColor === 'green' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'}
          strokeWidth="4"
          className="animate-ping"
        />
      )}

      {/* Anel de Seleção */}
      {isSelected && (
        <circle cx="0" cy="0" r="76" fill="none" stroke="#facc15" strokeWidth="6" />
      )}
      {isTargetable && !isSelected && (
        <circle cx="0" cy="0" r="76" fill="none" stroke={targetColor === 'green' ? '#22c55e' : '#ef4444'} strokeWidth="6" />
      )}

      {/* Fundo Exausto */}
      {!isReiAliado && (
        <circle 
          cx="0" cy="0" r="70"
          fill={exhaustedGradient}
          stroke={exhaustedStroke}
          strokeWidth="6"
          opacity={isMovementSpent ? 1 : 0}
          style={{ transition: 'opacity 1s ease-in-out' }}
        />
      )}

      {/* Fundo Ativo */}
      {!isReiAliado && (
        <circle 
          cx="0" cy="0" r="70"
          fill={activeGradient}
          stroke={activeStroke}
          strokeWidth="6"
          opacity={isMovementSpent ? 0 : 1}
          style={{ 
            transition: 'opacity 1s ease-in-out',
            filter: 'saturate(1.2) brightness(1.1)' 
          }}
        />
      )}

      {/* Fundo do Rei (Imagem) */}
      {isReiAliado && (
        <g>
          {/* Círculo base para clip ou fundo se a imagem falhar */}
          <circle cx="0" cy="0" r="70" fill="#1e293b" />
          <image 
            href={kingImg} 
            x="-77" y="-77" 
            width="154" height="154"
            style={{
              filter: isMovementSpent ? 'grayscale(0.8) brightness(0.5)' : 'none',
              transition: 'filter 1s ease-in-out'
            }}
            clipPath="url(#unit-clip)"
          />
        </g>
      )}

      <defs>
        <clipPath id="unit-clip">
          <circle cx="0" cy="0" r="70" />
        </clipPath>
      </defs>



      {/* Escudo Protetor (Aura Branca) */}
      <AnimatePresence>
        {hasShield && <ShieldAura key="shield-aura" />}
      </AnimatePresence>

      {/* Indicador de Summoning Sickness (Enjoo de Invocação) */}
      {hasSickness && (
        <g>
          <circle cx="0" cy="0" r="70" fill="rgba(49, 46, 129, 0.5)" />
          <circle cx="0" cy="0" r="24" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="2" className="animate-pulse" />
          <text x="0" y="6" fontSize="18" textAnchor="middle">⏳</text>
        </g>
      )}

      {/* Indicadores de Status (Buffs) */}
      <UnitBuffs buffs={displayBuffs} />

      {/* Artefatos Equipados */}
      <UnitEquipment artifacts={unit.equippedArtifacts || []} />

      {/* Ícone da Classe */}
      <motion.g 
        animate={{ 
          y: [0, -4, 0]
        }}
        transition={{ 
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{
          opacity: isMovementSpent ? 0.6 : 1.0,
          filter: isMovementSpent ? 'grayscale(1) brightness(0.5)' : 'grayscale(0) brightness(1.2)',
          transition: 'opacity 1s, filter 1s'
        }}
      >
        {!isReiAliado && CLASS_ICONS[unit.unitClass] ? (
          <image 
            href={CLASS_ICONS[unit.unitClass]} 
            x="-30" y="-35" 
            width="60" height="60" 
            filter="drop-shadow(0px 10px 15px rgba(0,0,0,0.5))"
          />
        ) : !isReiAliado ? (
          <text x="0" y="8" fontSize="40" textAnchor="middle" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))">❓</text>
        ) : null}
      </motion.g>

      {/* Badges de Atributo (ATK / HP) */}
      <UnitBadges unit={unit} isAttackSpent={isAttackSpent} />

      {/* Efeito de Raio (Overlay) */}
      <AnimatePresence>
        {animation === 'lightning' && <LightningAnimation />}
      </AnimatePresence>

    </motion.g>
  );
};
