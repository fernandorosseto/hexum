import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animação de Raio / Relâmpago.
 * 
 * Renderiza um raio zigzag em SVG com efeito de glow externo e núcleo branco.
 * Usado como overlay sobre unidades atingidas por feitiço de raio.
 * 
 * DEVE ser renderizado dentro de um componente HTML (não SVG).
 */
export const LightningAnimation: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scaleY: 0, originY: 0 }}
    animate={{ opacity: [0, 1, 0.8, 1, 0], scaleY: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
  >
    <div className="text-6xl filter drop-shadow-[0_0_15px_#60a5fa] -mt-10">⚡</div>

    {/* Raio Zigzag em SVG */}
    <svg
      viewBox="0 0 100 400"
      className="absolute top-[-360px] h-[380px] w-20 overflow-visible pointer-events-none"
      preserveAspectRatio="none"
    >
      {/* Brilho externo (Glow) */}
      <motion.polyline
        points="50,0 30,100 70,200 20,300 50,400"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.3, 0.1, 0.2, 0] }}
        style={{ filter: 'blur(10px)' }}
      />
      {/* Núcleo do raio */}
      <motion.polyline
        points="50,0 30,100 70,200 20,300 50,400"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 0.7, 1, 0] }}
      />
    </svg>
  </motion.div>
);
