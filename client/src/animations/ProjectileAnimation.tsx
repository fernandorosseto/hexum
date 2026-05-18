import React from 'react';
import { motion, useMotionValue, useMotionValueEvent, animate } from 'framer-motion';
import type { HexCoordinates } from 'shared';
import { hexToPixel } from '../board/HexUtils';

interface ProjectileAnimationProps {
  source: HexCoordinates;
  target: HexCoordinates;
  playerId: string;
}

/**
 * Animação de Projétil (Flecha do Arqueiro).
 * 
 * Calcula a trajetória em arco usando Bézier Quadrática com simulação de profundidade 3D.
 * A cabeça da flecha rotaciona dinamicamente seguindo a tangente da curva.
 * 
 * DEVE ser renderizado dentro de um <svg>.
 */
export const ProjectileAnimation: React.FC<ProjectileAnimationProps> = ({ source, target, playerId }) => {
  const start = hexToPixel(source);
  const end = hexToPixel(target);

  // Calcular ponto de controle para o arco (Bézier Quadrática)
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dist = Math.hypot(end.x - start.x, end.y - start.y);

  const arcHeight = Math.max(100, dist * 0.4);
  const cpX = midX;
  const cpY = midY - arcHeight;

  const color = playerId === 'p1' ? '#60a5fa' : '#ef4444';
  const filter = playerId === 'p1' ? 'url(#neon-glow-p1)' : 'url(#neon-glow-p2)';

  // Motion value para progressão atômica (0 a 1)
  const progress = useMotionValue(0);

  // Efeito para disparar a animação de progresso
  React.useEffect(() => {
    const controls = animate(progress, 1, {
      duration: 0.6,
      ease: "linear"
    });
    return () => controls.stop();
  }, [progress]);

  // Transforma progresso em coordenadas X, Y e Rotação usando a fórmula de Bézier
  const x = useMotionValue(start.x);
  const y = useMotionValue(start.y);
  const rotation = useMotionValue(0);

  useMotionValueEvent(progress, "change", (t) => {
    // Posição da flecha
    const currentX = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * cpX + Math.pow(t, 2) * end.x;
    const currentY = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * cpY + Math.pow(t, 2) * end.y;

    // Tangente
    const tx = 2 * (1 - t) * (cpX - start.x) + 2 * t * (end.x - cpX);
    const ty = 2 * (1 - t) * (cpY - start.y) + 2 * t * (end.y - cpY);
    const angle = Math.atan2(ty, tx) * (180 / Math.PI);

    x.set(currentX);
    y.set(currentY);
    rotation.set(angle);
  });

  return (
    <motion.g className="pointer-events-none">
      {/* Cabeça da Flecha */}
      <motion.g
        style={{ x, y, rotate: rotation, transformOrigin: "0px 0px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.6, times: [0, 0.1, 0.9, 1] }}
      >
        {/* Glow de impacto na frente */}
        <circle cx="0" cy="0" r="12" fill="none" stroke={color} strokeWidth="3" style={{ filter: 'blur(3px)' }} />

        {/* Haste da flecha */}
        <line x1="-45" y1="0" x2="-6" y2="0" stroke="white" strokeWidth="3.5" opacity="0.8" />
        
        {/* Penas (Fletching) */}
        <path d="M-40,0 L-48,-6 L-34,-6 Z M-40,0 L-48,6 L-34,6 Z" fill={color} opacity="0.9" />

        {/* Ponta da Flecha (Metálica) */}
        <polygon
          points="0,0 -12,-6 -12,6"
          fill="white"
          stroke={color}
          strokeWidth="1.5"
        />

        {/* Brilho interno da ponta */}
        <circle cx="-3" cy="0" r="4.5" fill={color} style={{ filter }} />
      </motion.g>
    </motion.g>
  );
};
