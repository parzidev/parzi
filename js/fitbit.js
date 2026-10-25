// Fitbit (Adım) modülü
const fitbitModule = (function() {
    let fitbitData = {
        steps: 0,
        date: null,
        goal: 10000,
        percent: 0
    };

    function init() {
        fetchSteps();
        // Çok sık sorgulamayalım; 60 sn yeterli
        setInterval(fetchSteps, 60_000);
        return this;
    }

    async function fetchSteps() {
        const card = document.querySelector('.fitbit-card');
        if (!card) return;
        const statusEl = card.querySelector('.fitbit-status');

        try {
            statusEl.textContent = 'Loading';
            const resp = await fetch('https://fitbit.parzi.dev/api/adim', { cache: 'no-store' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();

            const item = (json && json['activities-steps'] && json['activities-steps'][0]) || null;
            const steps = parseInt(item?.value || '0', 10) || 0;
            const date = item?.dateTime || null;

            const percent = Math.min(100, Math.round((steps / fitbitData.goal) * 100));
            fitbitData = { ...fitbitData, steps, date, percent };

            updateCard();
            statusEl.textContent = 'Updated';
        } catch (err) {
            console.error('Fitbit API hatası:', err);
            statusEl.textContent = 'Unavailable';
        }
    }

    function updateCard() {
        const card = document.querySelector('.fitbit-card');
        if (!card) return;

        const countEl = card.querySelector('.step-count');
        const dateEl = card.querySelector('.fitbit-date');
        const goalEl = card.querySelector('.fitbit-goal-value');
        const progressEl = card.querySelector('.step-progress');

        if (countEl) countEl.textContent = formatNumber(fitbitData.steps);
        if (goalEl) goalEl.textContent = formatNumber(fitbitData.goal);
        if (dateEl) {
            dateEl.textContent = fitbitData.date ? new Date(fitbitData.date).toLocaleDateString('tr-TR') : '';
        }
        if (progressEl) {
            progressEl.style.setProperty('--progress', `${fitbitData.percent}%`);
            progressEl.setAttribute('data-percent', String(fitbitData.percent));
            progressEl.setAttribute('aria-valuenow', String(Math.min(fitbitData.steps, fitbitData.goal)));
            progressEl.setAttribute('aria-valuemax', String(fitbitData.goal));
            progressEl.setAttribute('aria-valuetext', `${formatNumber(fitbitData.steps)} of ${formatNumber(fitbitData.goal)} steps`);
        }
    }

    function formatNumber(n) { return Number(n || 0).toLocaleString('tr-TR'); }

    return {
        init,
        setGoal(goal) {
            fitbitData.goal = Number(goal) || 10000;
            fitbitData.percent = Math.min(100, Math.round((fitbitData.steps / fitbitData.goal) * 100));
            updateCard();
        }
    };
})();

