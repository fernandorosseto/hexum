# Plano de Implementação Hexum (Foco: MVP Contra a Máquina)

Este plano divide a produção do jogo em etapas concretas e validadas passo-a-passo. O objetivo central é **alcançar a diversão e testar as regras o mais rápido possível**. Por isso, atacaremos primeiro a criação de uma inteligência artificial (Bot) simples rodando no navegador, deixando o servidor Multiplayer complexo (Node.js/Supabase) pré-preparado na arquitetura, mas implementado apenas na fase final de escala.

## Fase 1: A Fundação e o Motor Isomórfico (O "Cérebro" do Jogo)

Antes de desenhar qualquer tela, precisamos que as regras do tabuleiro existam matematicamente em `TypeScript`.

- [x] Instanciar o Monorepo com a pasta `shared` (onde a lógica de tabuleiro mora) e `client`. A pasta `server` fica para o futuro.
- [x] Criar a calculadora Hexagonal (`HexMath`): Programar a base de Coordenadas (q, r, s) para validar vizinhos, linhas de visão e alcances de ataque.
- [x] Definir os `Types` e Modelos de Cartas (`Unit`, `Spell`, `Artifact`), estipulados no GDD (Rei, Mago, Clérigo).
- [x] Definir as regras Puras de Estado (`GameState` e `Reducers`): Criar os comandos centrais puros `playCard()`, `moveTo()`, e `attack()`, responsáveis por validar ações baseadas na mana.

> **Meta da Fase 1:** Você pode rodar testes unitários no terminal que simulam uma partida invisível, comprovando que "O cavaleiro pode andar 3 casas e gastar 3 manas". (CONCLUÍDA)

---

## Fase 2: Renderização Visual do Tabuleiro (React + Vite)

Dando vida aos números usando React e Matemática UI.

- [x] *Setup Frontend:* Iniciar Vite (React + TS) e Tailwind CSS.
- [x] Construir Rota de "Partida Local" (sem backend de rede ainda).
- [x] Renderizar `HexBoard`: Componente que desenha o chão de ladrilhos da arena baseados nos cálculos de offsets `(x, y)` projetados do `(q, r, s)`.
- [x] Renderizar `Units`: Exibir Peças sobrepostas com os ícones de Cartas e componentes flutuantes de Vida/Mana.
- [x] Entradas do Jogador (Clicks): Fazer os hexágonos brilharem quando houver cliques, desenhando trilhas lógicas de caminho e executando a função `moveTo` que re-desenha a interface (Zustand Reactivity).

---

## Fase 3: Efeitos das Classes, Combate e Turnos (Loop Fundamental)

Aqui o jogo entra na forma "Jogável".

- [x] UI de Batalha: Adicionar a Mão de Cartas inferior, botão de "Passar Turno" e Medidores Globais de P1/P2.
- [x] Resolução de Dano: Função de atacar, subtrair HP, ativar "Animações" com o framer-motion como "Pulo Frontal" rápido e checar se o Rei Morreu (Condição de Vitória).
- [x] Mecânicas Exclusivas:
    - *Ataque Linear do Lanceiro e Arqueiro:* Limitar zonas de alcance direcional.
    - *Ataque Splash do Mago (Explosão Rúnica):* Distribuir danos num raio em blocos visuais vermelhos.
    - *Cura e Auras (Clérigo/Rei).*
- [x] Pipeline de Status: Criar *DoT* como Envenenamento e Queimadura no início dos turnos.

> **Meta da Fase 3:** Você pode abrir 2 abas (ou usar o mesmo mouse) para jogar Ouro Vs Prata na sua máquina, garantindo que o feitiço ou ataque X causou Y de dano.

---

## Fase 4: IA Estratégica (Oponente "Inteligente")

A máquina oponente simula jogadas reais e escolhe a ação por busca adversarial.

- [x] `evaluateState`: heurística que dá nota ao tabuleiro (material por classe e HP, pressão sobre o Rei inimigo, ameaça ao próprio Rei, economia de mana, influência posicional). **Soma-zero**, requisito da poda alfa-beta.
- [x] `getBestAction`: alfa-beta com aprofundamento iterativo, tabela de transposição e orçamento de tempo. A ação `END_TURN` é o que faz a busca trocar de lado.
- [x] Hook `useBot`: dispara o turno da IA quando a vez passa para o p2 (a execução mora em `gameStore.runAiTurn`, com guard único).
- [x] Visualização de "Pensamento": delay entre as ações da IA para o jogador acompanhar.

> **Meta da Fase 4:** ATINGIDA. `shared/src/selfPlay.test.ts` conduz uma partida IA vs IA completa; `aiEngine.test.ts` cobre o mate em 1 e a simetria da avaliação.

---

## Fase 5: Transição Multiplayer

Implementada sobre **Firebase** (Auth anônima + Firestore) em vez do par Node.js + Socket.io previsto originalmente — decisão tomada para chegar ao PvP jogável sem manter infraestrutura própria.

- [x] Sala PvP por código, com índice `lobbyCodes/{CODE}` e ocupação de vaga transacional.
- [x] Sincronização em tempo real do `GameState` via `onSnapshot`.
- [x] Identidade de jogador sem tela de login (Auth anônima), com `VITE_AUTH_MODE=firebase` para ligar contas de verdade.
- [x] `firestore.rules` versionadas: só os participantes leem a sala, só o dono escreve no próprio perfil.
- [x] Validação do snapshot recebido (`hooks/pvpSync.ts`): recusa escrita fora do turno do remetente e estado que volta no tempo.
- [x] Regras de segurança testadas no emulador (`npm run test:rules`), sem credenciais e dentro do CI.
- [x] Preparação para o servidor: `redactStateFor` (visão pública do estado) e build CommonJS do `shared/` para consumo em Node.
- [ ] **Servidor autoritativo** (Cloud Functions): resolver as jogadas fora do cliente. É o que falta para (a) esconder a mão e o baralho do adversário, (b) impedir que um cliente escreva qualquer `GameState` e (c) tornar o ranking confiável. **Depende do plano Blaze.**
- [ ] Histórico/ranking gravados pelo servidor (`saveMatchResult` hoje só escreve o placar do próprio jogador).
- [ ] Deck building persistente e matchmaking.

---

## Fase 6: Dívidas em aberto

- [x] **Regra de fim por baralho:** derrota por baralho vazio implementada — quem precisa comprar e não tem carta perde, e a tela de fim de jogo informa o motivo (`winReason`). Uma partida sem abate de Rei termina por volta do turno 35.
- [x] **Limite de tamanho de mão:** 5 cartas na virada do turno; o excedente é descartado pelo próprio jogador (fase `END_PHASE`), e a IA resolve o próprio descarte.
- [ ] **Peso dos assets:** `hexum.png` (8,9 MB) e `muralha_gelo.png` (6,4 MB) respondem pela maior parte dos ~19 MB do `dist/`.
