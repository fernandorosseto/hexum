import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board/HexUtils';
import { HexCoordinates } from 'shared';

interface Props {
  targets: HexCoordinates[];
}

/**
 * Animação de Muralha de Gelo Premium.
 * 
 * Cria estalagmites tridimensionais de cristais glaciais translúcidos
 * que surgem de forma abrupta do solo, acompanhados por uma onda de geada ártica
 * e partículas de geada.
 */
export const WallFormationAnimation: React.FC<Props> = ({ targets }) => {
  return (
    <g className="pointer-events-none z-50 overflow-visible">
      {targets.map((target, idx) => {
        const { x, y } = hexToPixel(target);
        return (
          <g key={idx} transform={`translate(${x}, ${y})`}>
            {/* ── 1. EXPANSÃO DE GEADA ÁRTICA (Domo de Neve) ── */}
            <motion.circle
              r={HEX_SIZE * 0.75}
              fill="rgba(186, 230, 253, 0.25)"
              stroke="#e0f2fe"
              strokeWidth="2"
              style={{ filter: 'url(#neon-glow-p1)' }}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.45], opacity: [0.95, 0] }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
            
            {/* ── 2. CRISTAIS TRIDIMENSIONAIS DE GELO (Estalagmites Angulares) ── */}
            {/* Espiral Esquerda (Menor) */}
            <motion.polygon
              points="-18,20 -28,5 -20,-25 -8,-15"
              fill="url(#ice-wall-gradient)"
              stroke="#e0f2fe"
              strokeWidth="1.2"
              style={{ filter: 'url(#neon-glow-p1)', originY: "20px" }}
              initial={{ scaleY: 0, opacity: 0, y: 25 }}
              animate={{ scaleY: [0, 1.15, 1], opacity: [0, 0.9, 0], y: 0 }}
              transition={{ duration: 0.52, delay: 0.05, ease: "easeOut" }}
            />

            {/* Espiral Central (Colossal) */}
            <motion.g
              initial={{ scaleY: 0, opacity: 0, y: 30 }}
              animate={{ scaleY: [0, 1.25, 1], opacity: [0, 0.98, 0], y: 0 }}
              transition={{ duration: 0.58, ease: "easeOut" }}
              style={{ originY: "20px" }}
            >
              {/* Lâmina de Gelo Glacial Externa */}
              <polygon
                points="0,20 -15,-5 -6,-62 0,-76 6,-62 15,-5"
                fill="url(#ice-wall-gradient)"
                stroke="#bae6fd"
                strokeWidth="1.8"
                style={{ filter: 'url(#neon-glow-p1)' }}
              />
              {/* Núcleo de Gelo Branco Sólido */}
              <polygon
                points="0,20 -8,-2 -3,-54 0,-68 3,-54 8,-2"
                fill="white"
                opacity="0.8"
              />
            </motion.g>

            {/* Espiral Direita (Menor) */}
            <motion.polygon
              points="18,20 8,-15 20,-25 28,5"
              fill="url(#ice-wall-gradient)"
              stroke="#e0f2fe"
              strokeWidth="1.2"
              style={{ filter: 'url(#neon-glow-p1)', originY: "20px" }}
              initial={{ scaleY: 0, opacity: 0, y: 25 }}
              animate={{ scaleY: [0, 1.15, 1], opacity: [0, 0.9, 0], y: 0 }}
              transition={{ duration: 0.52, delay: 0.1, ease: "easeOut" }}
            />
          </g>
        );
      })}
    </g>
  );
};
