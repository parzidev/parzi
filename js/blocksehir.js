/*
  Konum tabanlı engelleme
  - Engellenen konumlar `block-locations.json` dosyasında tutulur (aynı klasörde)
  - Ülke veya şehir bazlı engelleme yapabilirsiniz
*/
window.locationRedirectCheck = (async function blockUserByLocation() {
  try {
    const scriptUrl = (document.currentScript && document.currentScript.src)
      ? document.currentScript.src
      : new URL('blocksehir.js', window.location.href).toString();

    const blockedLocationsUrl = new URL('block-locations.json', scriptUrl).toString();

    // IP bilgisi, ülke ve şehir bilgisi almak için ipinfo.io kullanıyoruz
    const [locationRes, blockedLocationsRes] = await Promise.all([
      fetch('https://ipinfo.io/json?token=c8d8f13b5d6a0d', { cache: 'no-store' }),
      fetch(blockedLocationsUrl, { cache: 'no-store' })
    ]);

    if (!locationRes.ok) throw new Error('Konum servisinden yanıt alınamadı');
    if (!blockedLocationsRes.ok) throw new Error('block-locations.json bulunamadı veya erişilemedi');

    const locationData = await locationRes.json();
    const userCountry = locationData && locationData.country;
    const userCity = locationData && locationData.city;
    
    if (!userCountry && !userCity) return false;

    const blockedLocations = await blockedLocationsRes.json();

    const normalizeCity = city => city.toLowerCase()
      .replace(/ı/g, 'i')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '');
    const cityRoute = typeof userCity === 'string' && Object.entries(blockedLocations.cities || {})
      .find(([city]) => normalizeCity(city) === normalizeCity(userCity));
    
    // Önce şehir kontrolü yap (daha spesifik)
    if (cityRoute) {
      window.location.href = cityRoute[1];
      return true;
    }
    
    // Sonra ülke kontrolü yap
    if (userCountry && blockedLocations.countries && blockedLocations.countries[userCountry]) {
      window.location.href = blockedLocations.countries[userCountry];
      return true;
    }
    return false;
  } catch (error) {
    console.error('Konum engelleme hatası:', error);
    return false;
  }
})();
