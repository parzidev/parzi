/*
  IP tabanlı yönlendirme
  - Eşleşmeler `ip-routes.json` dosyasında tutulur (aynı klasörde)
  - Dosyaya yeni IP:URL çifti ekleyerek yönlendirmeleri genişletebilirsiniz
*/
(async function routeUserByIp() {
  try {
    const scriptUrl = (document.currentScript && document.currentScript.src)
      ? document.currentScript.src
      : new URL('ip.js', window.location.href).toString();

    const routesUrl = new URL('ip-routes.json', scriptUrl).toString();

    const [ipRes, routesRes] = await Promise.all([
      fetch('https://api.ipify.org?format=json', { cache: 'no-store' }),
      fetch(routesUrl, { cache: 'no-store' })
    ]);

    if (!ipRes.ok) throw new Error('IP servisinden yanıt alınamadı');
    if (!routesRes.ok) throw new Error('ip-routes.json bulunamadı veya erişilemedi');

    const ipData = await ipRes.json();
    const userIp = ipData && ipData.ip;
    if (!userIp) return;

    const routes = await routesRes.json();
    const targetUrl = routes && routes[userIp];

    if (typeof targetUrl === 'string' && targetUrl.length > 0) {
      if (await window.locationRedirectCheck) return;
      console.log('Yönlendirme hedefi:', targetUrl);
      window.location.href = targetUrl;
    }
  } catch (error) {
    console.error('IP yönlendirme hatası:', error);
  }
})();
