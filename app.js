const tg = window.Telegram?.WebApp;

// Создаем элемент для отладки
const debugPanel = document.createElement('div');
debugPanel.id = 'debug-panel';
debugPanel.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.9);
    color: #0f0;
    padding: 10px;
    font-size: 11px;
    font-family: monospace;
    max-height: 150px;
    overflow-y: auto;
    z-index: 10000;
    display: none;
`;
document.body.appendChild(debugPanel);

function debugLog(message, color = '#0f0') {
    console.log(message);
    const line = document.createElement('div');
    line.style.color = color;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    debugPanel.appendChild(line);
    debugPanel.style.display = 'block';
    debugPanel.scrollTop = debugPanel.scrollHeight;
}

if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
    debugLog('✅ Telegram Web App инициализирован');
    debugLog(`Platform: ${tg.platform}`);
    debugLog(`Version: ${tg.version}`);
    debugLog(`sendData: ${typeof tg.sendData}`);
    debugLog(`openTelegramLink: ${typeof tg.openTelegramLink}`);
    debugLog(`initData: ${tg.initData ? '✅ есть' : '❌ нет'}`);
    if (tg.initDataUnsafe?.user) {
        debugLog(`User: ${tg.initDataUnsafe.user.first_name} (${tg.initDataUnsafe.user.id})`);
    }
} else {
    debugLog('⚠️ Открыто не в Telegram Web App', '#ff0');
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
// ПОДПИСКИ
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
        alert('❌ Открой Mini App в Telegram');
        return;
    }
    
    console.log('💎 Запрос на покупку подписки:', subId);
    
    const subscription = SUBSCRIPTIONS.find(sub => sub.id === subId);
    if (!subscription) {
        alert('❌ Подписка не найдена');
        return;
    }
    
    showNotification(`Обработка ${subscription.title}...`, '#2196F3');
    
    try {
        // Вариант 1: Попытка отправить через sendData
        const payload = JSON.stringify({ 
            action: 'buy_subscription', 
            sub_id: subId,
            title: subscription.title,
            price: subscription.price
        });
        
        console.log('📤 Попытка sendData:', payload);
        
        if (typeof tg.sendData === 'function') {
            console.log('✅ sendData доступен, отправляем...');
            tg.sendData(payload);
            console.log('✅ sendData вызван');
        } else {
            console.warn('⚠️ sendData недоступен, используем deep link');
            // Вариант 2: Deep link как fallback
            const botUsername = 'Svinina_bot';
            const deepLink = `https://t.me/${botUsername}?start=sub_${subId}`;
            console.log('📤 Открываем deep link:', deepLink);
            tg.openTelegramLink(deepLink);
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
        // Вариант 3: Deep link при ошибке
        try {
            const botUsername = 'Svinina_bot';
            const deepLink = `https://t.me/${botUsername}?start=sub_${subId}`;
            console.log('📤 Fallback: открываем deep link:', deepLink);
            tg.openTelegramLink(deepLink);
        } catch (linkError) {
            console.error('❌ Ошибка deep link:', linkError);
            alert('❌ Ошибка: ' + linkError.message);
        }
    }
}



function selectGirl(rawGirl) {
    if (!rawGirl || !rawGirl.id) {
        debugLog('❌ Персонаж не найден', '#f00');
        alert('❌ Персонаж не найден');
        return;
    }
    
    debugLog(`👤 Выбран персонаж: ${rawGirl.id} (${rawGirl.name})`);
    
    if (!tg) {
        debugLog('❌ Telegram Web App не инициализирован', '#f00');
        alert('❌ Telegram Web App не инициализирован');
        return;
    }
    
    showNotification(`Выбор персонажа ${rawGirl.name}...`, '#4CAF50');
    
    try {
        const payload = JSON.stringify({ 
            action: 'select_girl', 
            girl_id: rawGirl.id,
            girl_name: rawGirl.name
        });
        
        debugLog(`📤 Payload: ${payload}`, '#0ff');
        
        if (typeof tg.sendData === 'function') {
            debugLog('✅ Используем sendData()');
            tg.sendData(payload);
            debugLog('✅ sendData() вызван, ожидание закрытия...');
        } else {
            debugLog('⚠️ sendData недоступен, используем deep link', '#ff0');
            const botUsername = 'Svinina_bot';
            const deepLink = `https://t.me/${botUsername}?start=select_${rawGirl.id}`;
            debugLog(`🔗 Deep link: ${deepLink}`, '#0ff');
            tg.openTelegramLink(deepLink);
            debugLog('✅ openTelegramLink() вызван');
        }
        
        closeDetail();
    } catch (error) {
        debugLog(`❌ Ошибка: ${error.message}`, '#f00');
        console.error('❌ Ошибка:', error);
        
        try {
            debugLog('🔄 Fallback: пробуем deep link', '#ff0');
            const botUsername = 'Svinina_bot';
            const deepLink = `https://t.me/${botUsername}?start=select_${rawGirl.id}`;
            debugLog(`🔗 Deep link: ${deepLink}`, '#0ff');
            tg.openTelegramLink(deepLink);
            debugLog('✅ Fallback openTelegramLink() вызван');
        } catch (linkError) {
            debugLog(`❌ Fallback ошибка: ${linkError.message}`, '#f00');
            alert('❌ Ошибка: ' + linkError.message);
        }
    }
}

// =========================================================
// ОСТАЛЬНЫЕ ФУНКЦИИ
// =========================================================

function showNotification(text, color = '#4CAF50') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; 
        background: ${color}; color: white; padding: 12px 20px;
        border-radius: 8px; z-index: 9999; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 2000);
}

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
    const lines = description.split("\n").map(l => l.trim()).filter(Boolean);
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
        button.addEventListener("click", () => openDetail(rawGirl));
        gridEl.appendChild(button);
    });
}

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

function applyFilters() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const filtered = girlsCache.filter((girl) => {
        const haystack = [
            girl.name, girl.name_en, girl.role, girl.role_en,
            girl.description, girl.description_en, girl.type, girl.type_en
        ].join(" ").toLowerCase();
        return !query || haystack.includes(query);
    });
    renderGirls(filtered);
}

function loadGirls() {
    girlsCache = window.STATIC_GIRLS || [];
    renderGirls(girlsCache);
}

// =========================================================
// EVENTS
// =========================================================

detailChoose?.addEventListener("click", () => {
    if (currentGirl) selectGirl(currentGirl);
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
console.log('📱 Бот: Svinina_bot');
