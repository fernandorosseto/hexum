# Plano PvP — Estado Atual e Próximas Etapas

**Data:** 2026-05-05  
**Referências:** `Plano_Implementacao.md`, `TDD_Arquitetura.md`

---

## Onde estamos no plano original

```
Fase 1 — Motor Isomórfico        ✅ CONCLUÍDA
Fase 2 — Renderização Visual      ✅ CONCLUÍDA
Fase 3 — Combate e Turnos         ✅ CONCLUÍDA
Fase 4 — IA Estratégica           ✅ CONCLUÍDA (aiEngine, useBot, delays, dificuldades)
Fase 5 — Transição Multiplayer    🔴 NÃO INICIADA
```

---

## O que a Fase 5 exige (PvP real)

O plano original previa **Node.js + Socket.io** como backend autoritativo.
Agora com **Firebase já configurado**, podemos usar **Firestore Realtime** como alternativa mais simples e sem servidor próprio.

### Dois caminhos possíveis

| Abordagem | Vantagens | Desvantagens |
|-----------|-----------|--------------|
| **Firebase Realtime / Firestore** | Sem servidor pra gerenciar, já temos auth | Latência levemente maior, mais complexo para ações rápidas |
| **Node.js + Socket.io** | Latência mínima, controle total | Precisa hospedar servidor (Railway, Render...) |

> **Recomendação:** Firestore para o MVP PvP. Migrar para Socket.io se houver problemas de latência depois.

---

## Próxima Etapa Concreta — MVP PvP com Firestore

### Etapa 1 — Matchmaking (criar/entrar em sala)

```
/matches/{matchId}
  status: 'waiting' | 'in_progress' | 'finished'
  players: { p1: uid, p2: uid | null }
  hostId: uid
  createdAt: timestamp
```

- Tela "Criar Sala" → gera `matchId`, escreve no Firestore, exibe código/link
- Tela "Entrar em Sala" → aceita código, preenche `p2`, muda status para `in_progress`

### Etapa 2 — Estado de jogo sincronizado

```
/matches/{matchId}/gameState (documento)
  → snapshot completo do GameState
  → updated a cada ação do jogador
```

- Cada cliente usa `onSnapshot()` para escutar mudanças em tempo real
- Quem está no turno envia a ação → atualiza Firestore
- O outro cliente recebe o novo `gameState` via listener

### Etapa 3 — Regras de autoridade (quem pode agir)

- Validar no cliente: `if (currentTurnPlayerId !== myUid) return`
- O motor `shared/` já tem toda a lógica pura — reutilizamos 100%
- O servidor (Firestore Rules) bloqueia escritas de quem não é o jogador da vez

### Etapa 4 — UI da sala de espera

- Componente `LobbyPage` com:
  - Código da sala para compartilhar
  - Indicador de "aguardando oponente..."
  - Botão cancelar
  - Animação de entrada quando P2 conectar

---

## Checklist resumido

- [ ] **Firestore Rules** — proteger `/matches` por autenticação
- [ ] **`firestore.ts`** — funções `createMatch()`, `joinMatch()`, `updateGameState()`, `subscribeMatch()`
- [ ] **`LobbyPage.tsx`** — tela de sala de espera
- [ ] **`useMultiplayer` hook** — escuta `onSnapshot` e despacha ações
- [ ] **`App.tsx`** — nova rota/view `LOBBY` e `PVP`
- [ ] **`MainMenu.tsx`** — botão "Jogar contra Amigo"
- [ ] **Desativar IA** quando `isVsAI === false` e partida é PvP

---

## Estimativa de complexidade

| Item | Esforço |
|------|---------|
| Funções Firestore (match) | Baixo |
| Hook `useMultiplayer` | Médio |
| Lobby UI | Baixo |
| Sincronização de estado | Médio-alto |
| Regras de segurança Firestore | Baixo |

**Total estimado:** 1–2 sessões de trabalho para MVP funcional.

---

## Próxima ação imediata

> Implementar as **funções Firestore de matchmaking** + o **hook `useMultiplayer`** + a **`LobbyPage`**.
