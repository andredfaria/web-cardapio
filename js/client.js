document.addEventListener('DOMContentLoaded', () => {
    let cart = [];
    let currentSelectedDrink = null;
    let currentQty = 1;

    const drinksList = document.getElementById('client-drinks-list');
    const cartCount = document.getElementById('cart-count');
    const viewOrderBtn = document.getElementById('view-order-btn');
    const orderItemsList = document.getElementById('order-items-list');
    const orderTotal = document.getElementById('order-total');
    const finalTotal = document.getElementById('final-total');
    const modal = document.getElementById('selection-modal');
    const modalDrinkName = document.getElementById('modal-drink-name');
    const modalDrinkPrice = document.getElementById('modal-drink-price');
    const modalQty = document.getElementById('modal-qty');

    // Navigation
    window.showView = (viewId) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        
        if (viewId === 'view-summary') {
            renderOrderSummary();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Load and render drinks for menu
    async function renderMenu() {
        const drinks = await window.dbOperations.getAllDrinks();
        drinksList.innerHTML = '';

        if (drinks.length === 0) {
            drinksList.innerHTML = '<p style="text-align:center; color:#999; margin-top: 50px;">Ainda não há drinks no cardápio.</p>';
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
                    <button class="btn-accent" onclick="openSelectionModal(${drink.id})">Selecionar</button>
                </div>
            `;
            drinksList.appendChild(drinkElement);
        });
    }

    // Modal Operations
    window.openSelectionModal = async (id) => {
        const drink = await window.dbOperations.getDrinkById(id);
        if (drink) {
            currentSelectedDrink = drink;
            currentQty = 1;
            modalDrinkName.textContent = drink.nome;
            modalDrinkPrice.textContent = `R$ ${parseFloat(drink.preco).toFixed(2)}`;
            modalQty.textContent = currentQty;
            modal.style.display = 'flex';
        }
    };

    window.closeModal = () => {
        modal.style.display = 'none';
        currentSelectedDrink = null;
    };

    window.updateQty = (delta) => {
        currentQty += delta;
        if (currentQty < 1) currentQty = 1;
        modalQty.textContent = currentQty;
    };

    // Cart Operations
    window.addToCart = () => {
        if (currentSelectedDrink) {
            // Check if already in cart
            const existing = cart.find(item => item.id === currentSelectedDrink.id);
            if (existing) {
                existing.qty += currentQty;
            } else {
                cart.push({
                    id: currentSelectedDrink.id,
                    nome: currentSelectedDrink.nome,
                    preco: currentSelectedDrink.preco,
                    qty: currentQty
                });
            }
            
            updateCartUI();
            closeModal();
        }
    };

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        cartCount.textContent = totalItems;
        viewOrderBtn.style.display = totalItems > 0 ? 'block' : 'none';
    }

    function renderOrderSummary() {
        orderItemsList.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const subtotal = item.preco * item.qty;
            total += subtotal;

            const element = document.createElement('div');
            element.className = 'list-item';
            element.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.nome} x ${item.qty}</span>
                    <span class="item-price">Subtotal: R$ ${subtotal.toFixed(2)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-danger btn-small" onclick="removeFromCart(${index})">Remover</button>
                </div>
            `;
            orderItemsList.appendChild(element);
        });

        orderTotal.textContent = total.toFixed(2);
    }

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderOrderSummary();
        updateCartUI();
        
        if (cart.length === 0) {
            showView('view-menu');
        }
    };

    // Finalize
    window.finalizeOrder = () => {
        const total = cart.reduce((sum, item) => sum + (item.preco * item.qty), 0);
        finalTotal.textContent = total.toFixed(2);
        showView('view-confirmation');
    };

    window.copyPixKey = () => {
        const key = document.getElementById('pix-key').textContent;
        navigator.clipboard.writeText(key).then(() => {
            const feedback = document.getElementById('copy-feedback');
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 2000);
        });
    };

    window.newOrder = () => {
        cart = [];
        updateCartUI();
        showView('view-menu');
    };

    // Initial load
    renderMenu();
});
