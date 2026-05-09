# MainMenu Redesign — Layout Split + Avatar Google

**Data:** 2026-05-05  
**Status:** ✅ Implementado

---

## Motivação

O layout anterior:
- Parecia "template de IA" — coluna única centralizada genérica
- Logo cortada no topo em telas menores
- Pill de usuário no fundo (padrão não convencional)
- Sem adaptação real para mobile/desktop

---

## Mudanças

### Layout

| Antes | Depois |
|-------|--------|
| Coluna única centralizada | Split 2 colunas no desktop (arte esq, ações dir) |
| Logo 550–650px (cortava) | Logo responsiva: 220 → 440px escalonado |
| Usuário no rodapé | Avatar Google no canto superior direito fixo |

### Componentes novos

- **`UserAvatar`** — componente interno com dropdown Google-style
  - Clique no avatar abre painel com nome, email, botão Sair
  - Fecha ao clicar fora (listener de `mousedown`)
  - Animação suave com `framer-motion`

### Melhorias visuais

- Botões com menos gradiente "AI vibes", mais sutis
- Dificuldades em grid 4 colunas compacto
- Subtítulo do botão play mostra `{modo} · {ícone} {nível}`
- Feedback link no desktop vai para a top bar
- Copyright quase invisível no rodapé

### Responsividade

| Breakpoint | Comportamento |
|-----------|--------------|
| Mobile (< md) | Coluna única, logo menor (220px), feedback inline |
| Tablet (md) | Split horizontal, logo 340px |
| Desktop (lg+) | Split mais espaçado, logo 400–440px |

---

## Arquivos modificados

| Arquivo | Alteração |
|--------|-----------|
| `client/src/ui/MainMenu.tsx` | Reescrita completa |
