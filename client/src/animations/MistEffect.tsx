import React from 'react';
import { motion } from 'framer-motion';
import type { Unit } from 'shared';
import { hexToPixel, HEX_SIZE } from '../board/HexUtils';

interface MistEffectProps {
  unit: Unit;
}

/**
 * Efeito visual de Névoa Persistente Premium.
 * 
 * Renderiza nuvens de ocultamento dinâmicas e giratórias sobre a unidade imune.
 * Otimizado com movimentos de lissajous/swirl cruzados e rotação lenta 
 * que reage organicamente através do filtro de deslocamento fractal para um efeito realista de fumaça 3D.
 */
export const MistEffect: React.FC<MistEffectProps> = ({ unit }) => {
  const { x, y } = hexToPixel(unit.position);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none z-30"
      >
        {/* ── 1. CAMADAS DE NÉVOA RÁPIDA (Otimizadas por GPU - Movimento orbital e expansão) ── */}
        {[0, 120, 240].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <motion.circle
              key={`mist-glow-${unit.id}-${i}`}
              r={HEX_SIZE * 0.78}
              fill="url(#mist-radial)"
              style={{ filter: 'url(#neon-glow-p1)', transformOrigin: "center" }}
              animate={{
                x: [Math.cos(rad) * 15, Math.cos((rad + 1.2) * Math.PI) * 35, Math.cos(rad) * 15],
                y: [Math.sin(rad) * 15, Math.sin((rad + 1.2) * Math.PI) * 35, Math.sin(rad) * 15],
                rotate: [0, i % 2 === 0 ? 360 : -360],
                scale: [0.9, 1.3, 0.9],
                opacity: [0.15, 0.38, 0.15]
              }}
              transition={{ duration: 8 + i * 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}

        {/* ── 2. CAMADA MASTER 1 (Giro horário e drift lateral) ── */}
        <motion.circle
          r={HEX_SIZE * 0.85}
          fill="url(#mist-radial)"
          filter="url(#mist-filter)"
          style={{ transformOrigin: "center" }}
          animate={{
            x: [-18, 18, -18],
            y: [10, -10, 10],
            rotate: [0, 360],
            scale: [1.0, 1.2, 1.0],
            opacity: [0.22, 0.45, 0.22]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── 3. CAMADA MASTER 2 (Giro anti-horário e drift oposto para textura 3D de fumaça ondulante) ── */}
        <motion.circle
          r={HEX_SIZE * 0.82}
          fill="url(#mist-radial)"
          filter="url(#mist-filter)"
          style={{ transformOrigin: "center" }}
          animate={{
            x: [18, -18, 18],
            y: [-10, 10, -10],
            rotate: [0, -360],
            scale: [1.15, 0.95, 1.15],
            opacity: [0.18, 0.38, 0.18]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.g>
    </g>
  );
};
