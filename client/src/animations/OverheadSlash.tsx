import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board';
import { HexCoordinates } from 'shared';

interface Props {
  source: HexCoordinates;
  target: HexCoordinates;
}

export const OverheadSlash: React.FC<Props> = ({ source, target }) => {
  const src = hexToPixel(source);
  const tgt = hexToPixel(target);
  
  // Calcular ângulo entre origem e destino caso necessário, mas o golpe é vertical
  const center = tgt;

  return (
    <g transform={`translate(${center.x}, ${center.y})`}>
      <motion.g className="pointer-events-none z-50 overflow-visible">
      
      {/* ── 1. ANEL DE FORÇA DE IMPACTO (Sincronizado com o impacto da espada aos 350ms) ── */}
      <motion.circle
        r={HEX_SIZE * 0.7}
        fill="none"
        stroke="#38bdf8" // sky-400
        strokeWidth="4"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.8], opacity: [0.9, 0] }}
        transition={{ delay: 0.35, duration: 0.3, ease: "easeOut" }}
      />
      <motion.circle
        r={HEX_SIZE * 0.7}
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.6], opacity: [1, 0] }}
        transition={{ delay: 0.35, duration: 0.25, ease: "easeOut" }}
      />

      {/* ── 2. A ESPADA GIGANTE VERTICAL (Anticipation + Smear Descent + Impact Squash + Recovery) ── */}
      <motion.g
        initial={{ y: -110, scaleX: 1.0, scaleY: 1.0, opacity: 0 }}
        animate={{
          y: [-110, -110, -40, 10, 12, 14],             // Fica no topo (anticipação), cai rápido, bate e permanece brevemente
          scaleY: [1.0, 1.0, 3.8, 0.7, 0.9, 0.1],       // Estica no smear frame vertical de queda e esmaga no impacto
          scaleX: [1.0, 1.0, 0.5, 2.2, 1.1, 0.1],       // Afina na descida e alarga no impacto horizontal
          opacity: [0, 1, 0.95, 1, 0.9, 0]
        }}
        transition={{
          duration: 0.65,
          ease: "easeOut",
          times: [0, 0.25, 0.45, 0.55, 0.75, 1.0]
        }}
      >
        {/* Cabo da Espada (Grip - agora apontando para cima) */}
        <line x1="0" y1="-5" x2="0" y2="-20" stroke="#78716c" strokeWidth="4" strokeLinecap="round" />
        
        {/* Guarda-Mão da Espada (Crossguard - agora na parte superior da lâmina) */}
        <path d="M -16 -5 L 16 -5" stroke="#a8a29e" strokeWidth="5" strokeLinecap="round" />
        
        {/* Lâmina Externa (Brilho Azul/Cyan Neon apontando para BAIXO) */}
        <polygon
          points="-7,-5 -5,80 0,96 5,80 7,-5"
          fill="rgba(56, 189, 248, 0.2)"
          stroke="#0ea5e9"
          strokeWidth="2.5"
          strokeLinejoin="round"
          style={{ filter: 'url(#neon-glow-p1)' }}
        />
        
        {/* Núcleo da Lâmina (Branco Metálico Sólido) */}
        <polygon
          points="-3.5,-5 -2.5,78 0,92 2.5,78 3.5,-5"
          fill="white"
          stroke="white"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* ── 3. FAÍSCAS METÁLICAS DE COLISÃO (Sincronizadas com o impacto aos 350ms) ── */}
      {/* Faísca 1 (Noroeste) */}
      <motion.line
        x1="0" y1="0" x2="-38" y2="-30"
        stroke="#fbbf24" // amber-400
        strokeWidth="3.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ delay: 0.37, duration: 0.3, ease: "easeOut" }}
      />
      {/* Faísca 2 (Nordeste) */}
      <motion.line
        x1="0" y1="0" x2="38" y2="-30"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ delay: 0.35, duration: 0.33, ease: "easeOut" }}
      />
      {/* Faísca 3 (Esquerda) */}
      <motion.line
        x1="0" y1="0" x2="-45" y2="0"
        stroke="#fbbf24"
        strokeWidth="3.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ delay: 0.38, duration: 0.28, ease: "easeOut" }}
      />
      {/* Faísca 4 (Direita) */}
      <motion.line
        x1="0" y1="0" x2="45" y2="0"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ delay: 0.34, duration: 0.35, ease: "easeOut" }}
      />
      {/* Faísca 5 (Sudoeste) */}
      <motion.line
        x1="0" y1="0" x2="-35" y2="25"
        stroke="#fbbf24"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ delay: 0.36, duration: 0.31, ease: "easeOut" }}
      />
      {/* Faísca 6 (Sudeste) */}
      <motion.line
        x1="0" y1="0" x2="35" y2="25"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1], opacity: [1, 0] }}
        transition={{ delay: 0.35, duration: 0.34, ease: "easeOut" }}
      />

      </motion.g>
    </g>
  );
};
