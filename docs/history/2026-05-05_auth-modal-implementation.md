# Firebase Auth — Tela de Login Implementada

**Data:** 2026-05-05  
**Status:** ✅ Implementado

---

## O que foi criado nesta sessão

### Novos componentes

| Arquivo | Descrição |
|--------|-----------|
| `client/src/ui/AuthModal.tsx` | Modal de Login / Registro |
| `client/src/hooks/useAuth.ts` | Hook React para estado do usuário |

### Modificações

| Arquivo | Alteração |
|--------|-----------|
| `client/src/ui/MainMenu.tsx` | Integrado botão de login + perfil do usuário |

---

## Fluxo de autenticação

```
MainMenu
├── user == null → botão "Entrar / Criar Conta" → abre AuthModal
│   ├── Tab "Login"    → email + senha  OU  Google
│   └── Tab "Registro" → nome + email + senha  OU  Google
└── user != null → pill com avatar (inicial) + nome + email + botão "Sair"
```

---

## AuthModal — funcionalidades

- ✅ Tabs Login / Registro
- ✅ Email + senha com validação de erros em pt-BR
- ✅ Botão "Continuar com Google" (popup)
- ✅ Fecha ao clicar fora do modal
- ✅ Animações via `framer-motion`

---

## Serviços Firebase em uso

- `Auth` → `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signInWithPopup` (Google), `signOut`
- `Firestore` → cria/atualiza perfil do usuário no login/registro

---

## Próximos passos sugeridos

1. Proteger o botão "Iniciar Batalha" para usuários não autenticados (opcional)
2. Salvar resultado de cada partida no Firestore via `saveMatchResult()`
3. Exibir ranking de jogadores (top wins) em uma tela dedicada
