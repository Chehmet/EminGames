document.addEventListener('DOMContentLoaded', () => {

    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    let currentKid = 'emin'; // Ребенок по умолчанию

    // --- ЭЛЕМЕНТЫ DOM ---
    const greetingEl = document.getElementById('greeting');
    const cardTitleEl = document.getElementById('card-title');
    const timeMessageEl = document.getElementById('time-message');
    const timesUpOverlay = document.getElementById('times-up-overlay');
    
    const eminVisualizer = document.getElementById('emin-visualizer');
    const carEl = document.getElementById('cartoon-car');
    
    const samiraVisualizer = document.getElementById('samira-visualizer');
    const flowerStemEl = document.getElementById('flower-stem');

    const sound = new Audio('/static/sounds/time_up.mp3');

    // --- ФУНКЦИИ API ---

    // Функция для получения данных о ребенке
    async function fetchKidData(kidName) {
        try {
            const response = await fetch(`/api/kidstatus/${kidName}/`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            updateUI(kidName, data);
        } catch (error) {
            console.error('Could not fetch time data:', error);
            timeMessageEl.innerText = 'Oops! Could not load time.';
        }
    }

    // Функция для добавления времени
    async function addBonusTime(kidName) {
        const password = prompt("Parents only! Please enter the password:");
        if (!password) return;

        try {
            const response = await fetch(`/api/add-time/${kidName}/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ password: password })
            });
            const result = await response.json();
            if (!response.ok) {
                alert(`Error: ${result.error || 'Something went wrong'}`);
            } else {
                alert("Success! 10 minutes added.");
                fetchKidData(kidName); // Обновляем данные на экране
            }
        } catch (error) {
            console.error('Error adding time:', error);
        }
    }

    // Функция для списания времени
    async function logWatchedTime(kidName) {
        const inputEl = document.getElementById('minutes-watched-input');
        const minutes = parseInt(inputEl.value, 10);

        if (isNaN(minutes) || minutes <= 0) {
            alert("Please enter a valid number of minutes.");
            return;
        }

        try {
            const response = await fetch(`/api/log-time/${kidName}/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ minutes: minutes })
            });
            if (!response.ok) throw new Error('Failed to log time');
            
            inputEl.value = ''; // Очищаем поле ввода
            fetchKidData(kidName); // Обновляем данные
        } catch (error) {
            console.error('Error logging time:', error);
        }
    }

    // --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---

    function updateUI(kidName, data) {
        // Обновляем общие элементы
        greetingEl.innerHTML = `Hi, ${kidName.charAt(0).toUpperCase() + kidName.slice(1)}! 👋 Let's check your time!`;
        
        const { remaining_minutes, total_minutes } = data;

        if (remaining_minutes > 0) {
            timeMessageEl.innerHTML = `You can watch for <strong>${remaining_minutes}</strong> minutes.`;
            timesUpOverlay.classList.add('hidden');
        } else {
            timeMessageEl.innerHTML = `Time is up for today!`;
            timesUpOverlay.classList.remove('hidden');
            sound.play();
        }

        // Вычисляем процент оставшегося времени
        const timeUsedPercentage = ((total_minutes - remaining_minutes) / total_minutes) * 100;
        const cappedPercentage = Math.max(0, Math.min(100, timeUsedPercentage));

        // Обновляем визуализатор в зависимости от ребенка
        if (kidName === 'emin') {
            eminVisualizer.classList.remove('hidden');
            samiraVisualizer.classList.add('hidden');
            cardTitleEl.innerHTML = 'TV & Cartoons Today 📺';
            // 85% - чтобы машинка не уезжала за трек
            carEl.style.left = `${cappedPercentage * 0.85}%`;
        } else if (kidName === 'samira') {
            samiraVisualizer.classList.remove('hidden');
            eminVisualizer.classList.add('hidden');
            cardTitleEl.innerHTML = 'Grow your Flower 🌸';
            // Высота стебля от 0% до 100% от 150px
            flowerStemEl.style.height = `${(100 - cappedPercentage) / 100 * 150}px`;
        }
    }
    
    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    document.getElementById('switch-emin').addEventListener('click', () => {
        currentKid = 'emin';
        document.getElementById('switch-emin').classList.add('active');
        document.getElementById('switch-samira').classList.remove('active');
        fetchKidData(currentKid);
    });

    document.getElementById('switch-samira').addEventListener('click', () => {
        currentKid = 'samira';
        document.getElementById('switch-samira').classList.add('active');
        document.getElementById('switch-emin').classList.remove('active');
        fetchKidData(currentKid);
    });

    document.getElementById('read-book-btn').addEventListener('click', () => {
        addBonusTime(currentKid);
    });

    document.getElementById('log-time-btn').addEventListener('click', () => {
        logWatchedTime(currentKid);
    });


    // --- ПЕРВЫЙ ЗАПУСК ---
    fetchKidData(currentKid);
});