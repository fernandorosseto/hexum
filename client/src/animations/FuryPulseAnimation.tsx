import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel } from '../board/HexUtils';
import { HexCoordinates } from 'shared';

interface Props {
  target: HexCoordinates;
}

/**
 * Animação de Habilidade Pulso de Fúria Premium.
 * 
 * Cria uma violenta explosão de adrenalina em vermelho e rosa neon.
 * Substitui o triângulo plano anterior por um sigilo pontiagudo de fúria (estrela de 4 pontas afiada)
 * cercado por ondas de choque agressivas expandindo rapidamente.
 */
export const FuryPulseAnimation: React.FC<Props> = ({ target }) => {
  const { x, y } = hexToPixel(target);

  return (
    <motion.g transform={`translate(${x}, ${y})`} className="pointer-events-none z-50 overflow-visible">
      {/* ── 1. ANÉIS DE ADRENALINA EXPANSIVOS (Ondas de Choque Sequenciais) ── */}
      {[1.2, 1.8, 2.4].map((scaleTgt, i) => (
        <motion.circle
          key={i}
          r={32}
          fill="none"
          stroke="#ef4444" // red-500
          strokeWidth={4 - i}
          style={{ filter: 'url(#neon-glow-p1)' }}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, scaleTgt], opacity: [0, 0.95, 0] }}
          transition={{ duration: 0.52, delay: i * 0.08, ease: "easeOut" }}
        />
      ))}

      {/* ── 2. SIGILO DE FÚRIA (Estrela de 4 Pontas Extremamente Afiada) ── */}
      <motion.g
        initial={{ scale: 0.1, opacity: 0, rotate: 0 }}
        animate={{ 
          scale: [0.1, 1.45, 1.1], 
          opacity: [0, 1.0, 0], 
          rotate: [0, 135] 
        }}
        transition={{ duration: 0.58, ease: "easeOut" }}
      >
        {/* Camada Externa de Energia (Neon Vermelho) */}
        <path
          d="M 0 -26 L 4.5 -4.5 L 26 0 L 4.5 4.5 L 0 26 L -4.5 4.5 L -26 0 L -4.5 -4.5 Z"
          fill="rgba(185, 28, 28, 0.3)" // red-700 translúcido
          stroke="#b91c1c"
          strokeWidth="3.5"
          style={{ filter: 'url(#neon-glow-p1)' }}
        />
        {/* Núcleo Brilhante e Afiado */}
        <path
          d="M 0 -18 L 2.5 -2.5 L 18 0 L 2.5 2.5 L 0 18 L -2.5 2.5 L -18 0 L -2.5 -2.5 Z"
          fill="#f43f5e" // rose-500
          stroke="#ffffff"
          strokeWidth="0.8"
        />
      </motion.g>

      {/* ── 3. EXPLOSÃO RADIAL DE FOCO (Flash de Raiva) ── */}
      <motion.circle
        r={25}
        fill="rgba(239, 68, 68, 0.12)"
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.7], opacity: [0.9, 0] }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </motion.g>
  );
};
