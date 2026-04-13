import React from 'react';

// Interfaces
interface IconProps {
  id: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ────────────────────────────────────────────────────────
// FEITIÇOS (SPELLS)
// ────────────────────────────────────────────────────────

export const SpellIcon: React.FC<IconProps> = ({ id, size = 32, className = '', style }) => {
  const getSpellSVG = () => {
    switch (id) {
      case 'spl_raio':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
          </svg>
        );
      case 'spl_transfusao':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" fillOpacity="0.4" />
            <path d="M12 8v4" strokeWidth="3" />
            <path d="M10 10h4" strokeWidth="3" />
          </svg>
        );
      case 'spl_nevoa':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1772 10.2014 17.854 10.0152C17.3879 6.64332 14.4984 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2335 4.01146 11.4639 4.03383 11.6908C2.28584 12.2801 1 13.9427 1 15.9375C1 18.1812 2.81881 20 5.0625 20L17.5 19Z" fill="currentColor" fillOpacity="0.2" />
          </svg>
        );
      case 'spl_muralha':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16M8 6V3M16 6V3M12 12V6M8 18v-6M16 18v-6M12 21v-3" />
          </svg>
        );
      case 'spl_passos':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 6c-2 0-3 3-3 3s-1-3-3-3-3 3-4 3c-1.5 0-3-2-3-2M2 13s2 1 3 1 3-3 4-3 3 2 3 2" />
            <path d="M12 20s2 1 3 1 3-3 4-3" />
          </svg>
        );
      case 'spl_meteoro':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 3L9 15M21 3c-2 0-3 3-3 3s-1-3-3-3-3 3-4 3c-1.5 0-3-2-3-2" />
            <circle cx="7" cy="17" r="4" fill="currentColor" fillOpacity="0.4" />
          </svg>
        );
      case 'spl_bencao':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M5 9h14" />
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          </svg>
        );
      case 'spl_raizes':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22V8M7 12c0-3 5-3 5 0M17 10c0-4-5-4-5 0M4 18c0-5 8-5 8 0" />
          </svg>
        );
      case 'spl_furia':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2L2 14.5L5.5 18L18 5.5L14.5 2Z" fill="currentColor" fillOpacity="0.5"/>
            <path d="M9.5 2L22 14.5L18.5 18L6 5.5L9.5 2Z" fill="currentColor" fillOpacity="0.3"/>
          </svg>
        );
      case 'spl_reforcos':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M4 14h16M5 14l2 8h10l2-8" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        );
      default:
        // Círculo genérico brilhante se não achar a spell
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity="0.5" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        );
    }
  };

  return (
    <div className={className} style={{ width: size, height: size, ...style }}>
      {getSpellSVG()}
    </div>
  );
};

// ────────────────────────────────────────────────────────
// ARTEFATOS (ARTIFACTS)
// ────────────────────────────────────────────────────────

export const ArtifactIcon: React.FC<IconProps> = ({ id, size = 32, className = '', style }) => {
  const getArtifactSVG = () => {
    switch (id) {
      case 'art_escudo':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.4" />
          </svg>
        );
      case 'art_montante':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2L2 14.5L5.5 18L18 5.5L14.5 2Z" fill="currentColor" fillOpacity="0.2"/>
            <path d="M22 22l-6-6M19 13l4 4-2 2-4-4" />
          </svg>
        );
      case 'art_arco':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2c4 4 4 16 0 20M14 2L2 12l12 10" />
            <path d="M22 12H2" />
          </svg>
        );
      case 'art_adagas':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 3L3 11l2 2 8-8-2-2zM21 13l-8 8-2-2 8-8 2 2z" fill="currentColor" fillOpacity="0.5"/>
          </svg>
        );
      case 'art_anel':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" strokeWidth="3" />
            <circle cx="12" cy="4" r="2" fill="currentColor" />
          </svg>
        );
      case 'art_corcel':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 19c-2 0-3-2-3-5s3-9 10-9 10 6 10 9-1 5-3 5M12 10v9M8 10v4M16 10v4" />
          </svg>
        );
      case 'art_coroa':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20h20M4 20L2 7l6 4 4-7 4 7 6-4-2 13" fill="currentColor" fillOpacity="0.3" />
          </svg>
        );
      case 'art_tomo':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" fill="currentColor" fillOpacity="0.1" />
            <path d="M12 8h4M12 12h4" />
          </svg>
        );
      case 'art_amuleto':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        );
      case 'art_estandarte':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2v20M4 4h16l-4 6 4 6H4" fill="currentColor" fillOpacity="0.4" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
            <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
          </svg>
        );
    }
  };

  return (
    <div className={className} style={{ width: size, height: size, ...style }}>
      {getArtifactSVG()}
    </div>
  );
};
