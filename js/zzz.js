// Uyku süresini formatla (saniyeden saat ve dakikaya)
function formatSleepDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
        return `${hours} saat ${minutes} dakika`;
    } else if (hours > 0) {
        return `${hours} saat`;
    } else if (minutes > 0) {
        return `${minutes} dakika`;
    } else {
        return 'az önce';
    }
}

// Uyku durumunu kontrol eden fonksiyon
async function updateSleepStatus() {
    try {
        console.log('😴 Uyku durumu kontrol ediliyor...');
        
        const response = await fetch('https://fitbit.parzi.dev/api/sleep/suan');
        
        if (!response.ok) {
            console.warn(`⚠️ Fitbit API hatası: ${response.status}`);
            throw new Error(`API hatası: ${response.status}`);
        }
        
        const data = await response.json();
        const sleepStatusElement = document.getElementById('sleep-status');
        
        if (sleepStatusElement) {
            // uyuyor_mu değerine göre "zzz" veya "uyanık" yaz
            if (data.uyuyor_mu && data.mevcut_uyku) {
                const duration = formatSleepDuration(data.mevcut_uyku.duration);
                console.log(`💤 Uyuyor: ${duration} süredir`);
                sleepStatusElement.textContent = `zzz 😴 (${duration})`;
                sleepStatusElement.style.color = '#9b87f5';
            } else if (data.uyuyor_mu) {
                console.log('💤 Uyuyor (süre bilgisi yok)');
                sleepStatusElement.textContent = 'zzz 😴';
                sleepStatusElement.style.color = '#9b87f5';
            } else {
                console.log('👀 Uyanık');
                sleepStatusElement.textContent = 'uyanık 👀';
                sleepStatusElement.style.color = '#4ade80';
            }
        }
    } catch (error) {
        console.error('❌ Uyku durumu alınamadı:', error.message);
        const sleepStatusElement = document.getElementById('sleep-status');
        if (sleepStatusElement) {
            sleepStatusElement.textContent = 'bilinmiyor 🤷';
            sleepStatusElement.style.color = '#94a3b8';
        }
    }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', updateSleepStatus);

// Her 5 dakikada bir güncelle
setInterval(updateSleepStatus, 5 * 60 * 1000);

