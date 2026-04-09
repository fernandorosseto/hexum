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

A máquina oponente agora simulará jogadas reais e escolherá a melhor ação baseada em um algoritmo de busca tática.

- [ ] Construir o `evaluateState.ts`: Função heurística que dá "nota" ao tabuleiro (Vantagem de HP, Posicionamento do Rei, Mana).
- [ ] Implementar `getBestAction.ts`: Motor de simulação que testa todos os movimentos legais e escolhe o de maior score.
- [ ] Hook `useBot`: Integrar no cliente para disparar ações automáticas quando `currentTurnPlayerId === 'p2'`.
- [ ] Visualização de "Pensamento": Adicionar delays de 800ms entre as ações da IA para que o jogador acompanhe o desenrolar do turno inimigo.

---

## Fase 5: Transição Multiplayer (A Escala do Chess.com)

Quando o "Jogo Contra o Bot" for validado por você, migraremos a "Mesa de Operações" para a Nuvem de forma instantânea.

- [ ] Bootstrapping BackEnd: Configurar `Node.js` + `Socket.io` isolados.
- [ ] Importar Motor Lógico (`Phase 1`) do Monorepo para dentro da Engine Node.js.
- [ ] Desativar Controlador Local no Cliente e conectar o Hook do `MatchController` mandando pacotes via Socket (`emit('PLAY_CARD', x, y)`).
- [ ] Conectar o BaaS `Supabase`, Autenticar o perfil de Jogador, resgatar o array de Cartas do Inventário, e gravar histórico das vitórias de Matchmakings ranqueados pelo Servidor!
