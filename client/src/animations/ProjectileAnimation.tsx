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
    // Posição: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const currentX = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * cpX + Math.pow(t, 2) * end.x;
    const currentY = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * cpY + Math.pow(t, 2) * end.y;

    // Tangente: B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
    const tx = 2 * (1 - t) * (cpX - start.x) + 2 * t * (end.x - cpX);
    const ty = 2 * (1 - t) * (cpY - start.y) + 2 * t * (end.y - cpY);

    const angle = Math.atan2(ty, tx) * (180 / Math.PI);

    x.set(currentX);
    y.set(currentY);
    rotation.set(angle);
  });

  return (
    <motion.g className="pointer-events-none">
      {/* Rastro Neon */}
      <motion.path
        d={`M ${start.x} ${start.y} Q ${cpX} ${cpY} ${end.x} ${end.y}`}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 1, 1],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 0.6, times: [0, 0.2, 1], ease: "linear" }}
        style={{ filter }}
      />

      {/* Cabeça da Flecha (Agrupada para rotação) */}
      <motion.g
        style={{ x, y, rotate: rotation }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.6, times: [0, 0.1, 0.9, 1] }}
      >
        {/* Glow de impacto na frente */}
        <circle r="5" fill="white" style={{ filter: 'blur(2px)' }} />

        {/* Mini Flecha (Triângulo) */}
        <polygon
          points="8,0 -6,-5 -4,0 -6,5"
          fill="white"
          stroke={color}
          strokeWidth="1"
        />

        {/* Brilho da flecha */}
        <circle r="3" fill={color} style={{ filter }} />
      </motion.g>
    </motion.g>
  );
};
