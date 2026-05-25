import React from 'react';

// Interfaces
interface IconProps {
  id: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ────────────────────────────────────────────────────────
// FEITIÇOS (SPELLS) -> Letra 'f' em cor Prata (Silver)
// ────────────────────────────────────────────────────────
export const SpellIcon: React.FC<IconProps> = ({ id, size = 32, className = '', style }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      style={{ width: size, height: size, ...style }}
    >
      <text 
        x="12" 
        y="17.5" 
        fontSize="16" 
        fontWeight="900" 
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle" 
        fill={style?.color || '#cbd5e1'}
      >
        f
      </text>
    </svg>
  );
};

// ────────────────────────────────────────────────────────
// ARTEFATOS (ARTIFACTS) -> Letra 'a' em cor Dourada (Gold)
// ────────────────────────────────────────────────────────
export const ArtifactIcon: React.FC<IconProps> = ({ id, size = 32, className = '', style }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      style={{ width: size, height: size, ...style }}
    >
      <text 
        x="12" 
        y="17" 
        fontSize="15" 
        fontWeight="900" 
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle" 
        fill={style?.color || '#fbbf24'}
      >
        a
      </text>
    </svg>
  );
};

// ────────────────────────────────────────────────────────
// STATUS / BUFFS (BUFFS E DEBUFFS) -> Letra 'b' em cor Bronze (Bronze)
// ────────────────────────────────────────────────────────
export const BuffIcon: React.FC<IconProps> = ({ id, size = 16, className = '', style }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      style={{ width: size, height: size, ...style }}
    >
      <text 
        x="12" 
        y="17.5" 
        fontSize="16" 
        fontWeight="900" 
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle" 
        fill={style?.color || '#cd7f32'}
      >
        b
      </text>
    </svg>
  );
};
