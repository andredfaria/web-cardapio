const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function json(statusCode, body) {
    return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

// Chamada genérica para a API REST do Supabase
async function db(path, { method = 'GET', body, prefer } = {}) {
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
    };
    if (prefer) headers['Prefer'] = prefer;

    const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        throw new Error(data?.message || `Supabase error ${res.status}`);
    }
    return data;
}

// Extrai o ID do caminho original (event.rawUrl preserva a URL do browser)
function extractId(event) {
    let pathname = '';
    try {
        pathname = new URL(event.rawUrl).pathname;
    } catch {
        pathname = event.path || '';
    }
    const match = pathname.match(/\/api\/drinks\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: HEADERS, body: '' };
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return json(500, { error: 'Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não configuradas' });
    }

    const id = extractId(event);

    try {
        switch (event.httpMethod) {
            case 'GET': {
                if (id !== null) {
                    const rows = await db(`/drinks?id=eq.${id}&select=*`);
                    if (!rows.length) return json(404, { error: 'Drink não encontrado' });
                    return json(200, rows[0]);
                }
                const drinks = await db('/drinks?select=*&order=id');
                return json(200, drinks);
            }

            case 'POST': {
                const { nome, preco } = JSON.parse(event.body || '{}');
                if (!nome || preco == null) return json(400, { error: 'nome e preco são obrigatórios' });
                const rows = await db('/drinks', {
                    method: 'POST',
                    body: { nome, preco: parseFloat(preco) },
                    prefer: 'return=representation',
                });
                return json(201, rows[0]);
            }

            case 'PUT': {
                if (id === null) return json(400, { error: 'ID obrigatório' });
                const { nome, preco } = JSON.parse(event.body || '{}');
                if (!nome || preco == null) return json(400, { error: 'nome e preco são obrigatórios' });
                const rows = await db(`/drinks?id=eq.${id}`, {
                    method: 'PATCH',
                    body: { nome, preco: parseFloat(preco) },
                    prefer: 'return=representation',
                });
                if (!rows.length) return json(404, { error: 'Drink não encontrado' });
                return json(200, rows[0]);
            }

            case 'DELETE': {
                if (id === null) return json(400, { error: 'ID obrigatório' });
                await db(`/drinks?id=eq.${id}`, { method: 'DELETE' });
                return json(200, { ok: true });
            }

            default:
                return json(405, { error: 'Método não permitido' });
        }
    } catch (err) {
        console.error('Erro na função drinks:', err);
        return json(500, { error: err.message || 'Erro interno do servidor' });
    }
};
