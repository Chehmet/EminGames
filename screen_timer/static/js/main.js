document.addEventListener('DOMContentLoaded', () => {

    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    let currentKid = 'emin';

    // --- ЭЛЕМЕНТЫ DOM ---
    const greetingEl = document.getElementById('greeting');
    const cardTitleEl = document.getElementById('card-title');
    const timeMessageEl = document.getElementById('time-message');
    const timesUpOverlay = document.getElementById('times-up-overlay');
    const eminVisualizer = document.getElementById('emin-visualizer');
    const carEl = document.getElementById('cartoon-car');
    const samiraVisualizer = document.getElementById('samira-visualizer');
    const flowerStemEl = document.getElementById('flower-stem');

    // Элементы модального окна
    const passwordModalOverlay = document.getElementById('password-modal-overlay');
    const modalContentWrapper = document.getElementById('modal-content-wrapper');
    const modalButtons = document.getElementById('modal-buttons');
    const passwordInput = document.getElementById('password-input');
    const confirmPasswordBtn = document.getElementById('confirm-password-btn');
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const passwordFeedbackEl = document.getElementById('password-feedback');

    const sound = new Audio('/static/sounds/time_up.mp3');

    // --- ФУНКЦИИ API ---

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
    
    async function submitBonusTime(kidName) {
        const password = passwordInput.value;
        if (!password) {
            showPasswordFeedback("Please enter a password.", "error");
            return;
        }

        try {
            const response = await fetch(`/api/add-time/${kidName}/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ password: password })
            });
            const result = await response.json();

            if (!response.ok) {
                showPasswordFeedback(result.error || 'Something went wrong', "error");
                passwordInput.value = '';
                passwordInput.focus();
            } else {
                // УСПЕХ! Показываем сообщение и закрываем окно через 1.5 секунды
                showPasswordFeedback("Success! 10 minutes added.", "success");
                modalContentWrapper.classList.add('hidden'); // Скрываем поля
                modalButtons.classList.add('hidden');
                
                setTimeout(() => {
                    hidePasswordModal();
                    fetchKidData(kidName);
                }, 1500); // Ждем 1.5 секунды
            }
        } catch (error) {
            showPasswordFeedback('Could not connect to the server.', "error");
            console.error('Error adding time:', error);
        }
    }

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
            
            inputEl.value = '';
            fetchKidData(kidName);
        } catch (error) {
            console.error('Error logging time:', error);
        }
    }

    // --- УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ---
    function showPasswordFeedback(message, type) {
        passwordFeedbackEl.textContent = message;
        passwordFeedbackEl.className = 'password-feedback'; // Сброс классов
        passwordFeedbackEl.classList.add(type); // Добавляем 'error' или 'success'
        passwordFeedbackEl.classList.remove('hidden');
    }

    function resetPasswordModal() {
        passwordFeedbackEl.classList.add('hidden');
        passwordInput.value = '';
        modalContentWrapper.classList.remove('hidden');
        modalButtons.classList.remove('hidden');
    }

    function showPasswordModal() {
        resetPasswordModal();
        passwordModalOverlay.classList.remove('hidden');
        passwordInput.focus();
    }

    function hidePasswordModal() {
        passwordModalOverlay.classList.add('hidden');
    }

    // --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---
    function updateUI(kidName, data) {
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
        const timeUsedPercentage = ((total_minutes - remaining_minutes) / total_minutes) * 100;
        const cappedPercentage = Math.max(0, Math.min(100, timeUsedPercentage));
        if (kidName === 'emin') {
            eminVisualizer.classList.remove('hidden');
            samiraVisualizer.classList.add('hidden');
            cardTitleEl.innerHTML = 'TV & Cartoons Today 📺';
            carEl.style.left = `${cappedPercentage * 0.85}%`;
        } else if (kidName === 'samira') {
            samiraVisualizer.classList.remove('hidden');
            eminVisualizer.classList.add('hidden');
            cardTitleEl.innerHTML = 'Grow your Flower 🌸';
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
    document.getElementById('read-book-btn').addEventListener('click', showPasswordModal);
    document.getElementById('log-time-btn').addEventListener('click', () => logWatchedTime(currentKid));
    
    confirmPasswordBtn.addEventListener('click', () => submitBonusTime(currentKid));
    cancelPasswordBtn.addEventListener('click', hidePasswordModal);
    closeModalBtn.addEventListener('click', hidePasswordModal);
    passwordModalOverlay.addEventListener('click', (event) => {
        if (event.target === passwordModalOverlay) {
            hidePasswordModal();
        }
    });

    // Добавляем обработчик нажатия Enter
    passwordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            // Предотвращаем стандартное поведение формы (если оно есть)
            event.preventDefault(); 
            submitBonusTime(currentKid);
        }
    });

    // --- ПЕРВЫЙ ЗАПУСК ---
    fetchKidData(currentKid);
});