// Tema modülü
const themeModule = (function() {
    // Özel değişkenler
    let themeToggle;
    let themeOptions;
    let themeToggleLabel;
    let xdText;
    let themeColorMeta;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    let preferredMode = readPreference();
    let currentMode = preferredMode || getSystemMode();
    const browserChrome = {
        dark: {
            favicon: 'images/code-white.png',
            themeColor: '#111111'
        },
        light: {
            favicon: 'images/code.png',
            themeColor: '#ffffff'
        }
    };

    // Apply before the stylesheets load so dark-mode visitors do not see a white flash.
    themeColorMeta = document.getElementById('theme-color-meta');
    document.documentElement.setAttribute('data-theme', currentMode);
    updateBrowserChrome(currentMode);

    // Modül başlatma
    function init() {
        themeToggle = document.getElementById('theme-toggle');
        themeOptions = document.querySelectorAll('[data-theme-option]');
        themeToggleLabel = document.getElementById('theme-toggle-label');
        xdText = document.getElementById('xd-text');
        themeColorMeta = document.getElementById('theme-color-meta');

        if (!themeToggle) {
            console.error('Tema değiştirme öğeleri bulunamadı.');
            return this;
        }

        applyMode(preferredMode || getSystemMode());

        if (themeOptions.length) {
            themeOptions.forEach(option => {
                option.addEventListener('click', () => chooseMode(option.dataset.themeOption));
            });
        } else {
            themeToggle.addEventListener('click', function() {
                chooseMode(currentMode === 'dark' ? 'light' : 'dark');
            });
        }

        const followSystemTheme = () => {
            if (!preferredMode) applyMode(getSystemMode());
        };
        if (systemTheme.addEventListener) {
            systemTheme.addEventListener('change', followSystemTheme);
        } else {
            systemTheme.addListener(followSystemTheme);
        }

        return this;
    }

    // Modu uygulama fonksiyonu
    function applyMode(mode) {
        currentMode = normalizeMode(mode);

        // Eski night-mode efektlerini temizle
        document.documentElement.removeAttribute('data-night-mode');
        document.body.classList.remove('stars-visible');
        document.body.classList.remove('has-stars');
        if (xdText) {
            xdText.classList.toggle('hidden', currentMode !== 'dark');
        }

        document.documentElement.setAttribute('data-theme', currentMode);
        if (themeOptions.length) {
            themeOptions.forEach(option => {
                option.setAttribute('aria-pressed', String(option.dataset.themeOption === currentMode));
                option.setAttribute('aria-label', `Use ${option.dataset.themeOption} theme`);
            });
        } else {
            themeToggle.setAttribute('aria-pressed', String(currentMode === 'dark'));
            themeToggle.setAttribute('aria-label', currentMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        }

        if (themeToggleLabel) {
            themeToggleLabel.textContent = currentMode === 'dark' ? 'Dark' : 'Light';
        }

        updateBrowserChrome(currentMode);
    }

    function chooseMode(mode) {
        preferredMode = normalizeMode(mode);
        try {
            localStorage.setItem('mode', preferredMode);
        } catch (error) {
            // Keep the explicit choice in memory when storage is unavailable.
        }
        applyMode(preferredMode);
    }

    function readPreference() {
        try {
            const mode = localStorage.getItem('mode');
            return mode === 'dark' || mode === 'light' ? mode : null;
        } catch (error) {
            return null;
        }
    }

    function getSystemMode() {
        return systemTheme.matches ? 'dark' : 'light';
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
        return mode === 'dark' ? 'dark' : 'light';
    }

    // Public API
    return {
        init: init
    };

})();
