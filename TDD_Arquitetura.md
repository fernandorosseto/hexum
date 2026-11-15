# Hexum - Technical Design Document (TDD)

Este documento centraliza as decisões de arquitetura de software, stack tecnológica, estruturação de pastas, gerenciamento de estado e modelagem do motor de jogo do projeto Hexum.

---

## 🏗️ 1. Stack Tecnológica (As Ferramentas)

A stack foi otimizada para máxima acessibilidade web, iteração rápida de UI e lógica de jogo compartilhada entre cliente e motor.

*   **Frontend (Cliente, Interface e Tabuleiro):** `React 19` via **Vite** (SPA), fortemente tipado com `TypeScript`.
    *   **Estilização (UI):** **Tailwind CSS v4** (plugin `@tailwindcss/vite`) com utilitários inline nos componentes; `index.css` guarda o reset e as animações em keyframes. (Não há CSS Modules.)
    *   **Renderização do Tabuleiro:** O cenário hexagonal é renderizado diretamente no DOM com posicionamento CSS baseado em coordenadas axiais (q, r, s). Cada hexágono é um elemento HTML estilizado e interativo. Animações são feitas via classes CSS (keyframes para ataque, dano, cura).
    *   **State Manager:** `Zustand` — store reativo global que mantém o `GameState` completo e expõe ações (mover, atacar, jogar carta, etc.).
*   **Motor de Jogo (Shared/Isomórfico):** Pacote `shared/` em TypeScript puro. Contém toda a lógica de regras, validações, cálculos de dano, matemática hexagonal e IA. É importado tanto pelo cliente React quanto pode ser reutilizado por um futuro servidor autoritativo.
*   **IA Local:** Motor de IA integrado (`aiEngine.ts`): busca alfa-beta com aprofundamento iterativo, tabela de transposição e orçamento de tempo, usando as mesmas funções puras do motor. A avaliação é **soma-zero** (requisito da poda) e a busca troca de lado pela ação `END_TURN`.
*   **Backend/Multiplayer:** PvP **implementado** sobre **Firebase** (Auth anônima + Firestore), sem servidor autoritativo: cada cliente resolve a própria jogada e publica o `GameState` no documento da sala. `firestore.rules` restringe leitura/escrita aos participantes e `hooks/pvpSync.ts` recusa snapshot fora do turno do remetente. **Limite conhecido:** como o `GameState` mora num documento único e o Firestore autoriza por documento, o adversário enxerga sua mão e seu baralho — esconder informação oculta exige migrar a resolução para um servidor (Cloud Functions ou Node).

---

## 🧩 2. Arquitetura e Estado do Cliente

### Estruturas Core no Frontend:

1.  **State Manager (`Zustand` Store — `gameStore.ts`):** O "maestro" global no Cliente React. Guarda:
    *   O objeto `GameState` completo (turno, fase, mana, tabuleiro, baralhos).
    *   UI State adicional: `selectedHex`, `selectedCard`, `selectedAbility`, `inspectedItem`, `logs`, `animatingUnits`.
    *   Modo **Sandbox** (para testes) com flags que bypassam restrições de regras.
    *   Actions (métodos): `attemptMove`, `attemptAttack`, `attemptHeal`, `attemptPlayCard`, `triggerEndTurn`, `offerCard`, `spawnUnit`, `resetGame`, etc.

2.  **Fluxo de Interação:**
    *   Usuário clica em um hexágono ou carta → UI atualiza seleção no store.
    *   Ao confirmar ação, o store chama a função pura do motor compartilhado (`moveTo`, `attack`, `playCard`, etc.).
    *   O motor retorna um novo `GameState` via `cloneGameState()` — clone manual campo a campo (bem mais rápido que `JSON.parse(JSON.stringify)`, usado intensivamente pela busca da IA). **Todo campo novo do `GameState` precisa ser adicionado lá**, senão some no primeiro reducer.
    *   O store faz `set({ ...newState })` e o React re-renderiza automaticamente os componentes afetados (tabuleiro, mão, HUD de mana, logs).

3.  **`HexGrid` Component:** Renderiza o tabuleiro hexagonal completo. Cada hexágono é um elemento posicionado via CSS transforms baseados nas coordenadas axiais. Highlights visuais (verde para movimentação válida, vermelho para ataques válidos) são calculados em tempo real via funções `getValidMoveCoordinates` e `getValidAttackTargets`.

4.  **`UnitSprite` Component:** Cada unidade no tabuleiro é renderizada como emoji/ícone estilizado com barras de HP, indicadores de buffs e animações de combate (classes CSS dinâmicas: `unit-attacking`, `unit-damaged`, `unit-healing`).

5.  **Combat Logs:** Array `combatLogs[]` no `GameState` é preenchido durante a resolução de ataque com informações detalhadas (dano base, bônus de artefatos, efeitos especiais). O store consome e exibe no painel de log do jogo.

---

## ⚙️ 3. Motor Lógico Compartilhado (Shared Package)

O coração do jogo — todas as regras vivem aqui, isoladas da UI.

### Princípios:

1.  **Funções Puras (Reducers):** Toda ação de jogo (`moveTo`, `attack`, `playCard`, `heal`, `convert`, `endTurn`) recebe um `GameState` e retorna um **novo** `GameState`, sem tocar na entrada. Os handlers de feitiço e artefato, por sua vez, mutam **in-place** o estado já clonado que recebem — convenção interna deliberada, documentada nas interfaces `SpellHandler` / `ArtifactHandler`.

2.  **State Machine Simples:** Fases controladas por enum: `DRAW_PHASE` → `MAIN_PHASE` → `END_PHASE` → `GAME_OVER`. Transições são gerenciadas pelo `endTurn()`.

3.  **Behaviors Pattern (Strategy):** Cada classe de unidade tem seu próprio `UnitBehavior` (`unitBehaviors.ts`) que implementa:
    *   `validateMove()` — regras de movimentação da classe.
    *   `isValidMovePosition()` — para calcular indicators visuais.
    *   `validateAttack()` — regras de alcance e trajetória.
    *   `applyDamage()` — dano, efeitos colaterais, empurrão, veneno, execução, etc.
    *   Registrado em `UNIT_BEHAVIORS: Record<UnitClass, UnitBehavior>`.

4.  **Handler Registries:** Feitiços e Artefatos são registrados em maps separados:
    *   `SPELL_REGISTRY: Record<string, SpellHandler>` — cada feitiço tem um `execute()`.
    *   `ARTIFACT_REGISTRY: Record<string, ArtifactHandler>` — cada artefato tem um `onEquip()` (efeito instantâneo) ou é `PassiveOnly` (verificado em runtime durante ações).

5.  **Card Library (`cardLibrary.ts`):** Definição centralizada de stats, custos, descrições e construção de decks. IDs estáveis (`unit_cavaleiro`, `spl_meteoro`, `art_carvalho`, …). Use `tryGetUnitCard` quando o id puder não ser de unidade — `getUnitCard` lança.

6.  **Escalamento de Efeitos:** A função `checkEffectTrigger(unit)` calcula a chance probabilística baseada em `roundsInField` da unidade: `(1 + roundsInField) / 100`.

7.  **DoT (Damage over Time):** A função `applyDoT(target, type, duration, value)` garante que efeitos de Veneno e Queimadura **não acumulam** — se já existir um DoT do mesmo tipo, renova a duração/valor para o maior.

---

## 📁 4. Estrutura de Pastas (MonoRepo)

```text
hexum/
├── shared/                         # Código Isomórfico (Regras do Jogo)
│   └── src/
│       ├── types.ts                # Tipagem TS: GameState, Unit, Card, Buff, Phase, etc.
│       ├── hexMath.ts              # Grid Hexagonal: distâncias, vizinhos, linha reta, diagonal, LoS
│       ├── gameEngine.ts           # Motor principal: createInitialState, moveTo, attack, playCard, heal, convert, endTurn, offerCard
│       ├── unitBehaviors.ts        # Behaviors por classe: Rei, Cavaleiro, Lanceiro, Arqueiro, Assassino, Mago, Clerigo
│       ├── spellHandlers.ts        # Handlers dos 11 feitiços
│       ├── artifactHandlers.ts     # Handlers dos 10 artefatos
│       ├── cardLibrary.ts          # Definição de stats, custos e descrições de todas as cartas
│       ├── aiEngine.ts             # Motor de IA (alfa-beta + TT + orçamento de tempo)
│       ├── getValidAttackTargets.ts # Cálculo de alvos válidos para a UI
│       ├── testUtils.ts            # Fábricas de estado/unidade para os testes
│       ├── index.ts                # Barrel export
│       └── *.test.ts               # gameEngine, aiEngine, selfPlay (Vitest)
│
├── client/                         # SPA Vite + React + TS (Frontend)
│   └── src/
│       ├── App.tsx                 # Componente raiz (roteamento, layout)
│       ├── App.css                 # Estilos globais
│       ├── index.css               # Reset e base CSS
│       ├── main.tsx                # Entrypoint do Vite
│       ├── board/                  # Tabuleiro: HexGrid, HexMap, UnitLayer, UnitSprite
│       ├── ui/                     # HUD, mão, log, menu, lobby, sandbox
│       ├── units/                  # Camadas do sprite: buffs, badges, aura, equipamento
│       ├── animations/             # Efeitos visuais (SVG + framer-motion)
│       ├── store/                  # gameStore, combatActions, sandboxActions,
│       │                           # animationActions, actionGuard
│       ├── hooks/                  # useBot, useMultiplayer, useAuth, pvpSync, useZoomPan
│       ├── firebase/               # config, auth, firestore
│       └── assets/                 # Assets estáticos
│
├── firestore.rules                 # Regras de segurança do Firestore
├── firebase.json                   # Deploy das regras/índices
├── .github/workflows/ci.yml        # typecheck + lint + testes + build
├── package.json                    # Root package (workspaces + scripts)
└── *.md                            # Documentação (GDD, TDD, Plano, CLAUDE.md)
```

---

## 🔄 5. Modelo de Dados (GameState)

O estado completo do jogo é representado por uma única interface TypeScript:

```typescript
interface GameState {
  matchId: string;
  turnNumber: number;
  currentPhase: Phase;           // 'DRAW_PHASE' | 'MAIN_PHASE' | 'END_PHASE' | 'GAME_OVER'
  currentTurnPlayerId: string;
  winner?: string;
  players: Record<string, PlayerState>;
  boardUnits: Record<string, Unit>;
  combatLogs?: string[];
}

interface PlayerState {
  id: string;
  mana: number;
  maxMana: number;
  canOfferCard: boolean;         // Se pode sacrificar carta por mana este turno
  hand: string[];                // IDs das cartas na mão
  deck: string[];                // IDs das cartas no baralho
  graveyard: string[];           // IDs das cartas descartadas
}

interface Unit {
  id: string;
  playerId: string;
  cardId: string;
  unitClass: UnitClass;          // 'Rei' | 'Clerigo' | 'Cavaleiro' | 'Lanceiro' | 'Arqueiro'
                                 // | 'Alquimista' | 'Assassino' | 'Mago' | 'Estrutura'
                                 // ('Mago' é apelido de 'Alquimista': mesmo behavior)
  hp: number;
  maxHp: number;
  attack: number;
  position: HexCoordinates;      // { q, r, s }
  buffs: Buff[];
  roundsInField: number;         // Para mecânica de escalonamento
  summoningSickness: boolean;
  canMove: boolean;
  canAttack: boolean;
  abilityCooldown: number;       // Turnos até a especial voltar
  equippedArtifacts?: string[];  // Máx. MAX_ARTIFACTS_PER_UNIT, sem repetição
}

interface Buff {
  type: 'poison' | 'burn' | 'stun' | 'shield' | 'taunt' | 'fury'
      | 'immune_ranged' | 'bleed' | 'fear' | 'invulnerable' | 'rooted';
  duration: number;
  value?: number;
}
```

---

## 🎮 6. IA (Motor de Decisão)

`aiEngine.ts` — busca adversarial sobre as mesmas funções puras do motor.

*   **A unidade da busca é a AÇÃO, não o turno.** Um jogador encadeia várias ações no mesmo turno; só `END_TURN` passa a vez. Por isso a negação do negamax é **condicional**: o sinal só inverte quando `currentTurnPlayerId` muda.
*   **Avaliação soma-zero:** `evaluateState(s, a) === -evaluateState(s, b)`. Material por classe e HP, pressão sobre o Rei inimigo, ameaça ao próprio Rei, economia de mana e bônus posicional de influência — tudo calculado para os dois lados e subtraído.
*   **Tabela de transposição** com chave completa do estado (posições, HP, buffs, cooldowns, artefatos, mana, mão), com escopo por busca.
*   **Aprofundamento iterativo com orçamento de tempo** (`timeBudgetMs`): interrompida no meio, devolve a melhor jogada da última profundidade concluída, sem travar a UI.
*   **Ordenação de jogadas** por heurística barata (`scoreAction`) para a poda alfa-beta cortar cedo.

---

## 🧪 7. Testes

*   **Framework:** Vitest. `npm test` na raiz roda motor e cliente.
*   **`shared/`** — `gameEngine.test.ts` (regras, validações, artefatos, medo, linha de visão), `aiEngine.test.ts` (soma-zero, geração de ações, troca de turno, mate em 1, orçamento de tempo) e `selfPlay.test.ts` (fumaça IA vs IA).
*   **`client/`** — `gameStoreRules.test.ts` (rendição, cronômetro, fim de turno), `actionGuard.test.ts`, `pvpSync.test.ts` (aceitação de snapshot remoto), mais os testes de projeção hexagonal e de sprite.
*   **Regras do Firestore** — `tests/firestoreRules.test.ts` roda contra o emulador (`npm run test:rules`), sem credenciais e offline: verifica que um terceiro não lê a sala alheia, que ninguém escreve no lugar de outro e que a vaga de convidado só é ocupada com o próprio uid.
*   **CI** (`.github/workflows/ci.yml`) roda typecheck, lint, testes e build a cada push, mais um job separado com o emulador para as regras.

---

## 🚀 8. Roadmap Técnico (Futuro)

1.  **Servidor Autoritativo (a maior lacuna):** mover a resolução de jogadas para Cloud Functions. Resolve de uma vez (a) o adversário enxergar sua mão e seu baralho, (b) o cliente poder escrever qualquer `GameState` e (c) a confiabilidade do ranking.

    Modelo alvo: `matches/{id}` público (tabuleiro, HP, mana, contagem de cartas) + `matches/{id}/private/{uid}` com a mão daquele jogador; nenhum dos dois gravável pelo cliente, que passa a mandar intenção por callable. Duas peças já existem: `redactStateFor` produz a visão pública, e `npm run build --workspace shared` emite CommonJS consumível por Node. Falta o projeto `functions/`, que exige plano Blaze.
2.  **Regra de fim por baralho:** hoje não existe fadiga, derrota por deck vazio nem limite de mão — uma partida equilibrada pode não terminar.
3.  **Peso dos assets:** `hexum.png` (8,9 MB) e `muralha_gelo.png` (6,4 MB) dominam os ~19 MB do `dist/`. Reexportar em WebP/AVIF na resolução real de uso é a maior economia disponível.
4.  **Contas e ranking:** `VITE_AUTH_MODE=firebase` já liga login por e-mail/Google; falta a Cloud Function que escreve as estatísticas.
5.  **Sprites e Animações:** ampliar o conjunto visual de ataques, mortes e efeitos mágicos.
