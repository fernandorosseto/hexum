import { describe, it, expect } from 'vitest';
import { getLineOfSight, createHex } from './hexMath';

describe('Hex Math Rounding Bug', () => {
  it('should not throw in getLineOfSight for any coordinates', () => {
    // This coordinate pair is known to cause rounding issues in some hex grid implementations
    const a = { q: 0, r: 0, s: 0 };
    const b = { q: 2, r: -1, s: -1 }; 
    
    // Testing a range of coordinates
    for (let q = -5; q <= 5; q++) {
      for (let r = -5; r <= 5; r++) {
        const start = { q: 0, r: 0, s: 0 };
        const end = { q, r, s: -q - r };
        expect(() => getLineOfSight(start, end)).not.toThrow();
      }
    }
  });
});
