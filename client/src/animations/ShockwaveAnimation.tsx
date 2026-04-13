import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board';
import { HexCoordinates } from 'shared';

interface Props {
  target: HexCoordinates;
}

export const ShockwaveAnimation: React.FC<Props> = ({ target }) => {
  const center = hexToPixel(target);

  return (
    <motion.g transform={`translate(${center.x}, ${center.y})`} className="pointer-events-none z-50">
      
      {/* Ground Crack/Rupture */}
      <motion.circle
        r={HEX_SIZE * 0.9}
        fill="rgba(30, 41, 59, 0.4)" // slate-800
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Dust Wave */}
      <motion.circle
        r={HEX_SIZE * 1.2}
        fill="none"
        stroke="rgba(148, 163, 184, 0.6)" // slate-400
        strokeWidth="15"
        style={{ filter: 'blur(4px)' }}
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: [0.2, 2.5], opacity: [1, 0], strokeWidth: [15, 0] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Impact Spike */}
      <motion.polygon
        points={`
          0,${-HEX_SIZE*1.5} 
          ${HEX_SIZE*0.3},${-HEX_SIZE*0.3} 
          ${HEX_SIZE*1.5},0 
          ${HEX_SIZE*0.3},${HEX_SIZE*0.3} 
          0,${HEX_SIZE*1.5} 
          ${-HEX_SIZE*0.3},${HEX_SIZE*0.3} 
          ${-HEX_SIZE*1.5},0 
          ${-HEX_SIZE*0.3},${-HEX_SIZE*0.3}
        `}
        fill="white"
        style={{ filter: 'blur(2px)' }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.2, 0.8], opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

    </motion.g>
  );
};
