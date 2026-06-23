const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

const user = tg?.initDataUnsafe?.user;
const statusEl = document.getElementById("userStatus");
const gridEl = document.getElementById("girlsGrid");
const searchInput = document.getElementById("searchInput");
const detailView = document.getElementById("detailView");
const detailPhoto = document.getElementById("detailPhoto");
const detailType = document.getElementById("detailType");
const detailAge = document.getElementById("detailAge");
const detailName = document.getElementById("detailName");
const detailRole = document.getElementById("detailRole");
const detailDescription = document.getElementById("detailDescription");
const detailChoose = document.getElementById("detailChoose");
const detailClose = document.getElementById("detailClose");
const subscriptionsListEl = document.getElementById("subscriptionsList");

let girlsCache = [];
let currentGirl = null;

if (statusEl) {
    statusEl.textContent = user?.first_name ? `Hello ${user.first_name}` : "Hello Player";
}

// =========================================================
// ВКЛАДКИ
// =========================================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const tab = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`tab-${tab}`);
        if (target) target.classList.add('active');

        if (tab === 'subscriptions') {
            renderSubscriptions();
        }
    });
});

// =========================================================
// ПОДПИСКИ (обновлённые цены)
// =========================================================

const SUBSCRIPTIONS = [
    { id: 'sub_7', title: 'Подписка 7 дней', desc: 'Безлимитное общение на 7 дней', price: '700⭐' },
    { id: 'sub_30', title: 'Подписка 30 дней', desc: 'Безлимитное общение на 30 дней', price: '2000⭐' },
    { id: 'sub_60', title: 'Подписка 60 дней', desc: 'Максимальная экономия', price: '4000⭐' }
];

function renderSubscriptions() {
    if (!subscriptionsListEl) return;

    if (!SUBSCRIPTIONS.length) {
        subscriptionsListEl.innerHTML = '<div class="empty">Подписки временно недоступны.</div>';
        return;
    }

    subscriptionsListEl.innerHTML = '';
    SUBSCRIPTIONS.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'sub-card';
        card.innerHTML = `
            <div class="sub-info">
                <div class="sub-title">${escapeHtml(sub.title)}</div>
                <div class="sub-desc">${escapeHtml(sub.desc)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="sub-price">${escapeHtml(sub.price)}</span>
                <button class="sub-btn" data-sub-id="${escapeHtml(sub.id)}">Купить</button>
            </div>
        `;

        const btn = card.querySelector('.sub-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            buySubscription(sub.id);
        });

        subscriptionsListEl.appendChild(card);
    });
}

function buySubscription(subId) {
    if (!tg) {
        alert('Открой Mini App в Telegram');
        return;
    }

    try {
        const data = JSON.stringify({
            action: 'buy_subscription',
            sub_id: subId
        });
        console.log('📤 Покупка подписки:', data);
        tg.sendData(data);
        tg.close();
    } catch (error) {
        console.error('❌ Ошибка:', error);
        alert('Ошибка при покупке. Попробуй ещё раз.');
    }
}

// =========================================================
// ОТПРАВКА ДАННЫХ В БОТА (исправленная)
// =========================================================

function sendToBot(data) {
    if (!tg) {
        alert('Открой Mini App в Telegram');
        return false;
    }
    
    try {
        const jsonData = JSON.stringify(data);
        console.log('📤 Отправка в бота:', jsonData);
        
        // Прямой вызов через WebApp
        tg.sendData(jsonData);
        
        // Закрываем приложение через 200мс (даём время на отправку)
        setTimeout(() => {
            tg.close();
        }, 200);
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        alert('Ошибка отправки: ' + error.message);
        return false;
    }
}

// =========================================================
// ВЫБОР ПЕРСОНАЖА
// =========================================================

function selectGirl(rawGirl) {
    if (!rawGirl) {
        alert('Персонаж не найден');
        return;
    }
    
    console.log('👤 Выбран персонаж:', rawGirl.id, rawGirl.name);
    console.log('📤 Отправка данных в бот...');
    
    const result = sendToBot({
        action: "select_girl",
        girl_id: rawGirl.id
    });
    
    if (!result) {
        alert('Не удалось отправить данные в бот. Проверь консоль.');
    }
}

// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function cleanDescription(text, maxLines = 2) {
    return (text || "")
        .replace(/\*/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, maxLines)
        .join(" ");
}

function getCharacterQuote(girl) {
    const description = girl?.description || "";
    const lines = description
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    return lines.length ? lines[lines.length - 1] : cleanDescription(girl?.role || description, 2);
}

function girlAge(girl) {
    if (!girl?.age) return "";
    return Number.isFinite(Number(girl.age)) ? `${girl.age} years` : String(girl.age);
}

function normalizeGirl(girl) {
    return {
        ...girl,
        name: girl.name_en || girl.name,
        age: girl.age_en || girl.age,
        role: girl.role_en || girl.role,
        type: girl.type_en || girl.type,
        description: girl.description_en || girl.description,
    };
}

// =========================================================
// РЕНДЕР ПЕРСОНАЖЕЙ
// =========================================================

function renderGirls(girls) {
    if (!gridEl) return;
    if (!girls || !girls.length) {
        gridEl.innerHTML = '<div class="empty">Персонажи не найдены.</div>';
        return;
    }
    
    gridEl.innerHTML = "";
    girls.forEach((rawGirl) => {
        const girl = normalizeGirl(rawGirl);
        const button = document.createElement("button");
        button.className = "card";
        button.type = "button";
        
        const coverHtml = girl.photo_url
            ? `<div class="cover"><img src="${escapeHtml(girl.photo_url)}" alt=""></div>`
            : `<div class="fallback">${escapeHtml((girl.name || "?").slice(0, 1))}</div>`;
        
        button.innerHTML = `
            ${coverHtml}
            ${girl.type ? `<span class="badge">${escapeHtml(girl.type)}</span>` : ""}
            <div class="card-body">
                <span class="name">${escapeHtml(girl.name || "Character")}</span>
                <div class="meta-row">
                    <span>${escapeHtml(girlAge(girl))}</span>
                </div>
            </div>
        `;
        
        button.addEventListener("click", () => {
            console.log('🖱️ Клик по карточке:', girl.id);
            openDetail(rawGirl);
        });
        
        gridEl.appendChild(button);
    });
}

// =========================================================
// ДЕТАЛЬНЫЙ ПРОСМОТР
// =========================================================

function openDetail(rawGirl) {
    const girl = normalizeGirl(rawGirl);
    currentGirl = rawGirl;
    if (!detailView) return;
    
    detailPhoto.innerHTML = girl.photo_url
        ? `<img src="${escapeHtml(girl.photo_url)}" alt="${escapeHtml(girl.name || "Character")}">`
        : `<div class="fallback">${escapeHtml((girl.name || "?").slice(0, 1))}</div>`;
    
    detailType.textContent = girl.type || "";
    detailAge.textContent = girlAge(girl);
    detailName.textContent = girl.name || "Character";
    detailRole.textContent = girl.role || "";
    detailDescription.textContent = getCharacterQuote(girl);
    detailChoose.textContent = `✅ Выбрать ${girl.name || "персонажа"}`;
    
    detailView.classList.add("open");
    detailView.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeDetail() {
    currentGirl = null;
    detailView?.classList.remove("open");
    detailView?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

// =========================================================
// ФИЛЬТРЫ
// =========================================================

function applyFilters() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const filtered = girlsCache.filter((girl) => {
        const haystack = [
            girl.name,
            girl.name_en,
            girl.role,
            girl.role_en,
            girl.description,
            girl.description_en,
            girl.type,
            girl.type_en,
        ].join(" ").toLowerCase();
        return !query || haystack.includes(query);
    });
    renderGirls(filtered);
}

// =========================================================
// ЗАГРУЗКА ДАННЫХ
// =========================================================

function loadGirls() {
    girlsCache = window.STATIC_GIRLS || [];
    console.log('📦 Загружено персонажей:', girlsCache.length);
    renderGirls(girlsCache);
}

// =========================================================
// EVENTS
// =========================================================

detailChoose?.addEventListener("click", () => {
    console.log('🖱️ Клик по кнопке "Выбрать"');
    if (currentGirl) {
        selectGirl(currentGirl);
    } else {
        alert('Персонаж не выбран');
    }
});

detailClose?.addEventListener("click", closeDetail);
detailView?.addEventListener("click", (event) => {
    if (event.target === detailView) closeDetail();
});

searchInput?.addEventListener("input", applyFilters);

// =========================================================
// INIT
// =========================================================

loadGirls();
renderSubscriptions();

console.log('✅ Mini App загружен');
console.log('📱 Telegram WebApp доступен:', !!tg);
console.log('🔑 User:', user);
