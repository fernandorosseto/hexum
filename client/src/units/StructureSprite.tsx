import React from 'react';
import { motion } from 'framer-motion';
import type { Unit } from 'shared';

interface Props {
  unit: Unit;
  isSelected?: boolean;
  isTargetable?: boolean;
  targetColor?: 'red' | 'green';
  animClass?: string;
}

export const StructureSprite: React.FC<Props> = ({ unit, isSelected, isTargetable, targetColor, animClass }) => {
  const isP1 = unit.playerId === 'p1';
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
        ${animClass || ''}
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
};
