import React from 'react';
import { motion } from 'framer-motion';
import type { HexCoordinates } from 'shared';
import { hexToPixel } from '../board/HexUtils';

interface TransfusionAnimationProps {
  source: HexCoordinates;
  target: HexCoordinates;
}

/**
 * Animação de Transfusão Sombria Premium.
 * 
 * Substitui o feixe rígido anterior por um feixe de energia vital bioluminescente curvado por Bezier.
 * Adiciona contas de energia flutuantes que viajam ao longo da curva usando caminhos dashed animados por hardware,
 * halo de drenagem na origem e ondas de pulso curativas no destino.
 */
export const TransfusionAnimation: React.FC<TransfusionAnimationProps> = ({ source, target }) => {
  const start = hexToPixel(source);
  const end = hexToPixel(target);

  // Calcular curva de Bezier quadrática com offset perpendicular para fluxo orgânico
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // Vetor normalizado perpendicular
  const px = -dy / len;
  const py = dx / len;
  
  // Ponto de controle arqueado 40px para a lateral
  const ctrlX = (start.x + end.x) / 2 + px * 45;
  const ctrlY = (start.y + end.y) / 2 + py * 45;
  
  const pathD = `M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`;

  return (
    <motion.g 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="pointer-events-none z-50 overflow-visible"
    >
      {/* ── 1. HALO DE DRENAGEM DE ALMA NA ORIGEM (Vórtex Vermelho Escuro) ── */}
      <motion.circle
        cx={start.x}
        cy={start.y}
        r={22}
        fill="none"
        stroke="#991b1b" // red-800
        strokeWidth="3.5"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 1.8, opacity: 0 }}
        animate={{ scale: [1.8, 0.4], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.65, ease: "easeIn" }}
      />
      <motion.circle
        cx={start.x}
        cy={start.y}
        r={14}
        fill="rgba(153, 27, 27, 0.3)"
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: [1.5, 0.1], opacity: [0, 1.0, 0] }}
        transition={{ duration: 0.6, ease: "easeIn" }}
      />

      {/* ── 2. O FEIXE PRINCIPAL DE ENERGIA VITAL (Curva de Bezier Neon) ── */}
      {/* Rastro Externo Fluido (Neon Glow) */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="url(#blood-gradient)"
        strokeWidth="11"
        strokeLinecap="round"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ pathLength: 0, opacity: 0.2 }}
        animate={{
          pathLength: [0, 1, 1],
          opacity: [0.2, 0.95, 0]
        }}
        transition={{
          duration: 0.72,
          times: [0, 0.65, 1.0],
          ease: "easeInOut"
        }}
      />
      
      {/* Núcleo Central de Alta Tensão (Branco/Rosa Térmico) */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="#ffe4e6" // rose-100
        strokeWidth="3.2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 1, 1],
          opacity: [0, 1.0, 0]
        }}
        transition={{
          duration: 0.72,
          times: [0, 0.62, 1.0],
          ease: "easeInOut"
        }}
      />

      {/* ── 3. CONTAS DE SANGUE CONDUZIDAS (Dashed Path Animado simulando células/mana fluindo) ── */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="#f43f5e" // rose-500
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="8 24"
        initial={{ strokeDashoffset: 0, opacity: 0 }}
        animate={{
          strokeDashoffset: -120,
          opacity: [0, 0.95, 0]
        }}
        transition={{
          duration: 0.75,
          ease: "linear"
        }}
      />

      {/* ── 4. HALO DE ABSORÇÃO E CURA NO DESTINO (Onda de choque regenerativa) ── */}
      {/* Pulso de Cura Interno */}
      <motion.circle
        cx={end.x}
        cy={end.y}
        r={18}
        fill="none"
        stroke="#ef4444" // red-500
        strokeWidth="3.5"
        style={{ filter: 'url(#neon-glow-p1)' }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.6], opacity: [0, 0.95, 0] }}
        transition={{ delay: 0.42, duration: 0.38, ease: "easeOut" }}
      />
      
      {/* Brilho Suave de Expansão */}
      <motion.circle
        cx={end.x}
        cy={end.y}
        r={25}
        fill="rgba(239, 68, 68, 0.2)"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.45], opacity: [0, 0.8, 0] }}
        transition={{ delay: 0.45, duration: 0.35, ease: "easeOut" }}
      />
    </motion.g>
  );
};
