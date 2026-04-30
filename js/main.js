// Ana uygulama modülü
const app = (function() {
    // Sosyal medya linklerini ayarla
    function setupSocialLinks() {
        const socialLinks = document.querySelectorAll('.social-links a');
        
        socialLinks.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }

    function setupLoadingStates() {
        const loadingElements = document.querySelectorAll('.loading-value');
        const pendingText = new Set(['', '-', 'Loading...']);

        loadingElements.forEach(element => {
            let observer;
            const clearLoading = () => {
                if (!pendingText.has(element.textContent.trim())) {
                    element.classList.remove('loading-value');
                    element.removeAttribute('aria-busy');
                    if (observer) {
                        observer.disconnect();
                    }
                }
            };

            element.setAttribute('aria-busy', 'true');
            clearLoading();

            observer = new MutationObserver(clearLoading);
            observer.observe(element, {
                childList: true,
                characterData: true,
                subtree: true
            });
        });
    }
    
    // Uygulama başlatma
    function init() {
        console.log('Sayfa yüklendi');
        
        // Sosyal medya linklerini ayarla
        setupSocialLinks();
        setupLoadingStates();
        
        // Tüm modülleri başlat
        timeModule.init();
        themeModule.init();
        weatherModule.init();
        spotifyModule.init();
        githubModule.init();
        fitbitModule.init();
        
        return this;
    }
    
    // Public API
    return {
        init: init
    };
})();

// Sayfa yüklendiğinde uygulamayı başlat
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});
