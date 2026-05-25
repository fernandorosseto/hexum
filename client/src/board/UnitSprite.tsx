import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Unit, HexCoordinates } from 'shared';
import { getFearStatus } from 'shared';
import { useGameStore } from '../store/gameStore';
import { CLASS_ICONS } from '../constants/unitIcons';
import { HEX_SIZE } from './HexUtils';
import reiImg from '../assets/icons/rei.png';
import { BuffIcon } from '../assets/icons/VectorIcons';
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
  const isRei = unit.unitClass.toLowerCase() === 'rei';
  const unitImage = CLASS_ICONS[unit.unitClass];

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

  // Tamanhos e escalas proporcionais baseados no HEX_SIZE do mapa
  const rBase = HEX_SIZE * (70 / 90);
  const rAura = HEX_SIZE * (74 / 90);
  const rSelected = HEX_SIZE * (76 / 90);
  const rPing = HEX_SIZE * (78 / 90);

  const reiWidth = HEX_SIZE * (154 / 90);
  const reiOffset = -reiWidth / 2;

  const sicknessInnerR = HEX_SIZE * (24 / 90);

  const iconSizeBase = HEX_SIZE * (60 / 90);
  const iconSizeBig = HEX_SIZE * (126 / 90);

  const iconXBase = -iconSizeBase / 2;
  const iconYBase = -iconSizeBase * 35 / 60;

  const iconXBig = -iconSizeBig / 2;
  const iconYBig = -iconSizeBig * 55 / 126;

  return (
    <motion.g 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
      className={`pointer-events-none ${animClass}`}
      style={{ filter: groupFilter }}
    >
      {/* Aura de Identificação (Time) */}
      <circle 
        cx="0" cy="0" r={rAura}
        fill={auraColor}
        opacity={isMovementSpent ? 0.2 : 0.4}
        filter="blur(8px)"
        className={!isMovementSpent ? 'animate-pulse' : ''}
      />

      {/* Anel pulsante de alvo atacável */}
      {isTargetable && (
        <circle 
          cx="0" cy="0" r={rPing}
          fill="none"
          stroke={targetColor === 'green' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'}
          strokeWidth={HEX_SIZE * 4 / 90}
          className="animate-ping"
        />
      )}

      {/* Anel de Seleção */}
      {isSelected && (
        <circle cx="0" cy="0" r={rSelected} fill="none" stroke="#facc15" strokeWidth={HEX_SIZE * 6 / 90} />
      )}
      {isTargetable && !isSelected && (
        <circle cx="0" cy="0" r={rSelected} fill="none" stroke={targetColor === 'green' ? '#22c55e' : '#ef4444'} strokeWidth={HEX_SIZE * 6 / 90} />
      )}

      {/* Fundo Exausto */}
      <circle 
        cx="0" cy="0" r={rBase}
        fill={exhaustedGradient}
        stroke={exhaustedStroke}
        strokeWidth={HEX_SIZE * 6 / 90}
        opacity={isMovementSpent ? 1 : 0}
        style={{ transition: 'opacity 1s ease-in-out' }}
      />

      {/* Fundo Ativo */}
      <circle 
        cx="0" cy="0" r={rBase}
        fill={activeGradient}
        stroke={activeStroke}
        strokeWidth={HEX_SIZE * 6 / 90}
        opacity={isMovementSpent ? 0 : 1}
        style={{ 
          transition: 'opacity 1s ease-in-out',
          filter: 'saturate(1.2) brightness(1.1)' 
        }}
      />

      {/* Imagem da Unidade (Rei, Lanceiro, Arqueiro, etc.) */}
      {unitImage && (
        <g>
          {/* Círculo base para clip ou fundo se a imagem falhar */}
          <circle cx="0" cy="0" r={rBase} fill="#1e293b" />
          <image 
            href={unitImage as string} 
            x={reiOffset} y={reiOffset} 
            width={reiWidth} height={reiWidth}
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
          <circle cx="0" cy="0" r={rBase} />
        </clipPath>
      </defs>

      {/* Escudo Protetor (Aura Branca) */}
      <AnimatePresence>
        {hasShield && <ShieldAura key="shield-aura" />}
      </AnimatePresence>

      {/* Indicador de Summoning Sickness (Enjoo de Invocação) */}
      {hasSickness && (
        <g>
          <circle cx="0" cy="0" r={rBase} fill="rgba(49, 46, 129, 0.4)" />
          <circle cx="0" cy="0" r={sicknessInnerR} fill="rgba(15, 23, 42, 0.85)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth={HEX_SIZE * 2 / 90} className="animate-pulse" />
          <svg 
            x={-sicknessInnerR * 0.65} 
            y={-sicknessInnerR * 0.65} 
            width={sicknessInnerR * 1.3} 
            height={sicknessInnerR * 1.3} 
            overflow="visible"
            className="animate-spin"
            style={{ animationDuration: '6s' }}
          >
            <BuffIcon id="summoningSickness" size={sicknessInnerR * 1.3} />
          </svg>
        </g>
      )}

      {/* Indicadores de Status (Buffs e Artefatos) margeando a borda - Exibindo no máximo 1 de cada categoria */}
      <UnitBuffs 
        buffs={displayBuffs.slice(0, 1)} 
        totalCount={(displayBuffs.length > 0 ? 1 : 0) + ((unit.equippedArtifacts && unit.equippedArtifacts.length > 0) ? 1 : 0)} 
        startIndex={0} 
      />

      <UnitEquipment 
        artifacts={(unit.equippedArtifacts || []).slice(0, 1)} 
        totalCount={(displayBuffs.length > 0 ? 1 : 0) + ((unit.equippedArtifacts && unit.equippedArtifacts.length > 0) ? 1 : 0)} 
        startIndex={displayBuffs.length > 0 ? 1 : 0} 
      />



      {/* Badges de Atributo (ATK / HP) */}
      <UnitBadges unit={unit} isAttackSpent={isAttackSpent} />

      {/* Efeito de Raio (Overlay) */}
      <AnimatePresence>
        {animation === 'lightning' && <LightningAnimation />}
      </AnimatePresence>

    </motion.g>
  );
};
