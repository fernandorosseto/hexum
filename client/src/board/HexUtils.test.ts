import { describe, it, expect } from 'vitest';
import { hexToPixel, generateHexMap, HEX_SIZE } from './HexUtils';

describe('HexUtils (Motor de Projeção Visual)', () => {
  
  it('hexToPixel deve ancorar o centro do tabuleiro (0,0) na Coordenada Pixel (0,0)', () => {
    const point = hexToPixel({ q: 0, r: 0, s: 0 });
    expect(point.x).toBe(0);
    expect(point.y).toBe(0);
  });

  it('a conversão "Pointy Top" do hexágono Q=1 R=0 deve caminhar o Raio(size)*Sqrt(3) estritamente no Eixo X', () => {
    const point = hexToPixel({ q: 1, r: 0, s: -1 });
    
    // Math: x = SIZE * sqrt(3) * (q + r/2) => SIZE * sqrt(3) * 1
    const expectedX = HEX_SIZE * Math.sqrt(3);
    const expectedY = 0; // r = 0

    // Usamos toBeCloseTo por causa do ponto flutuante do sqrt(3)
    expect(point.x).toBeCloseTo(expectedX);
    expect(point.y).toBeCloseTo(expectedY);
  });

  it('generateHexMap com Raio GDD 4 deve gerar a Arena perfeitamente com 61 blocos de combate', () => {
    const hexMap = generateHexMap(4);
    
    // Formula da malha hexagonal centrada: 1 + 3 * radius * (radius + 1)
    // R4 -> 1 + 3 * 4 * 5 = 1 + 60 = 61
    expect(hexMap.length).toBe(61);
    
    // Centro obrigatoriamente existe
    const originExists = hexMap.find(h => h.q === 0 && h.r === 0 && h.s === 0);
    expect(originExists).toBeDefined();

    // Uma peça na borda exata do extremo esquerdo "Q = -4" deve existir
    const edgeExists = hexMap.find(h => h.q === -4 && h.r === 0);
    expect(edgeExists).toBeDefined();

    // Uma coordenada fora dos Muros da Arena (Raio 5) deve ser bloqueada
    const outOfBounds = hexMap.find(h => h.q === 5 && h.r === 0);
    expect(outOfBounds).toBeUndefined();
  });
});
