import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Unit } from 'shared';
import { getFearStatus } from 'shared';
import { useGameStore } from '../store/gameStore';
import reiIcon from '../assets/rei.png';
import arqueiroIcon from '../assets/arqueiro.png';
import assassinoIcon from '../assets/assassino.png';
import cavaleiroIcon from '../assets/cavaleiro.png';
import clerigoIcon from '../assets/clerigo.png';
import lanceiroIcon from '../assets/lanceiro.png';
import magoIcon from '../assets/mago.png';

interface Props {
  unit: Unit;
  isSelected?: boolean;
  isTargetable?: boolean;
  targetColor?: 'red' | 'green';
  animation?: 'attacking' | 'damaged' | 'healing' | 'lightning';
}

const CLASS_ICONS: Record<string, string> = {
  'Rei': reiIcon, 
  'Cavaleiro': cavaleiroIcon, 
  'Lanceiro': lanceiroIcon,
  'Arqueiro': arqueiroIcon, 
  'Assassino': assassinoIcon, 
  'Mago': magoIcon, 
  'Clerigo': clerigoIcon, 
};

const BUFF_ICONS: Record<string, string> = {
  'poison': '🧪', 'burn': '🔥', 'stun': '🌀', 'taunt': '💢', 'fury': '⚡', 'bleed': '🩸', 'fear': '💀', 'invulnerable': '✨'
};

export const UnitSprite: React.FC<Props> = ({ unit, isSelected, isTargetable, targetColor, animation }) => {
  const isP1 = unit.playerId === 'p1';
  const isEstrutura = unit.unitClass === 'Estrutura';
  const hpPercent = Math.max(0, (unit.hp / unit.maxHp) * 100);
  
  const gameState = useGameStore(state => state);
  const fearInfo = getFearStatus(unit, gameState as any);

  const displayBuffs = [...unit.buffs];
  const isCurrentTurn = unit.playerId === gameState.currentTurnPlayerId;
  const isMovementSpent = isCurrentTurn && !unit.canMove && !unit.summoningSickness;
  const isAttackSpent = isCurrentTurn && !unit.canAttack && !unit.summoningSickness;
  const hasSickness = unit.summoningSickness;
  
  if (fearInfo.inRange) {
    displayBuffs.push({ type: 'fear' as any, duration: 0 });
  }

  const animClass = animation === 'damaged' ? 'animate-shake animate-damage-flash' 
    : animation === 'attacking' ? 'animate-attack-pulse'
    : animation === 'healing' ? 'animate-heal-glow'
    : animation === 'lightning' ? 'animate-lightning'
    : '';

  if (isEstrutura) {
    const scale = 0.82; // Ajuste para não transbordar
    return (
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
        className={`
          relative flex flex-col items-center justify-center 
          w-full h-full pointer-events-none drop-shadow-2xl
          ${isSelected ? 'drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
          ${isTargetable 
            ? targetColor === 'green'
              ? 'drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
              : 'drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]' 
            : ''}
          ${animClass}
        `}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Sombra projetada no chão */}
          <polygon 
            points="50,4 90,27 90,73 50,96 10,73 10,27" 
            transform={`scale(${scale}) translate(${(1-scale)*50/scale}, ${(1-scale)*50/scale + 5})`}
            fill="rgba(0,0,0,0.3)" 
            filter="blur(4px)"
          />
          
          {/* Corpo Principal (Vidro/Gelo) */}
          <g transform={`scale(${scale}) translate(${(1-scale)*50/scale}, ${(1-scale)*50/scale})`}>
            {/* Base com Glassmorphism */}
            <polygon 
              points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" 
              fill="rgba(186, 230, 253, 0.2)"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            />
            
            {/* Gradiente de profundidade */}
            <polygon 
              points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" 
              fill="url(#ice-wall-gradient)"
              opacity="0.4"
            />

            {/* Facetas de Vidro (Reflexos) */}
            <path d="M 50,0 L 50,45 L 93.3,25" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <path d="M 6.7,25 L 50,45 L 6.7,75" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <path d="M 50,100 L 50,55 L 93.3,75" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            
            {/* Brilhos Especulares */}
            <polygon points="50,5 88,27 88,35 50,13" fill="white" opacity="0.3" />
            <polygon points="12,30 25,37 25,63 12,70" fill="white" opacity="0.15" />

            {/* Geada / Glitter (Estático) */}
            {[...Array(6)].map((_, i) => (
              <circle 
                key={i}
                cx={20 + Math.random() * 60}
                cy={20 + Math.random() * 60}
                r={0.8 + Math.random()}
                fill="white"
                opacity={0.3 + Math.random() * 0.3}
              />
            ))}
          </g>
        </svg>

        {/* HP da Muralha (Dentro do bloco e maior) */}
        <div className={`
          absolute flex items-center gap-1 font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-20 transition-all
          ${isP1 ? 'text-white' : 'text-cyan-100'}
        `}>
          <span className="text-2xl">♥</span>
          {unit.hp}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
      className={`
        relative flex flex-col items-center justify-center 
        w-[78%] h-[78%] rounded-full shadow-2xl
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
      <div className={`
        absolute inset-0 rounded-full border-[3px] bg-gradient-to-br shadow-2xl transition-opacity duration-1000 ease-in-out
        ${isP1 ? 'from-blue-500 to-blue-700 border-blue-400 shadow-blue-900/40' : 'from-red-500 to-red-600 border-red-400 shadow-red-900/40'}
        ${isMovementSpent ? 'opacity-0' : 'opacity-100'}
      `} />

      {/* Camada de Fundo: EXAUSTA (Cinza) */}
      <div className={`
        absolute inset-0 rounded-full border-[3px] bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600 shadow-inner transition-opacity duration-1000 ease-in-out
        ${isMovementSpent ? 'opacity-100' : 'opacity-0'}
      `} />
      {/* Anel pulsante de alvo atacável */}
      {isTargetable && (
        <div className={`
          absolute -inset-2 rounded-full border-2 animate-ping
          ${targetColor === 'green' ? 'border-green-500/60' : 'border-red-500/60'}
        `} />
      )}

      {/* Aura de Identificação (Time) */}
      <div className={`
        absolute inset-[-4px] rounded-full blur-md opacity-40 transition-all duration-1000
        ${isMovementSpent ? 'bg-slate-700 opacity-20 shadow-inner' : isP1 ? 'bg-[#0b622f] animate-pulse' : 'bg-[#602471] animate-pulse'}
      `} />
      
      {/* Base / Sombra */}
      <div className={`
        absolute inset-0 rounded-full border-2 transition-all duration-1000 ease-in-out
        ${isP1 ? 'border-[#0b622f]/50 bg-[#0b622f]/20' : 'border-[#602471]/50 bg-[#602471]/20'}
        ${isMovementSpent ? 'grayscale-[1] brightness-[0.4] saturate-0' : 'saturate-[1.4] brightness-[1.1]'}
        ${hasSickness ? 'grayscale-[0.2] brightness-[0.9]' : ''}
      `} />

      {/* Escudo Protetor (Aura Branca) */}
      <AnimatePresence>
        {unit.buffs.some(b => b.type === 'shield') && (
          <motion.div
            key="shield-aura"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 15px 2px rgba(255,255,255,0.3)',
                '0 0 25px 6px rgba(255,255,255,0.6)',
                '0 0 15px 2px rgba(255,255,255,0.3)'
              ]
            }}
            exit={{ 
              opacity: 0, 
              scale: 1.8, 
              filter: 'blur(10px)',
              transition: { duration: 0.5, ease: "easeOut" } 
            }}
            transition={{ 
              opacity: { duration: 2, repeat: Infinity },
              scale: { duration: 2, repeat: Infinity },
              boxShadow: { duration: 2, repeat: Infinity }
            }}
            className="absolute inset-[-6px] rounded-full border-[3px] border-white/80 z-20 pointer-events-none"
            style={{ 
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            }}
          >
             {/* Partículas de brilho internas */}
            <div className="absolute inset-0 rounded-full bg-white/10 blur-sm animate-pulse" />
          </motion.div>
        )}
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
      <div className="absolute -top-6 flex gap-1">
        <AnimatePresence>
          {displayBuffs.map((buff, idx) => (
            <motion.div
              key={`${buff.type}-${idx}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`bg-black/90 rounded-full w-9 h-9 flex items-center justify-center text-base border border-white/30 shadow-xl ${buff.type === 'fear' ? 'text-purple-400' : ''}`}
              title={`${buff.type} ${buff.duration > 0 ? '(' + buff.duration + ')' : ''}`}
            >
              {BUFF_ICONS[buff.type] || '✨'}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ícone da Classe */}
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
        className={`relative z-10 flex items-center justify-center transition-opacity duration-1000 
          ${isMovementSpent ? 'opacity-60' : 'opacity-100'}
        `}
      >
        {CLASS_ICONS[unit.unitClass] ? (
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
      
      {/* Badges de Atributo (Mantém as cores vivas) */}
      <div className={`
        absolute -bottom-5 flex items-center gap-2 font-black text-base bg-slate-950 rounded-lg px-3 py-1 border-2 shadow-[0_2px_8px_rgba(0,0,0,0.8)] relative z-10 transition-all
        ${isP1 ? 'border-[#0b622f]' : 'border-[#602471]'}
      `}>
        <span className={`drop-shadow-sm transition-all duration-1000 ease-in-out ${!isAttackSpent ? 'text-yellow-300' : 'text-slate-500 opacity-40 grayscale'}`}>
          ⚔{unit.attack}
        </span>
        <span className="text-slate-500">|</span>
        <span className={`drop-shadow-sm ${hpPercent > 60 ? 'text-green-400' : hpPercent > 30 ? 'text-yellow-300' : 'text-red-400'}`}>
          ♥{unit.hp}
        </span>
      </div>

      {/* Efeito de Raio (Overlay) */}
      <AnimatePresence>
        {animation === 'lightning' && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
            animate={{ opacity: [0, 1, 0.8, 1, 0], scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-6xl filter drop-shadow-[0_0_15px_#60a5fa] -mt-10">⚡</div>
            
            {/* Raio Zigzag em SVG */}
            <svg 
              viewBox="0 0 100 400" 
              className="absolute top-[-360px] h-[380px] w-20 overflow-visible pointer-events-none"
              preserveAspectRatio="none"
            >
              {/* Brilho externo (Glow) */}
              <motion.polyline
                points="50,0 30,100 70,200 20,300 50,400"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 0.3, 0.1, 0.2, 0] }}
                style={{ filter: 'blur(10px)' }}
              />
              {/* Núcleo do raio */}
              <motion.polyline
                points="50,0 30,100 70,200 20,300 50,400"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 0.7, 1, 0] }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
