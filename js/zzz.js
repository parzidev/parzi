// Format sleep duration (from seconds to hours and minutes)
function formatSleepDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        const hourText = hours === 1 ? 'hour' : 'hours';
        const minuteText = minutes === 1 ? 'minute' : 'minutes';
        return `${hours} ${hourText} ${minutes} ${minuteText}`;
    } else if (hours > 0) {
        const hourText = hours === 1 ? 'hour' : 'hours';
        return `${hours} ${hourText}`;
    } else if (minutes > 0) {
        const minuteText = minutes === 1 ? 'minute' : 'minutes';
        return `${minutes} ${minuteText}`;
    } else {
        return 'just now';
    }
}

// Format time elapsed since last sleep
function formatTimeSince(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0 && minutes === 0) {
        return 'just woke up';
    } else if (hours === 0) {
        return `${minutes}m ago`;
    } else if (minutes === 0) {
        return `${hours}h ago`;
    } else {
        return `${hours}h ${minutes}m ago`;
    }
}

// Check sleep status function
async function updateSleepStatus() {
    try {
        console.log('😴 Checking sleep status...');

        const response = await fetch('https://fitbit.parzi.dev/api/sleep/suan');

        if (!response.ok) {
            console.warn(`⚠️ Fitbit API error: ${response.status}`);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const sleepData = data.data; // API returns data inside a data object
        const sleepStatusElement = document.getElementById('sleep-status');

        if (sleepStatusElement) {
            // Check if user is currently sleeping
            if (sleepData.is_sleeping && sleepData.current_session) {
                const startTime = new Date(sleepData.current_session.start_time);
                const now = new Date();
                const durationSeconds = Math.floor((now - startTime) / 1000);
                const duration = formatSleepDuration(durationSeconds);
                console.log(`💤 Sleeping: for ${duration}`);
                sleepStatusElement.innerHTML = `😴 sleeping <span style="opacity: 0.7;">(${duration})</span>`;
                sleepStatusElement.style.color = '#9b87f5';
            } else if (sleepData.is_sleeping) {
                console.log('💤 Sleeping (no duration info)');
                sleepStatusElement.textContent = '😴 sleeping';
                sleepStatusElement.style.color = '#9b87f5';
            } else {
                // When awake, show last sleep info
                console.log('👀 Awake');
                if (sleepData.last_sleep && sleepData.last_sleep.end_time) {
                    const lastSleepEnd = new Date(sleepData.last_sleep.end_time);
                    const now = new Date();
                    const elapsedSeconds = Math.floor((now - lastSleepEnd) / 1000);
                    const timeSince = formatTimeSince(elapsedSeconds);

                    // Add sleep duration info
                    const sleepDuration = sleepData.last_sleep.duration_hours
                        ? `${sleepData.last_sleep.duration_hours.toFixed(1)}h`
                        : sleepData.last_sleep.minutes_asleep
                            ? `${Math.floor(sleepData.last_sleep.minutes_asleep / 60)}h ${sleepData.last_sleep.minutes_asleep % 60}m`
                            : '';

                    const durationText = sleepDuration ? ` for ${sleepDuration}` : '';
                    sleepStatusElement.innerHTML = `awake <span style="opacity: 0.7;">(slept ${timeSince}${durationText})</span>`;
                } else {
                    sleepStatusElement.textContent = 'awake';
                }
                sleepStatusElement.style.color = '#4ade80';
            }
        }
    } catch (error) {
        console.error('❌ Sleep status could not be retrieved:', error.message);
        const sleepStatusElement = document.getElementById('sleep-status');
        if (sleepStatusElement) {
            sleepStatusElement.textContent = '🤷 unknown';
            sleepStatusElement.style.color = '#94a3b8';
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateSleepStatus);

// Update every 5 minutes
setInterval(updateSleepStatus, 5 * 60 * 1000);

