
const apiKey = 'bc9ee4dc966affd2c33c7358511d1510';
const city = 'arnavutköy';

async function getWeather() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        if (!response.ok) {
            throw new Error(`HTTP hata: ${response.status}`);
        }
        const data = await response.json();
        if (data.cod === 200) {
            const temperature = data.main.temp;
            const weatherDescription = data.weather[0].description;
            document.getElementById('weather').innerText = `${temperature}°C, ${weatherDescription}`;
        } else {
            document.getElementById('weather').innerText = 'Hava durumu verisi alınamadı';
        }
    } catch (error) {
        console.error('Hata:', error);
        document.getElementById('weather').innerText = 'Hava durumu verisi alınamadı';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    getWeather(); // Sayfa yüklendiğinde hava durumu bilgisini al
});