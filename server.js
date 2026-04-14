const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');

// Inicializa o arquivo de banco de dados se não existir
function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ drinks: [], nextId: 1 }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.static(__dirname));

// GET /api/drinks - lista todos
app.get('/api/drinks', (req, res) => {
    const db = loadDB();
    res.json(db.drinks);
});

// GET /api/drinks/:id - busca por id
app.get('/api/drinks/:id', (req, res) => {
    const db = loadDB();
    const drink = db.drinks.find(d => d.id === parseInt(req.params.id));
    if (!drink) return res.status(404).json({ error: 'Drink não encontrado' });
    res.json(drink);
});

// POST /api/drinks - cria novo
app.post('/api/drinks', (req, res) => {
    const { nome, preco } = req.body;
    if (!nome || preco == null) return res.status(400).json({ error: 'nome e preco são obrigatórios' });
    const db = loadDB();
    const drink = { id: db.nextId++, nome, preco: parseFloat(preco) };
    db.drinks.push(drink);
    saveDB(db);
    res.status(201).json(drink);
});

// PUT /api/drinks/:id - atualiza
app.put('/api/drinks/:id', (req, res) => {
    const { nome, preco } = req.body;
    if (!nome || preco == null) return res.status(400).json({ error: 'nome e preco são obrigatórios' });
    const db = loadDB();
    const idx = db.drinks.findIndex(d => d.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Drink não encontrado' });
    db.drinks[idx] = { id: parseInt(req.params.id), nome, preco: parseFloat(preco) };
    saveDB(db);
    res.json(db.drinks[idx]);
});

// DELETE /api/drinks/:id - remove
app.delete('/api/drinks/:id', (req, res) => {
    const db = loadDB();
    const idx = db.drinks.findIndex(d => d.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Drink não encontrado' });
    db.drinks.splice(idx, 1);
    saveDB(db);
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Admin:  http://localhost:${PORT}/admin.html`);
    console.log(`Dados:  ${DB_FILE}`);
});
