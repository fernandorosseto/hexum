import React from 'react';

export const ArqueiroSVG: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g>
        {/* Aura traseira brilhante */}
        <circle cx="50" cy="50" r="35" fill="#65a30d" opacity="0.3" filter="blur(8px)" />
        
        {/* Capuz / Cabeça (Geométrica) */}
        <polygon points="35,30 50,15 65,30 50,40" fill="#a3e635" />
        <polygon points="50,20 60,30 50,35 40,30" fill="#166534" opacity="0.5" />
        
        {/* Corpo Geométrico (Capa tech) */}
        <path d="M 50 35 L 75 85 L 25 85 Z" fill="none" stroke="#65a30d" strokeWidth="4" strokeLinejoin="round" />
        <line x1="50" y1="40" x2="50" y2="85" stroke="#a3e635" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
        
        {/* Arco Mágico de Luz */}
        <path d="M 85 15 Q 100 50 85 85" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
        
        {/* Corda Puxada */}
        <polyline points="85,15 35,50 85,85" fill="none" stroke="white" strokeWidth="1.5" opacity="0.8" />
        
        {/* Flecha de Energia Armada */}
        <line x1="35" y1="50" x2="95" y2="50" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
        {/* Ponta da flecha */}
        <polygon points="98,50 88,45 88,55" fill="#fef3c7" />
        {/* Penas da flecha traseira */}
        <path d="M 35 50 L 45 45 M 35 50 L 45 55" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
