/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UnitSprite } from './UnitSprite';
import type { Unit } from 'shared';

describe('Integração de Componente React: UnitSprite', () => {
  
  const dummyReiP1: Unit = {
    id: 'u_test_rei',
    playerId: 'p1',
    cardId: 'rei',
    unitClass: 'Rei', // Deve renderizar 👑
    hp: 15,
    maxHp: 15,
    attack: 0,
    buffs: [],
    position: { q: 0, r: 0, s: 0 },
    roundsInField: 0,
    summoningSickness: false,
    canMove: true,
    canAttack: true
  };

  it('Injeta e exprime Atributos do Tabuleiro no Componente UnitSprite (HP, ATK e Ícone visual)', () => {
    render(<UnitSprite unit={dummyReiP1} />);

    // 1. Testa se o dicionário Emoji funcionou
    expect(screen.getByText('👑')).toBeDefined();

    // 2. Garante que os badges de barra de vida inferior foram gerados na UI Real
    expect(screen.getByText('15')).toBeDefined(); // HP
    expect(screen.getByText('0')).toBeDefined();  // ATK
  });
});
