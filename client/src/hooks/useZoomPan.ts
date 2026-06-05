import { useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

export const useZoomPan = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Configurações de Zoom
  // - Mobile: Inicial em 1.0 (para visualização completa do tabuleiro) com variação de 0.6x a 2.5x
  // - Desktop: Zoom livre original (0.4x a 3.5x com base 1.0x)
  const BASE_SCALE = 1.0;

  const MIN_SCALE = isMobile ? 0.6 : 0.4;
  const MAX_SCALE = isMobile ? 2.5 : 3.5;

  const scale = useMotionValue(BASE_SCALE);
  const springScale = useSpring(scale, { stiffness: 300, damping: 30 });
  const lastPinchDistance = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDistance.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / lastPinchDistance.current;
      const newScale = Math.min(Math.max(scale.get() * delta, MIN_SCALE), MAX_SCALE);
      scale.set(newScale);
      lastPinchDistance.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastPinchDistance.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale.get() * delta, MIN_SCALE), MAX_SCALE);
    scale.set(newScale);
  };

  return {
    scale,
    springScale,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onWheel: handleWheel,
    }
  };
};
