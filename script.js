import { db, userId } from './firebase.js';

// Состояние игры
const gameState = {
    gold: 0,
    depth: 0,
    currentPickaxe: 'wood',
    ownedPickaxes: { wood: true },
    upgrades: {
        backpack: { level: 1, cost: 100 },
        autoClicker: { level: 0, cost: 500 },
        luck: { level: 1, cost: 200 }
    },
    stats: {
        totalMined: 0,
        deepestMine: 0
    }
};

// Данные о кирках
const pickaxesData = {
    wood: { name: "Деревянная", power: 1, cost: 0, sprite: "wood.png", description: "Базовая кирка" },
    stone: { name: "Каменная", power: 3, cost: 100, sprite: "stone.png", description: "+10% к углю" },
    iron: { name: "Железная", power: 5, cost: 500, sprite: "iron.png", description: "Шанс 2x урона" },
    gold: { name: "Золотая", power: 8, cost: 2000, sprite: "gold.png", description: "+30% к золоту" },
    diamond: { name: "Алмазная", power: 12, cost: 10000, sprite: "diamond.png", description: "Игнор твёрдости" },
    mithril: { name: "Мифриловая", power: 20, cost: 50000, sprite: "mithril.png", description: "Автоклик 1/сек" },
    dragon: { name: "Драконья", power: 50, cost: 250000, sprite: "dragon.png", description: "Взрывы руды" },
    legendary: { name: "Легендарная", power: 100, cost: 1000000, sprite: "legendary.png", description: "Шанс x10 дропа" }
};

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    renderPickaxes();
    renderUpgrades();
    setupEventListeners();
    
    // Автокликер
    setInterval(autoMine, 1000);
});

// Загрузка игры из Firebase
async function loadGame() {
    try {
        const doc = await db.collection('players').doc(userId).get();
        if (doc.exists) {
            const data = doc.data();
            Object.assign(gameState, data);
            updateUI();
            showNotification('Игра загружена!');
        }
    } catch (error) {
        console.error("Ошибка загрузки:", error);
    }
}

// Сохранение игры в Firebase
async function saveGame() {
    try {
        await db.collection('players').doc(userId).set(gameState);
        showNotification('Игра сохранена!');
    } catch (error) {
        console.error("Ошибка сохранения:", error);
    }
}

// Рендер списка кирок
function renderPickaxes() {
    const grid = document.getElementById('pickaxes-grid');
    grid.innerHTML = '';

    for (const [id, data] of Object.entries(pickaxesData)) {
        const owned = gameState.ownedPickaxes[id] || false;
        const isCurrent = gameState.currentPickaxe === id;
        
        const item = document.createElement('div');
        item.className = `pickaxe-item ${owned ? 'owned' : ''} ${isCurrent ? 'current' : ''}`;
        item.innerHTML = `
            <img src="assets/pickaxes/${data.sprite}" alt="${data.name}">
            <h3>${data.name}</h3>
            <p>${data.description}</p>
            <p>Сила: ${data.power}</p>
            ${!owned ? `<p class="price">Цена: ${data.cost} золота</p>` : ''}
            ${owned ? `<p class="owned">${isCurrent ? 'ЭКИПИРОВАНА' : 'КУПЛЕНА'}</p>` : ''}
        `;
        
        item.addEventListener('click', () => handlePickaxeClick(id, data));
        grid.appendChild(item);
    }
}

// Рендер улучшений
function renderUpgrades() {
    const grid = document.getElementById('upgrades-grid');
    grid.innerHTML = '';

    for (const [id, data] of Object.entries(gameState.upgrades)) {
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        item.innerHTML = `
            <img src="assets/upgrades/${id}.png" alt="${id}">
            <h3>${getUpgradeName(id)}</h3>
            <p>Уровень: ${data.level}</p>
            <p class="price">Цена: ${data.cost} золота</p>
        `;
        
        item.addEventListener('click', () => handleUpgradeClick(id));
        grid.appendChild(item);
    }
}

// Обработка клика по кирке
function handlePickaxeClick(id, data) {
    // Если кирка уже куплена - экипируем
    if (gameState.ownedPickaxes[id]) {
        gameState.currentPickaxe = id;
        updateUI();
        renderPickaxes();
        showNotification(`Экипирована ${data.name} кирка!`);
        return;
    }
    
    // Пытаемся купить
    if (gameState.gold >= data.cost) {
        gameState.gold -= data.cost;
        gameState.ownedPickaxes[id] = true;
        gameState.currentPickaxe = id;
        updateUI();
        renderPickaxes();
        showNotification(`Куплена ${data.name} кирка!`);
    } else {
        showNotification('Недостаточно золота!', 'error');
    }
}

// Обработка клика по улучшению
function handleUpgradeClick(id) {
    const upgrade = gameState.upgrades[id];
    
    if (gameState.gold >= upgrade.cost) {
        gameState.gold -= upgrade.cost;
        upgrade.level += 1;
        upgrade.cost = Math.floor(upgrade.cost * 2.5);
        
        // Применяем эффект улучшения
        applyUpgradeEffect(id);
        
        updateUI();
        renderUpgrades();
        showNotification(`Улучшено ${getUpgradeName(id)} до уровня ${upgrade.level}!`);
    } else {
        showNotification('Недостаточно золота!', 'error');
    }
}

// Применение эффектов улучшений
function applyUpgradeEffect(id) {
    switch (id) {
        case 'backpack':
            // Увеличиваем максимальную грузоподъемность
            break;
        case 'autoClicker':
            // Увеличиваем скорость автокликера
            break;
        case 'luck':
            // Увеличиваем шанс на редкие ресурсы
            break;
    }
}

// Добыча ресурсов
function mine() {
    const pickaxe = pickaxesData[gameState.currentPickaxe];
    let goldEarned = pickaxe.power;
    
    // Учитываем глубину
    goldEarned += Math.floor(gameState.depth / 10);
    
    // Учитываем улучшения
    goldEarned *= (1 + gameState.upgrades.luck.level * 0.1);
    
    // Рандомные события
    if (Math.random() < 0.05) {
        const event = triggerRandomEvent();
        goldEarned *= event.multiplier;
        showNotification(event.message, event.type);
    }
    
    gameState.gold += Math.floor(goldEarned);
    gameState.depth += 1;
    gameState.stats.totalMined += goldEarned;
    
    if (gameState.depth > gameState.stats.deepestMine) {
        gameState.stats.deepestMine = gameState.depth;
    }
    
    updateUI();
    playMiningAnimation();
}

// Автоматическая добыча
function autoMine() {
    const autoClickerLevel = gameState.upgrades.autoClicker.level;
    if (autoClickerLevel > 0) {
        for (let i = 0; i < autoClickerLevel; i++) {
            mine();
        }
    }
}

// Рандомные события
function triggerRandomEvent() {
    const events = [
        { 
            message: "Найдена золотая жила! x3 золота!", 
            multiplier: 3, 
            type: "success" 
        },
        { 
            message: "Обвал! Потеряно 50% золота.", 
            multiplier: 0.5, 
            type: "error" 
        },
        { 
            message: "Сундук с сокровищами! +500 золота!", 
            multiplier: 1, 
            bonus: 500,
            type: "success" 
        }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    if (randomEvent.bonus) {
        gameState.gold += randomEvent.bonus;
    }
    
    return randomEvent;
}

// Обновление интерфейса
function updateUI() {
    document.getElementById('gold-value').textContent = gameState.gold.toLocaleString();
    document.getElementById('depth-value').textContent = `${gameState.depth}m`;
    
    const depthPercent = Math.min(100, gameState.depth / 100 * 100);
    document.getElementById('depth-fill').style.width = `${depthPercent}%`;
    
    const pickaxeImg = document.getElementById('pickaxe-img');
    pickaxeImg.src = `assets/pickaxes/${pickaxesData[gameState.currentPickaxe].sprite}`;
}

// Анимация добычи
function playMiningAnimation() {
    const animation = document.getElementById('miner-animation');
    animation.style.backgroundImage = `url('assets/ores/${getRandomOre()}.png')`;
    animation.style.animation = 'none';
    void animation.offsetWidth; // Trigger reflow
    animation.style.animation = 'mining 0.3s forwards, ore-pop 0.5s forwards';
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.color = type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#ffffff';
    notification.style.opacity = 1;
    
    setTimeout(() => {
        notification.style.opacity = 0;
    }, 3000);
}

// Вспомогательные функции
function getUpgradeName(id) {
    const names = {
        backpack: "Увеличить рюкзак",
        autoClicker: "Автокликер",
        luck: "Удача"
    };
    return names[id] || id;
}

function getRandomOre() {
    const ores = ['coal', 'iron', 'gold', 'diamond'];
    const weights = [0.5, 0.3, 0.15, 0.05];
    
    let random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < ores.length; i++) {
        sum += weights[i];
        if (random <= sum) return ores[i];
    }
    
    return 'coal';
}

function setupEventListeners() {
    document.getElementById('mine-btn').addEventListener('click', mine);
    document.getElementById('save-btn').addEventListener('click', saveGame);
    
    // Лидерборд
    const modal = document.getElementById('leaderboard-modal');
    document.getElementById('leaderboard-btn').addEventListener('click', async () => {
        modal.style.display = 'block';
        await showLeaderboard();
    });
    
    document.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Показать таблицу лидеров
async function showLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '<li>Загрузка...</li>';
    
    try {
        const snapshot = await db.collection('players')
            .orderBy('stats.deepestMine', 'desc')
            .limit(10)
            .get();
        
        leaderboardList.innerHTML = '';
        
        if (snapshot.empty) {
            leaderboardList.innerHTML = '<li>Нет данных</li>';
            return;
        }
        
        let rank = 1;
        snapshot.forEach(doc => {
            const player = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${rank}. Глубина: ${player.stats.deepestMine}m</span>
                ${player.gold ? `<span> | Золото: ${player.gold.toLocaleString()}</span>` : ''}
            `;
            leaderboardList.appendChild(li);
            rank++;
        });
    } catch (error) {
        console.error("Ошибка загрузки лидерборда:", error);
        leaderboardList.innerHTML = '<li>Ошибка загрузки</li>';
    }
}
