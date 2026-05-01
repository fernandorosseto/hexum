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

  let dropShadow = '';
  if (isSelected) dropShadow = 'drop-shadow(0px 0px 15px rgba(250,204,21,0.5))';
  else if (isTargetable) dropShadow = targetColor === 'green' ? 'drop-shadow(0px 0px 15px rgba(34,197,94,0.6))' : 'drop-shadow(0px 0px 15px rgba(239,68,68,0.6))';

  return (
    <motion.g 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
      className={`pointer-events-none ${animClass || ''}`}
      style={{ filter: dropShadow }}
    >
      <g transform="translate(-50, -50)">
        {/* Sombra projetada no chão */}
        <polygon 
          points="50,4 90,27 90,73 50,96 10,73 10,27" 
          transform={`scale(${scale}) translate(${(1-scale)*50/scale}, ${(1-scale)*50/scale + 5})`}
          fill="rgba(0,0,0,0.3)" 
          filter="blur(4px)"
        />
        
        {/* Corpo Principal (Vidro/Gelo) */}
        <g transform={`scale(${scale}) translate(${(1-scale)*50/scale}, ${(1-scale)*50/scale})`}>
          {/* Base com Glassmorphism (SVG filters instead of backdrop-filter) */}
          <polygon 
            points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" 
            fill="rgba(186, 230, 253, 0.2)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
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
      </g>

      {/* HP da Muralha (Dentro do bloco e maior) */}
      <text 
        x="0" y="8" 
        fontSize="24" 
        fontWeight="900" 
        textAnchor="middle" 
        fill={isP1 ? '#ffffff' : '#cffafe'}
        filter="drop-shadow(0px 2px 4px rgba(0,0,0,1))"
      >
        ♥ {unit.hp}
      </text>
    </motion.g>
  );
};
