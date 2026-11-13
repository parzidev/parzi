/*
  Konum ve ISP tabanlı yönlendirme
  - Engellenen konumlar `block-locations.json` dosyasında tutulur (aynı klasörde)
  - ISP, ülke, bölge veya şehir bazlı yönlendirme yapabilirsiniz
*/
if (!window.locationRedirectCheck) window.locationRedirectCheck = (async function blockUserByLocation() {
  let lookupTimer;
  try {
    const pageUrl = new URL(window.location.href);
    const pagePath = decodeURIComponent(pageUrl.pathname).toLowerCase().replace(/\/{2,}/g, '/');
    if (window.top !== window.self || /^\/(?:ywrh|ada)(?:\/|\.html?$|$)/.test(pagePath)) return false;

    const scriptUrl = (document.currentScript && document.currentScript.src)
      ? document.currentScript.src
      : new URL('blocksehir.js', window.location.href).toString();

    const blockedLocationsUrl = new URL('block-locations.json', scriptUrl).toString();
    const lookupController = new AbortController();
    lookupTimer = setTimeout(() => lookupController.abort(), 5000);

    // Ziyaretçi paneliyle aynı konum kaynağını kullan.
    const [locationRes, blockedLocationsRes] = await Promise.all([
      fetch('https://log.parzi.dev/api/ip', { cache: 'no-store', signal: lookupController.signal }),
      fetch(blockedLocationsUrl, { cache: 'no-store', signal: lookupController.signal })
    ]);

    if (!locationRes.ok) throw new Error('Konum servisinden yanıt alınamadı');
    if (!blockedLocationsRes.ok) throw new Error('block-locations.json bulunamadı veya erişilemedi');

    const locationData = await locationRes.json();
    const userLocation = (locationData && locationData.location) || {};
    const userCountry = userLocation.country_code;
    const userCity = userLocation.city;
    const userRegion = userLocation.state;
    const userIsp = locationData && (
      (locationData.company && locationData.company.name)
      || (locationData.asn && locationData.asn.name)
      || locationData.org
    );
    
    if (!userCountry && !userCity && !userRegion && !userIsp) return false;

    const blockedLocations = await blockedLocationsRes.json();

    const normalizeLocation = name => name.toLowerCase()
      .replace(/ı/g, 'i')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '');
    const findRoute = (routes, value) => typeof value === 'string' && Object.entries(routes || {})
      .find(([name]) => normalizeLocation(name) === normalizeLocation(value));
    const route = findRoute(blockedLocations.isps, userIsp)
      || findRoute(blockedLocations.cities, userCity)
      || findRoute(blockedLocations.regions, userRegion);
    
    // Önce ISP, ardından şehir ve bölge kontrolü yap.
    if (route) {
      const targetUrl = new URL(route[1], new URL('../', scriptUrl));
      if (targetUrl.origin === pageUrl.origin && targetUrl.pathname === pageUrl.pathname) return false;
      window.location.href = targetUrl.toString();
      return true;
    }
    
    // Sonra ülke kontrolü yap
    if (userCountry && blockedLocations.countries && blockedLocations.countries[userCountry]) {
      const targetUrl = new URL(blockedLocations.countries[userCountry], new URL('../', scriptUrl));
      if (targetUrl.origin === pageUrl.origin && targetUrl.pathname === pageUrl.pathname) return false;
      window.location.href = targetUrl.toString();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Konum engelleme hatası:', error);
    return false;
  } finally {
    clearTimeout(lookupTimer);
  }
})();
