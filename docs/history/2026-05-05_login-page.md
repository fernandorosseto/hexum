# Login Page — Tela Cheia Antes do Menu

**Data:** 2026-05-05  
**Status:** ✅ Implementado

---

## Fluxo de navegação

```
App carrega
    │
    ├── authLoading == true
    │       └── 🔄 Spinner "Carregando..."
    │
    ├── user == null
    │       └── 📄 LoginPage (tela cheia)
    │               ├── Tab Login → email + senha | Google
    │               └── Tab Registro → nome + email + senha | Google
    │
    └── user != null
            └── 🏠 MainMenu (menu principal)
                    ├── Pill com avatar + nome + email + botão Sair
                    └── Botões: Iniciar Batalha / Sandbox
```

---

## Arquivos modificados

| Arquivo | Alteração |
|--------|-----------|
| `client/src/ui/LoginPage.tsx` | Criado — página de login tela cheia |
| `client/src/App.tsx` | Auth gate: loading spinner + redirect para LoginPage |
| `client/src/ui/MainMenu.tsx` | Removida lógica de login — só exibe pill de usuário logado |
| `client/src/ui/AuthModal.tsx` | Mantido (pode ser reaproveitado futuramente) |

---

## LoginPage — design

- Background com imagem do jogo + overlay escuro
- Logo Hexum centralizada com glow âmbar
- Card de login com glass-morphism
- Tabs animadas (Login / Registro)
- Campo de nome aparece com animação no modo Registro
- Mensagens de erro em pt-BR
- Botão Google com ícone SVG real
- Footer sutil com copyright

---

## Próximos passos sugeridos

1. Salvar resultado de partidas no Firestore (`saveMatchResult`)
2. Exibir ranking de jogadores
3. Página de perfil do usuário com estatísticas
