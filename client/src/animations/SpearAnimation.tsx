import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HexCoordinates } from 'shared';
import { hexToPixel } from '../board/HexUtils';

interface SpearAnimationProps {
  attackerPosition: HexCoordinates;
  target: HexCoordinates;
}

/**
 * Animação da Lança Holográfica Neon do Lanceiro.
 * 
 * Renderiza uma lança tecnológica com efeitos de plasma, shockwave de impacto
 * e movimento de wind-up → thrust → retorno.
 * 
 * DEVE ser renderizado dentro de um <svg> como filho de um <g> ou <foreignObject>.
 * Este componente usa coordenadas de pixel absolutas do tabuleiro.
 */
export const SpearAnimation: React.FC<SpearAnimationProps> = ({ attackerPosition, target }) => {
  const { x, y } = hexToPixel(attackerPosition);
  const targetPx = hexToPixel(target);
  const dx = targetPx.x - x;
  const dy = targetPx.y - y;
  const thrustDistance = Math.hypot(dx, dy);
  const thrustAngle = Math.atan2(dy, dx) * (180 / Math.PI);

  const spearLength = thrustDistance * 0.8;
  const shaftLength = Math.max(0, spearLength - 36);
  const hitOffset = thrustDistance - spearLength;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <foreignObject x={-100} y={-100} width={200} height={200} className="overflow-visible pointer-events-none">
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ transform: `rotate(${thrustAngle}deg)` }}
            >
              <motion.div
                initial={{ x: 0, opacity: 0, scale: 0.8 }}
                animate={{
                  x: [0, -15, Math.max(0, hitOffset), 0],
                  opacity: [0, 1, 1, 0],
                  scale: [0.8, 0.8, 1.1, 0.5]
                }}
                transition={{
                  duration: 0.55,
                  times: [0, 0.15, 0.45, 1], // [Spawn, Recuo(Windup), Impacto, Retorno]
                  ease: ["easeOut", "backInOut", "circIn"]
                }}
                style={{
                  transformOrigin: 'left center',
                  width: 'fit-content',
                  position: 'absolute',
                  left: '50%'
                }}
                className="flex items-center"
              >
                {/* Lança Holográfica Neon */}
                <div className="flex items-center drop-shadow-[0_0_12px_rgba(45,212,191,0.9)] filter brightness-[1.8] relative">
                  {/* Shockwave de Impacto */}
                  <motion.div
                    className="absolute right-0 top-1/2 -mt-6 -mr-4 w-12 h-12 rounded-full border-[3px] border-teal-300 pointer-events-none mix-blend-screen"
                    style={{ boxShadow: '0 0 15px #2dd4bf, inset 0 0 10px #2dd4bf' }}
                    initial={{ opacity: 0, scale: 0.1 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.1, 2.5, 3] }}
                    transition={{ duration: 0.3, delay: 0.55 * 0.40, ease: "easeOut" }}
                  />
                  {/* Cabo de Energia/Laser */}
                  <div
                    className="h-1 bg-teal-200/90 rounded-full shadow-[0_0_8px_#2dd4bf] border-y border-teal-400/60 relative overflow-hidden"
                    style={{ width: `${shaftLength}px` }}
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/60 animate-pulse" style={{ filter: 'blur(1px)' }} />
                  </div>
                  {/* Anel Conector */}
                  <div className="w-2 h-4 bg-transparent border-[1.5px] border-teal-300 rounded-sm -ml-0.5 flex items-center justify-center shadow-[0_0_5px_#2dd4bf]">
                    <div className="w-1 h-2 bg-teal-100" />
                  </div>
                  {/* Ponta */}
                  <div className="-ml-1 drop-shadow-[0_0_6px_#2dd4bf]">
                    <svg viewBox="0 0 40 40" className="w-8 h-8 transform -rotate-90">
                      <defs>
                        <linearGradient id="neon-grad-spear" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ccfbf1" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M20,5 C12,5 6,15 20,30 C34,15 28,5 20,5 M20,30 C10,30 10,40 20,40 C30,40 30,30 20,30"
                        fill="url(#neon-grad-spear)" opacity="0.9" stroke="#2dd4bf" strokeWidth="2.5"
                      />
                      <path
                        d="M20,10 C15,10 10,18 20,28 C30,18 25,10 20,10 M20,28 C15,28 15,35 20,35 C25,35 25,28 20,28"
                        fill="#fff" opacity="0.6" filter="blur(1px)"
                      />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </foreignObject>
    </g>
  );
};
