# CLAUDE.md — Hexum

Guia de trabalho no repositório. Leia antes de mexer no código.

> Auditoria completa feita em 2026-09-19 sobre o commit `8c2eb51`; as correções
> foram aplicadas na sequência. A §6 registra o que foi corrigido e a §7 o que
> continua em aberto — e por quê.

---

## 1. O que é o projeto

Jogo de estratégia tática por turnos em tabuleiro hexagonal. Monorepo npm workspaces:

| Pacote | Conteúdo |
| --- | --- |
| `shared/` | Motor de jogo isomórfico em TS puro (regras, hex math, feitiços, artefatos, IA). Sem build próprio — é consumido como fonte. |
| `client/` | SPA Vite + React 19 + Zustand + Framer Motion + Tailwind v4. |

O PvP roda sobre Firebase (Auth anônima + Firestore) **direto do cliente**: não
existe servidor autoritativo. Veja §7 para o que isso implica.

### Comandos (todos a partir da raiz)

```bash
npm install
npm run dev          # servidor de desenvolvimento
npm run build        # tsc -b && vite build
npm run typecheck    # tsc -b
npm run lint         # ESLint — está limpo, mantenha assim
npm test             # testes do motor + do cliente
```

`npm test` roda `shared` e `client`. Para um só: `npm run test:shared` ou
`npm run test:client`.

O jogo roda offline sem configuração nenhuma. Para o PvP, copie
`client/.env.example` para `client/.env` e preencha as credenciais do Firebase.

---

## 2. Arquitetura

```
shared/src/
  types.ts                 GameState, Unit, Buff, PlayerState
  hexMath.ts               coordenadas cúbicas (q,r,s), BOARD_RADIUS = 3, linha de visão
  gameEngine.ts            reducers: createInitialState, moveTo, attack, playCard,
                           heal, convert, offerCard, endTurn, cloneGameState
  unitBehaviors.ts         Strategy por classe (validateMove/validateAttack/applyDamage)
  spellHandlers.ts         SPELL_REGISTRY (11 feitiços)
  artifactHandlers.ts      ARTIFACT_REGISTRY (10 artefatos)
  cardLibrary.ts           UNIT_STATS, ARTIFACTS, SPELLS, descrições i18n
  aiEngine.ts              busca alfa-beta + tabela de transposição + orçamento de tempo
  getValidAttackTargets.ts helper de UI
  testUtils.ts             fábricas de estado/unidade para os testes

client/src/
  store/gameStore.ts       Zustand + persist + subscribeWithSelector
  store/combatActions.ts   wrappers que chamam o motor e agendam animações
  store/sandboxActions.ts  ferramentas do modo Sandbox
  store/animationActions.ts cadeias de setTimeout que aplicam o estado final
  store/actionGuard.ts     invalida callbacks de uma ação já superada
  hooks/useBot.ts          gatilho do turno da IA
  hooks/useMultiplayer.ts  sincronização PvP
  hooks/pvpSync.ts         regra pura de aceitação de snapshot remoto
  hooks/useAuth.ts         convidado (anônimo) ou Firebase, via VITE_AUTH_MODE
  firebase/*               config, auth, firestore
  board/, ui/, units/, animations/
```

**Fluxo:** clique → action do store → função pura do `shared` → `set({...newState})`.

---

## 3. Regras de ouro ao mexer aqui

1. **Regra de jogo muda em `shared/`, nunca no cliente.** O `client/` só orquestra
   chamadas e animações.
2. **Nunca coloque validação só em `getValidAttackTargets` / `getValidMoveCoordinates`.**
   Eles são helpers de UI. A regra tem que existir em `attack()` / `moveTo()` também —
   foi exatamente esse descolamento que fez o Provocar não valer para IA e PvP.
3. **Todo campo novo do `GameState` precisa entrar em `cloneGameState()`**
   (`shared/src/gameEngine.ts`). Quem esquece, perde o campo no primeiro reducer —
   foi o que aconteceu com `language` e matou toda a localização dos logs de combate.
4. **`getUnitCard` lança** para ids que não são de unidade. Use `tryGetUnitCard`
   sempre que o id puder ser de feitiço ou artefato.
5. **Erros de regra são `throw new Error(...)`** no motor e ficam com `console.warn`
   nos wrappers do store. Ao investigar "a ação não fez nada", olhe o console.
6. **Escreva teste em `shared/` ao tocar no motor.** A suíte cobre os bugs já
   corrigidos e é a rede que impede a reincidência.
7. **`npm run lint` está em zero.** Não reabra o débito.

---

## 4. Armadilhas específicas deste código

- **A unidade da busca da IA é a AÇÃO, não o turno.** Um jogador encadeia várias
  ações e só `END_TURN` passa a vez, então a negação do negamax em
  `aiEngine.search()` é **condicional** (`next.currentTurnPlayerId === me`).
  Negar sempre inverte o sinal no meio do turno do próprio jogador — inclusive o
  da vitória.
- **`evaluateState` precisa continuar soma-zero.** Qualquer termo novo tem que ser
  calculado para os dois lados dentro de `calculateSideValue`. Há teste para isso.
- **Animações aplicam o estado final dentro de `setTimeout`.** Toda ação que agenda
  animação passa por `beginAction()` (`store/actionGuard.ts`) e marca `isResolving`,
  senão um clique no meio da janela é desfeito quando o timer antigo dispara.
- **Sandbox relaxa regras montando um estado temporário** nos wrappers
  (`combatActions`), não no motor. O motor só conhece a flag `sandboxMode`.
- **`Mago` é apelido de `Alquimista`** — mesmo `UnitBehavior`, e `getUnitCard`
  mapeia os dois para `unit_alquimista`. Não existe unidade `Mago` invocável.

---

## 5. Fonte da verdade

O código é a especificação. Os documentos foram alinhados a ele nesta auditoria:

- **Stats de unidade:** `UNIT_STATS` em `shared/src/cardLibrary.ts`.
- **Tamanho do tabuleiro:** `BOARD_RADIUS` em `shared/src/hexMath.ts` (3).
- **Regras e cartas:** [`GDD_Mecanicas.md`](./GDD_Mecanicas.md).
- **Arquitetura:** [`TDD_Arquitetura.md`](./TDD_Arquitetura.md).
- **O que falta:** [`Plano_Implementacao.md`](./Plano_Implementacao.md).

---

## 6. O que a auditoria encontrou e corrigiu

Registro do que estava quebrado, para não regredir. Cada item tem teste.

### Motor (`shared/`)

| Problema | Correção |
| --- | --- |
| `cloneGameState` não copiava `language`, então dentro de todo reducer ele era `undefined` — os ~40 textos PT do log de combate eram código morto | o clone copia o campo |
| `hasAnyValidAction` chamava `getUnitCard(cardId) \|\| …`, que **lança** para `art_*`/`spl_*`; o bloco rodava quase todo turno e matava o auto-pass | `tryGetUnitCard` + remoção do bloco de sacrifício, que além disso supunha que `offerCard` dava mana no mesmo turno |
| `playCard` era o único reducer sem checagem de turno | valida `currentTurnPlayerId` |
| Rei morto pelo próprio meteoro dava a vitória a quem conjurou | `cleanupDeaths`, que sempre premia o adversário do Rei que caiu |
| `heal()` não validava dono, classe, turno nem enjoo — um Clérigo do p2 curava unidade do p1 no turno do p1 | validação completa |
| Provocar existia só no helper de UI; `attack()` ignorava | `assertTauntRespected` no motor |
| Coroa do Regente calculava raio 2, mas o ataque checava `dist === 1` | usa o raio de `getFearStatus` |
| Arqueiro e Alquimista atiravam através de paredes e unidades | exigem linha de visão, como o Lanceiro |
| Adagas Envenenadas furavam até `invulnerable` | furam Escudo (dano real, por design), não Invulnerabilidade |
| `isValidMovePosition` divergia de `validateMove`: o Corcel sumia dos realces de Rei e Lanceiro | ambos por `maxMoveDistFor` |
| Artefatos empilhavam sem limite (3× Lâmina = +6 de ataque) | sem repetição, máx. `MAX_ARTIFACTS_PER_UNIT` |
| `sort(() => 0.5 - Math.random())` e ids de 5 caracteres | Fisher-Yates e ids por contador |
| Log do medo acumulava entre turnos | `combatLogs` limpo antes da checagem |

### IA (`shared/src/aiEngine.ts`)

A busca não era "imprecisa": era estruturalmente inválida.

- `getPossibleActions`/`simulateAction` **nunca trocavam o turno**. As jogadas do
  oponente lançavam "not your turn", viravam `null`, e o nó devolvia `-Infinity` →
  `+Infinity` no pai. **Toda jogada parecia vencedora.** → ação `END_TURN` + negação
  condicional.
- `evaluateState` **não era soma-zero** (o bônus de influência só era somado para um
  lado): medido `eval(p1) = eval(p2) = 920`. → termo movido para dentro de
  `calculateSideValue`.
- Hash Zobrist só via posição/dono/classe: HP, buffs, mana e mão colidiam na tabela
  de transposição, que ainda era um `Map` global entre partidas, com flag calculada
  depois de `alpha` ser mutado. → chave completa, escopo por busca, flag contra o
  `alpha` original.
- `HEAL` era um tipo de ação que nunca era gerado — o Clérigo era inútil para a IA.
- Null-move pruning passava a vez sem `endTurn` (estado inconsistente) e sem guarda
  de zugzwang. → removido.
- Acrescentado aprofundamento iterativo com orçamento de tempo.

### Cliente

| Problema | Correção |
| --- | --- |
| Dois laços de IA independentes (`useBot` + agendamento de `triggerEndTurn`), cada um com seu guard | `useBot` virou gatilho fino para `runAiTurn`, guard único |
| `runAiTurn` girava para sempre se o motor recusasse uma ação (os wrappers engolem o erro) | limite de ações, deadline e detecção de ação sem efeito |
| `surrender()` dava a vitória a quem desistia no modo solo (`myRole` é `null` fora do PvP) | usa o jogador local |
| `GameOverUI` fixava `winner === 'p1'`: no PvP, quem vencia como convidado via "Derrota" | calcula pelo papel local |
| Fim de partida no PvP expulsava os dois jogadores para o menu antes da tela de resultado | mantém a tela; só volta ao menu quando a sala fecha sem fim de jogo local |
| `decrementTimer` nunca era chamado: o cronômetro ficava congelado em 60s | tick real; ao zerar passa o turno no PvP e apenas para no solo |
| `persist` guardava `currentView`, `lobbyId`, `myRole`, `isPvP`…: um reload reabria sessão PvP morta | persiste só a partida |
| Estado final da animação sobrescrevia ações feitas durante a janela | `actionGuard` + `isResolving` |
| Unidades do Sandbox nasciam sem `abilityCooldown` (especial sempre disponível) | descoberto ao tipar o store; corrigido |
| `HexMap` montava um `GameState` falso com `as any`, sem `players` nem `sandboxMode` | estado de preview derivado do estado real |

### PvP, autenticação e infraestrutura

| Problema | Correção |
| --- | --- |
| `useAuth` era um mock: uid gerado no initializer do `useState` (diferente por instância do hook e a cada reload) e todo o código de login inalcançável | Auth anônima do Firebase (sem tela de login) + `VITE_AUTH_MODE=firebase` para ligar contas |
| Nenhuma regra de segurança versionada | `firestore.rules`, `firebase.json`, `firestore.indexes.json` |
| Entrar por código lia as 20 salas mais recentes e filtrava no cliente — salas antigas inacessíveis, sem transação, e todo mundo lia partidas alheias | índice `lobbyCodes/{CODE}` + transação; leitura da sala restrita aos participantes |
| `saveMatchResult` escrevia nas estatísticas dos dois jogadores | só o placar do jogador local |
| `initializeApp` não lança com credenciais `undefined`, então o `try/catch` "offline" nunca protegeu nada | validação explícita das variáveis |
| Snapshot remoto era aplicado sem validação | `shouldAcceptRemoteState` recusa escrita fora do turno e estado que volta no tempo |
| `npm run dev` na raiz não existia (o README mandava usar) | scripts na raiz |
| Testes do cliente sem script que os rodasse; `shared/` sem nenhum teste | scripts + suíte de regressão |
| 153 erros de ESLint | zero |
| Sem CI | `.github/workflows/ci.yml` |
| Dois testes de PvP tautológicos (chegavam a afirmar `JSON.stringify(x) === JSON.stringify(x)`) | substituídos por testes da lógica real extraída |
| Bundle único de 868 kB, com o aviso apenas silenciado | code-splitting por vendor (app: 197 kB) |
| Lixo versionado na raiz (`mech*.txt`, `sprite*.txt`, `test_ai*.ts`, `ai_tournament_results.json`) e 4 imagens sem referência | removidos; a cobertura dos scripts virou `selfPlay.test.ts` |

---

## 7. Dívidas em aberto (conhecidas e deliberadas)

1. **Sem servidor autoritativo.** O cliente resolve a própria jogada e publica o
   `GameState`. As regras do Firestore e a validação de snapshot reduzem a
   superfície, mas **o adversário ainda enxerga sua mão e seu baralho**: o estado
   mora num documento único e o Firestore autoriza por documento, não por campo.
   Só um servidor (Cloud Functions ou Node) resolve — e é o mesmo trabalho que
   torna o ranking confiável.
2. **Sem regra de fim por baralho.** Não existe fadiga, derrota por deck vazio nem
   limite de mão; uma partida em que ninguém alcança o Rei pode não terminar.
   É decisão de design, não bug — por isso não foi inventada uma regra.
3. **Assets pesados.** `hexum.png` (8,9 MB) e `muralha_gelo.png` (6,4 MB)
   respondem pela maior parte dos ~19 MB do `dist/`. Reexportar em WebP/AVIF na
   resolução real de uso é a maior economia disponível — não foi feito porque
   mexe em arte.
4. **Efeitos probabilísticos quase invisíveis.** `checkEffectTrigger` devolve
   `(1 + roundsInField) / 100` — 1% no turno de invocação. É a chance de Atordoar
   do Cavaleiro e do Arqueiro, de Empurrar do Lanceiro, do Escudo Sagrado e da
   Conversão do Clérigo. A "Chamado da Fé", habilidade-assinatura do Clérigo,
   falha ~97% das vezes e consome a ação. Números de balanceamento foram mantidos
   como estão por decisão do dono do projeto.
5. **PvP não foi testado ponta a ponta** contra um Firestore real (não há
   credenciais neste ambiente). A lógica pura está coberta por testes; o caminho de
   rede, não.
