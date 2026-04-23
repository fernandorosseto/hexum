import { useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

export const useZoomPan = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Controle de Zoom (Pinch/Wheel)
  const scale = useMotionValue(isMobile ? 1.2 : 1.0);
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
      const newScale = Math.min(Math.max(scale.get() * delta, 0.4), 3.5);
      scale.set(newScale);
      lastPinchDistance.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastPinchDistance.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale.get() * delta, 0.4), 3.5);
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
