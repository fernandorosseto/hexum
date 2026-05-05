# Firebase Integration — Hexum

**Data:** 2026-05-05  
**Status:** 🟡 Planejamento

---

## Objetivo

Integrar o Firebase ao projeto Hexum para habilitar:

- 🔐 **Autenticação** de jogadores (email/senha, Google)
- 🗄️ **Firestore** para persistência de dados (partidas, ranking, histórico)
- 📡 **Realtime** para partidas multiplayer futuras
- ☁️ **Hosting** (opcional, atualmente no Vercel)

---

## Checklist de Setup Inicial

### 1. Firebase Console
- [ ] Criar conta/email dedicado para o projeto (`hexum@...`)
- [ ] Criar projeto no Firebase Console
- [ ] Habilitar **Authentication** (Email/Senha + Google)
- [ ] Criar banco **Firestore** (modo produção ou teste)
- [ ] Registrar app Web e obter `firebaseConfig`

### 2. Instalação no Projeto

```bash
cd /home/fernando/hexum/client
npm install firebase
```

### 3. Arquivos a criar

```
client/src/
└── firebase/
    ├── firebaseConfig.ts    ← credenciais (via .env)
    ├── auth.ts              ← funções de autenticação
    └── firestore.ts         ← funções de banco de dados
```

### 4. Variáveis de ambiente (`.env`)

Adicionar ao `client/.env` (nunca commitar com valores reais):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Estrutura Firestore (Proposta)

```
/users/{uid}
  - displayName: string
  - email: string
  - createdAt: timestamp
  - stats: { wins, losses, draws }

/matches/{matchId}
  - players: [uid1, uid2]
  - winner: uid | 'draw'
  - startedAt: timestamp
  - endedAt: timestamp
  - gameLog: array (opcional)
```

---

## Próximos passos

1. Obter o `firebaseConfig` do console
2. Criar `firebaseConfig.ts` com as credenciais via `import.meta.env`
3. Implementar tela de Login/Registro
4. Integrar autenticação ao estado global (`store/`)
5. Salvar resultado das partidas no Firestore

---

> **Nota:** Aguardando criação do projeto no Firebase Console para prosseguir com a implementação.
