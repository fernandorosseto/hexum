export interface HexCoordinates {
  q: number;
  r: number;
  s: number;
}

export const BOARD_RADIUS = 5;

export function isInsideBoard(hex: HexCoordinates): boolean {
  return Math.abs(hex.q) <= BOARD_RADIUS && 
         Math.abs(hex.r) <= BOARD_RADIUS && 
         Math.abs(hex.s) <= BOARD_RADIUS;
}

export function createHex(q: number, r: number, s: number): HexCoordinates {
  if (Math.round(q + r + s) !== 0) throw new Error(`Invalid hex: ${q} + ${r} + ${s} must be 0`);
  return { q, r, s };
}

export function createHexSilent(q: number, r: number, s: number): HexCoordinates {
  return { q, r, s: -q - r };
}

export function cubeRound(fracQ: number, fracR: number, fracS: number): HexCoordinates {
  let q = Math.round(fracQ);
  let r = Math.round(fracR);
  let s = Math.round(fracS);

  const qDiff = Math.abs(q - fracQ);
  const rDiff = Math.abs(r - fracR);
  const sDiff = Math.abs(s - fracS);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return createHexSilent(q, r, s);
}

export function getHexDistance(a: HexCoordinates, b: HexCoordinates): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
}

export function getHexNeighbors(hex: HexCoordinates): HexCoordinates[] {
  const directions = [
    { q: 1, r: -1, s: 0 }, { q: 1, r: 0, s: -1 }, { q: 0, r: 1, s: -1 },
    { q: -1, r: 1, s: 0 }, { q: -1, r: 0, s: 1 }, { q: 0, r: -1, s: 1 }
  ];
  return directions.map(d => createHex(hex.q + d.q, hex.r + d.r, hex.s + d.s));
}

// Verifica se dois hexágonos estão perfeitamente alinhados (linha reta)
export function isLine(a: HexCoordinates, b: HexCoordinates): boolean {
  return a.q === b.q || a.r === b.r || a.s === b.s;
}

// Verifica se dois hexágonos estão em diagonal hexagonal real (distância 2 e não em linha reta)
export function isDiagonal(a: HexCoordinates, b: HexCoordinates): boolean {
  return getHexDistance(a, b) === 2 && a.q !== b.q && a.r !== b.r && a.s !== b.s;
}

// Traz a linha de visão desenhando os hexágonos entre dois pontos
export function getLineOfSight(a: HexCoordinates, b: HexCoordinates): HexCoordinates[] {
  const N = getHexDistance(a, b);
  const line: HexCoordinates[] = [];
  if (N === 0) return [a];
  
  // Nudge para não bater nas diagonais perfeitas (padrão de jogos hex)
  const offsetA = { q: a.q + 1e-6, r: a.r + 1e-6, s: a.s - 2e-6 };
  const offsetB = { q: b.q + 1e-6, r: b.r + 1e-6, s: b.s - 2e-6 };
  
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const fq = offsetA.q + (offsetB.q - offsetA.q) * t;
    const fr = offsetA.r + (offsetB.r - offsetA.r) * t;
    const fs = offsetA.s + (offsetB.s - offsetA.s) * t;
    line.push(cubeRound(fq, fr, fs));
  }
  return line;
}
