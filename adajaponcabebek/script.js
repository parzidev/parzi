const radicalDisplay = document.getElementById('radical-display');
const optionsGrid = document.getElementById('options-grid');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const highScoreEl = document.getElementById('high-score');
const totalCorrectEl = document.getElementById('total-correct');
const appTitle = document.getElementById('app-title');
const statsContainer = document.getElementById('stats-container');

// Containers
const menuContainer = document.getElementById('menu-container');
const quizContainer = document.getElementById('quiz-container');
const trainingContainer = document.getElementById('training-container');
const trainingGrid = document.getElementById('training-grid');
const reviewContainer = document.getElementById('review-container');
const reviewGrid = document.getElementById('review-grid');
const storyContainer = document.getElementById('story-container');
const storyCounter = document.getElementById('story-counter');
const storyTitle = document.getElementById('story-title');
const storyJapanese = document.getElementById('story-japanese');
const storyTranslation = document.getElementById('story-translation');
const storyWords = document.getElementById('story-words');
const storyTranslationToggle = document.getElementById('story-translation-toggle');
const storySectionLabel = document.getElementById('story-section-label');
const storyLineCount = document.getElementById('story-line-count');
const storyProgressBar = document.getElementById('story-progress-bar');
const storyShortTab = document.getElementById('story-short-tab');
const storyLongTab = document.getElementById('story-long-tab');

let currentMode = null; // 'hiragana', 'katakana', 'kanji'
let currentDataSet = [];
let currentItem = null;
let score = 0;
let streak = 0;
let highScore = 0;
let totalCorrect = parseInt(localStorage.getItem('totalCorrect')) || 0;
let isAnswering = false;
let retryQueue = []; // Stores { item: obj, readyAt: questionCount }
let questionCount = 0;
let isSpeedMode = false;
let mistakes = JSON.parse(localStorage.getItem('mistakes')) || [];
let currentStoryIndex = 0;
let currentStoryLength = 'short';
let storyTranslationVisible = false;
let storyDataLoaded = false;
let storyDataLoading = null;
const storyGroups = {
    short: [],
    long: []
};
const storyMeta = {
    short: {
        file: 'kisa.json',
        label: 'Kısa Hikaye',
        title: 'Kısa Japonca Hikayeler 🎀'
    },
    long: {
        file: 'uzun.json',
        label: 'Uzun Hikaye',
        title: 'Uzun Japonca Hikayeler 🎀'
    }
};

// Initialize
function init() {
    showMenu();
}

function showMenu() {
    menuContainer.style.display = 'flex';
    quizContainer.style.display = 'none';
    trainingContainer.style.display = 'none';
    statsContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    storyContainer.style.display = 'none';
    appTitle.textContent = "Ada Bebek Kanji Quiz 🎀";
    currentMode = null;
    isSpeedMode = false;
}

function saveMistakes() {
    localStorage.setItem('mistakes', JSON.stringify(mistakes));
}

function addMistake(item, mode) {
    // Check if already exists
    const exists = mistakes.some(m => m.char === item.char && m.mode === mode);
    if (!exists) {
        mistakes.push({ ...item, mode: mode, date: new Date().toISOString() });
        saveMistakes();
    }
}

function showReview() {
    menuContainer.style.display = 'none';
    quizContainer.style.display = 'none';
    trainingContainer.style.display = 'none';
    statsContainer.style.display = 'none';
    reviewContainer.style.display = 'flex';
    storyContainer.style.display = 'none';
    appTitle.textContent = "Yanlışlar 📖";
    renderReview();
}

async function showStories(event, length = 'short', resetIndex = false) {
    if (event) event.stopPropagation();

    currentStoryLength = getStoryLength(length);
    await loadStoryGroups();

    const stories = getStories();
    if (resetIndex || currentStoryIndex >= stories.length) currentStoryIndex = 0;

    menuContainer.style.display = 'none';
    quizContainer.style.display = 'none';
    trainingContainer.style.display = 'none';
    statsContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    storyContainer.style.display = 'flex';
    appTitle.textContent = storyMeta[currentStoryLength].title;
    storyTranslationVisible = false;
    updateStoryTabs();
    renderStory();
}

function getStoryLength(length) {
    return length === 'long' ? 'long' : 'short';
}

async function loadStoryGroups() {
    if (storyDataLoaded) return;
    if (storyDataLoading) return storyDataLoading;

    storyDataLoading = Promise.all([
        readStoryJson(storyMeta.short.file),
        readStoryJson(storyMeta.long.file)
    ]).then(([shortStories, longStories]) => {
        const fallbackStories = typeof miniStories !== 'undefined' ? miniStories : [];
        storyGroups.short = shortStories.length > 0 ? shortStories : fallbackStories;
        storyGroups.long = longStories;
        storyDataLoaded = true;
    });

    return storyDataLoading;
}

async function readStoryJson(fileName) {
    try {
        const response = await fetch(fileName, { cache: 'no-store' });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function getStories(length = currentStoryLength) {
    return storyGroups[getStoryLength(length)] || [];
}

async function setStoryLength(length) {
    const nextLength = getStoryLength(length);
    if (nextLength === currentStoryLength) return;

    currentStoryLength = nextLength;
    currentStoryIndex = 0;
    storyTranslationVisible = false;
    await loadStoryGroups();
    appTitle.textContent = storyMeta[currentStoryLength].title;
    updateStoryTabs();
    renderStory();
}

function renderStory() {
    const stories = getStories();
    const story = stories[currentStoryIndex];

    if (!story) {
        renderEmptyStory();
        return;
    }

    const japaneseLines = Array.isArray(story.japanese) ? story.japanese : [];
    const turkishLines = Array.isArray(story.turkish) ? story.turkish : [];
    const words = Array.isArray(story.words) ? story.words : [];
    const progress = stories.length > 0 ? ((currentStoryIndex + 1) / stories.length) * 100 : 0;
    const titleParts = [story.japaneseTitle, story.title].filter(Boolean);
    const translationDisplay = storyTranslationVisible ? 'grid' : 'none';

    storySectionLabel.textContent = storyMeta[currentStoryLength].label;
    storyCounter.textContent = `${currentStoryIndex + 1} / ${stories.length}`;
    storyLineCount.textContent = `${japaneseLines.length} cümle`;
    storyProgressBar.style.width = `${progress}%`;
    storyTitle.textContent = titleParts.join(' · ') || 'Story';
    storyJapanese.innerHTML = japaneseLines.map((line, index) => `
        <p><span>${index + 1}</span>${escapeHtml(line)}</p>
    `).join('');
    storyTranslation.innerHTML = turkishLines.map((line, index) => `
        <p><span>${index + 1}</span>${escapeHtml(line)}</p>
    `).join('');
    storyTranslation.hidden = !storyTranslationVisible;
    storyTranslation.style.display = translationDisplay;
    storyTranslationToggle.textContent = storyTranslationVisible ? 'Türkçeyi Gizle' : 'Türkçesini Göster';
    storyTranslationToggle.setAttribute('aria-expanded', String(storyTranslationVisible));
    storyWords.innerHTML = words.map(word => `
        <span class="story-word"><strong>${escapeHtml(word.jp)}</strong> ${escapeHtml(word.tr)}</span>
    `).join('');
}

function renderEmptyStory() {
    storySectionLabel.textContent = storyMeta[currentStoryLength].label;
    storyCounter.textContent = '0 / 0';
    storyLineCount.textContent = '0 cümle';
    storyProgressBar.style.width = '0%';
    storyTitle.textContent = currentStoryLength === 'long' ? 'Uzun hikayeler hazırlanıyor' : 'Hikaye bulunamadı';
    storyJapanese.innerHTML = '<p class="story-empty">JSON gelince burası dolacak.</p>';
    storyTranslation.innerHTML = '';
    storyTranslation.hidden = true;
    storyTranslation.style.display = 'none';
    storyTranslationToggle.textContent = 'Türkçesini Göster';
    storyTranslationToggle.setAttribute('aria-expanded', 'false');
    storyWords.innerHTML = '';
}

function updateStoryTabs() {
    storyShortTab.classList.toggle('active', currentStoryLength === 'short');
    storyLongTab.classList.toggle('active', currentStoryLength === 'long');
}

function toggleStoryTranslation() {
    storyTranslationVisible = !storyTranslationVisible;
    renderStory();
}

function nextStory() {
    const stories = getStories();
    if (stories.length === 0) return;

    currentStoryIndex = (currentStoryIndex + 1) % stories.length;
    storyTranslationVisible = false;
    renderStory();
}

function previousStory() {
    const stories = getStories();
    if (stories.length === 0) return;

    currentStoryIndex = (currentStoryIndex - 1 + stories.length) % stories.length;
    storyTranslationVisible = false;
    renderStory();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderReview() {
    reviewGrid.innerHTML = '';
    if (mistakes.length === 0) {
        reviewGrid.innerHTML = '<p style="text-align: center; width: 100%; color: var(--secondary-color);">Bizde yanlış olmaz 😎👍</p>';
        return;
    }

    mistakes.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'review-card';

        let charContent = item.char;
        if (item.mode === 'kanji') {
            charContent = `<img src="images/radicals-svg/${item.char}.svg" alt="${item.char}" onerror="this.parentElement.textContent='${item.char}'" style="height: 1.5em;">`;
        }

        let displayValue = '';
        if (item.mode === 'hiragana' || item.mode === 'katakana') {
            displayValue = item.reading;
        } else {
            displayValue = Array.isArray(item.meaning) ? item.meaning[0] : item.meaning;
        }

        card.innerHTML = `
            <div class="training-char">${charContent}</div>
            <div class="review-details" style="display: none; text-align: center;">
                <div class="training-reading" style="font-weight: bold; margin-bottom: 5px;">${displayValue}</div>
                <button class="review-solve-btn" onclick="removeMistake(${index}, event)">biliom✅</button>
            </div>
        `;

        card.onclick = () => toggleReveal(card);
        reviewGrid.appendChild(card);
    });
}

function toggleReveal(card) {
    const details = card.querySelector('.review-details');
    if (details.style.display === 'none') {
        details.style.display = 'block';
        card.classList.add('revealed');
    } else {
        // details.style.display = 'none';
        // card.classList.remove('revealed');
    }
}

function removeMistake(index, event) {
    if (event) event.stopPropagation();
    mistakes.splice(index, 1);
    saveMistakes();
    renderReview();
}

function clearMistakes() {
    if (confirm('Tüm hata defterini temizlemek istediğine emin misin?')) {
        mistakes = [];
        saveMistakes();
        renderReview();
    }
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
    reviewContainer.style.display = 'none';
    storyContainer.style.display = 'none';

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
    totalCorrectEl.textContent = `Total: ${totalCorrect}`;

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
    reviewContainer.style.display = 'none';
    storyContainer.style.display = 'none';

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

    // Set grid layout based on mode
    if (currentMode === 'hiragana' || currentMode === 'katakana') {
        trainingGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    } else {
        trainingGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    }

    currentDataSet.forEach(item => {
        // Calculate target column based on vowel sound
        let targetCol = 0;
        const lastChar = item.reading ? item.reading.slice(-1).toLowerCase() : '';

        if (['a'].includes(lastChar)) targetCol = 0;
        else if (['i'].includes(lastChar)) targetCol = 1;
        else if (['u'].includes(lastChar)) targetCol = 2;
        else if (['e'].includes(lastChar)) targetCol = 3;
        else if (['o'].includes(lastChar)) targetCol = 4;

        // Special cases
        if (item.char === 'ん' || item.char === 'ン') targetCol = 0;
        if (item.reading === 'long vowel') targetCol = 0;
        if (item.reading === 'small tsu') targetCol = 2; // Treat like 'u' column for alignment? Or maybe 0? Let's try 2 (middle) or just let it flow. Actually user wants 'tsu' usually in 'u' col.
        if (item.char === 'ワ' || item.char === 'わ') targetCol = 0;
        if (item.char === 'ヲ' || item.char === 'を') targetCol = 4;

        // Calculate current column
        let currentCol = trainingGrid.children.length % 5;

        // Add placeholders to reach target column
        // If we are past the target column, we need to wrap to next line
        if (currentCol > targetCol) {
            const needed = 5 - currentCol + targetCol;
            for (let i = 0; i < needed; i++) {
                trainingGrid.appendChild(createPlaceholder());
            }
        } else if (currentCol < targetCol) {
            const gaps = targetCol - currentCol;
            for (let i = 0; i < gaps; i++) {
                trainingGrid.appendChild(createPlaceholder());
            }
        }

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

        card.onclick = () => {
            // Maybe play sound or show details modal
        };

        trainingGrid.appendChild(card);

        // Post-card placeholders for special items that should fill the row
        if (currentMode === 'hiragana' || currentMode === 'katakana') {
            if (item.char === 'ん' || item.char === 'ン' || item.reading === 'long vowel') {
                // Fill the rest of the row
                let newCol = trainingGrid.children.length % 5;
                if (newCol !== 0) {
                    const gaps = 5 - newCol;
                    for (let i = 0; i < gaps; i++) {
                        trainingGrid.appendChild(createPlaceholder());
                    }
                }
            }
        }
    });
}

function createPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.style.visibility = 'hidden';
    return placeholder;
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

        // Update Total Correct
        totalCorrect++;
        totalCorrectEl.textContent = `Total: ${totalCorrect}`;
        localStorage.setItem('totalCorrect', totalCorrect);

        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = `Best: ${highScore}`;
            const scoreKey = currentMode + (isSpeedMode ? 'Speed' : '') + 'HighScore';
            localStorage.setItem(scoreKey, highScore);
        }

        if (score === 100) {
            showSpecialSuccess();
        } else if (isSpeedMode) {
            setTimeout(nextQuestion, 400); // Slightly longer delay
        } else {
            showFeedback(true);
        }
    } else {
        btn.classList.add('wrong');
        streak = 0;

        // Add to mistakes
        addMistake(currentItem, currentMode);

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

function showSpecialSuccess() {
    const overlay = document.getElementById('feedback-overlay');
    const feedbackText = document.getElementById('feedback-text');
    const feedbackImage = document.getElementById('feedback-image');

    feedbackText.textContent = "oha çalışkan bebek";

    if (feedbackImage) {
        feedbackImage.src = 'ohacaliskan.png';
        feedbackImage.style.display = 'block';
    }

    overlay.className = 'feedback-overlay show correct';

    const delay = 4000;
    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(nextQuestion, 300);
    }, delay);
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
