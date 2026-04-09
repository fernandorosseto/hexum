# Hexum - Technical Design Document (TDD)

Este documento centraliza as decisões de arquitetura de software, stack tecnológica, estruturação de pastas, gerenciamento de estado e modelagem do motor de jogo do projeto Hexum.

---

## 🏗️ 1. Stack Tecnológica (As Ferramentas)

A stack foi otimizada para máxima acessibilidade web, iteração rápida de UI e lógica de jogo compartilhada entre cliente e motor.

*   **Frontend (Cliente, Interface e Tabuleiro):** `React` via **Vite** (SPA), fortemente tipado com `TypeScript`.
    *   **Estilização (UI):** CSS puro (Vanilla CSS) com módulos CSS para componentes e design responsivo.
    *   **Renderização do Tabuleiro:** O cenário hexagonal é renderizado diretamente no DOM com posicionamento CSS baseado em coordenadas axiais (q, r, s). Cada hexágono é um elemento HTML estilizado e interativo. Animações são feitas via classes CSS (keyframes para ataque, dano, cura).
    *   **State Manager:** `Zustand` — store reativo global que mantém o `GameState` completo e expõe ações (mover, atacar, jogar carta, etc.).
*   **Motor de Jogo (Shared/Isomórfico):** Pacote `shared/` em TypeScript puro. Contém toda a lógica de regras, validações, cálculos de dano, matemática hexagonal e IA. É importado tanto pelo cliente React quanto pode ser reutilizado por um futuro servidor autoritativo.
*   **IA Local:** Motor de IA integrado (`aiEngine.ts`) que joga contra o humano localmente, utilizando as mesmas funções do motor de jogo. Decisões são tomadas por heurísticas (avaliação de alvos, priorização de ameaças, posicionamento).
*   **Backend/Multiplayer:** Ainda não implementado. O projeto roda 100% local (Client-Side) com IA. A arquitetura shared/isomórfica foi desenhada para facilitar a futura migração para servidor autoritativo (Node.js + Socket.io).

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
    *   O motor retorna um novo `GameState` (imutável — sempre via `JSON.parse(JSON.stringify(state))` clone profundo).
    *   O store faz `set({ ...newState })` e o React re-renderiza automaticamente os componentes afetados (tabuleiro, mão, HUD de mana, logs).

3.  **`HexGrid` Component:** Renderiza o tabuleiro hexagonal completo. Cada hexágono é um elemento posicionado via CSS transforms baseados nas coordenadas axiais. Highlights visuais (verde para movimentação válida, vermelho para ataques válidos) são calculados em tempo real via funções `getValidMoveCoordinates` e `getValidAttackTargets`.

4.  **`UnitSprite` Component:** Cada unidade no tabuleiro é renderizada como emoji/ícone estilizado com barras de HP, indicadores de buffs e animações de combate (classes CSS dinâmicas: `unit-attacking`, `unit-damaged`, `unit-healing`).

5.  **Combat Logs:** Array `combatLogs[]` no `GameState` é preenchido durante a resolução de ataque com informações detalhadas (dano base, bônus de artefatos, efeitos especiais). O store consome e exibe no painel de log do jogo.

---

## ⚙️ 3. Motor Lógico Compartilhado (Shared Package)

O coração do jogo — todas as regras vivem aqui, isoladas da UI.

### Princípios:

1.  **Funções Puras (Reducers):** Toda ação de jogo (`moveTo`, `attack`, `playCard`, `heal`, `convert`, `endTurn`) recebe um `GameState` e retorna um **novo** `GameState` modificado. Sem efeitos colaterais na entrada original.

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

5.  **Card Library (`cardLibrary.ts`):** Definição centralizada de stats, custos, descrições e construção de decks. Todas as cartas do jogo estão aqui com seus IDs estáveis (`unit_cavaleiro`, `spl_meteoro`, `art_escudo`, etc.).

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
│       ├── spellHandlers.ts        # Handlers dos 10 feitiços
│       ├── artifactHandlers.ts     # Handlers dos 10 artefatos
│       ├── cardLibrary.ts          # Definição de stats, custos e descrições de todas as cartas
│       ├── aiEngine.ts             # Motor de IA (heurísticas para jogar contra o humano)
│       ├── simulation.ts           # Simulação em massa AI vs AI (para balanceamento)
│       ├── getValidAttackTargets.ts # Cálculo de alvos válidos para a UI
│       ├── index.ts                # Barrel export
│       └── *.test.ts               # Testes unitários (Vitest)
│
├── client/                         # SPA Vite + React + TS (Frontend)
│   └── src/
│       ├── App.tsx                 # Componente raiz (roteamento, layout)
│       ├── App.css                 # Estilos globais
│       ├── index.css               # Reset e base CSS
│       ├── main.tsx                # Entrypoint do Vite
│       ├── board/                  # Componentes do Tabuleiro: HexGrid, HexTile, UnitSprite
│       ├── ui/                     # Componentes de UI: HandPanel, ManaBar, CombatLog, InspectPanel, Sandbox
│       ├── store/                  # Zustand Store (gameStore.ts)
│       ├── hooks/                  # Custom Hooks React
│       └── assets/                 # Assets estáticos
│
├── package.json                    # Root package (workspaces)
└── *.md                            # Documentação (GDD, TDD, Plano)
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
  unitClass: UnitClass;          // 'Rei' | 'Cavaleiro' | 'Lanceiro' | 'Arqueiro' | 'Mago' | 'Assassino' | 'Clerigo'
  hp: number;
  maxHp: number;
  attack: number;
  position: HexCoordinates;      // { q, r, s }
  buffs: Buff[];
  roundsInField: number;         // Para mecânica de escalonamento
  summoningSickness: boolean;
  canMove: boolean;
  canAttack: boolean;
  equippedArtifacts?: string[];
}

interface Buff {
  type: 'poison' | 'burn' | 'stun' | 'shield' | 'taunt' | 'fury' | 'immune_ranged';
  duration: number;
  value?: number;
}
```

---

## 🎮 6. IA (Motor de Decisão)

O `aiEngine.ts` implementa um oponente autônomo que joga contra o humano localmente:

*   **Avaliação de Ações:** A IA enumera todas as ações possíveis (mover, atacar, jogar carta, curar, converter, habilidade especial) e atribui scores baseados em heurísticas.
*   **Prioridades:** Eliminar unidades inimigas > proteger o Rei > avançar posição > jogar cartas de suporte.
*   **Simulação de Balanceamento:** O módulo `simulation.ts` permite rodar milhares de partidas AI vs AI para coletar estatísticas (win rate, duração média, uso de mana) e ajustar parâmetros de balanceamento.

---

## 🧪 7. Testes

*   **Framework:** Vitest (integrado ao Vite).
*   **Cobertura:** Testes unitários para mecânicas de combate, movimentação, feitiços, artefatos e matemática hexagonal.
*   **Arquivos de Teste:** `gameEngine.test.ts`, `gdd_mechanics.test.ts`, `magic_cards.test.ts`, `mechanics.test.ts`, `hexMath.test.ts`, `repro.test.ts`, `repro2.test.ts`, `rounding.test.ts`.

---

## 🚀 8. Roadmap Técnico (Futuro)

1.  **Servidor Autoritativo (Node.js):** Migrar a lógica do shared para rodar no servidor, com o cliente enviando apenas "intenções" via WebSocket (`Socket.io`).
2.  **Matchmaking e Auth:** Integrar com Supabase (PostgreSQL) para contas, ranking (Elo), histórico de partidas e deck building persistente.
3.  **Multiplayer Real-Time:** O modelo isomórfico permite reutilizar 100% das regras — o servidor valida e retransmite o `GameState` atualizado para ambos os clientes.
4.  **Sprites e Animações:** Substituir emojis por sprites pixelart/2D e adicionar animações visuais elaboradas (ataques, mortes, efeitos mágicos).
