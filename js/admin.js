document.addEventListener('DOMContentLoaded', () => {
    const drinkForm = document.getElementById('drink-form');
    const drinksList = document.getElementById('drinks-list');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');
    const drinkIdInput = document.getElementById('drink-id');
    const nomeInput = document.getElementById('nome');
    const precoInput = document.getElementById('preco');

    let isEditing = false;

    // Load and render drinks
    async function renderDrinks() {
        const drinks = await window.dbOperations.getAllDrinks();
        drinksList.innerHTML = '';

        if (drinks.length === 0) {
            drinksList.innerHTML = '<p style="text-align:center; color:#999;">Nenhum drink cadastrado.</p>';
            return;
        }

        drinks.forEach(drink => {
            const drinkElement = document.createElement('div');
            drinkElement.className = 'list-item';
            drinkElement.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${drink.nome}</span>
                    <span class="item-price">R$ ${parseFloat(drink.preco).toFixed(2)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-accent btn-small edit-btn" data-id="${drink.id}">Editar</button>
                    <button class="btn-danger btn-small delete-btn" data-id="${drink.id}">Excluir</button>
                </div>
            `;
            drinksList.appendChild(drinkElement);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => editDrink(parseInt(e.target.dataset.id)));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteDrink(parseInt(e.target.dataset.id)));
        });
    }

    // Handle form submission
    drinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const drink = {
            nome: nomeInput.value,
            preco: parseFloat(precoInput.value)
        };

        if (isEditing) {
            drink.id = parseInt(drinkIdInput.value);
            await window.dbOperations.updateDrink(drink);
            resetForm();
        } else {
            await window.dbOperations.addDrink(drink);
            drinkForm.reset();
        }

        renderDrinks();
    });

    // Edit drink
    async function editDrink(id) {
        const drink = await window.dbOperations.getDrinkById(id);
        if (drink) {
            drinkIdInput.value = drink.id;
            nomeInput.value = drink.nome;
            precoInput.value = drink.preco;
            
            isEditing = true;
            formTitle.textContent = 'Editar Drink';
            submitBtn.textContent = 'Salvar Alterações';
            cancelBtn.style.display = 'block';
            
            // Scroll to form
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Delete drink
    async function deleteDrink(id) {
        if (confirm('Deseja realmente excluir este drink?')) {
            await window.dbOperations.deleteDrink(id);
            renderDrinks();
        }
    }

    // Reset form
    function resetForm() {
        isEditing = false;
        drinkForm.reset();
        drinkIdInput.value = '';
        formTitle.textContent = 'Cadastrar Drink';
        submitBtn.textContent = 'Adicionar';
        cancelBtn.style.display = 'none';
    }

    cancelBtn.addEventListener('click', resetForm);

    // Initial load
    renderDrinks();
});
