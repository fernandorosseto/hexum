/**
 * Testes das regras de segurança do Firestore (`firestore.rules`).
 *
 * Rodam contra o emulador local — não precisam de credenciais, de projeto real
 * nem do plano Blaze: `npm run test:rules`.
 *
 * O que está sendo garantido aqui é exatamente o que o PvP promete hoje:
 * ninguém de fora da partida lê a sala, e ninguém escreve no lugar de outro.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';

const HOST = 'uid_host';
const GUEST = 'uid_guest';
const STRANGER = 'uid_intruso';

let testEnv: RulesTestEnvironment;

const asHost = () => testEnv.authenticatedContext(HOST).firestore();
const asGuest = () => testEnv.authenticatedContext(GUEST).firestore();
const asStranger = () => testEnv.authenticatedContext(STRANGER).firestore();
const asAnonymousVisitor = () => testEnv.unauthenticatedContext().firestore();

/** Sala em andamento, semeada ignorando as regras. */
async function seedMatch(lobbyId = 'sala1') {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'lobbies', lobbyId), {
      code: 'ABC234',
      hostId: HOST,
      hostName: 'Host',
      guestId: GUEST,
      guestName: 'Guest',
      status: 'in_progress',
      createdAt: new Date(),
      gameState: { turnNumber: 1, players: { p1: { hand: ['spl_meteoro'] } } },
      updatedBy: HOST,
    });
    await setDoc(doc(db, 'lobbyCodes', 'ABC234'), {
      lobbyId, hostName: 'Host', status: 'in_progress',
    });
  });
  return lobbyId;
}

/** Sala aberta esperando adversário. */
async function seedWaitingLobby(lobbyId = 'sala_aberta', code = 'XYZ789') {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'lobbies', lobbyId), {
      code, hostId: HOST, hostName: 'Host',
      guestId: null, guestName: null,
      status: 'waiting', createdAt: new Date(),
      gameState: { turnNumber: 1 }, updatedBy: HOST,
    });
    await setDoc(doc(db, 'lobbyCodes', code), { lobbyId, hostName: 'Host', status: 'waiting' });
  });
  return lobbyId;
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-hexum',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => { await testEnv?.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

describe('lobbies — leitura', () => {
  it('host e convidado leem a própria partida', async () => {
    const id = await seedMatch();
    await assertSucceeds(getDoc(doc(asHost(), 'lobbies', id)));
    await assertSucceeds(getDoc(doc(asGuest(), 'lobbies', id)));
  });

  it('um terceiro NÃO lê a partida dos outros (é aqui que a mão vazava)', async () => {
    const id = await seedMatch();
    await assertFails(getDoc(doc(asStranger(), 'lobbies', id)));
  });

  it('visitante sem autenticação não lê nada', async () => {
    const id = await seedMatch();
    await assertFails(getDoc(doc(asAnonymousVisitor(), 'lobbies', id)));
  });

  it('sala aberta é legível por quem vai ocupar a vaga', async () => {
    const id = await seedWaitingLobby();
    await assertSucceeds(getDoc(doc(asStranger(), 'lobbies', id)));
  });
});

describe('lobbies — escrita', () => {
  it('participante atualiza o estado do jogo', async () => {
    const id = await seedMatch();
    await assertSucceeds(updateDoc(doc(asGuest(), 'lobbies', id), {
      gameState: { turnNumber: 2 }, updatedBy: GUEST,
    }));
  });

  it('terceiro NÃO escreve na partida (não dá para forjar "eu venci")', async () => {
    const id = await seedMatch();
    await assertFails(updateDoc(doc(asStranger(), 'lobbies', id), {
      gameState: { winner: STRANGER }, updatedBy: STRANGER,
    }));
  });

  it('participante não pode trocar quem são os jogadores', async () => {
    const id = await seedMatch();
    await assertFails(updateDoc(doc(asGuest(), 'lobbies', id), { hostId: GUEST }));
    await assertFails(updateDoc(doc(asGuest(), 'lobbies', id), { guestId: STRANGER }));
  });

  it('criar sala exige ser o próprio host, sem convidado e em espera', async () => {
    const base = {
      code: 'QWE234', hostName: 'Host', guestName: null,
      createdAt: new Date(), gameState: { turnNumber: 1 }, updatedBy: HOST,
    };
    await assertSucceeds(setDoc(doc(asHost(), 'lobbies', 'nova'), {
      ...base, hostId: HOST, guestId: null, status: 'waiting',
    }));
    // Criar sala no nome de outro jogador
    await assertFails(setDoc(doc(asStranger(), 'lobbies', 'forjada'), {
      ...base, hostId: HOST, guestId: null, status: 'waiting',
    }));
    // Já começar a partida com um convidado escolhido
    await assertFails(setDoc(doc(asHost(), 'lobbies', 'pre_ocupada'), {
      ...base, hostId: HOST, guestId: GUEST, status: 'in_progress',
    }));
  });

  it('só o host apaga a própria sala', async () => {
    const id = await seedMatch();
    await assertFails(deleteDoc(doc(asGuest(), 'lobbies', id)));
    await assertFails(deleteDoc(doc(asStranger(), 'lobbies', id)));
    await assertSucceeds(deleteDoc(doc(asHost(), 'lobbies', id)));
  });
});

describe('lobbies — entrar por código', () => {
  it('ocupa a vaga vazia com o próprio uid', async () => {
    const id = await seedWaitingLobby();
    await assertSucceeds(updateDoc(doc(asStranger(), 'lobbies', id), {
      guestId: STRANGER, guestName: 'Intruso', status: 'in_progress',
    }));
  });

  it('não dá para entrar colocando o uid de outra pessoa', async () => {
    const id = await seedWaitingLobby();
    await assertFails(updateDoc(doc(asStranger(), 'lobbies', id), {
      guestId: GUEST, guestName: 'Outro', status: 'in_progress',
    }));
  });

  it('não dá para tomar a vaga de uma partida já em andamento', async () => {
    const id = await seedMatch();
    await assertFails(updateDoc(doc(asStranger(), 'lobbies', id), {
      guestId: STRANGER, status: 'in_progress',
    }));
  });

  it('o índice de códigos é legível por qualquer autenticado e não expõe jogo', async () => {
    await seedWaitingLobby();
    await assertSucceeds(getDoc(doc(asStranger(), 'lobbyCodes', 'XYZ789')));
    await assertFails(getDoc(doc(asAnonymousVisitor(), 'lobbyCodes', 'XYZ789')));
  });
});

describe('users', () => {
  it('cada um escreve apenas no próprio perfil', async () => {
    await assertSucceeds(setDoc(doc(asHost(), 'users', HOST), {
      displayName: 'Host', email: '', stats: { wins: 0, losses: 0, draws: 0 },
    }));
    await assertFails(setDoc(doc(asStranger(), 'users', HOST), {
      displayName: 'Invadido', email: '', stats: { wins: 999, losses: 0, draws: 0 },
    }));
  });

  it('perfis são legíveis (ranking) mas não apagáveis', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(), 'users', HOST), { displayName: 'Host', email: '', stats: { wins: 3, losses: 0, draws: 0 } });
    });
    await assertSucceeds(getDoc(doc(asGuest(), 'users', HOST)));
  });
});

describe('matches', () => {
  it('só quem jogou registra a partida', async () => {
    await assertSucceeds(addDoc(collection(asHost(), 'matches'), {
      players: [HOST, GUEST], winner: HOST,
    }));
    await assertFails(addDoc(collection(asStranger(), 'matches'), {
      players: [HOST, GUEST], winner: STRANGER,
    }));
  });
});
