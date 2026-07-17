// GitHub activity module. Data is generated from GitHub GraphQL by GitHub Actions.
const githubModule = (function () {
    const githubUsername = 'parzidev';
    const rawDataUrl = `https://raw.githubusercontent.com/${githubUsername}/parzival/main/data/github-activity.json`;

    function init() {
        showLoadingState();
        fetchGitHubActivity();
        return this;
    }

    async function fetchGitHubActivity() {
        try {
            const data = await fetchFirstValidActivity(getActivityDataUrls());
            renderActivity(data);
        } catch (error) {
            console.warn('GitHub activity could not be loaded:', error.message);
            showUnavailableState();
        }
    }

    function getActivityDataUrls() {
        const sameOriginUrl = new URL('data/github-activity.json', window.location.href).toString();
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        const freshRawUrl = `${rawDataUrl}?v=${cacheBucket}`;
        const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
            || window.location.protocol === 'file:';

        return isLocal ? [sameOriginUrl, freshRawUrl] : [freshRawUrl, sameOriginUrl];
    }

    async function fetchFirstValidActivity(urls) {
        let lastError = new Error('No GitHub activity source was available.');

        for (const url of urls) {
            try {
                const response = await fetch(url, {
                    cache: 'no-store',
                    headers: { Accept: 'application/json' }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                validateActivityData(data);
                return data;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError;
    }

    function validateActivityData(data) {
        if (data?.schema_version !== 1) throw new Error('Unsupported GitHub activity schema.');
        if (data.username !== githubUsername) throw new Error('Unexpected GitHub activity user.');
        if (!Array.isArray(data.contributions?.months) || data.contributions.months.length === 0) {
            throw new Error('GitHub activity months are missing.');
        }
    }

    function renderActivity(data) {
        renderCalendar(data.contributions.months.slice(-12));
        updateRange(data.contributions.months.slice(-12));

        const bestDay = data.contributions.best_day;
        const bestDayLabel = bestDay
            ? `best day: ${formatNumber(bestDay.count)} on ${formatShortDate(bestDay.date)}`
            : 'no contribution days yet';
        const latestLabel = data.contributions.last_contribution_date
            ? `last activity ${formatRelativeDate(data.contributions.last_contribution_date)}`
            : 'no recent activity';

        updateGithubCard({
            stars: formatNumber(data.stats?.stars || 0),
            main: formatNumber(data.contributions.total || 0),
            label: 'contributions',
            focus: bestDayLabel,
            latest: latestLabel
        });
    }

    function renderCalendar(months) {
        const calendarContainer = document.getElementById('github-calendar');
        if (!calendarContainer) return;

        const calendar = document.createElement('div');
        calendar.className = 'static-calendar';

        for (let index = 0; index < months.length; index += 6) {
            const row = document.createElement('div');
            row.className = 'calendar-row';

            months.slice(index, index + 6).forEach(month => {
                const level = Math.max(0, Math.min(4, Number(month.level) || 0));
                const contributionCount = Number(month.count) || 0;
                const tooltip = `${month.name} ${month.year}: ${formatNumber(contributionCount)} ${pluralize('contribution', contributionCount)}`;
                const monthElement = document.createElement('div');
                const initial = document.createElement('span');

                monthElement.className = `calendar-month level-${level}`;
                monthElement.dataset.month = month.name;
                monthElement.dataset.tooltip = tooltip;
                monthElement.setAttribute('role', 'img');
                monthElement.setAttribute('aria-label', tooltip);

                initial.className = 'month-initial';
                initial.textContent = String(month.name || '').charAt(0);
                monthElement.appendChild(initial);
                row.appendChild(monthElement);
            });

            calendar.appendChild(row);
        }

        calendarContainer.replaceChildren(calendar);
    }

    function updateRange(months) {
        const rangeElement = document.getElementById('github-activity-range');
        if (!rangeElement || months.length === 0) return;

        const first = months[0];
        const last = months.at(-1);
        rangeElement.textContent = `${first.name} ${first.year} – ${last.name} ${last.year}`;
    }

    function showLoadingState() {
        setCalendarMessage('Loading real activity…');
        updateRangeText('GitHub GraphQL');
        updateGithubCard({
            stars: '—',
            main: '—',
            label: 'contributions',
            focus: 'loading activity',
            latest: 'from GitHub'
        });
    }

    function showUnavailableState() {
        setCalendarMessage('Activity unavailable', true);
        updateRangeText('try again later');
        updateGithubCard({
            stars: '—',
            main: '—',
            label: 'activity unavailable',
            focus: 'no cached data',
            latest: 'open profile'
        });
    }

    function setCalendarMessage(text, isError = false) {
        const calendarContainer = document.getElementById('github-calendar');
        if (!calendarContainer) return;

        const message = document.createElement('div');
        message.className = `github-calendar-message${isError ? ' is-error' : ''}`;
        message.textContent = text;
        calendarContainer.replaceChildren(message);
    }

    function updateRangeText(text) {
        const rangeElement = document.getElementById('github-activity-range');
        if (rangeElement) rangeElement.textContent = text;
    }

    function updateGithubCard({ stars, main, label, focus, latest }) {
        const starsElement = document.getElementById('stars-count');
        if (starsElement) starsElement.textContent = String(stars);

        const mainElement = document.getElementById('github-total-contributions');
        if (mainElement) mainElement.textContent = String(main);

        const labelElement = document.getElementById('github-stat-label');
        if (labelElement) labelElement.textContent = label;

        const focusElement = document.getElementById('github-best-day');
        if (focusElement) focusElement.textContent = focus;

        const latestElement = document.getElementById('github-last-commit');
        if (latestElement) latestElement.textContent = latest;
    }

    function formatRelativeDate(dateValue) {
        const date = new Date(`${dateValue}T12:00:00Z`);
        if (Number.isNaN(date.getTime())) return 'recently';

        const now = new Date();
        const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const activityDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const diffDays = Math.max(0, Math.floor((today - activityDate) / 86400000));

        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return formatShortDate(dateValue);
    }

    function formatShortDate(dateValue) {
        const date = new Date(`${dateValue}T12:00:00Z`);
        if (Number.isNaN(date.getTime())) return 'recently';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    }

    function formatNumber(value) {
        return Number(value || 0).toLocaleString('en-US');
    }

    function pluralize(word, count) {
        return count === 1 ? word : `${word}s`;
    }

    return { init };
})();
