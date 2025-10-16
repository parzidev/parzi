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
        const sleepStatusElement = document.getElementById('sleep-status');
        
        if (sleepStatusElement) {
            // Show "zzz" or "awake" based on uyuyor_mu value
            if (data.uyuyor_mu && data.mevcut_uyku) {
                const duration = formatSleepDuration(data.mevcut_uyku.duration);
                console.log(`💤 Sleeping: for ${duration}`);
                sleepStatusElement.textContent = `zzz 😴 (${duration})`;
                sleepStatusElement.style.color = '#9b87f5';
            } else if (data.uyuyor_mu) {
                console.log('💤 Sleeping (no duration info)');
                sleepStatusElement.textContent = 'zzz 😴';
                sleepStatusElement.style.color = '#9b87f5';
            } else {
                console.log('👀 Awake');
                sleepStatusElement.textContent = 'awake 👀';
                sleepStatusElement.style.color = '#4ade80';
            }
        }
    } catch (error) {
        console.error('❌ Sleep status could not be retrieved:', error.message);
        const sleepStatusElement = document.getElementById('sleep-status');
        if (sleepStatusElement) {
            sleepStatusElement.textContent = 'unknown 🤷';
            sleepStatusElement.style.color = '#94a3b8';
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateSleepStatus);

// Update every 5 minutes
setInterval(updateSleepStatus, 5 * 60 * 1000);

