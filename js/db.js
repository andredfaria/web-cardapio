// Camada de acesso a dados via API REST (backend SQLite compartilhado)
const dbOperations = {
    async addDrink(drink) {
        const res = await fetch('/api/drinks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(drink)
        });
        if (!res.ok) throw new Error('Erro ao adicionar drink');
        return (await res.json()).id;
    },

    async getAllDrinks() {
        const res = await fetch('/api/drinks');
        if (!res.ok) throw new Error('Erro ao buscar drinks');
        return res.json();
    },

    async updateDrink(drink) {
        const res = await fetch(`/api/drinks/${drink.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(drink)
        });
        if (!res.ok) throw new Error('Erro ao atualizar drink');
        return res.json();
    },

    async deleteDrink(id) {
        const res = await fetch(`/api/drinks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir drink');
        return res.json();
    },

    async getDrinkById(id) {
        const res = await fetch(`/api/drinks/${id}`);
        if (!res.ok) return null;
        return res.json();
    }
};

window.dbOperations = dbOperations;
