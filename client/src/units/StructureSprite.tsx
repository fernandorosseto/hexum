import React from 'react';
import { motion } from 'framer-motion';
import type { Unit } from 'shared';
import { HEX_SIZE } from '../board/HexUtils';
import muralhaGeloImg from '../assets/icons/muralha_gelo.png';

interface Props {
  unit: Unit;
  isSelected?: boolean;
  isTargetable?: boolean;
  targetColor?: 'red' | 'green';
  animClass?: string;
}

export const StructureSprite: React.FC<Props> = ({ unit, isSelected, isTargetable, targetColor, animClass }) => {
  const isP1 = unit.playerId === 'p1';
  
  // Tamanho proporcional baseado no HEX_SIZE do mapa
  const size = HEX_SIZE * 2.2;
  const x = -size / 2;
  // Shift ligeiramente para cima para dar o efeito 3D de elevação a partir da base do hexágono
  const y = -size * 0.58; 

  const neonColor = isP1 ? '#22d3ee' : '#fb7185'; // ciano / rosa

  let filterGlow = 'drop-shadow(0px 8px 12px rgba(0,0,0,0.5))';
  if (isSelected) {
    filterGlow = `drop-shadow(0px 0px 20px ${neonColor})`;
  } else if (isTargetable) {
    filterGlow = targetColor === 'green' 
      ? 'drop-shadow(0px 0px 20px rgba(34,197,94,0.85))' 
      : 'drop-shadow(0px 0px 20px rgba(239,68,68,0.85))';
  }

  return (
    <motion.g 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
      className={`pointer-events-none ${animClass || ''}`}
      style={{ filter: filterGlow }}
    >
      {/* Sombra de projeção suave no chão do tabuleiro */}
      <ellipse 
        cx="0" 
        cy={HEX_SIZE * 0.25} 
        rx={HEX_SIZE * 0.7} 
        ry={HEX_SIZE * 0.35} 
        fill="rgba(0, 0, 0, 0.45)" 
        filter="blur(8px)" 
      />

      {/* Imagem PNG da Muralha de Gelo com a animação mantida */}
      <image
        href={muralhaGeloImg}
        x={x}
        y={y}
        width={size}
        height={size}
      />

      {/* HP da Muralha (Grande, posicionado de forma legível no rodapé da estrutura) */}
      <text 
        x="0" 
        y={HEX_SIZE * 0.45} 
        fontSize={HEX_SIZE * 0.23} 
        fontWeight="900" 
        textAnchor="middle" 
        fill={isP1 ? '#ffffff' : '#cffafe'}
        filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.95))"
      >
        ♥ {unit.hp}
      </text>
    </motion.g>
  );
};
