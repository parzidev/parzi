const radicalDisplay = document.getElementById('radical-display');
const optionsGrid = document.getElementById('options-grid');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const highScoreEl = document.getElementById('high-score');
const appTitle = document.getElementById('app-title');
const statsContainer = document.getElementById('stats-container');

// Containers
const menuContainer = document.getElementById('menu-container');
const quizContainer = document.getElementById('quiz-container');
const trainingContainer = document.getElementById('training-container');
const trainingGrid = document.getElementById('training-grid');

let currentMode = null; // 'hiragana', 'katakana', 'kanji'
let currentDataSet = [];
let currentItem = null;
let score = 0;
let streak = 0;
let highScore = 0;
let isAnswering = false;
let retryQueue = []; // Stores { item: obj, readyAt: questionCount }
let questionCount = 0;
let isSpeedMode = false;

// Initialize
function init() {
    showMenu();
}

function showMenu() {
    menuContainer.style.display = 'flex';
    quizContainer.style.display = 'none';
    trainingContainer.style.display = 'none';
    statsContainer.style.display = 'none';
    appTitle.textContent = "Ada Bebek Kanji Quiz 🎀";
    currentMode = null;
    isSpeedMode = false;
}

function selectGame(mode) {
    // This function can be used for visual selection if needed, 
    // but buttons currently call startQuiz or startTraining directly.
}

function getDataSet(mode) {
    switch (mode) {
        case 'hiragana': return typeof hiragana !== 'undefined' ? hiragana : [];
        case 'katakana': return typeof katakana !== 'undefined' ? katakana : [];
        case 'kanji': return typeof radicals !== 'undefined' ? radicals : [];
        default: return [];
    }
}

function startQuiz(mode, event, speedMode = false) {
    if (event) event.stopPropagation();
    currentMode = mode;
    isSpeedMode = speedMode;
    currentDataSet = getDataSet(mode);

    if (currentDataSet.length === 0) {
        alert("Data not loaded for " + mode);
        return;
    }

    menuContainer.style.display = 'none';
    quizContainer.style.display = 'flex';
    trainingContainer.style.display = 'none';
    statsContainer.style.display = 'flex';

    // Update Title
    const titles = {
        'hiragana': 'Hiragana Quiz',
        'katakana': 'Katakana Quiz',
        'kanji': 'Kanji Quiz'
    };
    appTitle.textContent = (isSpeedMode ? "⚡ " : "") + titles[mode] + (isSpeedMode ? " (Speed) ⚡" : " 🎀");

    // Load High Score
    const scoreKey = mode + (isSpeedMode ? 'Speed' : '') + 'HighScore';
    const savedScore = localStorage.getItem(scoreKey);
    highScore = savedScore ? parseInt(savedScore, 10) : 0;
    highScoreEl.textContent = `Best: ${highScore}`;

    score = 0;
    streak = 0;
    scoreEl.textContent = `Score: 0`;
    streakEl.textContent = `Streak: 0`;

    retryQueue = [];
    questionCount = 0;

    nextQuestion();
}

function startTraining(mode, event) {
    if (event) event.stopPropagation();
    currentMode = mode;
    currentDataSet = getDataSet(mode);

    if (currentDataSet.length === 0) {
        alert("Data not loaded for " + mode);
        return;
    }

    menuContainer.style.display = 'none';
    quizContainer.style.display = 'none';
    trainingContainer.style.display = 'flex';
    statsContainer.style.display = 'none';

    const titles = {
        'hiragana': 'Hiragana Training',
        'katakana': 'Katakana Training',
        'kanji': 'Kanji Training'
    };
    appTitle.textContent = titles[mode] + " 🎀";

    renderTraining();
}

function renderTraining() {
    trainingGrid.innerHTML = '';
    currentDataSet.forEach(item => {
        const card = document.createElement('div');
        card.className = 'training-card';

        let charContent = item.char;
        if (currentMode === 'kanji') {
            charContent = `<img src="images/radicals-svg/${item.char}.svg" alt="${item.char}" onerror="this.parentElement.textContent='${item.char}'">`;
        }

        card.innerHTML = `
            <div class="training-char">${charContent}</div>
            <div class="training-reading">${item.reading || ''}</div>
        `;

        // Optional: Add click to hear sound or see details
        card.onclick = () => {
            // Maybe play sound or show details modal
        };

        trainingGrid.appendChild(card);
    });
}

function getRandomItem() {
    return currentDataSet[Math.floor(Math.random() * currentDataSet.length)];
}

function generateDistractors(correctItem, count = 3) {
    const distractors = new Set();
    const isKana = currentMode === 'hiragana' || currentMode === 'katakana';

    // Helper to get the value we are testing against (to avoid duplicates in options)
    const getValue = (item) => {
        if (isKana) return item.reading;
        return Array.isArray(item.meaning) ? item.meaning[0] : item.meaning;
    };

    const correctValue = getValue(correctItem);
    const usedValues = new Set([correctValue]);

    while (distractors.size < count) {
        const r = getRandomItem();
        const rValue = getValue(r);

        // Ensure distinct value from correct answer AND distinct from already picked distractors
        if (r.char !== correctItem.char && !usedValues.has(rValue)) {
            distractors.add(r);
            usedValues.add(rValue);
        }
    }
    return Array.from(distractors);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function nextQuestion() {
    isAnswering = true;
    questionCount++;

    // Check Retry Queue
    const retryIndex = retryQueue.findIndex(item => item.readyAt <= questionCount);

    if (retryIndex !== -1) {
        currentItem = retryQueue[retryIndex].item;
        retryQueue.splice(retryIndex, 1);
    } else {
        currentItem = getRandomItem();
    }

    // Update Display
    if (currentMode === 'kanji') {
        radicalDisplay.innerHTML = `<img src="images/radicals-svg/${currentItem.char}.svg" alt="${currentItem.char}" onerror="this.parentElement.textContent='${currentItem.char}'">`;
    } else {
        radicalDisplay.textContent = currentItem.char;
    }

    // Generate Options
    const distractors = generateDistractors(currentItem);
    const options = shuffleArray([currentItem, ...distractors]);

    // Render Options
    optionsGrid.innerHTML = '';
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';

        let mainText = '';
        let subText = '';

        if (currentMode === 'hiragana' || currentMode === 'katakana') {
            mainText = option.reading;
            // subText could be empty or maybe the type (e.g. "dakuten") if we wanted, but simple is better
        } else {
            // Kanji mode
            mainText = Array.isArray(option.meaning) ? option.meaning[0] : option.meaning;
            subText = option.meaningTR || '';
        }

        btn.innerHTML = `
            <div style="padding-bottom: 4px;">${mainText}</div>
            ${subText ? `<div style="font-size: 0.9em; color: var(--secondary-color); border-top: 1px solid var(--secondary-color); padding-top: 4px; margin-top: 4px;">${subText}</div>` : ''}
        `;

        btn.onclick = () => handleAnswer(option, btn);
        optionsGrid.appendChild(btn);
    });
}

function handleAnswer(selectedOption, btn) {
    if (!isAnswering) return;
    isAnswering = false;

    const isCorrect = selectedOption.char === currentItem.char;

    if (isCorrect) {
        btn.classList.add('correct');
        score++;
        streak++;

        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = `Best: ${highScore}`;
            const scoreKey = currentMode + (isSpeedMode ? 'Speed' : '') + 'HighScore';
            localStorage.setItem(scoreKey, highScore);
        }

        if (isSpeedMode) {
            setTimeout(nextQuestion, 400); // Slightly longer delay
        } else {
            showFeedback(true);
        }
    } else {
        btn.classList.add('wrong');
        streak = 0;

        retryQueue.push({
            item: currentItem,
            readyAt: questionCount + 3
        });

        // Highlight correct answer
        Array.from(optionsGrid.children).forEach(child => {
            const firstDiv = child.querySelector('div');
            // Determine what text we are looking for based on mode
            let targetText = '';
            if (currentMode === 'hiragana' || currentMode === 'katakana') {
                targetText = currentItem.reading;
            } else {
                targetText = Array.isArray(currentItem.meaning) ? currentItem.meaning[0] : currentItem.meaning;
            }

            if (firstDiv && firstDiv.textContent === targetText) {
                child.classList.add('correct');
            }
        });

        if (isSpeedMode) {
            setTimeout(nextQuestion, 800); // Longer delay for wrong answer
        } else {
            showFeedback(false);
        }
    }

    scoreEl.textContent = `Score: ${score}`;
    streakEl.textContent = `Streak: ${streak}`;
}

function showFeedback(isCorrect) {
    const overlay = document.getElementById('feedback-overlay');
    const feedbackText = document.getElementById('feedback-text');
    const feedbackImage = document.getElementById('feedback-image');

    let displayText = '';
    if (currentMode === 'hiragana' || currentMode === 'katakana') {
        displayText = currentItem.reading;
    } else {
        displayText = Array.isArray(currentItem.meaning) ? currentItem.meaning[0] : currentItem.meaning;
    }

    feedbackText.textContent = isCorrect ? `✓ Doğru! ${displayText}` : `✗ Yanlış! ${displayText}`;

    if (feedbackImage) {
        feedbackImage.src = isCorrect ? 'mutlu.png' : 'mutsuz.png';
        feedbackImage.style.display = 'block';
    }

    overlay.className = 'feedback-overlay show ' + (isCorrect ? 'correct' : 'wrong');

    const delay = isCorrect ? 1500 : 2500;
    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(nextQuestion, 300);
    }, delay);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (quizContainer.style.display === 'none') return;
    if (!isAnswering) return;

    if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        const buttons = optionsGrid.querySelectorAll('.option-btn');
        if (buttons[index]) {
            buttons[index].click();
        }
    }
});

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);
