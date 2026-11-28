const rewards = [
  { game: 'Clash of Clans', name: 'Fire Dragon Skull dekoru', event: 'Black Friday', image: 'clans', end: '2026-12-01T08:00:00Z', url: 'https://store.supercell.com/clashofclans?voucher=06e8053a-1538-4220-8b49-ea43540d7275' },
  { game: 'Clash Royale', name: 'Wall Breakers ifadesi', event: 'Black Friday', image: 'royale', end: '2026-12-01T08:00:00Z', url: 'https://store.supercell.com/clashroyale?voucher=c3fb2ecb-417a-427b-a2c2-917d7f2aed6e' },
  { game: 'Brawl Stars', name: 'Miami Vice spreyi', event: 'Black Friday', image: 'brawl', end: '2026-12-01T08:00:00Z', url: 'https://store.supercell.com/brawlstars?voucher=9bc207e5-efc7-4c7b-a472-bcf415c9188f' },
  { game: 'Hay Day', name: '500 Altın Anahtar', event: 'Black Friday', image: 'hayday', end: '2026-12-01T08:00:00Z', url: 'https://store.supercell.com/hayday?voucher=d915602f-f4ad-41a3-a53f-886925899bf6' },
  { game: 'Brawl Stars', name: '1 Thunder Frogs kutusu', event: 'Thunder Frogs', image: 'thunder', end: '2026-11-29T09:00:00Z', url: 'https://link.brawlstars.com/voucher/af1ff7ad-04f3-4114-a420-6b1654d4d5f4' }
];

const container = document.querySelector('#rewards');
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
container.innerHTML = rewards.map((reward, index) => `
  <article class="card card-${reward.image}" data-game="${reward.game}" data-index="${index}">
    <div class="art"><img class="banner" src="assets/${reward.image}-banner.webp" alt="" ${index > 2 ? 'loading="lazy"' : ''}><span class="event">${reward.event}</span><img class="prize" src="assets/${reward.image}-reward.webp" alt=""></div>
    <div class="card-body"><div class="game">${reward.game}</div><h2>${reward.name}</h2>
      <div class="timing"><div><span class="timing-label">BİTİŞ</span><time datetime="${reward.end}">${dateFormatter.format(new Date(reward.end))}</time></div><div class="remaining"><span class="timing-label">KALAN SÜRE</span><span class="countdown"></span></div></div>
      <a class="claim" href="${reward.url}" target="_blank" rel="noopener noreferrer">Ödülü al</a>
    </div>
  </article>`).join('');

function updateTimers() {
  const now = Date.now();
  document.querySelectorAll('.card').forEach(card => {
    const reward = rewards[Number(card.dataset.index)];
    const seconds = Math.max(0, Math.floor((Date.parse(reward.end) - now) / 1000));
    const timer = card.querySelector('.countdown');
    const claim = card.querySelector('.claim');
    if (seconds === 0) {
      timer.textContent = 'Süresi doldu';
      claim.textContent = 'Süresi doldu';
      claim.removeAttribute('href');
      claim.removeAttribute('target');
      claim.setAttribute('aria-disabled', 'true');
      return;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds % 86400 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const remainder = seconds % 60;
    timer.textContent = `${days ? `${days}g ` : ''}${hours}sa ${minutes}dk ${remainder}sn`;
  });
}
updateTimers();
setInterval(updateTimers, 1000);

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(filter => {
      const selected = filter === button;
      filter.classList.toggle('active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('.card').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.game !== button.dataset.filter;
    });
  });
});
