const Cart = {
    STORAGE_KEY: 'toolmaster_cart',
    
    init() {
        return this.loadCart();
    },
    
    loadCart() {
        const cartData = localStorage.getItem(this.STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : {};
    },
    
    saveCart(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateCartCount();
    },
    
    removeFromCart(productId) {
        const cart = this.loadCart();
        delete cart[productId];
        this.saveCart(cart);
        return cart;
    },
    
    changeCount(productId, delta) {
        const cart = this.loadCart();
        
        if (cart[productId]) {
            cart[productId].count += delta;
            
            if (cart[productId].count <= 0) {
                delete cart[productId];
            }
        }
        
        this.saveCart(cart);
        return cart;
    },
    
    getTotalSum() {
        const cart = this.loadCart();
        let total = 0;
        
        for (const productId in cart) {
            total += cart[productId].price * cart[productId].count;
        }
        
        return total;
    },
    
    getTotalItems() {
        const cart = this.loadCart();
        let total = 0;
        
        for (const productId in cart) {
            total += cart[productId].count;
        }
        
        return total;
    },
    
    updateCartCount() {
        const totalItems = this.getTotalItems();
        const cartIcon = document.querySelector('.fa-shopping-cart');
        
        if (!cartIcon) return;
        
        const oldCounter = document.querySelector('.cart-counter');
        if (oldCounter) oldCounter.remove();
        
        if (totalItems > 0) {
            const counter = document.createElement('span');
            counter.className = 'cart-counter badge bg-danger rounded-pill';
            counter.textContent = totalItems;
            counter.style.cssText = `
                position: absolute;
                top: 0;
                right: 0;
                font-size: 0.6rem;
                padding: 0.2rem 0.4rem;
                transform: translate(50%, -50%);
            `;
            
            const cartLink = cartIcon.closest('a');
            if (cartLink) {
                cartLink.style.position = 'relative';
                cartLink.appendChild(counter);
            }
        }
    },
    
    clearCart() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCartCount();
    }
};

// Функция отображения корзины
function renderCart() {
    const cartContainer = document.getElementById('cart');
    const totalElement = document.getElementById('total-cart-summa');
    
    if (!cartContainer) return;
    
    const cart = Cart.init(); // Загружаем корзину
    const cartItems = Object.values(cart);
    
    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="text-muted">
                        <i class="fas fa-shopping-cart fa-3x mb-3" style="opacity: 0.3;"></i>
                        <p class="h5">Ваша корзина пуста</p>
                        <p>Перейдите в <a href="index.html" class="text-primary">каталог</a> чтобы добавить товары</p>
                    </div>
                </td>
            </tr>
        `;
        if (totalElement) totalElement.textContent = '0';
        return;
    }
    
    // Генерируем HTML таблицы
    let html = '';
    let total = 0;
    
    cartItems.forEach(item => {
        const itemTotal = item.price * item.count;
        total += itemTotal;
        
        html += `
            <tr class="cart-item" data-id="${item.id}">
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.price} ₽</td>
                <td>
                    <div class="d-flex align-items-center justify-content-center">
                        <button class="btn btn-sm btn-outline-secondary js-change-count me-2" 
                                data-id="${item.id}" data-delta="-1">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="js-count" style="min-width: 30px; text-align: center;">${item.count}</span>
                        <button class="btn btn-sm btn-outline-secondary js-change-count ms-2" 
                                data-id="${item.id}" data-delta="1">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
                <td><span class="js-summa">${itemTotal}</span> ₽</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger js-remove-from-cart" 
                            data-id="${item.id}" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    cartContainer.innerHTML = html;
    if (totalElement) totalElement.textContent = total;
    
    // Добавляем обработчики событий
    addCartEventListeners();
}

// Добавление обработчиков событий для корзины
function addCartEventListeners() {
    // Удаление товара
    document.querySelectorAll('.js-remove-from-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            Cart.removeFromCart(productId);
            renderCart();
        });
    });
    
    // Изменение количества
    document.querySelectorAll('.js-change-count').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const delta = parseInt(this.getAttribute('data-delta'));
            Cart.changeCount(productId, delta);
            renderCart();
        });
    });
}

// Инициализация страницы корзины
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем корзину
    Cart.init();
    
    // Отображаем товары
    renderCart();
    
    // Обработчик для оформления заказа
    const orderBtn = document.getElementById('order');
    if (orderBtn) {
        orderBtn.addEventListener('click', function() {
            const cart = Cart.init();
            
            if (Object.keys(cart).length === 0) {
                alert('Корзина пуста! Добавьте товары перед оформлением заказа.');
                return;
            }
            
            // Простая форма оформления заказа
            const modalHtml = `
                <div class="modal fade" id="orderModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Оформление заказа</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="orderForm">
                                    <div class="mb-3">
                                        <label class="form-label">Ваше имя *</label>
                                        <input type="text" class="form-control" name="name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Телефон *</label>
                                        <input type="tel" class="form-control" name="phone" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" name="email">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Адрес доставки</label>
                                        <textarea class="form-control" name="address" rows="2"></textarea>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                                <button type="button" class="btn btn-primary" id="confirmOrder">Подтвердить заказ</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Добавляем модальное окно на страницу
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Инициализируем модальное окно
            const orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
            orderModal.show();
            
            // Подтверждение заказа
            document.getElementById('confirmOrder').addEventListener('click', function() {
                const form = document.getElementById('orderForm');
                const name = form.name.value.trim();
                const phone = form.phone.value.trim();
                
                if (!name || !phone) {
                    alert('Пожалуйста, заполните обязательные поля (имя и телефон)');
                    return;
                }
                
                // Формируем сообщение о заказе
                let orderMessage = `НОВЫЙ ЗАКАЗ\n\n`;
                orderMessage += `Имя: ${name}\n`;
                orderMessage += `Телефон: ${phone}\n`;
                if (form.email.value) orderMessage += `Email: ${form.email.value}\n`;
                if (form.address.value) orderMessage += `Адрес: ${form.address.value}\n`;
                orderMessage += `\nТовары:\n`;
                
                let total = 0;
                for (const productId in cart) {
                    const item = cart[productId];
                    const sum = item.price * item.count;
                    orderMessage += `- ${item.name}: ${item.count} × ${item.price} ₽ = ${sum} ₽\n`;
                    total += sum;
                }
                
                orderMessage += `\nИтого: ${total} ₽`;
                
                // Сохраняем заказ в localStorage для истории
                const orders = JSON.parse(localStorage.getItem('toolmaster_orders') || '[]');
                orders.push({
                    date: new Date().toISOString(),
                    customer: { name, phone, email: form.email.value, address: form.address.value },
                    items: cart,
                    total: total
                });
                localStorage.setItem('toolmaster_orders', JSON.stringify(orders));
                
                // Закрываем модальное окно
                orderModal.hide();
                
                // Очищаем корзину
                Cart.clearCart();
                
                // Показываем сообщение об успехе
                alert('Заказ успешно оформлен!\n\nНомер заказа: #' + Date.now() + '\n\n' + 
                      'С вами свяжется менеджер для подтверждения заказа.');
                
                // Перерисовываем корзину
                renderCart();
                
                // Удаляем модальное окно из DOM
                setTimeout(() => {
                    const modal = document.getElementById('orderModal');
                    if (modal) modal.remove();
                }, 500);
            });
            
            // Очистка при закрытии модального окна
            document.getElementById('orderModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
        });
    }
});
