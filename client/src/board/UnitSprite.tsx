import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Unit, HexCoordinates } from 'shared';
import { getFearStatus } from 'shared';
import { useGameStore } from '../store/gameStore';
import { CLASS_ICONS } from '../constants/unitIcons';
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

  const animClass = animation === 'damaged' ? 'animate-shake animate-damage-flash' 
    : animation === 'attacking' ? 'animate-attack-pulse'
    : animation === 'healing' ? 'animate-heal-glow'
    : animation === 'lightning' ? 'animate-lightning'
    : '';

  if (unit.unitClass === 'Estrutura') {
    return (
      <StructureSprite 
        unit={unit} 
        isSelected={isSelected} 
        isTargetable={isTargetable} 
        targetColor={targetColor} 
        animClass={animClass} 
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

  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
      className={`
        relative flex flex-col items-center justify-center 
        w-[78%] h-[78%] rounded-full
        ${isSelected ? 'ring-4 ring-yellow-400 scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''}
        ${isTargetable 
          ? targetColor === 'green'
            ? 'ring-4 ring-green-500 drop-shadow-[0_0_16px_rgba(34,197,94,0.7)]' 
            : 'ring-4 ring-red-500 drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]' 
          : ''}
        pointer-events-none transition-all duration-700
        ${animClass}
      `}
    >
      {/* Camada de Fundo: ATIVA (Colorida) */}
      <div 
        className={`
          absolute inset-0 rounded-full transition-all duration-1000 ease-in-out
          ${isReiAliado 
            ? 'opacity-100 shadow-none border-none border-0' 
            : (isMovementSpent ? 'opacity-0' : 'opacity-100') + ' border-[3px] shadow-2xl ' + (isP1 ? 'from-blue-600 to-blue-800 border-blue-400 shadow-blue-900/40' : 'from-red-600 to-red-800 border-red-400 shadow-red-900/40') + ' bg-gradient-to-br '}
        `}
        style={isReiAliado ? { 
          backgroundImage: `url(${kingImg})`, 
          backgroundSize: '110%',
          backgroundPosition: 'center',
          filter: isMovementSpent ? 'grayscale(0.8) brightness(0.5)' : 'none'
        } : {}}
      />

      {/* Camada de Fundo: EXAUSTA (Cinza) - Apenas para unidades comuns */}
      {!isReiAliado && (
        <div className={`
          absolute inset-0 rounded-full border-[3px] bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600 shadow-inner transition-opacity duration-1000 ease-in-out
          ${isMovementSpent ? 'opacity-100' : 'opacity-0'}
        `} />
      )}

      {/* Anel pulsante de alvo atacável */}
      {isTargetable && (
        <div className={`
          absolute -inset-2 rounded-full border-2 animate-ping
          ${targetColor === 'green' ? 'border-green-500/60' : 'border-red-500/60'}
        `} />
      )}

      {/* Aura de Identificação (Time) */}
      {!isReiAliado && (
        <div className={`
          absolute inset-[-4px] rounded-full blur-md opacity-40 transition-all duration-1000
          ${isMovementSpent ? 'bg-slate-700 opacity-20 shadow-inner' : isP1 ? 'bg-[#0b622f] animate-pulse' : 'bg-[#602471] animate-pulse'}
        `} />
      )}
      
      {/* Base / Sombra */}
      {!isReiAliado && (
        <div className={`
          absolute inset-0 rounded-full border-2 transition-all duration-1000 ease-in-out
          ${isP1 ? 'border-[#0b622f]/50 bg-[#0b622f]/20' : 'border-[#602471]/50 bg-[#602471]/20'}
          ${isMovementSpent ? 'grayscale-[1] brightness-[0.4] saturate-0' : 'saturate-[1.4] brightness-[1.1]'}
          ${hasSickness ? 'grayscale-[0.2] brightness-[0.9]' : ''}
        `} />
      )}

      {/* Escudo Protetor (Aura Branca) */}
      <AnimatePresence>
        {hasShield && <ShieldAura key="shield-aura" />}
      </AnimatePresence>

      {/* Indicador de Summoning Sickness (Enjoo de Invocação) */}
      {hasSickness && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-indigo-900/10 rounded-full backdrop-blur-[1px]">
          <div className="bg-slate-900/80 p-1.5 rounded-full border border-indigo-400/30 animate-pulse shadow-lg">
             <span className="text-sm">⏳</span>
          </div>
        </div>
      )}

      {/* Indicadores de Status (Buffs) */}
      <UnitBuffs buffs={displayBuffs} />

      {/* Artefatos Equipados */}
      <UnitEquipment artifacts={unit.equippedArtifacts || []} />

      {/* Ícone da Classe ou Spacer para o Rei */}
      <motion.div 
        animate={{ 
          y: [0, -3, 0],
          scale: isMovementSpent ? 0.9 : 1,
          filter: isMovementSpent ? 'grayscale(1) brightness(0.5)' : 'grayscale(0) brightness(1.2)'
        }}
        transition={{ 
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          default: { duration: 1, ease: "easeInOut" }
        }}
        className={`relative z-10 flex items-center justify-center transition-opacity duration-1000 min-h-[40px]
          ${isMovementSpent ? 'opacity-60' : 'opacity-100'}
        `}
      >
        {isP1 && unit.unitClass === 'Rei' ? (
          <div className="w-10 h-10" /> // Spacer para manter o layout flexbox intacto
        ) : CLASS_ICONS[unit.unitClass] ? (
          <img 
            src={CLASS_ICONS[unit.unitClass]} 
            className={`
              object-contain drop-shadow-xl brightness-110
              ${unit.unitClass === 'Rei' ? 'w-10 h-10 -mt-1' : 'w-9 h-9'}
            `} 
            alt={unit.unitClass} 
          />
        ) : (
          <span className="text-3xl drop-shadow-lg">❓</span>
        )}
      </motion.div>

      {/* Badges de Atributo (ATK / HP) */}
      <UnitBadges unit={unit} isAttackSpent={isAttackSpent} />

      {/* Efeito de Raio (Overlay) */}
      <AnimatePresence>
        {animation === 'lightning' && <LightningAnimation />}
      </AnimatePresence>

    </motion.div>
  );
};
