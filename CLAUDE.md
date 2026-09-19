# CLAUDE.md — Hexum

Guia de trabalho e **relatório de falhas** do repositório. Leia antes de mexer no código.

> Auditoria completa em 2026-09-19 sobre o commit `8c2eb51`. Os achados marcados com
> **[verificado]** foram reproduzidos executando o motor via Vitest; os demais vêm de
> leitura de código e estão com referência `arquivo:linha`.

---

## 1. O que é o projeto

Jogo de estratégia tática por turnos em tabuleiro hexagonal. Monorepo npm workspaces:

| Pacote | Conteúdo |
| --- | --- |
| `shared/` | Motor de jogo isomórfico em TS puro (regras, hex math, feitiços, artefatos, IA). Sem build próprio — é consumido como fonte. |
| `client/` | SPA Vite + React 19 + Zustand + Framer Motion + **Tailwind v4**. |

Sem pasta `server/`. O multiplayer é **Firebase/Firestore direto do cliente** (não há
servidor autoritativo).

### Comandos que realmente funcionam

```bash
npm install            # na raiz (workspaces)
cd client && npm run dev      # dev server
cd client && npm run build    # tsc -b && vite build  -> OK hoje
cd client && npx vitest run   # 13 testes, todos passam
cd client && npm run lint     # FALHA: 153 erros + 5 warnings
```

⚠️ **`npm run dev` na raiz NÃO existe** — o `package.json` da raiz não tem bloco
`scripts`. O README documenta esse comando e ele quebra. **[verificado]**

⚠️ `client/package.json` não tem script `test`. `shared/package.json` tem `"test": "vitest"`
mas o `shared/` **não possui nenhum arquivo de teste** (e `shared/tests/` está no
`.gitignore`). O motor — parte mais complexa do projeto — tem **0% de cobertura**.

---

## 2. Arquitetura (como está de fato)

```
shared/src/
  types.ts                 GameState, Unit, Buff, PlayerState
  hexMath.ts               coordenadas cúbicas (q,r,s), BOARD_RADIUS = 3, LoS
  gameEngine.ts            reducers: createInitialState, moveTo, attack, playCard,
                           heal, convert, offerCard, endTurn, cloneGameState
  unitBehaviors.ts         Strategy por classe (validateMove/validateAttack/applyDamage)
  spellHandlers.ts         SPELL_REGISTRY (11 feitiços)
  artifactHandlers.ts      ARTIFACT_REGISTRY (10 artefatos)
  cardLibrary.ts           UNIT_STATS, ARTIFACTS, SPELLS, descrições i18n
  aiEngine.ts              Negamax + quiescence + null-move + Zobrist/TT
  getValidAttackTargets.ts helper de UI

client/src/
  store/gameStore.ts       Zustand + persist + subscribeWithSelector
  store/combatActions.ts   wrappers que chamam o motor e agendam animações
  store/sandboxActions.ts  ferramentas do modo Sandbox
  store/animationActions.ts cadeias de setTimeout que aplicam o estado final
  hooks/useBot.ts          driver de IA #1
  hooks/useMultiplayer.ts  sincronização PvP via Firestore
  hooks/useAuth.ts         MOCK — sempre devolve um usuário fake
  firebase/*               config, auth, firestore
  board/, ui/, units/, animations/
```

**Fluxo:** clique → action do store → função pura do `shared` → `set({...newState})`.
Erros de regra são lançados como `Error` pelo motor e **silenciados** com
`console.warn` nos wrappers do store.

---

## 3. FALHAS — Críticas

### C1. `cloneGameState` descarta `language` → toda a localização de combate é código morto **[verificado]**
`shared/src/gameEngine.ts:211-241`

O clone reconstrói o `GameState` campo a campo e **não copia `language`**. Como todo
reducer começa com `const newState = cloneGameState(state)`, dentro de
`attack()`/`moveTo()`/etc. `state.language` é sempre `undefined`. Consequência:
`addCombatLog(state, en, pt)` (`unitBehaviors.ts:117-121`) sempre escolhe o inglês, e as
mensagens de erro ternárias (`gameEngine.ts:332, 368, 429, 448, 616`) idem. Os ~40 textos
em português do log de combate nunca são exibidos.

### C2. `hasAnyValidAction` lança exceção em quase todo turno → auto-pass morto **[verificado]**
`shared/src/gameEngine.ts:682`

```ts
const card = getUnitCard(cardId) || ARTIFACTS.find(...) || SPELLS.find(...)
```
`getUnitCard` **lança** `Error("Unidade não encontrada: ...")` para ids `art_*`/`spl_*`
em vez de devolver `undefined` (`cardLibrary.ts:167-169`), então o `||` nunca roda. O
bloco é alcançado sempre que `canOfferCard && hand.length > 1` — ou seja, praticamente
todo turno. Resultado: o sistema de auto-pass (`combatActions.ts:13-29` e
`gameStore.ts:356`) nunca funciona e o console enche de `Erro de Regra`. O `throw`
dentro do `setTimeout` de `checkAutoPass` (`combatActions.ts:21-27`) nem sequer está
protegido por try/catch.

### C3. `playCard` não valida de quem é o turno **[verificado]**
`shared/src/gameEngine.ts:490-574`

`moveTo`, `attack`, `convert` e `offerCard` checam `currentTurnPlayerId`; `playCard`
não. Qualquer jogador pode invocar unidades, equipar artefatos e conjurar feitiços fora
do seu turno. Em PvP (onde o cliente é a autoridade — ver C7) isso é exploração direta.

### C4. Rei morto pelo próprio feitiço dá a vitória a quem conjurou **[verificado]**
`shared/src/gameEngine.ts:545-548`

```ts
if (newState.boardUnits[uId].unitClass === 'Rei' && !newState.sandboxMode) {
  newState.currentPhase = 'GAME_OVER';
  newState.winner = playerId;          // <- sempre o conjurador
}
```
Chuva de Meteoros / Cadeia de Relâmpagos que matem o **próprio** Rei declaram o
conjurador vencedor. `handleUnitDeath` (`unitBehaviors.ts:123-132`) faz isso certo
(`unit.playerId === 'p1' ? 'p2' : 'p1'`); esse bloco duplicado em `playCard` está errado.

### C5. O motor de IA não consegue simular respostas do oponente **[verificado]**
`shared/src/aiEngine.ts:170-225` e `322-331`

`getPossibleActions`/`simulateAction` **nunca chamam `endTurn` nem trocam
`currentTurnPlayerId`**. O `negamax` alterna apenas a variável local `pId`. Quando a
busca desce um ply, `moveTo`/`attack` do oponente lançam `"Invalid unit or not your
turn."`, `simulateAction` devolve `null`, todos os ramos são pulados e o nó retorna
`best = -Infinity` — que vira `+Infinity` no pai. Toda jogada parece vencedora e a busca
em profundidade 3 é ruído. Efeitos colaterais:
- A única exceção é `playCard`, que não checa turno (C3) — então o oponente "responde"
  apenas jogando cartas, tornando a avaliação incoerente.
- `quiesce` (`aiEngine.ts:227-257`) sofre do mesmo problema em plies ímpares.

### C6. A função de avaliação não é soma-zero → negamax inválido **[verificado]**
`shared/src/aiEngine.ts:59-85`

```
eval(p1) = 920   eval(p2) = 920   soma = 1840   (deveria ser 0)
```
`calculateInfluenceBonus` é somado só para `playerId` e nunca subtraído do oponente. O
negamax exige `eval(s, A) === -eval(s, B)`. Além disso `calculateInfluenceBonus:80` usa
`(5 - row)`/`(5 + row)`, números mágicos de um tabuleiro raio 5 que não existe mais
(`BOARD_RADIUS = 3`).

### C7. PvP: o cliente é a autoridade e escreve o estado inteiro
`client/src/firebase/firestore.ts:220-226`, `client/src/hooks/useMultiplayer.ts:87-114`

`pushGameState` grava o `GameState` completo no documento do lobby, e o listener aplica
o que chegar sem nenhuma validação (`useMultiplayer.ts:54-74`). Qualquer cliente pode
escrever `{ winner: 'p2', currentPhase: 'GAME_OVER' }` ou se dar 99 de mana. Não existe
`firestore.rules`, `firebase.json` nem Cloud Function no repositório — o banco depende de
regras configuradas fora do versionamento (provavelmente em modo teste).

### C8. PvP vaza informação oculta
`client/src/firebase/firestore.ts:136-145`

`LobbyDoc.gameState` contém `players.p1.hand`, `players.p1.deck`, `players.p2.hand` e
`players.p2.deck`. Ambos os jogadores leem o documento inteiro → **a mão e o baralho do
adversário são públicos**. Combinado com `joinLobbyByCode` (que lê os 20 lobbies mais
recentes sem filtro), qualquer usuário consegue ler partidas de terceiros.

### C9. `useAuth` é um mock — autenticação inteira é código morto
`client/src/hooks/useAuth.ts:20-28`

```ts
// ── MOCK FOR GAME JAM: Skip login screen ──
const [mockUser] = useState(() => ({ uid: 'guest_' + Math.random()... }));
return { user: mockUser, loading: false };
```
Consequências:
- `LoginPage`, `AuthModal`, `registerWithEmail`, `loginWithEmail`, `loginWithGoogle`,
  `subscribeAuthState`, `createUserProfile`, `getUserProfile`, `getTopPlayers` e
  `saveMatchResult` **nunca são executados** (`App.tsx:55` nunca cai no `!user`).
- O `uid` é gerado no initializer do `useState`, ou seja, **por instância do hook**:
  `App.tsx` e `useMultiplayer` produzem uids diferentes na mesma sessão, e um reload gera
  outro. Nenhum perfil/estatística é rastreável.
- Todas as escritas no Firestore acontecem sem usuário autenticado.

---

## 4. FALHAS — Altas

### A1. Dois (às vezes três) drivers de IA concorrentes
`client/src/hooks/useBot.ts:17-25` + `client/src/store/gameStore.ts:354-355`

`triggerEndTurn` agenda `runAiTurn()` quando `isVsAI && turno === 'p2'`, **e** o
`useEffect` de `useBot` dispara `processBotTurn()` na mesma transição. Os guards são
independentes (`isAiThinking` no store vs `isThinking` ref local), então os dois laços
rodam sobre o mesmo estado e a IA joga duas vezes / se atropela. `<StrictMode>`
(`main.tsx:7`) duplica o efeito em dev, piorando o quadro.

### A2. `runAiTurn` pode entrar em laço infinito
`client/src/store/gameStore.ts:380-412`

O `while` só termina quando o estado muda. Mas `attemptMove`/`attemptAttack` engolem
erros do motor (`combatActions.ts:75, 159`) e não alteram nada. Basta a IA escolher uma
ação que o wrapper rejeite — por exemplo porque `selectedAbility` do humano ainda está
setado e `finalUseSpecial = useSpecial || !!selectedAbility` (`combatActions.ts:53, 89`)
transforma um MOVE normal em especial inválido — para travar a aba. `useBot` tem
guard-rails (máx. 15 ações / 8 s), `runAiTurn` não tem nenhum.

### A3. `heal()` sem validação de dono, classe, turno ou enjoo **[verificado]**
`shared/src/gameEngine.ts:580-598`

Só checa `healer.canAttack`. Não valida `healer.unitClass === 'Clerigo'`,
`healer.playerId === currentTurnPlayerId`, `target.playerId === healer.playerId` nem
`summoningSickness`. Verificado: um Clérigo do **p2** curou uma unidade do **p1** durante
o turno do p1. Também faz `healer.canAttack` sem checar se `healer`/`target` existem →
`TypeError` se o id for inválido. Compare com `convert()` (linhas 600-625), que valida
tudo corretamente.

### A4. Provocar (Taunt) não é aplicado pelo motor **[verificado]**
`shared/src/getValidAttackTargets.ts:51-62` vs `shared/src/gameEngine.ts:422-484`

A restrição de taunt existe **só no helper de UI**. `attack()` não a consulta. Verificado:
com um inimigo em Provocar adjacente, o Arqueiro atacou livremente um alvo atrás. A IA e
o PvP ignoram completamente o Estandarte da Coragem.

### A5. O raio 2 da Coroa do Regente nunca tem efeito
`shared/src/gameEngine.ts:462` vs `shared/src/gameEngine.ts:649-659`

`getFearStatus` calcula `fearRadius = coroa ? 2 : 1`, mas o chamador exige
`fearInfo.inRange && dist === 1`. O artefato de 3 de mana entrega, na prática, só os
+3 de HP máximo — metade do que a carta promete.

### A6. `offerCard` e `hasAnyValidAction` discordam sobre mana **[verificado]**
`shared/src/gameEngine.ts:640` vs `:676`

`offerCard` aumenta apenas `maxMana` (a mana atual só sobe no próximo `endTurn`), mas
`hasAnyValidAction` assume `manaAfterSacrifice = player.mana + 1`. Verificado: mana antes
1, depois 1, maxMana 2. O auto-pass (quando não estiver quebrado por C2) conclui que
sacrificar habilita cartas que continuam impagáveis neste turno.

### A7. Arqueiro e Alquimista atiram através de paredes e unidades **[verificado]**
`shared/src/unitBehaviors.ts:313-315` e `415-417`

`validateAttack` só checa distância. `checkTrajectory` existe (`:25-35`) e é usado apenas
pelo Lanceiro (`:277`). Verificado: Arqueiro em `(-2,0,2)` acertou alvo em `(1,0,-1)` com
uma Muralha de Gelo de 6 HP no caminho. Isso anula o valor tático de `spl_muralha` e o
`isPathBlocked` exportado fica praticamente sem uso.

### A8. Dano das Adagas Envenenadas ignora até `invulnerable`
`shared/src/unitBehaviors.ts:37-45`

`applyArtifactDamageEffects` faz `target.hp -= 1` cru, fora de `applyFinalDamage`. Furar
escudo é intencional (o GDD define "Dano Real"), mas furar `invulnerable` — que
`applyFinalDamage:52-55` trata como negação total — não é. Uma unidade com Amuleto da
Ilusão toma dano de qualquer atacante com Adagas.

### A9. Fim de jogo no PvP: os dois jogadores são expulsos para o menu
`client/src/hooks/useMultiplayer.ts:41-47` + `:166-169`

Ao entrar em `GAME_OVER` o cliente chama `closeLobby`; o snapshot com
`status === 'finished'` chega nos dois clientes, que rodam `clearLobbySession()` +
`setCurrentView('MENU')`. A tela de `GameOverUI` — que ainda espera 2 s antes de aparecer
(`GameOverUI.tsx:17-21`) — nunca é vista.

### A10. `GameOverUI` assume que o jogador humano é sempre `p1`
`client/src/ui/GameOverUI.tsx:36`

```ts
const isVictory = winner === 'p1';
```
No PvP o convidado joga como `p2`: ao vencer, vê a tela de derrota.

### A11. `surrender()` premia quem desiste no modo solo **[verificado]**
`client/src/store/gameStore.ts:266-280`

```ts
const opponentId = state.myRole === 'p1' ? 'p2' : 'p1';
```
Fora do PvP `myRole` é `null`, então `opponentId` vira `'p1'` — o humano. Verificado:
desistir como p1 contra a IA define `winner = 'p1'`. A função também não sincroniza a
rendição para o oponente no PvP.

---

## 5. FALHAS — Médias

### M1. `persist` guarda o estado de navegação e de lobby
`client/src/store/gameStore.ts:435-466`

O `partialize` remove só animações/seleção. Continuam persistidos `currentView`,
`lobbyId`, `lobbyCode`, `myRole`, `isPvP`, `isMatchStarted`, `logs`, `turnTimer` e
`isTimerRunning`. Recarregar a página reabre uma sessão PvP morta apontando para um
lobby inexistente. O objeto também carrega todas as *actions* (funções) para o
`JSON.stringify`.

### M2. Timer de turno é puramente decorativo
`client/src/store/gameStore.ts:220-225`

`decrementTimer` **não é chamado em lugar nenhum** do código. O HUD
(`BattleHUD.tsx:154-156, 230-236`) mostra eternamente "⏳ 60s" e a barra em 100%. Também
não há nenhuma consequência ao chegar a zero.

### M3. Tabela de transposição ignora quase todo o estado
`shared/src/aiEngine.ts:30-45`

O hash Zobrist usa apenas `(posição, dono, classe)`. **HP, buffs, mana, mão, cooldowns,
artefatos e número do turno ficam de fora** → posições materialmente diferentes colidem e
a IA reaproveita scores errados. Agravantes: a `TRANSPOSITION_TABLE` é um `Map` global de
módulo (`:57`), nunca limpo entre partidas (só em `size > 200000`, `:145`), e o flag
EXACT/UPPER/LOWER é calculado **depois** de `alpha` ter sido mutado no laço (`:219-222`),
o que rotula quase tudo como `UPPER`.

### M4. A IA nunca cura
`shared/src/aiEngine.ts:259-320`

`AIAction` define `{ type: 'HEAL' }` e `simulateAction` o trata (`:328`), mas
`getPossibleActions` nunca gera essa ação. O Clérigo, unidade de 3 de mana com a maior
nota de classe depois do Assassino (`classWeights`, `:101-103`), é inútil nas mãos da IA.

### M5. Null-move pruning sem proteção de zugzwang
`shared/src/aiEngine.ts:184-189`

O "passe" é feito trocando `currentTurnPlayerId` diretamente, sem rodar `endTurn` (sem
mana, sem compra, sem DoT, sem reset de `canMove/canAttack`). O estado resultante é
inconsistente e a redução `depth - 3` é agressiva demais para uma árvore já quebrada
por C5.

### M6. Divergências entre `validateMove` e `isValidMovePosition`
`shared/src/unitBehaviors.ts`

| Classe | `validateMove` | `isValidMovePosition` (usada pelos realces da UI) |
| --- | --- | --- |
| Rei (`:153-159`) | `dist > maxMoveDist` (2 com Corcel) | `dist === 1` fixo |
| Lanceiro (`:260-271`) | até `maxMoveDist` (2 com Corcel) | `dist === 1` fixo |
| Cavaleiro (`:193-199`) | `maxMoveDist` do chamador | recalcula `2 + bonus` por conta própria |

A UI mostra menos casas do que o motor aceita (Corcel de Guerra some visualmente para Rei
e Lanceiro) e a lógica do Cavaleiro está duplicada em dois lugares.

### M7. `Mago` é um alias de `Alquimista`; `Estrutura.applyDamage` é inalcançável
`shared/src/unitBehaviors.ts:503` e `:478-490`

`Mago: AlquimistaBehavior` — as duas classes são idênticas apesar do README anunciá-las
separadamente. `EstruturaBehavior.validateAttack` sempre lança, então o `applyDamage`
logo abaixo nunca executa (é código morto). `handleUnitDeath` também recebe
`killerPlayerId` e nunca o usa (`:123`).

### M8. Artefatos empilham sem limite **[verificado]**
`shared/src/gameEngine.ts:554-566`

Nenhuma checagem de duplicata nem de quantidade máxima. Verificado: 3× Lâmina do Carrasco
na mesma unidade → ataque 2 → 8. Nada impede 3× Escudo de Carvalho ou 3× Coroa. O alvo
também não é validado contra `getValidSpawnCoordinates` (só contra "existe unidade no
hex"), diferente do caminho de feitiço (`:531-536`).

### M9. Sem regra de deck-out, sem limite de mão → partidas infinitas **[verificado]**
`shared/src/gameEngine.ts:182-188`

`drawCard` é um no-op quando o deck acaba; não há fadiga, derrota por deck vazio nem
descarte por limite de mão. Verificado: após 60 turnos o deck está em 0, a mão em **20
cartas** e a partida segue em `MAIN_PHASE`. Com o timer inoperante (M2), nada força o fim.

### M10. Embaralhamento enviesado e ids com risco de colisão
`shared/src/gameEngine.ts:157-163, 120, 169, 520`

`sort(() => 0.5 - Math.random())` não é um embaralhamento uniforme (use Fisher-Yates).
Ids de unidade usam `Math.random().toString(36).substr(2, 5)` — 5 caracteres, sem
verificação de colisão, e `substr` está deprecado (aparece 6× no repo).

### M11. Corrida entre animações e estado
`client/src/store/combatActions.ts:377-392`, `client/src/store/animationActions.ts`

Cartas com animação aplicam um `newState` **pré-calculado** dentro de um `setTimeout` de
800-1000 ms. Qualquer ação do jogador nessa janela é sobrescrita ao fim do timer. O mesmo
padrão aparece em `attemptAttack`, que **ressuscita** o alvo morto
(`combatActions.ts:114-116`) para animar e conta com um segundo timer para removê-lo — se
o componente desmontar ou o estado for trocado no meio, sobra uma unidade com 0 HP no
tabuleiro. `sandboxPlayCard` (`sandboxActions.ts:79-88`) restaura a mana num `finally`
síncrono que roda **antes** do timer da animação, e depois é clobberada de volta.

### M12. `joinLobbyByCode` só enxerga os 20 lobbies mais recentes e não é transacional
`client/src/firebase/firestore.ts:177-200`

```ts
const q = query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(20));
const match = snap.docs.find(d => d.data().code === code.toUpperCase() && ...);
```
Filtragem no cliente em vez de `where('code', '==', code)`: com mais de 20 salas criadas
depois da sua, o código simplesmente "não é encontrado". Sem transação, dois convidados
podem entrar na mesma sala. O código de 6 caracteres é gerado por `Math.random()` sem
verificação de unicidade, e lobbies nunca são apagados (sem TTL).

### M13. `saveMatchResult` escreve estatísticas de outros usuários pelo cliente
`client/src/firebase/firestore.ts:89-113`

`updateDoc(users/{uid}, { 'stats.wins': increment(1) })` direto do navegador — inflar
vitórias é trivial. Os `await` são sequenciais (sem `writeBatch`), então uma falha no meio
deixa estatísticas parciais. Hoje a função é inalcançável por causa de C9, mas o desenho
precisa ir para uma Cloud Function antes de ser ligada.

### M14. `initializeApp` não falha sem credenciais — o fallback "offline" é ilusório
`client/src/firebase/firebaseConfig.ts:27-33`

O `try/catch` supõe que `initializeApp({ apiKey: undefined })` lance, o que não acontece.
`auth` e `db` ficam não-nulos e as guardas `if (!db) return` de todo o `firestore.ts`
nunca disparam; o erro só aparece depois, como falha de rede em runtime. Não existe
`.env.example` documentando as seis variáveis `VITE_FIREBASE_*`.

---

## 6. FALHAS — Baixas / Qualidade

- **Lint quebrado:** 153 erros e 5 warnings (`no-explicit-any`, `no-unused-vars`,
  `no-empty`, `react-hooks/exhaustive-deps`). Há 58 ocorrências de `any`/`as any` no
  código de produção; todo o `store/` é tipado como `(set: any, get: any)`.
- **Sem CI:** não existe `.github/`. Nada impede um merge com lint vermelho.
- **Import profundo furando o pacote:** `gameStore.ts:4` faz
  `import { getBestAction } from 'shared/src/aiEngine'` enquanto o resto do arquivo usa
  `from 'shared'`. `useBot.ts:3` importa o mesmo símbolo pelo barrel. Depende do alias do
  Vite e do `paths` do tsconfig; quebra se `shared` ganhar um `exports` no package.json.
- **Assets gigantes:** `dist/` tem **19 MB**. `hexum.png` 8,9 MB, `muralha_gelo.png`
  6,4 MB, `muralha_telo.png` 5,9 MB, `king.png` 3,4 MB — PNGs não otimizados e sem
  WebP/AVIF. O bundle JS é um chunk único de 868 KB (260 KB gz), e
  `vite.config.ts` apenas **esconde** o aviso com `chunkSizeWarningLimit: 2000` em vez de
  fazer code-splitting.
- **Estado de UI falso no `HexMap`:** `HexMap.tsx:100, 111` montam
  `{ boardUnits, currentTurnPlayerId, currentPhase } as any` como `GameState` — sem
  `players` nem `sandboxMode`. Qualquer regra futura que leia esses campos quebra em
  silêncio.
- **Unidade do Sandbox sem `abilityCooldown`:** `sandboxActions.ts:11-26` cria o objeto
  sem o campo obrigatório (passa por causa do `any`), então especiais ficam sempre
  disponíveis para unidades invocadas no Sandbox.
- **`attemptHeal` e `healUnit` são duplicatas** (`combatActions.ts:165` e `:437`) com
  logs ligeiramente diferentes; ambas expostas no store.
- **Log de medo acumula:** o ramo de Aura de Medo (`gameEngine.ts:462-472`) empurra no
  `combatLogs` herdado do clone e retorna antes do `newState.combatLogs = []` da linha
  475 — as mensagens se acumulam entre turnos.
- **Lixo versionado na raiz:** `mech.txt`, `mech2.txt`, `mech2_utf8.txt`, `mech3.txt`,
  `mech3_utf8.txt`, `sprite.txt`, `sprite4.txt`, `sprite_utf8.txt`, `sprite4_utf8.txt`,
  `test_ai.ts`, `test_ai_sim.ts`, `ai_tournament_results.json` (14 KB de resultado de
  torneio). `test_ai*.ts` não são testes Vitest e não rodam por nenhum script.
- **`index.html` com `lang="en"`** numa UI cujo padrão é `pt` quando
  `navigator.language` começa com "pt" (`gameStore.ts:114`).
- **`spl_reforcos` não confere com a própria descrição:** o card diz "adiciona 2 cartas
  de Lanceiro ao deck e à mão" (`cardLibrary.ts:125`) e o handler adiciona **1** a cada
  (`spellHandlers.ts:165-171`). Também é o único feitiço sem alvo, mas cai no
  `getAllHexes` genérico (`gameEngine.ts:84`) e aceita qualquer hex.
- **Fogo amigo não documentado:** `ChuvaDeMeteoros` (`spellHandlers.ts:120-137`) e o
  splash do Alquimista (`unitBehaviors.ts:418-446`) acertam aliados — e o Alquimista pode
  se acertar quando ataca a 1 hex. O GDD não menciona isso em nenhum dos dois.
- **Testes tautológicos:** `hooks/multiplayer.test.ts` e `hooks/sync.test.ts`
  **reimplementam** a lógica dentro do próprio teste em vez de importar
  `useMultiplayer`. O caso 1 verifica literalmente
  `JSON.stringify(x) !== JSON.stringify(x) === false`. Cobertura real do hook: zero.
- **Números mágicos de proc:** `checkEffectTrigger` (`unitBehaviors.ts:20-23`) devolve
  `(1 + roundsInField) / 100` — **1%** no turno de invocação. É a chance de Atordoar do
  Cavaleiro/Arqueiro, de Empurrar do Lanceiro, do Escudo Sagrado do Clérigo **e** da
  Conversão (`gameEngine.ts:618`). A "Chamado da Fé", habilidade-assinatura do Clérigo,
  falha ~97% das vezes e consome a ação mesmo assim. As identidades de classe anunciadas
  no README são, estatisticamente, invisíveis.

---

## 7. Documentação divergente do código

O `GDD_Mecanicas.md`, o `TDD_Arquitetura.md`, o `Plano_Implementacao.md` e o `README.md`
descrevem um jogo diferente do implementado. **Não trate esses arquivos como
especificação sem conferir o código.**

### Tabuleiro e posicionamento
| Assunto | Documento | Código |
| --- | --- | --- |
| Raio do tabuleiro | GDD: **5** | `hexMath.ts:7`: **3** (o teste `HexUtils.test.ts:24` fala em "Raio GDD 4" — três valores diferentes) |
| Invocação | GDD: duas fileiras iniciais **ou** adjacente ao Rei | `gameEngine.ts:513`: **só** adjacente ao Rei |

### Stats das unidades (GDD §2.3 × `cardLibrary.ts:34-42`)
| Unidade | GDD (mana/ATK/HP) | Código (mana/ATK/HP) |
| --- | --- | --- |
| Cavaleiro | 2 / 3 / 5 | **4** / 3 / 5 |
| Lanceiro | 1 / 1 / **3** | 1 / 1 / **4** |
| Assassino | 2 / **1** / 3 | 2 / **2** / 3 |

### Outros pontos
- **Névoa Espessa:** GDD e card dizem "1 turno"; o handler aplica `duration: 2`
  (`spellHandlers.ts:84`).
- **Amuleto da Ilusão:** GDD diz "invulnerável até o fim do próximo turno"; o código
  também consome a invulnerabilidade ao **atacar** (`unitBehaviors.ts:110-115`) e ela é
  furada pelas Adagas (A8).
- **Sandbox:** GDD promete "mana restaurada ao máximo (6)"; o código dá `mana/maxMana =
  99` ao p1 e deixa o p2 com 1 (`gameStore.ts:157-158`) — sandbox assimétrico.
- **DoT:** o Plano diz "no início dos turnos"; o motor aplica no **fim** do turno do dono
  (`gameEngine.ts:256-267`). Idem o Tomo Sagrado, cuja descrição diz "início do turno".
- **TDD §1:** "Backend/Multiplayer: ainda não implementado, o projeto roda 100% local" —
  existe PvP Firebase funcional. E a migração planejada era Node.js + Socket.io
  (`Plano` Fase 5), não Firestore.
- **TDD §1 e README:** "CSS puro (Vanilla CSS) com módulos CSS" / "Vanilla CSS Moderno" —
  o projeto usa **Tailwind v4** (`@tailwindcss/vite`), sem nenhum CSS module.
- **TDD §2.2:** "clone profundo sempre via `JSON.parse(JSON.stringify(state))`" — na
  verdade é o `cloneGameState` manual, que omite campos (ver C1). Os handlers de feitiço e
  artefato mutam o estado **in-place**, contrariando o princípio de "funções puras" do
  §3.1.
- **TDD §4:** lista `shared/src/simulation.ts` e `shared/src/*.test.ts` — **nenhum dos
  dois existe**. Fala em "10 feitiços" (são 11) e usa o id `art_escudo`, que não existe
  (o correto é `art_carvalho`; o comentário em `types.ts:41` repete o id errado).
- **Plano:** Fases 4 e 5 estão desmarcadas, mas a IA (`aiEngine.ts`) e o PvP estão
  implementados.
- **README:** manda rodar `npm install && npm run dev` na raiz — o segundo comando não
  existe (§1).

---

## 8. Se for mexer aqui

1. **Regras de jogo mudam em `shared/`, nunca no cliente.** O `client/` só orquestra
   chamadas e animações.
2. **Não adicione validação apenas em `getValidAttackTargets`/`getValidMoveCoordinates`.**
   Eles são helpers de UI; a regra tem que existir em `attack()`/`moveTo()` também — foi
   exatamente esse descolamento que produziu A4.
3. **Todo campo novo em `GameState` precisa ser adicionado a `cloneGameState`**
   (`gameEngine.ts:211`), senão some no primeiro reducer (ver C1).
4. **Erros de regra são `throw new Error(...)`** no motor e são engolidos com
   `console.warn` no store. Ao depurar "a ação não fez nada", olhe o console.
5. **Ao tocar no motor, escreva testes em `shared/`** — hoje não há nenhum, e
   `shared/tests/` está no `.gitignore` (remova essa linha antes).
6. `npm run lint` já está vermelho: compare a contagem antes/depois em vez de exigir zero.
