import { expect, test, describe } from 'vitest';
import { createHex, getHexDistance, getHexNeighbors, isLine, getLineOfSight } from './hexMath';

describe('HexMath Core', () => {
  test('criação de hexágono deve validar q+r+s=0', () => {
    expect(createHex(1, -1, 0)).toEqual({ q: 1, r: -1, s: 0 });
    expect(() => createHex(1, 1, 1)).toThrow(/Invalid hex/);
  });

  test('distância hexagonal (Manhattan 3D) correta', () => {
    const a = createHex(0, 0, 0); // Centro
    const b = createHex(2, -2, 0); // 2 casas para a direita
    
    expect(getHexDistance(a, b)).toBe(2);
  });

  test('deve retornar exatamente 6 vizinhos válidos', () => {
    const center = createHex(0, 0, 0);
    const neighbors = getHexNeighbors(center);
    
    expect(neighbors.length).toBe(6);
    expect(getHexDistance(center, neighbors[0])).toBe(1);
    expect(neighbors[0].q + neighbors[0].r + neighbors[0].s).toBe(0);
  });

  test('verificar se dois hexágonos estão em linha reta (Vertical/Diagonal/Horizontal)', () => {
    const origin = createHex(0, 0, 0);
    const inLine = createHex(0, -3, 3);
    const notInLine = createHex(1, -2, 1);
    
    expect(isLine(origin, inLine)).toBe(true);
    expect(isLine(origin, notInLine)).toBe(false);
  });

  test('cálculo da linha de visão devolve path percorrido', () => {
    const a = createHex(0, 0, 0);
    const b = createHex(0, 2, -2);
    const los = getLineOfSight(a, b);
    
    // A linha deve ter tamanho igual a Distância + 1 (inclui origem e fim)
    expect(los.length).toBe(3);
    expect(los[2]).toEqual(b);
  });
});
