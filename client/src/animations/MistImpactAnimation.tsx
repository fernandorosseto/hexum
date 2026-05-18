import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board/HexUtils';
import { HexCoordinates } from 'shared';

interface Props {
  target: HexCoordinates;
}

/**
 * Animação de Impacto de Névoa Premium.
 * 
 * Cria uma expansão densa e misteriosa de nuvens de fumaça e geada
 * em formato radial, utilizando gradientes de névoa bioluminescentes acelerados por GPU,
 * gerando um efeito de ocultamento instantâneo espetacular.
 */
export const MistImpactAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none z-50 overflow-visible">
      {/* ── 1. NUVENS RADIAIS DE FUMAÇA (8 direções em expansão) ── */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.circle
            key={i}
            r={HEX_SIZE * 0.45}
            fill="url(#mist-radial)"
            stroke="rgba(241, 245, 249, 0.25)" // slate-100 translúcido
            strokeWidth="1.5"
            style={{ filter: 'url(#neon-glow-p1)' }}
            initial={{ x: 0, y: 0, scale: 0.1, opacity: 0 }}
            animate={{ 
              x: Math.cos(rad) * 65, 
              y: Math.sin(rad) * 65, 
              scale: [0.1, 2.5, 3.4],
              opacity: [0, 0.85, 0] 
            }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />
        );
      })}

      {/* ── 2. EXPANSÃO DO FOGO CENTRAL (Domo de Vapor Ocultante) ── */}
      <motion.circle
        r={HEX_SIZE * 0.9}
        fill="url(#mist-radial)"
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 2.4, 3.1], opacity: [0, 0.75, 0] }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      
      {/* ── 3. ANEL DE DISPERSÃO ACELERADO (Onda de Geada) ── */}
      <motion.circle
        r={HEX_SIZE * 0.65}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.8], opacity: [0.9, 0] }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
    </motion.g>
  );
};
