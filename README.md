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
- **Aura de Medo:** o Rei emite uma aura passiva que pode fazer inimigos próximos falharem em seus ataques (raio 1, ou 2 com a Coroa do Regente), escalando conforme a partida progride.

## ✨ Destaques Técnicos
- **Motor de Jogo Agnóstico:** toda a lógica de combate e validação vive no pacote `shared` em TypeScript puro, reaproveitável por um futuro servidor autoritativo.
- **Interface Premium:** **React 19** + **Framer Motion**, com animações fluidas, efeitos de iluminação dinâmica (como a Cadeia de Relâmpagos em zigzag) e UI *Dark Mode*.
- **IA por busca real:** alfa-beta com aprofundamento iterativo, tabela de transposição e orçamento de tempo, sobre as mesmas funções puras do motor.
- **Modo Sandbox:** simulador de guerra integrado para testar qualquer combinação de unidades e efeitos sem restrições.
- **PvP por código de sala:** partidas em tempo real via Firebase/Firestore, sem necessidade de cadastro.

## 🚀 Tecnologias
- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Estilo:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animações:** [Framer Motion](https://www.framer.com/motion/)
- **Estado:** [Zustand](https://github.com/pmndrs/zustand)
- **Engine:** TypeScript puro (pacote `shared`)
- **Multiplayer:** [Firebase](https://firebase.google.com/) (Auth anônima + Firestore)
- **Testes:** [Vitest](https://vitest.dev/)

## 📦 Como Rodar

1. **Instale as dependências na raiz:**
   ```bash
   npm install
   ```

2. **Inicie o ambiente de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Explore o Sandbox:** acesse o menu inicial e entre no Modo Sandbox para experimentar as mecânicas.

> O jogo roda offline (solo e sandbox) sem nenhuma configuração. Para habilitar o **PvP**, copie `client/.env.example` para `client/.env` e preencha as credenciais do seu projeto Firebase; as regras de segurança estão versionadas em `firestore.rules`.

### Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm run build` | Build de produção do cliente |
| `npm run typecheck` | `tsc -b` no cliente (cobre o `shared` via project references) |
| `npm run lint` | ESLint |
| `npm test` | Testes do motor (`shared`) e do cliente |
| `npm run preview` | Serve o build de produção |

## 📚 Documentação

- [`GDD_Mecanicas.md`](./GDD_Mecanicas.md) — regras, cartas e mecânicas
- [`TDD_Arquitetura.md`](./TDD_Arquitetura.md) — arquitetura e decisões técnicas
- [`Plano_Implementacao.md`](./Plano_Implementacao.md) — fases do projeto e o que falta
- [`CLAUDE.md`](./CLAUDE.md) — guia de trabalho no repositório e dívidas conhecidas

---
*Desenvolvido com foco em estratégia pura e excelência visual.*
