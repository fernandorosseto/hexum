import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board';
import { HexCoordinates } from 'shared';

interface Props {
  source: HexCoordinates;
  target: HexCoordinates;
  color: 'gold' | 'cyan';
}

export const CleaveSlash: React.FC<Props> = ({ source, target, color }) => {
  const src = hexToPixel(source);
  const tgt = hexToPixel(target);
  
  // Calcular ângulo entre origem e destino
  const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x) * (180 / Math.PI);
  // O slash acontece um pouco antes de atingir o alvo na trajetória
  const slashCenter = {
    x: src.x + (tgt.x - src.x) * 0.7,
    y: src.y + (tgt.y - src.y) * 0.7,
  };

  const scale = color === 'gold' ? 1.6 : 1.1; // Rei tem o golpe maior e mais pesado
  
  // Seleção de cores premium e harmoniosas
  const strokeColor = color === 'gold' ? '#fbbf24' : '#22d3ee';      // amber-400 ou cyan-400
  const outerStroke = color === 'gold' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(6, 182, 212, 0.45)'; // Glow de energia
  const sparksColor = color === 'gold' ? '#fef08a' : '#99f6e4';      // yellow-200 ou teal-200

  return (
    <g transform={`translate(${slashCenter.x}, ${slashCenter.y})`}>
      <motion.g 
        rotate={angle}
        scale={scale}
        className="pointer-events-none z-50 overflow-visible"
      >
        {/* ── 1. ANEL DE IMPACTO ADJACENTE (Onda de choque secundária do golpe em área) ── */}
        <motion.circle
          cx={HEX_SIZE * 0.5}
          cy="0"
          r={HEX_SIZE * 0.4}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 1.4], opacity: [0.75, 0] }}
          transition={{ delay: 0.08, duration: 0.28, ease: "easeOut" }}
        />

        {/* ── 2. RASTRO SECUNDÁRIO DE ENERGIA (Camada Neon Externa Translúcida) ── */}
        <motion.path
          d={`M ${-HEX_SIZE * 0.9} ${-HEX_SIZE * 1.3} Q ${HEX_SIZE * 1.3} 0 ${-HEX_SIZE * 0.9} ${HEX_SIZE * 1.3}`}
          fill="none"
          stroke={outerStroke}
          strokeWidth="15"
          strokeLinecap="round"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        />

        {/* ── 3. RASTRO PRINCIPAL DO CORTE (Camada Neon Média) ── */}
        <motion.path
          d={`M ${-HEX_SIZE * 0.9} ${-HEX_SIZE * 1.3} Q ${HEX_SIZE * 1.3} 0 ${-HEX_SIZE * 0.9} ${HEX_SIZE * 1.3}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.95, 0] }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        />
        
        {/* ── 4. RASTRO INTERNO DE ALTO CONTRASTE (Núcleo Branco Sólido de Alta Velocidade) ── */}
        <motion.path
          d={`M ${-HEX_SIZE * 0.9} ${-HEX_SIZE * 1.3} Q ${HEX_SIZE * 1.3} 0 ${-HEX_SIZE * 0.9} ${HEX_SIZE * 1.3}`}
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 1.0, 0] }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        />

        {/* ── 5. CORTES DE VENTO (Wind Arcs disparados pelo corte no ápice da velocidade) ── */}
        {/* Corte Superior */}
        <motion.path
          d="M 25 -30 Q 55 -20 70 -5"
          fill="none"
          stroke={sparksColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0], scale: [0.8, 1.2] }}
          transition={{ delay: 0.1, duration: 0.26, ease: "easeOut" }}
        />
        {/* Corte Central */}
        <motion.path
          d="M 35 0 Q 75 0 95 0"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.9, 0], scale: [0.8, 1.25] }}
          transition={{ delay: 0.08, duration: 0.28, ease: "easeOut" }}
        />
        {/* Corte Inferior */}
        <motion.path
          d="M 25 30 Q 55 20 70 5"
          fill="none"
          stroke={sparksColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0], scale: [0.8, 1.2] }}
          transition={{ delay: 0.1, duration: 0.26, ease: "easeOut" }}
        />
      </motion.g>
    </g>
  );
};
