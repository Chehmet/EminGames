document.addEventListener('DOMContentLoaded', () => {

    // --- КОНФИГУРАЦИЯ ---
    // URL вашего реального API
    const API_URL = 'https://backend.gcrm.online/api/v1/finance/kidstatus';
    
    // ВАЖНО: Укажите здесь, сколько ВСЕГО минут в день у Эмина.
    // Например, если ему разрешено 1.5 часа, то это 90 минут.
    // Это нужно, чтобы правильно рассчитать положение машинки на треке.
    const TOTAL_CARTOON_MINUTES = 90; // <-- ИЗМЕНИТЕ ЭТО ЗНАЧЕНИЕ ПРИ НЕОБХОДИМОСТИ

    const timeUpSound = new Audio('/static/sounds/time_up.mp3');

    // --- ОСНОВНАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ ---
    async function fetchDataAndUpdateUI() {
        try {
            // Делаем запрос к вашему реальному API
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Could not connect to the server.');
            }
            const data = await response.json();

            // API возвращает часы, например 1.5. Мы переводим их в минуты.
            const remainingHours = data.allowed_tv_hours;
            const remainingMinutes = Math.round(remainingHours * 60);

            // Обновляем UI
            updateCard('cartoon', remainingMinutes, TOTAL_CARTOON_MINUTES);

        } catch (error) {
            console.error('Could not fetch time data:', error);
            document.getElementById('cartoon-message').innerText = 'Oops! Could not load time. Please tell Dad.';
        }
    }

    // --- ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ КАРТОЧКИ ---
    function updateCard(category, remainingMinutes, totalMinutes) {
        const messageEl = document.getElementById(`${category}-message`);
        const carEl = document.getElementById(`${category}-car`);
        const timesUpEl = document.getElementById(`${category}-times-up`);

        if (remainingMinutes > 0) {
            timesUpEl.style.display = 'none';
            messageEl.innerHTML = `Emin, you can watch for <strong>${remainingMinutes}</strong> minutes. <br> Ask for permission from your parents.`;

            let timeUsedPercentage = 0;
            if (totalMinutes > 0) {
                timeUsedPercentage = ((totalMinutes - remainingMinutes) / totalMinutes) * 100;
            }
            
            if (timeUsedPercentage > 100) timeUsedPercentage = 100;
            if (timeUsedPercentage < 0) timeUsedPercentage = 0;

            carEl.style.left = `${timeUsedPercentage * 0.85}%`;

        } else {
            timesUpEl.style.display = 'flex';
            messageEl.innerHTML = `Time is up for today!`;
            carEl.style.left = `85%`;
            timeUpSound.play();
        }
    }
    
    const bookButton = document.getElementById('read-book-btn');
    bookButton.addEventListener('click', () => {
        alert("Great job reading a book, Emin! Let's ask mom or dad to add your bonus time!");
    });

    // --- ЗАПУСК ---
    fetchDataAndUpdateUI();
});