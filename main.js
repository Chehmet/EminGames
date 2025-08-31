document.addEventListener('DOMContentLoaded', () => {

    // --- ГЛАВНАЯ КОНФИГУРАЦИЯ ---
    const API_BASE_URL = 'https://backend.gcrm.online/api/v1/finance/; // <-- Прямой адрес вашего API

    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    let currentKid = 'emin';
    const MAX_FAILED_ATTEMPTS = 3;
    const LOCKOUT_DURATION_MINUTES = 10;

    // --- ЭЛЕМЕНТЫ DOM ---
    const greetingEl = document.getElementById('greeting');
    const cardTitleEl = document.getElementById('card-title');
    const timeMessageEl = document.getElementById('time-message');
    const timesUpOverlay = document.getElementById('times-up-overlay');
    const eminVisualizer = document.getElementById('emin-visualizer');
    const carEl = document.getElementById('cartoon-car');
    const samiraVisualizer = document.getElementById('samira-visualizer');
    const flowerStemEl = document.getElementById('flower-stem');

    const passwordModalOverlay = document.getElementById('password-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalButtons = document.getElementById('modal-buttons');
    const passwordInput = document.getElementById('password-input');
    const confirmPasswordBtn = document.getElementById('confirm-password-btn');
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const passwordFeedbackEl = document.getElementById('password-feedback');

    const sound = new Audio('sounds/time_up.mp3');

    // --- ФУНКЦИИ API ---

    async function fetchKidData(kidName) {
        try {
            // Обращаемся к URL для конкретного ребенка
            const response = await fetch(`${API_BASE_URL}/kidstatus/${kidName}/`);
            if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status}`);
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
            const response = await fetch(`${API_BASE_URL}/add-time/${kidName}/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ password: password })
            });
            const result = await response.json();

            if (!response.ok) {
                handleFailedAttempt();
                showPasswordFeedback(result.error || 'Incorrect password', "error");
                passwordInput.value = '';
                passwordInput.focus();
            } else {
                localStorage.removeItem('failedAttempts');
                localStorage.removeItem('lockoutEndTime');
                
                modalTitle.classList.add('hidden');
                modalMessage.classList.add('hidden');
                passwordInput.classList.add('hidden');
                modalButtons.classList.add('hidden');
                showPasswordFeedback("Success! 10 minutes added.", "success");
                
                setTimeout(() => {
                    hidePasswordModal();
                    fetchKidData(kidName);
                }, 2000);
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
            const response = await fetch(`${API_BASE_URL}/log-time/${kidName}/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ minutes: minutes })
            });
            if (!response.ok) throw new Error('Failed to log time');
            
            inputEl.value = '';
            fetchKidData(kidName);
        } catch (error) {
            console.error('Error logging time:', error);
            alert("Oops! Could not save the time. Please try again.");
        }
    }

    // --- УПРАВЛЕНИЕ БЛОКИРОВКОЙ И МОДАЛЬНЫМ ОКНОМ ---
    
    function handleFailedAttempt() {
        let attempts = parseInt(localStorage.getItem('failedAttempts') || '0', 10);
        attempts++;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            const lockoutEndTime = Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000;
            localStorage.setItem('lockoutEndTime', lockoutEndTime);
            localStorage.removeItem('failedAttempts');
            checkLockoutStatus();
        } else {
            localStorage.setItem('failedAttempts', attempts);
        }
    }
    
    function checkLockoutStatus() {
        const lockoutEndTime = parseInt(localStorage.getItem('lockoutEndTime') || '0', 10);
        if (Date.now() < lockoutEndTime) {
            const remainingMinutes = Math.ceil((lockoutEndTime - Date.now()) / 60000);
            showPasswordFeedback(`Too many attempts. Try again in ${remainingMinutes} minutes.`, 'error');
            passwordInput.disabled = true;
            confirmPasswordBtn.disabled = true;
            return true;
        }
        localStorage.removeItem('lockoutEndTime');
        return false;
    }

    function showPasswordFeedback(message, type) {
        passwordFeedbackEl.textContent = message;
        passwordFeedbackEl.className = 'password-feedback';
        passwordFeedbackEl.classList.add(type);
        passwordFeedbackEl.classList.remove('hidden');
    }

    function resetPasswordModal() {
        passwordFeedbackEl.classList.add('hidden');
        passwordInput.value = '';
        modalTitle.classList.remove('hidden');
        modalMessage.classList.remove('hidden');
        passwordInput.classList.remove('hidden');
        modalButtons.classList.remove('hidden');
        passwordInput.disabled = false;
        confirmPasswordBtn.disabled = false;
    }

    function showPasswordModal() {
        resetPasswordModal();
        passwordModalOverlay.classList.remove('hidden');
        if (!checkLockoutStatus()) {
             passwordInput.focus();
        }
    }

    function hidePasswordModal() {
        passwordModalOverlay.classList.add('hidden');
    }

    // --- ОБНОВЛЕНИЕ ГЛАВНОГО ИНТЕРФЕЙСА ---
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
        if (kidName === 'Emin') {
            eminVisualizer.classList.remove('hidden');
            samiraVisualizer.classList.add('hidden');
            cardTitleEl.innerHTML = 'TV & Cartoons Today 📺';
            carEl.style.left = `${cappedPercentage * 0.85}%`;
        } else if (kidName === 'Samira') {
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
    passwordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            confirmPasswordBtn.click();
        }
    });

    // --- ПЕРВЫЙ ЗАПУСК ---
    fetchKidData(currentKid);
});