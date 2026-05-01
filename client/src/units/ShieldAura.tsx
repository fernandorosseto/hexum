import React from 'react';
import { motion } from 'framer-motion';
import { HEX_SIZE } from '../board/HexUtils';

export const ShieldAura: React.FC = () => {
  const radius = (HEX_SIZE * 1.56) / 2 + 6;
  
  return (
    <motion.circle
      key="shield-aura"
      cx="0" cy="0"
      initial={{ opacity: 0, r: radius * 0.8 }}
      animate={{ 
        opacity: [0.4, 0.7, 0.4],
        r: [radius, radius * 1.05, radius],
        strokeWidth: [2, 4, 2],
        filter: [
          'drop-shadow(0px 0px 8px rgba(255,255,255,0.4))',
          'drop-shadow(0px 0px 16px rgba(255,255,255,0.7))',
          'drop-shadow(0px 0px 8px rgba(255,255,255,0.4))'
        ]
      }}
      exit={{ 
        opacity: 0, 
        r: radius * 1.5, 
        filter: 'blur(10px)',
        transition: { duration: 0.5, ease: "easeOut" } 
      }}
      transition={{ 
        opacity: { duration: 2, repeat: Infinity },
        r: { duration: 2, repeat: Infinity },
        strokeWidth: { duration: 2, repeat: Infinity },
        filter: { duration: 2, repeat: Infinity }
      }}
      fill="url(#shield-radial)"
      stroke="rgba(255,255,255,0.8)"
      className="pointer-events-none"
    />
  );
};
