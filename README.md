# ⬡ Hexum: Tática 2.0

**Hexum** é um simulador de estratégia tática por turnos em umTabuleiro Hexagonal dinâmico. O jogo combina a profundidade dos clássicos de estratégia com a agilidade dos jogos de cartas modernos, exigindo domínio posicional, gerenciamento de recursos e execução de combos devastadores.

> *"Onde o posicionamento é a lei suprema e cada movimento define o destino na forja da vitória."*

---

## 🎮 O Jogo

Em **Hexum**, você assume o comando de um reino representado por seu Rei. Seu objetivo é simples, mas desafiador: proteger seu Rei a todo custo enquanto manobra suas tropas para eliminar o líder adversário.

### ⚔️ Mecânicas de Combate
- **Classes Especializadas:** Comande **Cavaleiros** que rompem linhas, **Assassinos** que saltam entre as sombras, **Magos** capazes de cataclismos arcanos e **Clérigos** que curam ou convertem inimigos.
- **Sistema de Mana:** Gerencie um pool de mana crescente (até 6) para invocar reforços e usar habilidades especiais.
- **Artefatos e Feitiços:** Equipe suas unidades com itens lendários ou mude o rumo da batalha com magias de controle e dano massivo.
- **Aura de Medo:** O Rei emite uma aura passiva que pode fazer com que inimigos adjacentes falhem em seus ataques, escalando conforme a partida progride.

## ✨ Destaques Técnicos
- **Motor de Jogo Agnóstico:** Toda a lógica de combate e validação reside em um pacote `shared` em TypeScript, facilitando a manutenção e garantindo consistência entre client e servidor.
- **Interface Premium:** Construído com **React** e **Framer Motion**, oferecendo animações fluidas, efeitos de iluminação dinâmica (como a Cadeia de Relâmpagos em zigzag) e uma UI moderna no estilo *Dark Mode*.
- **Modo Sandbox:** Um simulador de guerra integrado que permite aos jogadores e desenvolvedores testarem qualquer combinação de unidades e efeitos sem restrições.
- **Inteligência Tática:** Validação rigorosa de alvos, garantindo que feitiços benéficos curem aliados e feitiços maléficos punam apenas os inimigos.

## 🚀 Tecnologias
- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Animações:** [Framer Motion](https://www.framer.com/motion/)
- **Estado:** [Zustand](https://github.com/pmndrs/zustand)
- **Engine:** Pure TypeScript (Shared Package)
- **Testes:** [Vitest](https://vitest.dev/)
- **Estilo:** Vanilla CSS Moderno

## 📦 Como Rodar

1. **Instale as dependências na raiz:**
   ```bash
   npm install
   ```

2. **Inicie o ambiente de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Explore o Sandbox:** Acesse o menu inicial e entre no Modo Sandbox para experimentar as mecânicas.

---
*Desenvolvido com foco em estratégia pura e excelência visual.*
