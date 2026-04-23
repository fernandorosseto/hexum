import type { HexCoordinates } from 'shared';

export const HEX_SIZE = 90; // Aumentado para melhor visibilidade e preenchimento da tela

export function hexToPixel(hex: HexCoordinates): { x: number; y: number } {
  // Projeção "Pointy Top" clássica (Bico do hexágono apontando para cima)
  const x = HEX_SIZE * Math.sqrt(3) * (hex.q + hex.r / 2);
  const y = HEX_SIZE * 3 / 2 * hex.r;
  return { x, y };
}

// Gera um raio estrito de hexágonos a partir do centro (0,0)
export function generateHexMap(radius: number): HexCoordinates[] {
  const hexes: HexCoordinates[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      hexes.push({ q, r, s: -q - r });
    }
  }
  return hexes;
}
