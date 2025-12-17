// Функции для корзины
const Cart = {
    STORAGE_KEY: 'toolmaster_cart',
    
    // Инициализация корзины
    init() {
        this.loadCart();
        this.updateCartCount();
    },
    
    // Загрузить корзину из localStorage
    loadCart() {
        const cartData = localStorage.getItem(this.STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : {};
    },
    
    // Сохранить корзину в localStorage
    saveCart(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateCartCount();
    },
    
    // Добавить товар в корзину
    addToCart(productId, name, price, image = '') {
        const cart = this.loadCart();
        
        if (cart[productId]) {
            cart[productId].count += 1;
        } else {
            cart[productId] = {
                id: productId,
                name: name,
                price: price,
                image: image,
                count: 1
            };
        }
        
        this.saveCart(cart);
        this.showNotification(`${name} добавлен в корзину!`);
        return cart;
    },
    
    // Удалить товар из корзины
    removeFromCart(productId) {
        const cart = this.loadCart();
        delete cart[productId];
        this.saveCart(cart);
        return cart;
    },
    
    // Изменить количество товара
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
    
    // Получить общую сумму
    getTotalSum() {
        const cart = this.loadCart();
        let total = 0;
        
        for (const productId in cart) {
            total += cart[productId].price * cart[productId].count;
        }
        
        return total;
    },
    
    // Получить количество товаров в корзине
    getTotalItems() {
        const cart = this.loadCart();
        let total = 0;
        
        for (const productId in cart) {
            total += cart[productId].count;
        }
        
        return total;
    },
    
    // Обновить счетчик в шапке
    updateCartCount() {
        const totalItems = this.getTotalItems();
        const cartIcon = document.querySelector('.fa-shopping-cart');
        
        if (!cartIcon) return;
        
        // Удаляем старый счетчик, если есть
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
    
    // Показать уведомление
    showNotification(message) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 300px;
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.3s, transform 0.3s;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <i class="fas fa-check-circle me-2" style="font-size: 1.2rem;"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Удаление через 3 секунды
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // Очистить всю корзину
    clearCart() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCartCount();
    }
};

// Функции инициализации кнопок коззины
function initializeCartButtons() {
    // Обработчики кнопок "В корзину" с классом add-to-cart
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    console.log('Найдено кнопок корзины:', addToCartButtons.length);
    
    if (addToCartButtons.length === 0) return;
    
    addToCartButtons.forEach((button) => {
        // Проверяем, не добавлен ли уже обработчик
        if (button.hasAttribute('data-cart-initialized')) return;
        
        button.setAttribute('data-cart-initialized', 'true');
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = this.getAttribute('data-product-id');
            const name = this.getAttribute('data-product-name');
            const price = parseInt(this.getAttribute('data-product-price')) || 0;
            
            console.log('Добавление товара:', name, price, productId);
            
            // Добавляем в корзину
            Cart.addToCart(productId, name, price);
            
            // Анимация кнопки
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check me-2"></i>Добавлено';
            button.classList.remove('btn-primary');
            button.classList.add('btn-success');
            button.disabled = true;
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('btn-success');
                button.classList.add('btn-primary');
                button.disabled = false;
            }, 1500);
        });
    });
}

// Функции для слайдера
function initializeSlider() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    
    if (!slides.length) return;
    
    let currentSlide = 0;
    
    // Функция для показа слайда
    function showSlide(index) {
        // Корректируем индекс
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;
        
        currentSlide = index;
        
        // Скрываем все слайды
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Показываем текущий слайд
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) {
            dots[currentSlide].classList.add('active');
        }
    }
    
    // Следующий слайд
    function nextSlide() {
        showSlide(currentSlide + 1);
    }
    
    // Предыдущий слайд
    function prevSlide() {
        showSlide(currentSlide - 1);
    }
    
    // Обработчики событий для кнопок
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
        });
    }
    
    // Переход по точкам
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            showSlide(parseInt(this.dataset.slide));
        });
    });
    
    // Инициализация - показываем первый слайд
    showSlide(0);
    
    // Дополнительно: можно добавить управление клавиатурой
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
        }
    });
}
// Функции для формы
function initializeForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    const formMessage = document.getElementById('form-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');
    
    // Валидация поля
    function validateField(field) {
        const value = field.value.trim();
        let error = '';
        
        // Очистка предыдущих ошибок
        field.classList.remove('error', 'valid');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) errorDiv.remove();
        
        // Проверка обязательных полей
        if (field.hasAttribute('required') && !value) {
            error = 'Это поле обязательно для заполнения';
        }
        
        // Проверка email
        else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                error = 'Введите корректный email адрес';
            }
        }
        
        // Проверка телефона (обновленная регулярка)
        else if (field.name === 'phone' && value) {
            // Разрешаем любой формат с цифрами, скобками, пробелами, дефисами и плюсом
            const phoneRegex = /^[\+\d][\d\s\-\(\)]{9,}$/;
            const cleanPhone = value.replace(/\D/g, '');
            
            if (!phoneRegex.test(value) || cleanPhone.length < 10) {
                error = 'Введите корректный номер телефона (минимум 10 цифр)';
            }
        }
        
        // Проверка длины
        else if (field.hasAttribute('minlength') && value.length < parseInt(field.minlength)) {
            error = `Минимум ${field.minlength} символов`;
        }
        else if (field.hasAttribute('maxlength') && value.length > parseInt(field.maxlength)) {
            error = `Максимум ${field.maxlength} символов`;
        }
        
        // Отображение результата
        if (error) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 5px;';
            errorDiv.textContent = error;
            field.parentNode.appendChild(errorDiv);
        } else if (value) {
            field.classList.add('valid');
        }
        
        return !error;
    }
    
    // Валидация всей формы
    function validateForm() {
        let isValid = true;
        const inputs = contactForm.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Сообщения формы
    function showMessage(type, text) {
        if (!formMessage) return;
        
        formMessage.textContent = text;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => formMessage.style.display = 'none', 5000);
        }
    }
    
    // Индикатор загрузки
    function setLoading(isLoading) {
        if (!submitBtn || !btnText || !btnLoader) return;
        
        submitBtn.disabled = isLoading;
        btnText.style.display = isLoading ? 'none' : 'inline';
        btnLoader.style.display = isLoading ? 'inline-flex' : 'none';
    }
    
    // Валидация при потере фокуса
    contactForm.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', function() {
            this.classList.remove('error', 'valid');
            const errorDiv = this.parentNode.querySelector('.field-error');
            if (errorDiv) errorDiv.remove();
        });
    });
    
    // Отправка формы
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            showMessage('error', 'Исправьте ошибки в форме');
            return;
        }
        
        setLoading(true);
        showMessage('info', 'Отправка...');
        
        try {
            const response = await fetch(this.action, {
                method: 'POST',
                body: new FormData(this),
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                showMessage('success', 'Сообщение отправлено! Мы скоро свяжемся с вами.');
                contactForm.reset();
                contactForm.querySelectorAll('.valid').forEach(el => el.classList.remove('valid'));
            } else {
                showMessage('error', 'Ошибка отправки. Попробуйте еще раз.');
            }
        } catch {
            showMessage('error', 'Ошибка сети. Проверьте соединение.');
        } finally {
            setLoading(false);
        }
    });
}

// Фунцкции для навигации
function initializeNavigation() {
    // Плавная прокрутка
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (!target) return;
            
            e.preventDefault();
            
            // Прокрутка
            const header = document.querySelector('.navbar');
            const offset = header ? header.offsetHeight : 0;
            const position = target.offsetTop - offset;
            
            window.scrollTo({
                top: position,
                behavior: 'smooth'
            });
        });
    });
}

// Инициализация всего
document.addEventListener('DOMContentLoaded', () => {
    Cart.init();
    
    initializeCartButtons();
    
    initializeSlider();
    
    initializeForm();
    
    initializeNavigation();
});
