const { getStore } = require('@netlify/blobs');

const HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function json(statusCode, body) {
    return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

async function getDB(store) {
    const data = await store.get('drinks-db', { type: 'json' });
    return data || { drinks: [], nextId: 1 };
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: HEADERS, body: '' };
    }

    const store = getStore({ name: 'cardapio', consistency: 'strong' });

    // Extrai o ID do path: /api/drinks/5 → id = 5
    const match = (event.path || '').match(/\/api\/drinks\/(\d+)/);
    const id = match ? parseInt(match[1]) : null;

    try {
        switch (event.httpMethod) {
            case 'GET': {
                const db = await getDB(store);
                if (id !== null) {
                    const drink = db.drinks.find(d => d.id === id);
                    if (!drink) return json(404, { error: 'Drink não encontrado' });
                    return json(200, drink);
                }
                return json(200, db.drinks);
            }

            case 'POST': {
                const { nome, preco } = JSON.parse(event.body || '{}');
                if (!nome || preco == null) return json(400, { error: 'nome e preco são obrigatórios' });
                const db = await getDB(store);
                const drink = { id: db.nextId++, nome, preco: parseFloat(preco) };
                db.drinks.push(drink);
                await store.setJSON('drinks-db', db);
                return json(201, drink);
            }

            case 'PUT': {
                if (!id) return json(400, { error: 'ID obrigatório' });
                const { nome, preco } = JSON.parse(event.body || '{}');
                if (!nome || preco == null) return json(400, { error: 'nome e preco são obrigatórios' });
                const db = await getDB(store);
                const idx = db.drinks.findIndex(d => d.id === id);
                if (idx === -1) return json(404, { error: 'Drink não encontrado' });
                db.drinks[idx] = { id, nome, preco: parseFloat(preco) };
                await store.setJSON('drinks-db', db);
                return json(200, db.drinks[idx]);
            }

            case 'DELETE': {
                if (!id) return json(400, { error: 'ID obrigatório' });
                const db = await getDB(store);
                const idx = db.drinks.findIndex(d => d.id === id);
                if (idx === -1) return json(404, { error: 'Drink não encontrado' });
                db.drinks.splice(idx, 1);
                await store.setJSON('drinks-db', db);
                return json(200, { ok: true });
            }

            default:
                return json(405, { error: 'Método não permitido' });
        }
    } catch (err) {
        console.error('Erro na função drinks:', err);
        return json(500, { error: 'Erro interno do servidor' });
    }
};
