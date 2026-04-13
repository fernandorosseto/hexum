import React from 'react';
import { motion } from 'framer-motion';
import { hexToPixel, HEX_SIZE } from '../board';
import { HexCoordinates } from 'shared';

interface Props {
  epicenter: HexCoordinates;
}

export const ArcaneExplosion: React.FC<Props> = ({ epicenter }) => {
  const center = hexToPixel(epicenter);

  return (
    <motion.g transform={`translate(${center.x}, ${center.y})`} className="pointer-events-none z-50">
      {/* Implosion Core */}
      <motion.circle
        r={HEX_SIZE * 0.8}
        fill="rgba(192, 132, 252, 0.4)" // purple-400
        style={{ filter: 'blur(8px)' }}
        initial={{ scale: 2, opacity: 0 }}
        animate={{ scale: [2, 0.2, 3], opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, times: [0, 0.4, 1], ease: "easeOut" }}
      />
      
      {/* Energy Rings */}
      <motion.circle
        r={HEX_SIZE * 1.5}
        fill="none"
        stroke="rgba(147, 51, 234, 0.8)" // purple-600
        strokeWidth="6"
        initial={{ scale: 0.1, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0, strokeWidth: [6, 1] }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      />
      
      <motion.circle
        r={HEX_SIZE * 1.2}
        fill="none"
        stroke="rgba(56, 189, 248, 0.8)" // sky-400
        strokeWidth="4"
        initial={{ scale: 0.1, opacity: 1 }}
        animate={{ scale: 2.8, opacity: 0, strokeWidth: [4, 0] }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      />
      
      {/* Explosion Flash */}
      <motion.circle
        r={HEX_SIZE * 1.5}
        fill="white"
        style={{ filter: 'blur(15px)' }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.5, 2.5, 3] }}
        transition={{ delay: 0.2, duration: 0.4, times: [0, 0.3, 1], ease: "easeOut" }}
      />
    </motion.g>
  );
};
