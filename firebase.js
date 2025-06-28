// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAykmMO7Nw6i2UMy4OG1qrmQhE6MIX-ZDQ",
    authDomain: "pixel-miner-tycoon.firebaseapp.com",
    projectId: "pixel-miner-tycoon",
    storageBucket: "pixel-miner-tycoon.firebasestorage.app",
    messagingSenderId: "454320889233",
    appId: "1:454320889233:web:4f858c93b98a6d022f8e30"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Получаем ID пользователя Telegram
let userId = 'guest';
if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
    userId = Telegram.WebApp.initDataUnsafe.user.id.toString();
}

// Экспортируем необходимые функции
export { db, userId };
