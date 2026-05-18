import React from 'react';
import { motion } from 'framer-motion';
import type { HexCoordinates } from 'shared';
import { getHexNeighbors } from 'shared';
import { hexToPixel, HEX_SIZE } from '../board/HexUtils';

interface MeteorAnimationProps {
  epicenter: HexCoordinates;
}

/**
 * Animação de Chuva de Meteoros Premium.
 * 
 * Renderiza meteoros volumosos de magma (com núcleo de plasma e cauda de caimento flamejante)
 * despencando em arco sobre o epicentro e hexágonos vizinhos.
 * Ao atingirem o solo, geram detonações encorpadas com anéis de choque de fogo e estilhaços incandescentes.
 */
export const MeteorAnimation: React.FC<MeteorAnimationProps> = ({ epicenter }) => {
  const epicenterPos = hexToPixel(epicenter);
  const neighborHexes = getHexNeighbors(epicenter);
  
  // Variações de posição no epicentro para simular múltiplos impactos pesados
  const epicenterOffsets = [
    { dx: 12, dy: 8 }, 
    { dx: -10, dy: -18 }, 
    { dx: -18, dy: 6 }, 
    { dx: 8, dy: -12 }
  ];

  const meteorData = [
    ...epicenterOffsets.map((off, i) => ({ 
      target: { x: epicenterPos.x + off.dx, y: epicenterPos.y + off.dy }, 
      delay: i * 0.07, 
      isEpicenter: true 
    })),
    ...neighborHexes.map((n, i) => ({ 
      target: hexToPixel(n), 
      delay: 0.12 + i * 0.06, 
      isEpicenter: false 
    }))
  ];

  return (
    <motion.g key="meteor-animation" className="pointer-events-none z-50 overflow-visible">
      {meteorData.map((m, idx) => {
        const sizeMultiplier = m.isEpicenter ? 1.3 : 0.95;
        const impactDelay = m.delay + 0.22; // Instante exato do choque no chão

        return (
          <g key={`meteor-drop-${idx}`}>
            {/* ── 1. TRAJETÓRIA DE QUEDA DO METEORO (Despencando em diagonal íngreme) ── */}
            <motion.g 
              initial={{ x: m.target.x - 140, y: m.target.y - 280, opacity: 0 }} 
              animate={{ 
                x: m.target.x, 
                y: m.target.y, 
                opacity: [0, 1, 1, 0] 
              }} 
              transition={{ 
                duration: 0.22, 
                delay: m.delay, 
                ease: "easeIn" 
              }}
            >
              {/* Cauda Externa de Plasma (Vermelho/Laranja Neon Translúcido) */}
              <line 
                x1="-15" 
                y1="-30" 
                x2="0" 
                y2="0" 
                stroke="url(#meteor-trail)" 
                strokeWidth={10 * sizeMultiplier} 
                strokeLinecap="round" 
                style={{ filter: 'url(#neon-glow-p1)' }}
              />
              
              {/* Cauda Interna Incandescente (Amarelo/Branco Fogo) */}
              <line 
                x1="-10" 
                y1="-20" 
                x2="0" 
                y2="0" 
                stroke="#fbbf24" // amber-400
                strokeWidth={4 * sizeMultiplier} 
                strokeLinecap="round" 
              />

              {/* Núcleo Vulcânico do Meteoro (Rocha Derretida) */}
              <circle 
                r={8 * sizeMultiplier} 
                fill="#ea580c" // orange-600
                stroke="#f97316" 
                strokeWidth="1.5"
              />
              
              {/* Centro de Alto Contraste (Coração de Plasma) */}
              <circle 
                r={4 * sizeMultiplier} 
                fill="#fef08a" // yellow-200
              />
            </motion.g>

            {/* ── 2. DETONAÇÃO DE IMPACTO NO CHÃO (Sincronizado) ── */}
            <g transform={`translate(${m.target.x}, ${m.target.y})`}>
              <motion.g 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: impactDelay }} 
              >
                {/* Domo de Fogo Expansivo (Explosion Glow) */}
                <motion.circle 
                  r={m.isEpicenter ? HEX_SIZE * 1.3 : HEX_SIZE * 0.9} 
                  fill="url(#explosion-glow)" 
                  initial={{ scale: 0 }} 
                  animate={{ scale: [1, 1.4, 0], opacity: [0.8, 1, 0] }} 
                  transition={{ duration: 0.35, ease: "easeOut" }} 
                />

                {/* Anel de Onda de Choque Neon (Calor Térmico) */}
                <motion.circle
                  r={m.isEpicenter ? HEX_SIZE * 0.7 : HEX_SIZE * 0.5}
                  fill="none"
                  stroke="#ef4444" // red-500
                  strokeWidth="3.5"
                  style={{ filter: 'url(#neon-glow-p1)' }}
                  initial={{ scale: 0.2, opacity: 0.8 }}
                  animate={{ scale: [0.2, 1.9], opacity: [0.8, 0] }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                />

                {/* ── 3. ESTILHAÇOS INCANDESCENTES DE MAGMA (Lançados no impacto) ── */}
                {/* Fragmento 1 (Noroeste) */}
                <motion.circle
                  cx="0" cy="0"
                  r={m.isEpicenter ? 3 : 2}
                  fill="#fbbf24"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: -28, y: -25, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                />
                {/* Fragmento 2 (Nordeste) */}
                <motion.circle
                  cx="0" cy="0"
                  r={m.isEpicenter ? 2.5 : 1.8}
                  fill="#ffffff"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: 26, y: -22, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
                {/* Fragmento 3 (Sudoeste) */}
                <motion.circle
                  cx="0" cy="0"
                  r={m.isEpicenter ? 3.2 : 2.2}
                  fill="#f97316"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: -22, y: 24, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
                {/* Fragmento 4 (Sudeste) */}
                <motion.circle
                  cx="0" cy="0"
                  r={m.isEpicenter ? 2.2 : 1.5}
                  fill="#fbbf24"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: 28, y: 22, opacity: 0 }}
                  transition={{ duration: 0.27, ease: "easeOut" }}
                />
              </motion.g>
            </g>
          </g>
        );
      })}
    </motion.g>
  );
};
