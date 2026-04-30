// Tema modülü
const themeModule = (function() {
    // Özel değişkenler
    let themeToggle;
    let themeToggleLabel;
    let xdText;
    let themeColorMeta;
    let currentMode = 'dark'; // default mode
    const browserChrome = {
        dark: {
            favicon: 'images/code-white.png',
            themeColor: '#1a0a2e'
        },
        light: {
            favicon: 'images/code.png',
            themeColor: '#f5f0ff'
        }
    };

    // Modül başlatma
    function init() {
        themeToggle = document.getElementById('theme-toggle');
        themeToggleLabel = document.getElementById('theme-toggle-label');
        xdText = document.getElementById('xd-text');
        themeColorMeta = document.getElementById('theme-color-meta');

        if (!themeToggle) {
            console.error('Tema değiştirme öğeleri bulunamadı.');
            return this;
        }

        // Kullanıcının tema tercihini localStorage'dan al
        const savedMode = normalizeMode(localStorage.getItem('mode') || 'dark');

        // Kaydedilen modu uygula
        applyMode(savedMode);

        // Tema değiştirme butonuna tıklandığında
        themeToggle.addEventListener('click', function() {
            applyMode(currentMode === 'dark' ? 'light' : 'dark');
        });

        return this;
    }

    // Modu uygulama fonksiyonu
    function applyMode(mode) {
        currentMode = normalizeMode(mode);
        localStorage.setItem('mode', currentMode);

        // Eski night-mode efektlerini temizle
        document.documentElement.removeAttribute('data-night-mode');
        document.body.classList.remove('stars-visible');
        document.body.classList.remove('has-stars');
        if (xdText) {
            xdText.classList.toggle('hidden', currentMode !== 'dark');
        }

        document.documentElement.setAttribute('data-theme', currentMode);
        themeToggle.setAttribute('aria-pressed', String(currentMode === 'dark'));
        themeToggle.setAttribute('aria-label', currentMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');

        if (themeToggleLabel) {
            themeToggleLabel.textContent = currentMode === 'dark' ? 'Dark' : 'Light';
        }

        updateBrowserChrome(currentMode);
    }

    function updateBrowserChrome(mode) {
        const chrome = browserChrome[mode] || browserChrome.dark;

        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', chrome.themeColor);
        }

        document.querySelectorAll('link[rel~="icon"]').forEach(iconLink => {
            iconLink.setAttribute('href', chrome.favicon);
        });
    }

    function normalizeMode(mode) {
        return mode === 'light' ? 'light' : 'dark';
    }

    // Public API
    return {
        init: init
    };

})();
