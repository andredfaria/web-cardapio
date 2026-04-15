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
