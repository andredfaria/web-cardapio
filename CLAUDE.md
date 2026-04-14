# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Execução

O projeto requer o servidor Node.js para persistência compartilhada:

```bash
# Instalar dependências (apenas na primeira vez)
npm install

# Iniciar servidor (porta 3001)
npm start
# Acesse http://localhost:3001

# Modo desenvolvimento com hot-reload
npm run dev
```

Não há testes automatizados, lint ou typecheck configurados — tudo é vanilla HTML/CSS/JS no frontend.

## Arquitetura

PWA com backend Node.js/Express para cardápio de drinks. Dois contextos de uso separados por página:

- **`index.html` + `js/client.js`** — visão do cliente: navega entre 4 telas via `showView(viewId)` (menu → modal de seleção → resumo do pedido → confirmação com PIX). O carrinho é mantido em memória (array `cart`).
- **`admin.html` + `js/admin.js`** — painel admin: CRUD completo de drinks (criar, editar, excluir).
- **`js/db.js`** — camada de acesso via API REST. Expõe `window.dbOperations` com os métodos `addDrink`, `getAllDrinks`, `updateDrink`, `deleteDrink`, `getDrinkById`. Toda persistência passa por aqui através de `fetch` para o backend.
- **`server.js`** — servidor Express. Serve os arquivos estáticos e expõe a API REST (`/api/drinks`). Persiste os dados em `db.json`.
- **`db.json`** — banco de dados JSON local (gitignored). Criado automaticamente na primeira execução.
- **`sw.js`** — Service Worker com cache estático (cache-first). Rotas `/api/*` sempre ignoram o cache. Ao modificar assets, incremente `CACHE_NAME` para forçar atualização nos clientes.
- **`css/style.css`** — folha de estilos compartilhada entre `index.html` e `admin.html`.

## Pontos importantes

- O carrinho (`cart`) existe apenas em memória em `client.js` — não é persistido.
- Os dados do cardápio são compartilhados entre todos os usuários via `db.json` no servidor.
- A chave PIX está hardcoded em `index.html` (`#pix-key`).
- O Service Worker usa cache-first para assets estáticos, mas chamadas `/api/*` sempre vão ao servidor.
- Não há autenticação no painel admin — qualquer usuário com acesso à URL pode gerenciar o cardápio.
