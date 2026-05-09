# Firebase Setup — Implementação

**Data:** 2026-05-05  
**Status:** ✅ Implementado (aguardando credenciais reais)

---

## O que foi criado

### Arquivos novos

| Arquivo | Descrição |
|--------|-----------|
| `client/.env` | Variáveis de ambiente (credenciais Firebase) |
| `client/src/firebase/firebaseConfig.ts` | Inicializa o app Firebase |
| `client/src/firebase/auth.ts` | Registro, login (email + Google), logout |
| `client/src/firebase/firestore.ts` | Perfis, partidas, ranking |
| `client/src/firebase/index.ts` | Barrel export (re-exporta tudo) |
| `client/src/hooks/useAuth.ts` | Hook React para estado de autenticação |

### Dependências instaladas

```
firebase@^11.x
```

---

## Como preencher as credenciais

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto → **Configurações do Projeto** → **Seus apps** → Web
3. Copie o objeto `firebaseConfig`
4. Abra `/home/fernando/hexum/client/.env` e substitua cada `YOUR_*_HERE`

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=hexum-XXXX.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hexum-XXXX
VITE_FIREBASE_STORAGE_BUCKET=hexum-XXXX.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

> ⚠️ O arquivo `.env` já está no `.gitignore` — nunca será enviado ao GitHub.

---

## Serviços Firebase necessários (habilitar no Console)

- [x] **Authentication** → Email/Senha + Google
- [x] **Firestore Database** → Criar no modo `produção` ou `teste`

---

## Estrutura do Firestore

```
/users/{uid}
  - displayName: string
  - email: string
  - createdAt: timestamp
  - stats: { wins: number, losses: number, draws: number }

/matches/{matchId}
  - players: string[]
  - winner: string | 'draw'
  - difficulty: string
  - startedAt: timestamp
  - endedAt: timestamp
```

---

## Próximos passos

1. Preencher `.env` com credenciais reais
2. Implementar tela de Login/Registro no `MainMenu`
3. Conectar resultado de partida ao `saveMatchResult()` no `gameStore`
4. Exibir perfil do jogador no HUD
