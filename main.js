document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'https://backend.gcrm.online/api/v1/finance';
    const PARENT_PASSWORD = '1994';
    let currentKid = 'emin';
    const MAX_FAILED_ATTEMPTS_FOR_PENALTY = 5;
    
    const themeSwitcher = document.getElementById('theme-switcher');
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

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            themeSwitcher.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-theme');
            themeSwitcher.textContent = '🌙';
        }
    };
    themeSwitcher.addEventListener('click', () => {
        const isDarkMode = document.body.classList.contains('dark-theme');
        const newTheme = isDarkMode ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    async function fetchKidData(kidName) {
        try {
            const formattedKidName = kidName.charAt(0).toUpperCase() + kidName.slice(1);
            const response = await fetch(`${API_BASE_URL}/kidstatus/${formattedKidName}/`);
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
        if (password !== PARENT_PASSWORD) {
            handleFailedAttempt(kidName);
            const attempts = parseInt(localStorage.getItem(`failedAttempts_${kidName}`) || '0', 10);
            let errorMessage = "Incorrect password";
            if (attempts === MAX_FAILED_ATTEMPTS_FOR_PENALTY - 1) {
                errorMessage += ". Next incorrect attempt will result in a 5-minute penalty.";
            } else if (attempts === 0 && localStorage.getItem(`penaltyApplied_${kidName}`)) {
                errorMessage += ". A 5-minute penalty has been applied.";
                localStorage.removeItem(`penaltyApplied_${kidName}`);
            }
            showPasswordFeedback(errorMessage, "error");
            passwordInput.value = '';
            passwordInput.focus();
            return;
        }
        localStorage.setItem(`failedAttempts_${kidName}`, '0');
        try {
            const formattedKidName = kidName.charAt(0).toUpperCase() + kidName.slice(1);
            const response = await fetch(`${API_BASE_URL}/kidstatus/${formattedKidName}/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ amount: 10 })
            });
            if (!response.ok) {
                const result = await response.json();
                showPasswordFeedback(result.error || 'Server error, could not add time.', "error");
            } else {
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
            const formattedKidName = kidName.charAt(0).toUpperCase() + kidName.slice(1);
            const response = await fetch(`${API_BASE_URL}/kidstatus/${formattedKidName}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: -minutes })
            });
            if (!response.ok) throw new Error('Failed to log time on the server.');
            inputEl.value = '';
            fetchKidData(kidName);
        } catch (error) {
            console.error('Error logging time:', error);
            alert("Oops! Could not save the time. Please try again.");
        }
    }
    
    async function applyPenalty(kidName) {
        console.log(`Applying 5-minute penalty to ${kidName}...`);
        localStorage.setItem(`penaltyApplied_${kidName}`, 'true');
        try {
            const formattedKidName = kidName.charAt(0).toUpperCase() + kidName.slice(1);
            await fetch(`${API_BASE_URL}/kidstatus/${formattedKidName}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: -5 })
            });
            fetchKidData(kidName);
        } catch (error) {
            console.error(`Failed to apply penalty for ${kidName}:`, error);
        }
    }

    // ИЗМЕНЕНО: Удалена логика блокировки (lockout)
    function handleFailedAttempt(kidName) {
        const attemptsKey = `failedAttempts_${kidName}`;
        let attempts = parseInt(localStorage.getItem(attemptsKey) || '0', 10);
        attempts++;
        if (attempts === MAX_FAILED_ATTEMPTS_FOR_PENALTY) {
            applyPenalty(kidName);
            localStorage.setItem(attemptsKey, '0'); // Сбрасываем счетчик после штрафа
        } else {
            localStorage.setItem(attemptsKey, attempts);
        }
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
        passwordInput.focus();
    }

    function hidePasswordModal() {
        passwordModalOverlay.classList.add('hidden');
    }

    function updateUI(kidName, data) {
        greetingEl.innerHTML = `Hi, ${kidName.charAt(0).toUpperCase() + kidName.slice(1)}! 👋 Let's check your time!`;
        const remaining_minutes = data.remaining_tv_minutes;
        const total_minutes = data.total_tv_minutes;
        if (remaining_minutes === undefined || total_minutes === undefined) {
            timeMessageEl.innerText = 'Oops! Received invalid data from the server.';
            return;
        }
        if (remaining_minutes > 0) {
            timeMessageEl.innerHTML = `You can watch for <strong>${remaining_minutes}</strong> minutes.`;
            timesUpOverlay.classList.add('hidden');
        } else {
            timeMessageEl.innerHTML = `Time is up for today!`;
            timesUpOverlay.classList.remove('hidden');
            if (sound.HAVE_CURRENT_DATA) sound.play().catch(e => console.log("Play interrupted"));
        }
        const timeUsedPercentage = total_minutes > 0 ? ((total_minutes - remaining_minutes) / total_minutes) * 100 : 0;
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
            const growthPercentage = 100 - cappedPercentage;
            flowerStemEl.style.height = `${growthPercentage / 100 * 150}px`;
        }
    }
    
    document.getElementById('switch-emin').addEventListener('click', () => { currentKid = 'emin'; document.getElementById('switch-emin').classList.add('active'); document.getElementById('switch-samira').classList.remove('active'); fetchKidData(currentKid); });
    document.getElementById('switch-samira').addEventListener('click', () => { currentKid = 'samira'; document.getElementById('switch-samira').classList.add('active'); document.getElementById('switch-emin').classList.remove('active'); fetchKidData(currentKid); });
    document.getElementById('read-book-btn').addEventListener('click', showPasswordModal);
    document.getElementById('log-time-btn').addEventListener('click', () => logWatchedTime(currentKid));
    confirmPasswordBtn.addEventListener('click', () => submitBonusTime(currentKid));
    cancelPasswordBtn.addEventListener('click', hidePasswordModal);
    closeModalBtn.addEventListener('click', hidePasswordModal);
    passwordModalOverlay.addEventListener('click', (event) => { if (event.target === passwordModalOverlay) { hidePasswordModal(); } });
    passwordInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); confirmPasswordBtn.click(); } });

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    fetchKidData(currentKid);
});