// Hava durumu modülü
const weatherModule = (function () {
    // Özel değişkenler
    const apiKey = 'bc9ee4dc966affd2c33c7358511d1510';
    const city = 'Lüleburgaz';
    let weatherIconElement;
    let weatherDescElement;
    let timeCardElement;
    let weatherAnimationElement;
    let weatherAnimationInterval;

    // Modül başlatma
    function init() {
        weatherIconElement = document.getElementById('weather-icon');
        weatherDescElement = document.getElementById('weather-description');
        timeCardElement = document.querySelector('.time-card');
        weatherAnimationElement = document.querySelector('.weather-animation');

        // Sayfa yüklendiğinde hava durumunu getir
        getWeatherData();

        // Her 30 dakikada bir hava durumunu güncelle
        setInterval(getWeatherData, 30 * 60 * 1000);

        return this;
    }

    // Hava durumu verilerini getir
    async function getWeatherData() {
        try {
            console.log(`Hava durumu verisi alınıyor: ${city}`);

            // API URL'ini oluştur ve URL kodlamasını kullan
            const encodedCity = encodeURIComponent(city);
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&lang=en&units=metric`;

            console.log(`API URL: ${url}`);

            const response = await fetch(url);

            console.log(`API yanıt durumu: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Hata detayları:', errorData);
                throw new Error(`Hava durumu verileri alınamadı: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API yanıtı:', data);

            updateWeatherUI(data);
        } catch (error) {
            console.error('Hava durumu hatası:', error);
            weatherDescElement.textContent = 'Weather unavailable';

            // Varsayılan bir hava durumu göster
            setDefaultWeather();
        }
    }

    // Varsayılan hava durumu göster
    function setDefaultWeather() {
        // Varsayılan olarak açık hava göster
        weatherIconElement.className = 'fas';
        weatherIconElement.classList.add('fa-sun');
        setWeatherBackground('Clear');
    }

    // Hava durumu arayüzünü güncelle
    function updateWeatherUI(data) {
        const weatherMain = data.weather[0].main;
        const weatherDesc = data.weather[0].description;
        const temp = Math.round(data.main.temp);
        const windSpeed = Math.round(data.wind.speed);

        console.log(`Hava durumu: ${weatherMain}, Açıklama: ${weatherDesc}, Sıcaklık: ${temp}°C, Rüzgar: ${windSpeed} m/s`);

        // Hava durumu açıklamasını güncelle
        weatherDescElement.textContent = `${temp}°C - ${windSpeed} m/s`;

        // Hava durumuna göre ikonu ayarla
        setWeatherIcon(weatherMain);

        // Hava durumuna göre saat kartının arka planını ayarla
        setWeatherBackground(weatherMain);

        // Hava durumuna göre animasyonu ayarla
        setWeatherAnimation(weatherMain);

        // Rüzgar hızı yüksekse rüzgar animasyonu göster
        if (windSpeed > 5 && weatherMain !== 'Rain' && weatherMain !== 'Snow' && weatherMain !== 'Thunderstorm') {
            setWeatherAnimation('Wind');
        }

        updateProfileImageByWeather(weatherMain);
    }

    // Hava durumuna göre ikonu ayarla
    function setWeatherIcon(weatherMain) {
        // Önce mevcut sınıfları temizle
        weatherIconElement.className = 'fas';

        // Hava durumuna göre ikon sınıfı ekle
        switch (weatherMain) {
            case 'Clear':
                weatherIconElement.classList.add('fa-sun');
                weatherIconElement.style.color = 'rgba(255, 200, 60, 0.9)';
                break;
            case 'Clouds':
                weatherIconElement.classList.add('fa-cloud');
                weatherIconElement.style.color = 'rgba(200, 200, 220, 0.9)';
                break;
            case 'Rain':
                weatherIconElement.classList.add('fa-cloud-rain');
                weatherIconElement.style.color = 'rgba(160, 180, 220, 0.9)';
                break;
            case 'Drizzle':
                weatherIconElement.classList.add('fa-cloud-showers-heavy');
                weatherIconElement.style.color = 'rgba(160, 180, 220, 0.9)';
                break;
            case 'Snow':
                weatherIconElement.classList.add('fa-snowflake');
                weatherIconElement.style.color = 'rgba(220, 230, 240, 0.9)';
                break;
            case 'Thunderstorm':
                weatherIconElement.classList.add('fa-bolt');
                weatherIconElement.style.color = 'rgba(180, 160, 220, 0.9)';
                break;
            case 'Fog':
            case 'Mist':
            case 'Haze':
                weatherIconElement.classList.add('fa-smog');
                weatherIconElement.style.color = 'rgba(180, 180, 200, 0.9)';
                break;
            case 'Wind':
            case 'Squall':
                weatherIconElement.classList.add('fa-wind');
                weatherIconElement.style.color = 'rgba(160, 200, 200, 0.9)';
                break;
            default:
                weatherIconElement.classList.add('fa-cloud-sun');
                weatherIconElement.style.color = 'rgba(200, 200, 220, 0.9)';
        }
    }

    // Hava durumuna göre arka plan ayarla
    function setWeatherBackground(weatherMain) {
        // Önce tüm sınıfları temizle
        timeCardElement.classList.remove('weather-clear', 'weather-clouds', 'weather-rain', 'weather-snow', 'weather-thunderstorm', 'weather-fog', 'weather-wind');

        // Hava durumuna göre sınıf ekle
        switch (weatherMain) {
            case 'Clear':
                timeCardElement.classList.add('weather-clear');
                break;
            case 'Clouds':
                timeCardElement.classList.add('weather-clouds');
                break;
            case 'Rain':
            case 'Drizzle':
                timeCardElement.classList.add('weather-rain');
                break;
            case 'Snow':
                timeCardElement.classList.add('weather-snow');
                break;
            case 'Thunderstorm':
                timeCardElement.classList.add('weather-thunderstorm');
                break;
            case 'Fog':
            case 'Mist':
            case 'Haze':
                timeCardElement.classList.add('weather-fog');
                break;
            case 'Wind':
            case 'Squall':
                timeCardElement.classList.add('weather-wind');
                break;
            default:
                timeCardElement.classList.add('weather-clear');
        }
    }

    // Hava durumuna göre animasyon ayarla
    function setWeatherAnimation(weatherMain) {
        // Önce mevcut animasyonları temizle
        weatherAnimationElement.innerHTML = '';

        // Animasyon intervallerini temizle
        if (weatherAnimationInterval) {
            clearInterval(weatherAnimationInterval);
        }

        // Hava durumuna göre animasyon ekle
        switch (weatherMain) {
            case 'Clear':
                createSunAnimation();
                break;
            case 'Clouds':
                createCloudAnimation();
                break;
            case 'Rain':
            case 'Drizzle':
                createRainAnimation();
                break;
            case 'Snow':
                createSnowAnimation();
                break;
            case 'Thunderstorm':
                createRainAnimation();
                addThunderEffect();
                break;
            case 'Wind':
            case 'Squall':
                createWindAnimation();
                break;
            case 'Fog':
            case 'Mist':
            case 'Haze':
                createFogAnimation();
                break;
        }
    }

    // Güneş animasyonu oluştur
    function createSunAnimation() {
        // Güneş oluştur
        const sun = document.createElement('div');
        sun.classList.add('sun');
        weatherAnimationElement.appendChild(sun);

        // Güneş ışınları oluştur
        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('div');
            ray.classList.add('sun-ray');

            // Işınlar için açı hesapla (45 derece aralıklarla)
            const angle = i * 45;
            ray.style.transform = `rotate(${angle}deg)`;
            ray.style.top = '20px';
            ray.style.right = '20px';
            ray.style.transformOrigin = '0 center';

            // Işınlar için farklı animasyon gecikmeleri
            ray.style.animationDelay = `${i * 0.5}s`;

            weatherAnimationElement.appendChild(ray);
        }
    }

    // Bulut animasyonu oluştur
    function createCloudAnimation() {
        // Farklı boyutlarda ve hızlarda 3 bulut oluştur
        createCloud(30, 20, 8, '0px', '10px', 15);
        createCloud(40, 25, 12, '30px', '40px', 25);
        createCloud(25, 15, 10, '60px', '20px', 20);
    }

    // Bulut oluşturma yardımcı fonksiyonu
    function createCloud(width, height, duration, top, delay, moveRange) {
        const cloud = document.createElement('div');
        cloud.classList.add('cloud');

        // Bulut boyutu ve pozisyonu
        cloud.style.width = `${width}px`;
        cloud.style.height = `${height}px`;
        cloud.style.top = top;

        // Bulut animasyonu
        cloud.style.animation = `cloud-float ${duration}s linear infinite`;
        cloud.style.animationDelay = delay;

        weatherAnimationElement.appendChild(cloud);

        // Bulutu sola-sağa hareket ettiren animasyon
        weatherAnimationInterval = setInterval(() => {
            // Yeni bulut ekle
            const newCloud = document.createElement('div');
            newCloud.classList.add('cloud');
            newCloud.style.width = `${Math.random() * 20 + 20}px`;
            newCloud.style.height = `${Math.random() * 10 + 15}px`;
            newCloud.style.top = `${Math.random() * 80}px`;
            newCloud.style.animation = `cloud-float ${Math.random() * 5 + 10}s linear`;

            weatherAnimationElement.appendChild(newCloud);

            // Animasyon bitince bulutu kaldır
            setTimeout(() => {
                newCloud.remove();
            }, 15000);
        }, 3000);
    }

    // Rüzgar animasyonu oluştur
    function createWindAnimation() {
        // İlk rüzgar çizgilerini ekle
        for (let i = 0; i < 8; i++) {
            createWindLine();
        }

        // Belirli aralıklarla yeni rüzgar çizgileri ekle
        weatherAnimationInterval = setInterval(() => {
            createWindLine();
        }, 500);
    }

    // Rüzgar çizgisi oluştur
    function createWindLine() {
        const line = document.createElement('div');
        line.classList.add('wind-line');

        // Rastgele yükseklik ve kalınlık
        const height = Math.random() * 1 + 1; // 1-2px arası
        line.style.height = `${height}px`;

        // Rastgele pozisyon
        const topPos = Math.random() * 90 + 5; // 5%-95% arası
        line.style.top = `${topPos}%`;

        // Rastgele genişlik
        const width = Math.random() * 30 + 30; // 30-60px arası
        line.style.width = `${width}px`;

        // Rastgele animasyon süresi
        const duration = Math.random() * 2 + 1; // 1-3 saniye arası
        line.style.animation = `wind ${duration}s linear`;

        weatherAnimationElement.appendChild(line);

        // Animasyon bitince elementi kaldır
        setTimeout(() => {
            line.remove();
        }, duration * 1000);
    }

    // Sis animasyonu oluştur
    function createFogAnimation() {
        // Sis efekti için arka plan bulanıklaştırma
        weatherAnimationElement.style.background = 'rgba(200, 200, 220, 0.3)';
        weatherAnimationElement.style.backdropFilter = 'blur(5px)';

        // Belirli aralıklarla bulanıklık değişimi
        let opacity = 0.3;
        let increasing = true;

        weatherAnimationInterval = setInterval(() => {
            if (increasing) {
                opacity += 0.05;
                if (opacity >= 0.5) increasing = false;
            } else {
                opacity -= 0.05;
                if (opacity <= 0.2) increasing = true;
            }

            weatherAnimationElement.style.background = `rgba(200, 200, 220, ${opacity})`;
        }, 2000);
    }

    // Yağmur animasyonu oluştur
    function createRainAnimation() {
        // İlk damlaları ekle
        for (let i = 0; i < 20; i++) {
            createRaindrop();
        }

        // Belirli aralıklarla yeni damlalar ekle
        weatherAnimationInterval = setInterval(() => {
            createRaindrop();
        }, 300);
    }

    // Kar animasyonu oluştur
    function createSnowAnimation() {
        // İlk kar tanelerini ekle
        for (let i = 0; i < 15; i++) {
            createSnowflake();
        }

        // Belirli aralıklarla yeni kar taneleri ekle
        weatherAnimationInterval = setInterval(() => {
            createSnowflake();
        }, 500);
    }

    // Şimşek efekti ekle
    function addThunderEffect() {
        setInterval(() => {
            // Rastgele şimşek çak
            if (Math.random() > 0.7) {
                weatherAnimationElement.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                setTimeout(() => {
                    weatherAnimationElement.style.backgroundColor = 'transparent';
                }, 100);
            }
        }, 2000);
    }

    // Yağmur damlası oluştur
    function createRaindrop() {
        const drop = document.createElement('div');
        drop.classList.add('raindrop');

        // Rastgele pozisyon
        const leftPos = Math.random() * 100;
        drop.style.left = `${leftPos}%`;

        // Rastgele düşme hızı
        const duration = Math.random() * 0.5 + 0.5; // 0.5-1 saniye arası
        drop.style.animation = `rain ${duration}s linear infinite`;

        weatherAnimationElement.appendChild(drop);

        // Belirli bir süre sonra damlayı kaldır
        setTimeout(() => {
            drop.remove();
        }, duration * 1000 * 2); // Animasyon süresinin 2 katı kadar bekle
    }

    // Kar tanesi oluştur
    function createSnowflake() {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');

        // Rastgele boyut (daha gerçekçi kar taneleri için)
        const size = Math.random() * 3 + 2; // 2-5px arası
        flake.style.width = `${size}px`;
        flake.style.height = `${size}px`;

        // Rastgele pozisyon
        const leftPos = Math.random() * 100;
        flake.style.left = `${leftPos}%`;

        // Rastgele düşme hızı ve yatay hareket
        const duration = Math.random() * 5 + 5; // 5-10 saniye arası
        const horizontalMovement = Math.random() * 60 - 30; // -30px ile +30px arası

        // Kar taneleri için zig-zag hareketli animasyon
        const keyframes = [
            { transform: `translateY(-20px) translateX(0px) rotate(0deg)`, opacity: 0 },
            { transform: `translateY(20px) translateX(${horizontalMovement * 0.3}px) rotate(180deg)`, opacity: 0.9 },
            { transform: `translateY(60px) translateX(${-horizontalMovement * 0.2}px) rotate(360deg)`, opacity: 0.9 },
            { transform: `translateY(100px) translateX(${horizontalMovement * 0.4}px) rotate(720deg)`, opacity: 0.9 },
            { transform: `translateY(120px) translateX(${horizontalMovement}px) rotate(1080deg)`, opacity: 0 }
        ];

        const options = {
            duration: duration * 1000,
            iterations: 1,
            easing: 'ease-in-out'
        };

        const animation = flake.animate(keyframes, options);

        weatherAnimationElement.appendChild(flake);

        // Animasyon bitince kar tanesini kaldır
        animation.onfinish = () => {
            flake.remove();
        };
    }

    // Public API
    return {
        init: init
    };

})();


function updateProfileImageByWeather(weatherMain) {
    const profileImg = document.querySelector('.profile-image img');
    let imgSrc = 'images/me/mesad.png'; // Varsayılan

    switch (weatherMain.toLowerCase()) {
        case 'fog':
        case 'mist':
        case 'haze':
            imgSrc = 'images/me/fog.png';
            break;
        case 'smoke':
            imgSrc = 'images/me/smoke.png';
            break;
        case 'squall':
            imgSrc = 'images/me/squall.png';
            break;
        case 'tornado':
            imgSrc = 'images/me/tornado.png';
            break;
        case 'clouds':
            imgSrc = 'images/me/cloudly.png';
            break;
        case 'rain':
        case 'drizzle':
        case 'thunderstorm':
            imgSrc = 'images/me/rainy.png';
            break;
        case 'snow':
            imgSrc = 'images/me/snowy.png';
            break;
        case 'clear':
        default:
            imgSrc = 'images/me/mesad.png';
            break;
    }

    profileImg.src = imgSrc;
} 