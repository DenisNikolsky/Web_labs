/* ---------- Данные ---------- */
const products = [
  { id: 1,  title: "Кружка",                 price: 500,          emoji: "☕"  },
  { id: 2,  title: "Термос",                 price: 1500,         emoji: "🥤"  },
  { id: 3,  title: "Плед",                   price: 2000,         emoji: "🛋️" },
  { id: 4,  title: "Лампа",                  price: 1200,         emoji: "💡"  },
  { id: 5,  title: "Рюкзак",                 price: 3000,         emoji: "🎒"  },
  { id: 6,  title: "Наушники",               price: 2500,         emoji: "🎧"  },
  { id: 7,  title: "Губозакаточная машинка", price: 999999,       emoji: "🌀"  },
  { id: 8,  title: "Принтер для денег",      price: 1000000,      emoji: "🖨️" },
  { id: 9,  title: "МКС",                    price: 150000000000, emoji: "🛰️" },
  { id: 10, title: "Билет из Саратова",      price: 500,          emoji: "🎫"  },
];

const STORAGE_KEY = "shop-cart";

/* ---------- Элементы DOM ---------- */
const productsContainer = document.getElementById("products");
const cartList = document.getElementById("cart-list");
const cartEmpty = document.getElementById("cart-empty");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");
const orderModal = document.getElementById("order-modal");
const orderForm = document.getElementById("order-form");
const closeModalBtn = document.getElementById("close-modal");

/* ---------- Состояние ---------- */
let cart = loadCart();

/* ---------- Работа с localStorage ---------- */
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

/* ---------- Форматирование ---------- */
function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ---------- Отрисовка ---------- */
function renderProducts() {
  productsContainer.innerHTML = products
    .map(
      (product) => `
      <article class="product-card">
        <div class="product-card__emoji">${product.emoji}</div>
        <h3>${product.title}</h3>
        <p class="price">${formatPrice(product.price)}</p>
        ${product.id === 10 ? '<p class="product-note">Только в одну сторону 😉</p>' : ""}
        <button class="btn btn-primary" type="button" data-add="${product.id}">
          В корзину
        </button>
      </article>
    `
    )
    .join("");
}

function renderCart() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) cartCount.textContent = totalCount;

  if (cart.length === 0) {
    cartList.innerHTML = "";
    cartEmpty.hidden = false;
    cartTotal.textContent = formatPrice(0);
    return;
  }

  cartEmpty.hidden = true;

  cartList.innerHTML = cart
    .map(
      (item) => `
      <li class="cart-item">
        <div class="cart-item__title">${item.title}</div>
        <div class="cart-item__row">
          <div class="quantity-controls">
            <button type="button" data-decrease="${item.id}">−</button>
            <input
              type="number"
              min="1"
              step="1"
              value="${item.quantity}"
              data-quantity="${item.id}"
              aria-label="Количество ${item.title}"
            >
            <button type="button" data-increase="${item.id}">+</button>
          </div>
          <strong class="cart-item__price">${formatPrice(item.price * item.quantity)}</strong>
          <button class="btn btn-danger" type="button" data-remove="${item.id}">
            Удалить
          </button>
        </div>
      </li>
    `
    )
    .join("");

  updateTotal();
}

function updateTotal() {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatPrice(total);
}

/* ---------- Логика корзины ---------- */
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
    });
  }

  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
}

function changeQuantity(productId, delta) {
  const item = cart.find((item) => item.id === productId);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  renderCart();
}

function setQuantity(productId, value) {
  const item = cart.find((item) => item.id === productId);
  if (!item) return;

  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    item.quantity = 1;
  } else {
    item.quantity = quantity;
  }

  saveCart();
  renderCart();
}

/* ---------- События каталога и корзины ---------- */
productsContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  addToCart(Number(button.dataset.add));
});

cartList.addEventListener("click", (event) => {
  const decrease = event.target.closest("[data-decrease]");
  const increase = event.target.closest("[data-increase]");
  const remove = event.target.closest("[data-remove]");

  if (decrease) changeQuantity(Number(decrease.dataset.decrease), -1);
  if (increase) changeQuantity(Number(increase.dataset.increase), 1);
  if (remove) removeFromCart(Number(remove.dataset.remove));
});

cartList.addEventListener("change", (event) => {
  const input = event.target.closest("[data-quantity]");
  if (!input) return;
  setQuantity(Number(input.dataset.quantity), input.value);
});

/* ---------- Валидация формы ---------- */
const phoneRegex = /^\+?[0-9\s\-()]{10,18}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function showError(input, message) {
  input.classList.add("invalid");
  const errorEl = orderForm.querySelector(`[data-error-for="${input.name}"]`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("visible");
  }
}

function clearError(input) {
  input.classList.remove("invalid");
  const errorEl = orderForm.querySelector(`[data-error-for="${input.name}"]`);
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("visible");
  }
}

function validateRequired(input, message) {
  if (!input.value.trim()) {
    showError(input, message);
    return false;
  }
  clearError(input);
  return true;
}

function validatePhone(input) {
  const value = input.value.trim();

  if (!value) {
    showError(input, "Укажите номер телефона");
    return false;
  }

  const digits = value.replace(/[^\d]/g, "");

  if (!phoneRegex.test(value)) {
    showError(input, "Телефон должен содержать только цифры, пробелы, +, -, скобки");
    return false;
  }

  if (digits.length < 10 || digits.length > 15) {
    showError(input, "В номере должно быть от 10 до 15 цифр");
    return false;
  }

  clearError(input);
  return true;
}

function validateEmail(input) {
  const value = input.value.trim();

  // Email необязателен — если пусто, всё ок
  if (!value) {
    clearError(input);
    return true;
  }

  if (!emailRegex.test(value)) {
    showError(input, "Введите корректный email");
    return false;
  }

  clearError(input);
  return true;
}

/* ---------- Автоформатирование телефона ---------- */
const phoneInput = orderForm.elements.phone;

phoneInput.addEventListener("input", () => {
  let digits = phoneInput.value.replace(/\D/g, "");

  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }

  if (digits.startsWith("9")) {
    digits = "7" + digits;
  }

  if (digits.startsWith("7")) {
    let result = "+7";
    if (digits.length > 1) result += " (" + digits.slice(1, 4);
    if (digits.length >= 5) result += ") " + digits.slice(4, 7);
    if (digits.length >= 8) result += "-" + digits.slice(7, 9);
    if (digits.length >= 10) result += "-" + digits.slice(9, 11);
    phoneInput.value = result;
  } else {
    phoneInput.value = digits;
  }
});

phoneInput.addEventListener("blur", () => validatePhone(phoneInput));

/* ---------- Открытие / закрытие модального окна ---------- */
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Корзина пуста");
    return;
  }
  orderModal.showModal();
});

closeModalBtn.addEventListener("click", () => {
  orderModal.close();
});

/* ---------- Сброс ошибок при вводе ---------- */
["firstName", "lastName", "address"].forEach((name) => {
  const input = orderForm.elements[name];
  input.addEventListener("input", () => clearError(input));
});

const emailInput = orderForm.elements.email;

emailInput.addEventListener("input", () => {
  clearError(emailInput);
});

emailInput.addEventListener("blur", () => {
  if (emailInput.value.trim() !== "") {
    validateEmail(emailInput);
  }
});

/* ---------- Отправка формы ---------- */
orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const firstName = orderForm.elements.firstName;
  const lastName = orderForm.elements.lastName;
  const address = orderForm.elements.address;
  const phone = orderForm.elements.phone;
  const email = orderForm.elements.email;

  const isFirstNameOk = validateRequired(firstName, "Укажите имя");
  const isLastNameOk = validateRequired(lastName, "Укажите фамилию");
  const isAddressOk = validateRequired(address, "Укажите адрес доставки");
  const isPhoneOk = validatePhone(phone);
  const isEmailOk = validateEmail(email);

  const isValid =
    isFirstNameOk &&
    isLastNameOk &&
    isAddressOk &&
    isPhoneOk &&
    isEmailOk;

  if (!isValid) {
    const firstInvalid = orderForm.querySelector("input.invalid");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  alert("Заказ создан!");

  orderForm.reset();
  orderModal.close();

  orderForm
    .querySelectorAll(".field-error")
    .forEach((el) => el.classList.remove("visible"));
  orderForm
    .querySelectorAll("input.invalid")
    .forEach((el) => el.classList.remove("invalid"));

  cart = [];
  saveCart();
  renderCart();
});

/* ---------- Инициализация ---------- */
renderProducts();
renderCart();