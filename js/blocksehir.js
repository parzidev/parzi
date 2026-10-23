/*
  Konum tabanlı engelleme
  - Engellenen konumlar `block-locations.json` dosyasında tutulur (aynı klasörde)
  - Ülke, bölge veya şehir bazlı engelleme yapabilirsiniz
*/
window.locationRedirectCheck = (async function blockUserByLocation() {
  try {
    const scriptUrl = (document.currentScript && document.currentScript.src)
      ? document.currentScript.src
      : new URL('blocksehir.js', window.location.href).toString();

    const blockedLocationsUrl = new URL('block-locations.json', scriptUrl).toString();

    // Ziyaretçi paneliyle aynı konum kaynağını kullan.
    const [locationRes, blockedLocationsRes] = await Promise.all([
      fetch('https://log.parzi.dev/api/ip', { cache: 'no-store' }),
      fetch(blockedLocationsUrl, { cache: 'no-store' })
    ]);

    if (!locationRes.ok) throw new Error('Konum servisinden yanıt alınamadı');
    if (!blockedLocationsRes.ok) throw new Error('block-locations.json bulunamadı veya erişilemedi');

    const locationData = await locationRes.json();
    const userLocation = (locationData && locationData.location) || {};
    const userCountry = userLocation.country_code;
    const userCity = userLocation.city;
    const userRegion = userLocation.state;
    
    if (!userCountry && !userCity && !userRegion) return false;

    const blockedLocations = await blockedLocationsRes.json();

    const normalizeLocation = name => name.toLowerCase()
      .replace(/ı/g, 'i')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '');
    const findRoute = (routes, value) => typeof value === 'string' && Object.entries(routes || {})
      .find(([name]) => normalizeLocation(name) === normalizeLocation(value));
    const locationRoute = findRoute(blockedLocations.cities, userCity)
      || findRoute(blockedLocations.regions, userRegion);
    
    // Önce şehir, ardından bölge kontrolü yap.
    if (locationRoute) {
      window.location.href = locationRoute[1];
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
