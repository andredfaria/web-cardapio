# Design: Migração para SQLite + Deploy no EasyPanel

**Data:** 2026-04-14
**Status:** Aprovado

## Contexto

O sistema atual usa dois backends diferentes dependendo do ambiente:
- **Produção (Netlify):** Netlify Function → Supabase REST API
- **Dev local:** Express → `db.json` (arquivo JSON plano)

O objetivo é consolidar em um único backend: Express + SQLite, deployado em VPS via EasyPanel (Docker). O SQLite persiste em volume Docker, eliminando dependências externas (Supabase) e simplificando a operação.

## Escopo

- Modificar `server.js` para usar SQLite via `better-sqlite3`
- Adicionar `Dockerfile` e `.dockerignore` para EasyPanel
- Atualizar `package.json` com a dependência
- Atualizar `.gitignore` para excluir `/data`
- Manter `netlify/functions/drinks.js` intocado (Netlify continua funcional)
- Frontend (`js/db.js`, `js/client.js`, `js/admin.js`) sem nenhuma alteração

## Modelo de dados

```sql
CREATE TABLE IF NOT EXISTS drinks (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT    NOT NULL,
  preco REAL    NOT NULL
);
```

Idêntico ao modelo atual. `AUTOINCREMENT` substitui o contador `nextId` do `db.json`.

## Arquitetura

```
EasyPanel (VPS)
└── Container Docker
    ├── /app          ← código da aplicação
    └── /data         ← volume persistente
        └── database.sqlite
```

### Fluxo de boot

1. `fs.mkdirSync('/data', { recursive: true })` — garante que o diretório existe
2. `new Database(DB_PATH)` — abre ou cria o arquivo SQLite
3. `PRAGMA journal_mode = WAL` — ativa WAL para leituras concorrentes
4. `PRAGMA foreign_keys = ON` — integridade referencial ativa
5. `CREATE TABLE IF NOT EXISTS drinks (...)` — idempotente, seguro em todo boot

### Configuração EasyPanel

| Campo | Valor |
|-------|-------|
| Build method | Dockerfile |
| Port | `3001` |
| Volume persistente | `/data` |
| `DB_PATH` env var | `/data/database.sqlite` |

## Arquivos a modificar/criar

| Arquivo | Ação |
|---------|------|
| `server.js` | Modificar — troca db.json por SQLite |
| `package.json` | Modificar — adiciona `better-sqlite3` |
| `.gitignore` | Modificar — adiciona `/data` |
| `Dockerfile` | Criar |
| `.dockerignore` | Criar |

## Boas práticas incluídas

- **WAL mode:** leituras não bloqueiam escritas
- **Statements preparados:** sem risco de SQL injection
- **Idempotência no boot:** `CREATE TABLE IF NOT EXISTS` e `mkdirSync` não quebram em redeploys
- **Volume Docker:** persiste entre deploys e reinicializações do container
- **Variável de ambiente `DB_PATH`:** permite override sem mudar código

## O que NÃO está no escopo

- Sistema de migrações com versionamento (pode ser adicionado depois)
- Autenticação no painel admin (já inexistente, fora do escopo)
- Backup automatizado (recomendado configurar no EasyPanel via cron externo ou snapshot de volume)
