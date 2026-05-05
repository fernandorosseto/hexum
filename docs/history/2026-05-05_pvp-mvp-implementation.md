# PvP MVP — Implementação com Firestore

**Data:** 2026-05-05  
**Status:** ✅ Implementado

---

## Arquitetura implementada

```
Jogador A (host/p1)          Firestore /lobbies/{id}         Jogador B (guest/p2)
        │                              │                               │
   createLobby()  ──────────────────► │                               │
        │                         {code, status:'waiting'}            │
   aguarda snapshot                   │                               │
        │          ◄──────────────── onSnapshot                       │
        │                              │              joinLobbyByCode()◄─┤
        │                         {status:'in_progress'}               │
        │◄── onSnapshot                │                               │
        │    → setCurrentView('PVP')   │          setCurrentView('PVP')◄─┤
        │                              │                               │
   [joga ação]                         │                               │
   pushGameState() ──────────────────►│                               │
        │                         {gameState: ...}                     │
        │                              │◄──────────── onSnapshot ──────┤
        │                              │              setState(lobby.gameState)
```

---

## Arquivos criados / modificados

| Arquivo | O que faz |
|---------|-----------|
| `firebase/firestore.ts` | + `createLobby`, `joinLobbyByCode`, `subscribeToLobby`, `pushGameState`, `closeLobby` |
| `hooks/useMultiplayer.ts` | Escuta `onSnapshot`, aplica estado remoto, expõe `syncAction` |
| `hooks/useBot.ts` | Guard: bot desativado quando `isPvP === true` |
| `store/gameStore.ts` | + `lobbyId`, `myRole`, `isPvP`, `setLobbySession`, `clearLobbySession`, view `'PVP'` |
| `ui/LobbyPage.tsx` | Tela criar/entrar sala + sala de espera com código |
| `ui/MainMenu.tsx` | + botão "Jogar contra Amigo" |
| `App.tsx` | Rota PvP, `useMultiplayer`, sync automático após ação |
| `firebase/index.ts` | Re-exports atualizados |

---

## Fluxo de jogo PvP

1. Host clica **"Jogar contra Amigo"** → `LobbyPage` → cria sala no Firestore
2. Host vê código de 6 letras na tela de espera
3. Guest digita o código → entra na sala → jogo começa para ambos automaticamente
4. A cada fim de turno, quem jogou chama `pushGameState()` → Firestore → adversário recebe via `onSnapshot`
5. Quando `currentPhase === 'GAME_OVER'`, a sala é fechada automaticamente

---

## Limitações do MVP (para migração futura)

- Sem validação server-side: qualquer cliente pode escrever GameState inválido
- Latência: ~150-300ms (aceitável para turno-a-turno)
- Sem reconexão automática em caso de queda de rede

---

## Regras Firestore a configurar (Firebase Console)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /lobbies/{lobbyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (resource.data.hostId == request.auth.uid ||
         resource.data.guestId == request.auth.uid ||
         resource.data.guestId == null);
    }
  }
}
```
