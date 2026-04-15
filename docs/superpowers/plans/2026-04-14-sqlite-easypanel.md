# SQLite + EasyPanel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o backend de persistência (db.json / Supabase) por SQLite via `better-sqlite3`, com Dockerfile pronto para deploy no EasyPanel.

**Architecture:** Express.js existente em `server.js` passa a usar `better-sqlite3` (síncrono) abrindo um arquivo SQLite em `/data/database.sqlite`. O diretório `/data` é mapeado para um volume Docker persistente no EasyPanel. O banco é criado automaticamente no primeiro boot com `CREATE TABLE IF NOT EXISTS`. O frontend e a Netlify Function permanecem intocados.

**Tech Stack:** Node.js 20, Express 4, better-sqlite3, Docker (node:20-alpine)

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `package.json` | Modificar | Adicionar dependência `better-sqlite3` |
| `server.js` | Modificar | Trocar db.json por SQLite (todos os endpoints) |
| `.gitignore` | Modificar | Adicionar `/data` |
| `Dockerfile` | Criar | Build da imagem para EasyPanel |
| `.dockerignore` | Criar | Excluir arquivos desnecessários da imagem |

---

## Task 1: Adicionar `better-sqlite3` ao projeto

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar a dependência**

```bash
npm install better-sqlite3
```

Saída esperada: algo como `added 1 package` sem erros. O `package-lock.json` será atualizado automaticamente.

- [ ] **Step 2: Verificar que a dependência aparece no package.json**

```bash
node -e "require('better-sqlite3'); console.log('OK')"
```

Saída esperada: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: adicionar better-sqlite3"
```

---

## Task 2: Reescrever `server.js` com SQLite

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Substituir o conteúdo de server.js**

Substituir o arquivo inteiro por:

```javascript
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'database.sqlite');

// Garante que o diretório existe antes de abrir o banco
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Abre (ou cria) o banco e configura pragmas
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Cria a tabela se ainda não existir — idempotente em todo boot
db.exec(`
    CREATE TABLE IF NOT EXISTS drinks (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        nome  TEXT    NOT NULL,
        preco REAL    NOT NULL
    )
`);

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/drinks', (req, res) => {
    const drinks = db.prepare('SELECT * FROM drinks ORDER BY id').all();
    res.json(drinks);
});

app.get('/api/drinks/:id', (req, res) => {
    const drink = db.prepare('SELECT * FROM drinks WHERE id = ?').get(parseInt(req.params.id));
    if (!drink) return res.status(404).json({ error: 'Drink não encontrado' });
    res.json(drink);
});

app.post('/api/drinks', (req, res) => {
    const { nome, preco } = req.body;
    if (!nome || preco == null) return res.status(400).json({ error: 'nome e preco são obrigatórios' });
    const result = db.prepare('INSERT INTO drinks (nome, preco) VALUES (?, ?)').run(nome, parseFloat(preco));
    res.status(201).json({ id: result.lastInsertRowid, nome, preco: parseFloat(preco) });
});

app.put('/api/drinks/:id', (req, res) => {
    const { nome, preco } = req.body;
    if (!nome || preco == null) return res.status(400).json({ error: 'nome e preco são obrigatórios' });
    const id = parseInt(req.params.id);
    const result = db.prepare('UPDATE drinks SET nome = ?, preco = ? WHERE id = ?').run(nome, parseFloat(preco), id);
    if (result.changes === 0) return res.status(404).json({ error: 'Drink não encontrado' });
    res.json({ id, nome, preco: parseFloat(preco) });
});

app.delete('/api/drinks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const result = db.prepare('DELETE FROM drinks WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Drink não encontrado' });
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Banco: ${DB_PATH}`);
});
```

- [ ] **Step 2: Verificar que o servidor inicia sem erros**

```bash
npm start
```

Saída esperada:
```
Servidor rodando em http://localhost:3001
Banco: /caminho/para/cardapio/data/database.sqlite
```

Verificar que o arquivo `data/database.sqlite` foi criado:

```bash
ls -lh data/database.sqlite
```

Saída esperada: arquivo com alguns KB.

- [ ] **Step 3: Testar o CRUD completo**

Com o servidor rodando, em outro terminal:

```bash
# Listar (deve retornar array vazio)
curl http://localhost:3001/api/drinks
# Esperado: []

# Criar
curl -s -X POST http://localhost:3001/api/drinks \
  -H "Content-Type: application/json" \
  -d '{"nome":"Caipirinha","preco":18.5}' | node -e "process.stdin.resume();process.stdin.setEncoding('utf8');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)))"
# Esperado: { id: 1, nome: 'Caipirinha', preco: 18.5 }

# Listar novamente
curl http://localhost:3001/api/drinks
# Esperado: [{"id":1,"nome":"Caipirinha","preco":18.5}]

# Buscar por ID
curl http://localhost:3001/api/drinks/1
# Esperado: {"id":1,"nome":"Caipirinha","preco":18.5}

# Atualizar
curl -s -X PUT http://localhost:3001/api/drinks/1 \
  -H "Content-Type: application/json" \
  -d '{"nome":"Caipirinha de Limão","preco":20}'
# Esperado: {"id":1,"nome":"Caipirinha de Limão","preco":20}

# Deletar
curl -s -X DELETE http://localhost:3001/api/drinks/1
# Esperado: {"ok":true}

# Confirmar deleção
curl http://localhost:3001/api/drinks
# Esperado: []
```

- [ ] **Step 4: Parar o servidor (Ctrl+C) e commitar**

```bash
git add server.js
git commit -m "feat: substituir db.json por SQLite (better-sqlite3)"
```

---

## Task 3: Atualizar `.gitignore`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Adicionar `/data` ao .gitignore**

Abrir `.gitignore` e adicionar ao final:

```
# SQLite local
/data
```

O `db.json` já está no `.gitignore` — não precisa adicionar novamente.

- [ ] **Step 2: Verificar que o diretório data não aparece no git status**

```bash
git status
```

O diretório `data/` não deve aparecer na lista de arquivos não rastreados.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: ignorar diretório /data do SQLite"
```

---

## Task 4: Criar `Dockerfile`

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Criar o Dockerfile**

Criar o arquivo `Dockerfile` na raiz do projeto com o conteúdo:

```dockerfile
FROM node:20-alpine

# better-sqlite3 compila um addon nativo em C++ — requer essas ferramentas
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Instala dependências primeiro (aproveita cache do Docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o restante do código
COPY . .

# Variáveis de ambiente padrão (sobrescritas pelo EasyPanel)
ENV DB_PATH=/data/database.sqlite
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
```

- [ ] **Step 2: Criar `.dockerignore`**

Criar o arquivo `.dockerignore` na raiz do projeto:

```
node_modules
data
db.json
.env
.env.*
.git
.gitignore
docs
```

- [ ] **Step 3: Verificar o build local da imagem**

```bash
docker build -t cardapio-test .
```

Saída esperada: build concluído sem erros, camadas de `npm ci` e compilação do `better-sqlite3` aparecem nos logs.

- [ ] **Step 4: Verificar que o container sobe e responde**

```bash
docker run --rm -p 3001:3001 -v $(pwd)/data-docker:/data cardapio-test
```

Em outro terminal:

```bash
curl http://localhost:3001/api/drinks
```

Saída esperada: `[]`

Parar o container com `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: adicionar Dockerfile para deploy no EasyPanel"
```

---

## Task 5: Configurar no EasyPanel

Esta task é executada na interface do EasyPanel, não no código.

- [ ] **Step 1: Criar novo projeto no EasyPanel**

No painel do EasyPanel, criar um novo serviço do tipo **App**.

- [ ] **Step 2: Conectar o repositório**

Apontar para o repositório Git do projeto (GitHub/GitLab). O EasyPanel detectará o `Dockerfile` automaticamente.

- [ ] **Step 3: Configurar variáveis de ambiente**

No painel de configuração do serviço, adicionar:

| Variável | Valor |
|----------|-------|
| `DB_PATH` | `/data/database.sqlite` |
| `PORT` | `3001` |

- [ ] **Step 4: Configurar volume persistente**

Na seção de volumes do serviço, adicionar:

| Host path (volume EasyPanel) | Container path |
|------------------------------|----------------|
| `cardapio-data` (nome do volume) | `/data` |

- [ ] **Step 5: Configurar porta**

Expor a porta `3001` e configurar o domínio desejado no EasyPanel.

- [ ] **Step 6: Fazer o deploy**

Iniciar o deploy. Nos logs do container deve aparecer:

```
Servidor rodando em http://localhost:3001
Banco: /data/database.sqlite
```

- [ ] **Step 7: Verificar a aplicação em produção**

Acessar `https://seu-dominio/api/drinks` no browser.

Saída esperada: `[]` (banco vazio no primeiro boot).

Acessar `https://seu-dominio/admin.html` e criar um drink pelo painel admin. Verificar que aparece em `https://seu-dominio/api/drinks`.

Fazer um redeploy e verificar que os dados persistem (o volume garante isso).
