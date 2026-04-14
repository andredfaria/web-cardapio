# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Execução

### Produção (Netlify)
Deploy normal pelo Netlify — conecta o repositório e faz deploy automático. Os dados ficam salvos no Netlify Blobs (armazenamento nativo do Netlify, configurado automaticamente).

### Desenvolvimento local — opção 1: servidor Express (simples)
```bash
npm install
npm start          # porta 3001 — dados salvos em db.json
```

### Desenvolvimento local — opção 2: Netlify CLI (simula produção)
```bash
npm install -g netlify-cli
netlify login
netlify link       # vincula ao site no Netlify
netlify dev        # porta 8888 — usa Netlify Blobs real
```

## Arquitetura

PWA com backend serverless para cardápio de drinks. Dois contextos de uso separados por página:

- **`index.html` + `js/client.js`** — visão do cliente: navega entre 4 telas via `showView(viewId)` (menu → modal de seleção → resumo do pedido → confirmação com PIX). O carrinho é mantido em memória (array `cart`).
- **`admin.html` + `js/admin.js`** — painel admin: CRUD completo de drinks (criar, editar, excluir).
- **`js/db.js`** — camada de acesso via API REST. Expõe `window.dbOperations` com os métodos `addDrink`, `getAllDrinks`, `updateDrink`, `deleteDrink`, `getDrinkById`. Chama `/api/drinks` via `fetch`.
- **`netlify/functions/drinks.js`** — Netlify Function que responde a todas as rotas `/api/drinks/*`. Persiste dados no Netlify Blobs (chave `drinks-db` no store `cardapio`).
- **`netlify.toml`** — configura build e redireciona `/api/drinks` e `/api/drinks/*` para a função.
- **`server.js`** — servidor Express alternativo para dev local sem Netlify CLI. Persiste em `db.json`.
- **`sw.js`** — Service Worker com cache estático (cache-first). Rotas `/api/*` sempre ignoram o cache. Ao modificar assets, incremente `CACHE_NAME`.
- **`css/style.css`** — folha de estilos compartilhada entre `index.html` e `admin.html`.

## Pontos importantes

- O carrinho (`cart`) existe apenas em memória em `client.js` — não é persistido.
- No Netlify, os dados ficam no Netlify Blobs e são compartilhados entre todos os usuários.
- Em dev local com `npm start`, os dados ficam em `db.json` (gitignored).
- A chave PIX está hardcoded em `index.html` (`#pix-key`).
- Não há autenticação no painel admin — qualquer usuário com acesso à URL pode gerenciar o cardápio.
