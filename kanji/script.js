const radicalDisplay = document.getElementById('radical-display');
const optionsGrid = document.getElementById('options-grid');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const highScoreEl = document.getElementById('high-score');

let currentRadical = null;
let score = 0;
let streak = 0;
let highScore = 0;
let isAnswering = false;
let retryQueue = []; // Stores { radical: obj, readyAt: questionCount }
let questionCount = 0;

function initGame() {
    if (typeof radicals === 'undefined' || radicals.length === 0) {
        radicalDisplay.textContent = "Error";
        optionsGrid.innerHTML = "<p>Radical data not loaded.</p>";
        return;
    }

    // Load High Score
    const savedScore = localStorage.getItem('kanjiHighScore');
    if (savedScore) {
        highScore = parseInt(savedScore, 10);
        highScoreEl.textContent = `Best: ${highScore}`;
    }

    nextQuestion();
}

function getRandomRadical() {
    return radicals[Math.floor(Math.random() * radicals.length)];
}

function generateDistractors(correctRadical, count = 3) {
    const distractors = new Set();
    while (distractors.size < count) {
        const r = getRandomRadical();
        if (r.char !== correctRadical.char) {
            distractors.add(r);
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
    // If there's an item in the queue that is ready (readyAt <= current questionCount)
    const retryIndex = retryQueue.findIndex(item => item.readyAt <= questionCount);

    if (retryIndex !== -1) {
        // Pop from queue
        currentRadical = retryQueue[retryIndex].radical;
        retryQueue.splice(retryIndex, 1);
        console.log("Reviewing missed radical:", currentRadical.char);
    } else {
        currentRadical = getRandomRadical();
    }

    // Update Display
    radicalDisplay.textContent = currentRadical.char;

    // Generate Options
    const distractors = generateDistractors(currentRadical);
    const options = shuffleArray([currentRadical, ...distractors]);

    // Render Options
    optionsGrid.innerHTML = '';
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        const meaningText = Array.isArray(option.meaning) ? option.meaning[0] : option.meaning;
        const meaningTR = option.meaningTR || '';

        // Display English and Turkish with separator
        btn.innerHTML = `
            <div style="padding-bottom: 4px;">${meaningText}</div>
            <div style="font-size: 0.9em; color: var(--secondary-color); border-top: 1px solid var(--secondary-color); padding-top: 4px; margin-top: 4px;">${meaningTR}</div>
        `;

        btn.onclick = () => handleAnswer(option, btn);
        optionsGrid.appendChild(btn);
    });
}

function handleAnswer(selectedOption, btn) {
    if (!isAnswering) return;
    isAnswering = false;

    const isCorrect = selectedOption.char === currentRadical.char;

    if (isCorrect) {
        btn.classList.add('correct');
        score++;
        streak++;

        // Update High Score
        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = `Best: ${highScore}`;
            localStorage.setItem('kanjiHighScore', highScore);
        }

        setTimeout(nextQuestion, 600);
    } else {
        btn.classList.add('wrong');
        streak = 0;

        // Add to Retry Queue
        // It will appear after 3 more questions (approx)
        retryQueue.push({
            radical: currentRadical,
            readyAt: questionCount + 3
        });

        // Highlight correct answer
        Array.from(optionsGrid.children).forEach(child => {
            // We need to check the text content of the first div inside the button
            const firstDiv = child.querySelector('div');
            const meaning = Array.isArray(currentRadical.meaning) ? currentRadical.meaning[0] : currentRadical.meaning;
            if (firstDiv && firstDiv.textContent === meaning) {
                child.classList.add('correct');
            }
        });
        setTimeout(nextQuestion, 1500);
    }

    scoreEl.textContent = `Score: ${score}`;
    streakEl.textContent = `Streak: ${streak}`;
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
