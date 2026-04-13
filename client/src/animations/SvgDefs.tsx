import React from 'react';

/**
 * Definições SVG compartilhadas (gradientes, filtros).
 * Extraído do HexMap.tsx para reutilização e legibilidade.
 */
export const SvgDefs: React.FC = () => (
  <defs>
    <linearGradient id="blood-gradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.7" />
      <stop offset="50%" stopColor="#ef4444" stopOpacity="1.0" />
      <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.7" />
      <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="1.5s" repeatCount="indefinite" />
    </linearGradient>
    <radialGradient id="blood-glow">
      <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
      <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
    </radialGradient>
    <radialGradient id="mist-radial">
      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
      <stop offset="50%" stopColor="rgba(220, 220, 255, 0.4)" />
      <stop offset="100%" stopColor="rgba(200, 200, 255, 0)" />
    </radialGradient>
    <linearGradient id="ice-wall-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#bae6fd" />
      <stop offset="50%" stopColor="#38bdf8" />
      <stop offset="100%" stopColor="#bae6fd" />
    </linearGradient>
    <linearGradient id="meteor-trail" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="transparent" />
      <stop offset="100%" stopColor="#f97316" />
    </linearGradient>
    <radialGradient id="explosion-glow">
      <stop offset="0%" stopColor="#facc15" />
      <stop offset="40%" stopColor="#f97316" />
      <stop offset="100%" stopColor="transparent" />
    </radialGradient>
    <filter id="mist-filter">
      <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
    </filter>
    <filter id="neon-glow-p1" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="neon-glow-p2" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
);
