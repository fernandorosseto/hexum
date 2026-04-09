import { motion, AnimatePresence } from 'framer-motion';
import type { Unit } from 'shared';
import { getFearStatus } from 'shared';
import { useGameStore } from '../store/gameStore';
import inerteIcon from '../assets/pell.png';
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
  'Inerte': inerteIcon
};

const BUFF_ICONS: Record<string, string> = {
  'poison': '🧪', 'burn': '🔥', 'stun': '🌀', 'taunt': '💢', 'fury': '⚡', 'bleed': '🩸', 'fear': '💀', 'invulnerable': '✨'
};

export const UnitSprite: React.FC<Props> = ({ unit, isSelected, isTargetable, targetColor, animation }) => {
  const isP1 = unit.playerId === 'p1';
  const isInerte = unit.unitClass === 'Inerte';
  const hpPercent = Math.max(0, (unit.hp / unit.maxHp) * 100);
  
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

  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
      className={`
        relative flex flex-col items-center justify-center 
        w-[88%] h-[88%] rounded-full shadow-2xl border-[3px]
        ${isInerte
          ? 'from-slate-600 to-slate-800 border-slate-500 shadow-slate-900/50 grayscale opacity-80'
          : isP1 
            ? 'from-blue-500 to-blue-700 border-blue-400 shadow-blue-900/50' 
            : 'from-red-500 to-red-700 border-red-400 shadow-red-900/50'
        }
        ${isSelected ? 'ring-4 ring-yellow-400 scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''}
        ${isTargetable 
          ? targetColor === 'green'
            ? 'ring-4 ring-green-500 drop-shadow-[0_0_16px_rgba(34,197,94,0.7)]' 
            : 'ring-4 ring-red-500 drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]' 
          : ''}
        bg-gradient-to-br pointer-events-none transition-all duration-200
        ${animClass}
      `}
    >
      {/* Anel pulsante de alvo atacável */}
      {isTargetable && (
        <div className={`
          absolute -inset-2 rounded-full border-2 animate-ping
          ${targetColor === 'green' ? 'border-green-500/60' : 'border-red-500/60'}
        `} />
      )}

      {/* Aura de Identificação (Time) */}
      <div className={`
        absolute inset-[-4px] rounded-full blur-md opacity-40 animate-pulse
        ${isP1 ? 'bg-[#0b622f]' : 'bg-[#602471]'}
      `} />
      
      {/* Base / Sombra */}
      <div className={`
        absolute inset-0 rounded-full border-2 
        ${isP1 ? 'border-[#0b622f]/50 bg-[#0b622f]/20' : 'border-[#602471]/50 bg-[#602471]/20'}
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
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex items-center justify-center"
      >
        {CLASS_ICONS[unit.unitClass] ? (
          <img 
            src={CLASS_ICONS[unit.unitClass]} 
            className={`
              object-contain drop-shadow-xl brightness-110
              ${unit.unitClass === 'Inerte' ? 'w-8 h-8' : unit.unitClass === 'Rei' ? 'w-10 h-10 -mt-1' : 'w-9 h-9'}
            `} 
            alt={unit.unitClass} 
          />
        ) : (
          <span className="text-3xl drop-shadow-lg">❓</span>
        )}
      </motion.div>
      
      {/* Badges de Atributo (Restaurado o tamanho e layout original) */}
      <div className={`
        absolute -bottom-5 flex items-center gap-2 font-black text-base bg-slate-950 rounded-lg px-3 py-1 border-2 shadow-[0_2px_8px_rgba(0,0,0,0.8)] relative z-10 transition-all
        ${isInerte ? 'border-slate-700 opacity-90 grayscale' : isP1 ? 'border-[#0b622f]' : 'border-[#602471]'}
      `}>
        <span className={`${isInerte ? 'text-slate-500' : 'text-yellow-300'} drop-shadow-sm`}>
          ⚔{isInerte ? 0 : unit.attack}
        </span>
        <span className="text-slate-500">|</span>
        <span className={`drop-shadow-sm ${isInerte ? 'text-slate-400' : (hpPercent > 60 ? 'text-green-400' : hpPercent > 30 ? 'text-yellow-300' : 'text-red-400')}`}>
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
