import React from 'react';
import { motion } from 'framer-motion';

export const ShieldAura: React.FC = () => {
  return (
    <motion.div
      key="shield-aura"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.1, 1],
        boxShadow: [
          '0 0 15px 2px rgba(255,255,255,0.3)',
          '0 0 25px 6px rgba(255,255,255,0.6)',
          '0 0 15px 2px rgba(255,255,255,0.3)'
        ]
      }}
      exit={{ 
        opacity: 0, 
        scale: 1.8, 
        filter: 'blur(10px)',
        transition: { duration: 0.5, ease: "easeOut" } 
      }}
      transition={{ 
        opacity: { duration: 2, repeat: Infinity },
        scale: { duration: 2, repeat: Infinity },
        boxShadow: { duration: 2, repeat: Infinity }
      }}
      className="absolute inset-[-6px] rounded-full border-[3px] border-white/80 z-20 pointer-events-none"
      style={{ 
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
      }}
    >
      {/* Partículas de brilho internas */}
      <div className="absolute inset-0 rounded-full bg-white/10 blur-sm animate-pulse" />
    </motion.div>
  );
};
