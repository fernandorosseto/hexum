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
    canAttack: true,
    abilityCooldown: 0
  };

  it('Injeta e exprime Atributos do Tabuleiro no Componente UnitSprite (HP, ATK e Ícone visual)', () => {
    const { container } = render(<UnitSprite unit={dummyReiP1} />);

    // 1. Testa se a imagem do Rei foi renderizada
    const imageEl = container.querySelector('image');
    expect(imageEl).not.toBeNull();
    expect(imageEl?.getAttribute('href')).toContain('rei');

    // 2. Garante que os badges de barra de vida inferior foram gerados na UI Real
    expect(screen.getByText(/15/)).toBeDefined(); // HP
    expect(screen.getByText(/0/)).toBeDefined();  // ATK
  });

  const dummyInvulnerableUnit: Unit = {
    id: 'u_test_invuln',
    playerId: 'p1',
    cardId: 'c1',
    unitClass: 'Cavaleiro',
    hp: 10,
    maxHp: 10,
    attack: 3,
    buffs: [{ type: 'invulnerable', duration: 2 }],
    position: { q: 0, r: 0, s: 0 },
    roundsInField: 0,
    summoningSickness: false,
    canMove: true,
    canAttack: true,
    abilityCooldown: 0
  };

  it('Renderiza status de buffs premium com caminhos SVG (sem emojis)', () => {
    const { container } = render(<UnitSprite unit={dummyInvulnerableUnit} />);

    // 1. Garante que nenhum emoji genérico (✨) é renderizado como texto no componente
    expect(screen.queryByText('✨')).toBeNull();

    // 2. Garante que os caminhos vetoriais do BuffIcon invulnerável são renderizados dentro da tag SVG
    const svgIcon = container.querySelector('svg[overflow="visible"]');
    expect(svgIcon).not.toBeNull();
    
    // 3. Garante que o círculo base de buffs possui a cor da borda de bronze padrão
    const buffCircle = container.querySelector('circle[stroke="rgba(205, 127, 50, 0.8)"]');
    expect(buffCircle).not.toBeNull();
  });
});
