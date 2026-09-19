# HEXUM - GDD

**HEXUM** é um simulador de estratégia por turnos em tabuleiro hexagonal onde o posicionamento é a lei suprema. Comande heróis com habilidades únicas — como o *Rompante de Ferro* e a *Transposição Etérea* — em combates intensos. Gerencie mana, equipe artefatos e conjure feitiços para dominar a arena através de combos devastadores. Seja no calor da batalha ou no rigor do *Simulador de Guerra*, cada movimento define o seu destino na forja da vitória.

Este documento centraliza as mecânicas, regras de tabuleiro e habilidades das cartas (Unidades, Artefatos e Feitiços) definidas atualmente no projeto. Sinta-se à vontade para preencher, propor alterações, balanceamentos ou novas mecânicas a partir desta base!

---

## 🏰 1. O Tabuleiro (Board) e Regras Gerais

- **Formato do Tabuleiro:** Hexagonal, em coordenadas cúbicas (q, r, s), com **raio 3** (`BOARD_RADIUS` em `shared/src/hexMath.ts`) — 37 hexágonos.
- **Posicionamento de Cartas:** unidades só podem ser invocadas em uma casa **vazia adjacente ao próprio Rei**, onde quer que ele esteja. (Não existe regra de "fileiras iniciais".)
- **Recursos (Mana):** Cada jogador possui um máximo de **6 pontos de Mana**. O jogo inicia com **1 ponto de Mana** e este valor aumenta (+1) a cada turno, recarregando completamente.
- **Ações por Unidade:** Cada unidade em campo pode, no mesmo turno, **mover-se** E **atacar/usar habilidade especial** — são ações independentes controladas por flags separadas (`canMove` e `canAttack`).
- **Oferenda de Carta:** Uma vez por turno, o jogador pode descartar uma carta da mão para **ganhar +1 de Mana Máximo** permanente.
- **Condição de Vitória:** O jogo termina imediatamente se a unidade **Rei** de um dos jogadores for derrotada (HP ≤ 0).

---

## ⚔️ 2. Personagens (Unidades)

Esta seção define as peças medievais do jogo e suas identidades semânticas.

### 2.1 Movimentação (Geografia no Tabuleiro)

* **Rei:** Move-se **1 casa em qualquer direção** (6 opções).
* **Clérigo / Alquimista / Arqueiro / Lanceiro:** Movimentação base de **1 casa** (com restrições específicas para o Lanceiro que só move para frente/trás).
* **Cavaleiro:** Move-se **até 2 casas em linha reta**. Com **Corcel de Guerra**, estende para **3 casas**.
* **Assassino:** 
  1. Passo padrão: **1 casa em qualquer direção**.
  2. **Transposição Etérea:** Pode saltar **2 casas exatas em formato diagonal**. Ignora obstáculos ("salta por cima"). Custa **3 de Mana**.

---

### 2.2 Ataque e Habilidades Especiais

* **Rei:**
  * **Aura de Medo (Passiva):** Inimigos adjacentes têm chance (5% + 1%/turno, máximo 30%) de falhar em ataques corpo-a-corpo.
* **Cavaleiro:**
  * **Rompante de Ferro (Especial - 3 Mana):** Avança em linha reta até **3 casas** e ataca com **+2 de Dano Bônus**. Chance de **Atordoar**.
* **Lanceiro:**
  * **Impacto de Falange:** Ataca em linha vertical (alcance 2). Chance de **Empurrar** o alvo 1 casa para trás.
* **Arqueiro:**
  * **Tiro Preciso:** Ataca a distância (alcance 3), **com linha de visão livre** — qualquer unidade ou estrutura no caminho bloqueia o tiro. Chance de **Atordoar**.
* **Alquimista:**
  * **Cataclismo Arcano (AoE):** Explosão rúnica em um alvo (alcance 3, **exige linha de visão livre**) com splash em raio 1. Chance de **Queimadura**.
  * ⚠️ O splash acerta **aliados** e pode atingir o próprio Alquimista quando ele ataca a 1 casa.
* **Clérigo:**
  * **Prece de Alento:** Restaura **2 HP** de um aliado adjacente. Chance de conceder **Escudo Sagrado**.
  * **Chamado da Fé:** Tenta converter um inimigo adjacente.
* **Assassino:**
  * **Toque Letal (Passiva):** Todo ataque aplica **sangramento** (1 dano/turno, 2 turnos).
  * **Transposição Etérea (Especial - 3 Mana):** Salta 2 casas diagonais e ataca com **+2 de Dano Bônus** (Totalizando 3 de dano no impacto).
  * **Aterrissagem Adaptativa:**
    - Se o alvo **morrer** no impacto: O Assassino ocupa o hexágono do inimigo.
    - Se o alvo **sobreviver**: O Assassino pousa no primeiro hexágono vago **adjacente ao alvo** (buscando em sentido horário).
    - Se estiver cercado: Retorna à posição de origem.

---

### 2.3 Status Principais (Stats)

| Personagem | Custo Mana (Invocar) | Ataque (ATK) | Defesa (HP) | Função Principal |
| :--- | :---: | :---: | :---: | :--- |
| **👑 Rei** | 0 | 1 | 6 | Sobrevivência e Suporte |
| **🛡️ Cavaleiro** | 4 | 3 | 5 | Tanque e Rompedor |
| **🔱 Lanceiro** | 1 | 1 | 4 | Defensor Vertical |
| **🏹 Arqueiro** | 1 | 1 | 2 | Dano à Distância |
| **🗡️ Assassino** | 2 | 2 | 3 | Furtividade e Sangramento |
| **⚗️ Alquimista** | 3 | 1 (AoE) | 3 | Dano em Área |
| **📿 Clérigo** | 3 | 0 | 4 | Healer / Conversão |

> Fonte da verdade: `UNIT_STATS` em `shared/src/cardLibrary.ts`.

### 2.4 Heróis Históricos (Variantes em Jogo)

A identidade do jogo baseia-se em "Heróis" que utilizam as mecânicas das Classes Base. Isso permite criar diferentes cartas de comandantes icônicos (cada um com possivelmente variações sutis no custo ou HP) compartilhando as habilidades principais.

| Classe Base | Herói 1 | Herói 2 |
| :--- | :--- | :--- |
| **👑 Rei** | **Balduíno IV** (Aura de Medo do rei leproso) | **Leônidas I** (Sobrevivência de Esparta) |
| **🛡️ Cavaleiro** | **Joana d'Arc** (Fé e avanço de vanguarda) | **William Marshall** (Foco em defesa e lealdade) |
| **🔱 Lanceiro** | **El Cid** (Defesa impassível) | **Mestre Landsknecht** (Controle de área com lanças) |
| **🏹 Arqueiro** | **Robin Hood** (Precisão icônica) | **Nasu no Yoichi** (Ápice do arco naval) |
| **🗡️ Assassino** | **Hassan-i Sabbah** (Fundador da ordem) | **Hattori Hanzo** (Sombras e letalidade) |
| **⚗️ Alquimista** | **Roger Bacon** (Pólvora e reações alquímicas) | **Sun Simiao** (Elixires e fogo arcano) |
| **📿 Clérigo** | **Cardeal Richelieu** (Apoio tático intenso) | **Papa Urbano II** (Conversão de tropas aliadas) |

---

## 💎 3. Artefatos

Itens equipáveis que concedem bônus passivos ou novas capacidades às unidades.

| Artefato | Custo Mana | Descrição |
| :--- | :---: | :--- |
| **🛡️ Escudo de Carvalho** | 2 | Concede +1 de HP Máximo e um Escudo protetor permanente que absorve 3 de dano no próximo ataque recebido, 2 de dano no segundo ataque recebido e 1 de dano no terceiro ataque recebido, depois se quebra caso a unidade ainda esteja viva. |
| **🪓 Lâmina do Carrasco** | 3 | Aumenta o Ataque em +2. |
| **🏹 Arco Longo Élfico** | 2 | Aumenta o alcance de ataque em +1. |
| **🐍 Adagas Envenenadas** | 2 | Ataques causam +1 de dano real (ignora Escudo, mas **não** Invulnerabilidade) e aplicam Veneno. |
| **💍 Anel do Arquimago** | 3 | Aumenta o alcance de magias/curas e o raio de explosão do Alquimista. |
| **🐴 Corcel de Guerra** | 2 | Permite mover 2 casas. Cavaleiros ganham imunidade a conversão. |
| **👑 Coroa do Regente** | 3 | Concede +3 de HP Máximo e dobra o raio da Aura de Medo do Rei (1 → 2). |
| **📖 Tomo Sagrado** | 1 | Aumenta a cura em +1 e remove efeitos negativos. |
| **👁️ Amuleto da Ilusão** | 2 | A unidade fica invulnerável por 2 turnos. **Atacar consome o efeito.** |
| **🚩 Estandarte da Coragem** | 3 | A unidade ganha Provocar, forçando inimigos próximos (2 casas) a atacá-la. |

---

## 🧪 4. Feitiços (Spells)

Efeitos imediatos lançados diretamente da mão do jogador.

| Feitiço | Custo Mana | Descrição |
| :--- | :---: | :--- |
| **Aura rúnica** | 2 | Concede +2 de HP Máximo e um escudo que protege contra o próximo ataque recebido, depois se quebra. |
| **⚡ Cadeia de Relâmpagos** | 3 | Causa 2 de dano a um alvo e 1 de dano a um inimigo adjacente. |
| **🩸 Transfusão Sombria** | 2 | Drena 2 de HP de uma unidade para curar 2 de HP do seu Rei. |
| **🌫️ Névoa Espessa** | 2 | Torna um aliado imune a ataques à distância por 2 turnos. |
| **🧊 Muralha de Gelo** | 2 | Invoca uma barreira de gelo com 6 HP em 3 hexágonos vazio. |
| **🍃 Passos de Vento** | 1 | Permite que uma unidade aja novamente (reset de movimento/ataque). |
| **☄️ Chuva de Meteoros** | 4 | Causa 2 de dano no centro e 1 nos hexágonos adjacentes (4 e 2 contra Estruturas). ⚠️ Acerta **aliados**, inclusive o próprio Rei. |
| **✨ Bênção Divina** | 3 | Cura 3 de HP e remove todos os efeitos negativos de um aliado. |
| **🌱 Raízes da Terra** | 2 | Imobiliza uma unidade inimiga por 1 turno. |
| **🔥 Fúria de Batalha** | 1 | A unidade ganha +2 de Ataque, mas perde 1 de HP ao atacar. |
| **🎺 Chamado dos Reforços** | 3 | Adiciona 2 cartas de Lanceiro: uma ao baralho e uma à mão. |

---

## 🛠️ 5. Simulador de Guerra (Sandbox)

O ambiente de testes definitivo para validar táticas e balanceamento.

- **Forja (P1/P2):** Janelas de controle que permitem invocar qualquer unidade no hexágono selecionado e adicionar cartas à mão sem custo.
- **Purificar Arena:** Reseta o tabuleiro, remove todas as unidades e limpa as mãos de cartas para um novo teste.
- **Mana Infinita:** No Simulador o jogador 1 opera com mana 99; o jogador 2 começa com 1 e segue as regras normais (assimetria proposital para montar cenários rapidamente).

---

## 🎭 6. Glossário de Status e Efeitos

- **Toque Letal (Veneno):** 1 dano no fim do turno (2 turnos).
- **Cataclismo (Queimadura):** 1 dano no fim do turno (2 turnos).
- **Atordoamento (Stun):** Unidade não move nem ataca por 1 turno.
- **Escudo Sagrado:** Anula o próximo dano recebido.
- **Provocar (Taunt):** Regra do motor: havendo um inimigo com Provocar a até **2 casas**, ele é alvo obrigatório — atacar outra unidade é recusado.
- **Imobilizado (Roots):** A unidade não pode se mover, mas ainda pode atacar/usar habilidades.
- **Dano Real:** Dano que ignora escudos ou reduções defensivas.

---

## ☠️ 7. Condição de Vitória

O jogo termina quando o **Rei** de qualquer jogador chega a **0 HP** — **o vencedor é sempre o adversário do Rei que caiu**, inclusive quando a morte vem de fogo amigo (Meteoro, Relâmpago) ou de Veneno no fim do turno. No **Simulador de Guerra** o Rei não encerra a partida, para permitir testes.

---

## 🔧 8. Regras Auxiliares (motor)

- **Limite de artefatos:** no máximo **3 artefatos distintos** por unidade; o mesmo artefato não pode ser equipado duas vezes (`MAX_ARTIFACTS_PER_UNIT`).
- **Oferenda:** aumenta só a **mana máxima**. A mana utilizável só sobe na recarga do próximo turno.
- **Aura de Medo:** a checagem usa o raio da aura (1, ou 2 com a Coroa), não apenas casas adjacentes.
- **Cura / Conversão do Clérigo:** alcance 1 (+1 com Anel do Arquimago); só o Clérigo do jogador da vez pode agir, e a cura só atinge aliados.

### Lacunas conhecidas de design (não implementadas)

- **Sem regra de fadiga / deck vazio.** `drawCard` simplesmente não faz nada quando o baralho acaba, e não há limite de tamanho de mão. Uma partida em que ninguém consegue matar o Rei adversário pode durar indefinidamente. Definir a regra (derrota por deck vazio? dano de fadiga? limite de mão?) é uma decisão de design em aberto.
