import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createInitialState, cloneGameState, hasAnyValidAction, playCard, attack, heal,
  offerCard, endTurn, moveTo, getFearStatus, getCardManaCost, getValidSpawnCoordinates,
  MAX_ARTIFACTS_PER_UNIT,
} from './gameEngine';
import { makeState, makeUnit, hex } from './testUtils';

afterEach(() => vi.restoreAllMocks());

/** Trava o RNG para que efeitos probabilísticos não tornem o teste instável. */
function noProcs() {
  vi.spyOn(Math, 'random').mockReturnValue(0.999);
}

describe('cloneGameState', () => {
  it('preserva language para que os logs saiam no idioma certo', () => {
    const state = createInitialState();
    state.language = 'pt';
    expect(cloneGameState(state).language).toBe('pt');
  });

  it('não compartilha referências mutáveis com a origem', () => {
    const state = makeState([makeUnit({ id: 'u1' })]);
    const copy = cloneGameState(state);
    copy.boardUnits.u1.hp = 1;
    copy.boardUnits.u1.buffs.push({ type: 'stun', duration: 1 });
    expect(state.boardUnits.u1.hp).toBe(5);
    expect(state.boardUnits.u1.buffs).toHaveLength(0);
  });
});

describe('hasAnyValidAction', () => {
  it('não lança quando a mão tem feitiços e artefatos', () => {
    const state = makeState([]);
    state.players.p1.hand = ['art_carvalho', 'spl_raio'];
    state.players.p1.mana = 0;
    expect(() => hasAnyValidAction(state, 'p1')).not.toThrow();
  });

  it('devolve false quando nada pode ser feito', () => {
    const state = makeState([]);
    state.players.p1.hand = ['spl_raio'];
    state.players.p1.mana = 0;
    expect(hasAnyValidAction(state, 'p1')).toBe(false);
  });

  it('devolve true quando há uma jogada pagável', () => {
    const king = makeUnit({ id: 'k1', unitClass: 'Rei', position: hex(0, 0) });
    const state = makeState([king]);
    state.players.p1.hand = ['unit_lanceiro'];
    state.players.p1.mana = 5;
    expect(hasAnyValidAction(state, 'p1')).toBe(true);
  });
});

describe('getCardManaCost', () => {
  it('resolve unidades, artefatos e feitiços sem lançar', () => {
    expect(getCardManaCost('unit_lanceiro')).toBe(1);
    expect(getCardManaCost('art_carvalho')).toBe(2);
    expect(getCardManaCost('spl_raio')).toBe(3);
    expect(getCardManaCost('desconhecido')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('playCard', () => {
  it('rejeita jogar carta fora do próprio turno', () => {
    const king = makeUnit({ id: 'k2', playerId: 'p2', unitClass: 'Rei', position: hex(0, 0) });
    const state = makeState([king]);
    state.currentTurnPlayerId = 'p1';
    state.players.p2.hand = ['unit_lanceiro'];
    const spot = getValidSpawnCoordinates(state, 'p2', 'unit_lanceiro')[0];
    expect(() => playCard(state, 'p2', 'unit_lanceiro', spot)).toThrow(/turn|turno/i);
  });

  it('dá a vitória ao adversário quando o feitiço mata o próprio Rei', () => {
    const myKing = makeUnit({ id: 'k1', playerId: 'p1', unitClass: 'Rei', hp: 1, position: hex(0, 0) });
    const foeKing = makeUnit({ id: 'k2', playerId: 'p2', unitClass: 'Rei', position: hex(3, -3) });
    const state = makeState([myKing, foeKing]);
    state.players.p1.hand = ['spl_meteoro'];

    const out = playCard(state, 'p1', 'spl_meteoro', hex(0, 0));

    expect(out.currentPhase).toBe('GAME_OVER');
    expect(out.winner).toBe('p2');
  });

  it('não permite equipar o mesmo artefato duas vezes', () => {
    const unit = makeUnit({ id: 'u1', attack: 2, position: hex(0, 0) });
    const state = makeState([unit]);
    state.players.p1.hand = ['art_lamina', 'art_lamina'];

    const once = playCard(state, 'p1', 'art_lamina', hex(0, 0));
    expect(once.boardUnits.u1.attack).toBe(4);
    expect(() => playCard(once, 'p1', 'art_lamina', hex(0, 0))).toThrow(/artefato|artifact/i);
  });

  it('limita a quantidade de artefatos por unidade', () => {
    const unit = makeUnit({ id: 'u1', position: hex(0, 0) });
    const state = makeState([unit]);
    const arts = ['art_lamina', 'art_arco', 'art_adagas', 'art_corcel'];
    state.players.p1.hand = [...arts];

    let current = state;
    for (const art of arts.slice(0, MAX_ARTIFACTS_PER_UNIT)) {
      current = playCard(current, 'p1', art, hex(0, 0));
    }
    expect(() => playCard(current, 'p1', arts[MAX_ARTIFACTS_PER_UNIT], hex(0, 0)))
      .toThrow(/limite|limit/i);
  });
});

describe('heal', () => {
  const cleric = () => makeUnit({ id: 'c1', playerId: 'p1', unitClass: 'Clerigo', position: hex(0, 0) });
  const ally = () => makeUnit({ id: 'a1', playerId: 'p1', hp: 1, position: hex(1, 0) });

  it('cura aliado adjacente no próprio turno', () => {
    noProcs();
    const out = heal(makeState([cleric(), ally()]), 'c1', 'a1');
    expect(out.boardUnits.a1.hp).toBe(3);
    expect(out.boardUnits.c1.canAttack).toBe(false);
  });

  it('recusa curar inimigos', () => {
    const foe = makeUnit({ id: 'e1', playerId: 'p2', hp: 1, position: hex(1, 0) });
    expect(() => heal(makeState([cleric(), foe]), 'c1', 'e1')).toThrow(/allied/i);
  });

  it('recusa agir fora do próprio turno', () => {
    const state = makeState([cleric(), ally()], { currentTurnPlayerId: 'p2' });
    expect(() => heal(state, 'c1', 'a1')).toThrow(/turn|turno/i);
  });

  it('recusa quem não é Clérigo', () => {
    const fake = makeUnit({ id: 'c1', unitClass: 'Arqueiro', position: hex(0, 0) });
    expect(() => heal(makeState([fake, ally()]), 'c1', 'a1')).toThrow(/Cleric/i);
  });

  it('não explode com ids inválidos', () => {
    expect(() => heal(makeState([cleric()]), 'c1', 'inexistente')).toThrow(/Invalid units/i);
  });
});

describe('Provocar (taunt)', () => {
  const setup = () => makeState([
    makeUnit({ id: 'archer', unitClass: 'Arqueiro', position: hex(0, 0) }),
    makeUnit({ id: 'taunter', playerId: 'p2', position: hex(1, 0), buffs: [{ type: 'taunt', duration: 99 }] }),
    makeUnit({ id: 'soft', playerId: 'p2', unitClass: 'Clerigo', position: hex(-2, 0) }),
  ]);

  it('obriga o atacante a mirar na unidade que provoca', () => {
    expect(() => attack(setup(), 'archer', 'soft')).toThrow(/taunt|provocar/i);
  });

  it('permite atacar a própria unidade que provoca', () => {
    noProcs();
    const out = attack(setup(), 'archer', 'taunter');
    expect(out.boardUnits.taunter.hp).toBeLessThan(5);
  });
});

describe('linha de visão', () => {
  it('bloqueia o tiro do Arqueiro quando há unidade no caminho', () => {
    const state = makeState([
      makeUnit({ id: 'archer', unitClass: 'Arqueiro', position: hex(-2, 0) }),
      makeUnit({ id: 'wall', unitClass: 'Estrutura', hp: 6, position: hex(-1, 0) }),
      makeUnit({ id: 'foe', playerId: 'p2', position: hex(1, 0) }),
    ]);
    expect(() => attack(state, 'archer', 'foe')).toThrow(/Trajectory/i);
  });

  it('mantém o tiro válido com o caminho livre', () => {
    noProcs();
    const state = makeState([
      makeUnit({ id: 'archer', unitClass: 'Arqueiro', position: hex(-2, 0) }),
      makeUnit({ id: 'foe', playerId: 'p2', position: hex(1, 0) }),
    ]);
    expect(attack(state, 'archer', 'foe').boardUnits.foe.hp).toBeLessThan(5);
  });
});

describe('Aura de Medo', () => {
  it('a Coroa do Regente dobra o raio da aura', () => {
    const state = makeState([
      makeUnit({ id: 'k2', playerId: 'p2', unitClass: 'Rei', position: hex(0, 0), equippedArtifacts: ['art_coroa'] }),
      makeUnit({ id: 'archer', unitClass: 'Arqueiro', position: hex(2, 0) }),
    ]);
    const status = getFearStatus(state.boardUnits.archer, state);
    expect(status.radius).toBe(2);
    expect(status.inRange).toBe(true);
  });

  it('sem a Coroa o raio continua 1', () => {
    const state = makeState([
      makeUnit({ id: 'k2', playerId: 'p2', unitClass: 'Rei', position: hex(0, 0) }),
      makeUnit({ id: 'archer', unitClass: 'Arqueiro', position: hex(2, 0) }),
    ]);
    expect(getFearStatus(state.boardUnits.archer, state).inRange).toBe(false);
  });

  it('o medo impede o ataque e não vaza log entre turnos', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const state = makeState([
      makeUnit({ id: 'k2', playerId: 'p2', unitClass: 'Rei', position: hex(0, 0) }),
      makeUnit({ id: 'me', unitClass: 'Cavaleiro', position: hex(1, 0) }),
    ]);
    state.combatLogs = ['log antigo'];
    const out = attack(state, 'me', 'k2');
    expect(out.boardUnits.k2.hp).toBe(5);
    expect(out.boardUnits.me.canAttack).toBe(false);
    expect(out.combatLogs).toHaveLength(1);
  });
});

describe('Adagas Envenenadas', () => {
  it('furam escudo (dano real) mas não invulnerabilidade', () => {
    noProcs();
    const shielded = makeState([
      makeUnit({ id: 'me', unitClass: 'Rei', position: hex(0, 0), equippedArtifacts: ['art_adagas'] }),
      makeUnit({ id: 'foe', playerId: 'p2', hp: 5, position: hex(1, 0), buffs: [{ type: 'shield', duration: 99 }] }),
    ]);
    expect(attack(shielded, 'me', 'foe').boardUnits.foe.hp).toBe(4);

    const immune = makeState([
      makeUnit({ id: 'me', unitClass: 'Rei', position: hex(0, 0), equippedArtifacts: ['art_adagas'] }),
      makeUnit({ id: 'foe', playerId: 'p2', hp: 5, position: hex(1, 0), buffs: [{ type: 'invulnerable', duration: 2 }] }),
    ]);
    expect(attack(immune, 'me', 'foe').boardUnits.foe.hp).toBe(5);
  });
});

describe('offerCard', () => {
  it('aumenta apenas a mana máxima, não a disponível', () => {
    const state = makeState([]);
    state.players.p1 = { ...state.players.p1, hand: ['spl_raio'], mana: 1, maxMana: 1 };
    const out = offerCard(state, 'p1', 'spl_raio');
    expect(out.players.p1.mana).toBe(1);
    expect(out.players.p1.maxMana).toBe(2);
    expect(out.players.p1.canOfferCard).toBe(false);
  });
});

describe('Corcel de Guerra', () => {
  it('estende o movimento do Rei e aparece nos realces da UI', async () => {
    const { getValidMoveCoordinates } = await import('./gameEngine');
    const state = makeState([
      makeUnit({ id: 'k1', unitClass: 'Rei', position: hex(0, 0), equippedArtifacts: ['art_corcel'] }),
    ]);
    const moves = getValidMoveCoordinates(state, 'k1');
    const twoAway = moves.filter(m => Math.abs(m.q) + Math.abs(m.r) + Math.abs(m.s) === 4);
    expect(twoAway.length).toBeGreaterThan(0);
    expect(() => moveTo(state, 'k1', hex(2, 0))).not.toThrow();
  });
});

describe('endTurn', () => {
  it('aplica DoT e mata o Rei do dono do turno declarando o adversário vencedor', () => {
    const state = makeState([
      makeUnit({ id: 'k1', unitClass: 'Rei', hp: 1, buffs: [{ type: 'poison', duration: 2, value: 1 }], position: hex(0, 0) }),
      makeUnit({ id: 'k2', playerId: 'p2', unitClass: 'Rei', position: hex(3, -3) }),
    ]);
    const out = endTurn(state);
    expect(out.currentPhase).toBe('GAME_OVER');
    expect(out.winner).toBe('p2');
  });

  it('recarrega mana e libera as unidades do próximo jogador', () => {
    const state = makeState([makeUnit({ id: 'u2', playerId: 'p2', canMove: false, canAttack: false, position: hex(0, 0) })]);
    state.players.p2 = { ...state.players.p2, mana: 0, maxMana: 3 };
    const out = endTurn(state);
    expect(out.currentTurnPlayerId).toBe('p2');
    expect(out.players.p2.mana).toBe(4);
    expect(out.boardUnits.u2.canMove).toBe(true);
    expect(out.boardUnits.u2.canAttack).toBe(true);
  });
});
