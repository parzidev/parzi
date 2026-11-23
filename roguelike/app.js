(() => {
  const data = window.ROGUELIKE_CATALOG;
  if (!data) return;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };
  const picture = (path, name) => {
    const img = el('img');
    img.src = path;
    img.alt = name;
    img.loading = 'lazy';
    return img;
  };
  const note = (node, value, label) => {
    if (!value) return;
    const p = el('p');
    if (label) p.append(el('strong', '', label + ' '));
    p.append(document.createTextNode(value));
    node.append(p);
  };
  const itemGrid = document.querySelector('#item-grid');
  const search = document.querySelector('#search');
  let filter = 'all';
  const normalize = value => String(value ?? '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
  function renderItems() {
    const query = normalize(search.value.trim());
    const selected = data.items.filter(item => {
      const category = normalize(item.category);
      const matchesFilter = filter === 'all' || (filter === 'cursed' ? item.curse > 0 : filter === 'normal' ? !item.curse : category === normalize(filter));
      return matchesFilter && normalize(item.name + ' ' + item.desc).includes(query);
    });
    itemGrid.replaceChildren();
    for (const item of selected) {
      const card = el('article', 'item');
      const content = el('div');
      card.append(picture(item.icon, ''), content);
      content.append(el('h3', '', item.name), el('p', '', item.desc.replace(/^Lanetli · /, '')));
      const attributes = [];
      if (item.curse) attributes.push('LANETLİ');
      if (item.tier) attributes.push('KADEME ' + ['','I','II','III','IV'][item.tier]);
      if (item.price) attributes.push(item.price + ' MALZEME');
      content.append(el('p', 'meta', attributes.join(' · ')));
      itemGrid.append(card);
    }
    document.querySelector('#item-count').textContent = selected.length + ' EŞYA';
    document.querySelector('#no-results').hidden = selected.length !== 0;
  }
  search.addEventListener('input', renderItems);
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  function chooseFilter(value) {
    filter = value;
    for (const button of filterButtons) {
      const active = button.dataset.filter === value;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    renderItems();
  }
  for (const button of filterButtons) {
    button.addEventListener('click', () => chooseFilter(button.dataset.filter));
  }
  document.querySelector('#latest-items').addEventListener('click', () => {
    search.value = '';
    chooseFilter('cursed');
  });
  renderItems();
  for (const hero of data.heroes) {
    const card = el('article', 'hero'), content = el('div');
    content.append(el('h3', '', hero.name), el('p', '', hero.desc));
    card.append(picture(hero.icon, ''), content);
    document.querySelector('#hero-grid').append(card);
  }
  for (const boss of data.bosses) {
    const card = el('article', 'boss');
    card.append(picture(boss.icon, ''), el('h3', '', boss.name));
    note(card, boss.desc);
    note(card, boss.phase, 'İkinci evre');
    note(card, boss.counter, 'Karşılık');
    document.querySelector('#boss-grid').append(card);
  }
  const families = { primitive: 'İlkel', precise: 'Hassas', unarmed: 'Silahsız', tool: 'Alet' };
  const number = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
  for (const weapon of data.weapons) {
    const card = el('article', 'weapon'), content = el('div');
    content.append(el('h3', '', weapon.name), el('p', '', weapon.desc));
    const metadata = [
      families[weapon.family],
      'Hasar ' + number.format(weapon.damage),
      'Menzil ' + number.format(weapon.range),
      number.format(weapon.cooldown) + ' sn'
    ];
    content.append(el('p', 'meta', metadata.filter(Boolean).join(' · ')));
    card.append(picture(weapon.icon, ''), content);
    document.querySelector('#weapon-grid').append(card);
  }
  for (const group of window.ROGUELIKE_SYSTEMS || []) {
    const section = el('article', 'system-group'), entries = el('div');
    section.append(el('h3', '', group.title), entries);
    for (const entry of group.entries) {
      const row = el('div', 'system-entry');
      row.append(el('h4', '', entry.title), el('p', '', entry.text));
      entries.append(row);
    }
    document.querySelector('#system-list').append(section);
  }
})();
