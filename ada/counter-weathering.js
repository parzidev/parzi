(() => {
  'use strict';

  const DAY = 86400000;
  const STOP_DAY = Date.UTC(2026, 9, 17);
  const calendar = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric'
  });

  function weatheringAge(now = new Date()) {
    const parts = Object.fromEntries(calendar.formatToParts(now).map(part => [part.type, part.value]));
    return Math.max(0, Math.floor((Date.UTC(+parts.year, +parts.month - 1, +parts.day) - STOP_DAY) / DAY));
  }

  // Each feature owns a seed: existing marks survive new days and resizes.
  function randomFromSeed(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6D2B79F5;
      let value = Math.imul(state ^ state >>> 15, 1 | state);
      value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  const container = document.getElementById('day-counter');
  const value = document.getElementById('counter-value');
  const canvas = document.getElementById('counter-weathering');
  if (!container || !value || !canvas) return;

  let lastKey = '';
  let frame = 0;
  let previewOffset = 0;

  function render() {
    frame = 0;
    const bounds = value.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const style = getComputedStyle(value);
    const em = parseFloat(style.fontSize);
    const age = weatheringAge() + previewOffset;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const key = [age, bounds.width, bounds.height, style.font, style.color, density].join(':');
    if (key === lastKey) return;

    const padding = em * 0.11;
    const width = Math.ceil(bounds.width + padding * 2);
    const height = Math.ceil(bounds.height + padding * 2);
    const wear = 1 - Math.exp(-age / 180);
    const onset = 0.82 + 0.18 * smooth(0, 15, age);

    function layer() {
      const image = document.createElement('canvas');
      image.width = Math.ceil(width * density);
      image.height = Math.ceil(height * density);
      const context = image.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.scale(density, density);
      return { image, context };
    }

    const mask = layer();
    const ink = mask.context;
    ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ink.textAlign = 'center';
    ink.textBaseline = 'alphabetic';
    const metrics = ink.measureText(value.textContent.trim());
    const ascent = metrics.fontBoundingBoxAscent ?? em * 0.8;
    const descent = metrics.fontBoundingBoxDescent ?? em * 0.2;
    const baseline = padding + (bounds.height - ascent - descent) / 2 + ascent;
    ink.fillText(value.textContent.trim(), width / 2, baseline);
    const pixels = ink.getImageData(0, 0, mask.image.width, mask.image.height).data;

    function inside(x, y) {
      const px = Math.floor(x * density);
      const py = Math.floor(y * density);
      if (px < 0 || py < 0 || px >= mask.image.width || py >= mask.image.height) return false;
      return pixels[(py * mask.image.width + px) * 4 + 3] > 180;
    }

    function anchor(seed, edge = false, lower = false) {
      const random = randomFromSeed(seed);
      for (let attempt = 0; attempt < 600; attempt++) {
        const x = padding + random() * bounds.width;
        const y = padding + random() * bounds.height;
        if (!inside(x, y) || (lower && y < baseline - em * 0.38)) continue;
        const step = em * 0.018;
        if (!edge || (lower ? !inside(x, y + step) :
          !inside(x + step, y) || !inside(x - step, y) ||
          !inside(x, y + step) || !inside(x, y - step))) return { x, y };
      }
      return null;
    }

    const stone = layer();
    const surface = stone.context;
    const erosion = layer();
    erosion.context.drawImage(mask.image, 0, 0, width, height);
    const cut = erosion.context;
    cut.globalCompositeOperation = 'destination-out';

    function hash(x, y, seed) {
      let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
      value = Math.imul(value ^ value >>> 13, 1274126177);
      return ((value ^ value >>> 16) >>> 0) / 4294967295;
    }

    function noise(x, y, seed) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const top = hash(ix, iy, seed) * (1 - sx) + hash(ix + 1, iy, seed) * sx;
      const bottom = hash(ix, iy + 1, seed) * (1 - sx) + hash(ix + 1, iy + 1, seed) * sx;
      return top * (1 - sy) + bottom * sy;
    }

    function texture(x, y, seed) {
      return noise(x, y, seed) * 0.55 + noise(x * 2.13, y * 2.13, seed + 41) * 0.3 +
        noise(x * 5.07, y * 5.07, seed + 113) * 0.15;
    }

    function smooth(low, high, value) {
      const amount = Math.max(0, Math.min(1, (value - low) / (high - low)));
      return amount * amount * (3 - 2 * amount);
    }

    // Broad oxide blooms and embedded grime stay visible even on a phone.
    // Coordinates follow the font size so patches stay on the same glyph areas.
    const material = document.createElement('canvas');
    material.width = width;
    material.height = height;
    const materialContext = material.getContext('2d');
    if (!materialContext) throw new Error('Canvas unavailable');
    const pigment = materialContext.createImageData(width, height);
    const night = Number(style.color.match(/[\d.]+/)[0]) > 180;
    const base = night ? [157, 148, 122] : [125, 116, 96];
    const edgeStep = em * 0.009;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!inside(x + 0.5, y + 0.5)) continue;
        const u = x / em;
        const v = y / em;
        const mineral = texture(u * 19, v * 19, 9031);
        const rough = hash(Math.floor(u * 700), Math.floor(v * 700), 6197);
        const edge = !inside(x + edgeStep, y) || !inside(x - edgeStep, y) ||
          !inside(x, y + edgeStep) || !inside(x, y - edgeStep);
        const oxide = texture(u * 7.2, v * 9.3, 47621);
        const rust = smooth(0.45 - wear * 0.09, 0.68 - wear * 0.05, oxide + (edge ? 0.16 : 0));
        const damp = texture(u * 10.5 + 8, v * 6.1, 73141);
        const lower = Math.max(0, Math.min(1, (y - baseline + em * 0.35) / (em * 0.35)));
        const dirt = smooth(0.56 - wear * 0.07, 0.79, damp + lower * 0.055) * (0.7 + wear * 0.2);
        const iron = 0.35 + mineral * 0.65;
        const rustColor = [100 + iron * 72, 43 + iron * 47, 20 + iron * 21];
        const offset = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const metal = base[channel] + (mineral - 0.5) * 42 + (rough - 0.5) * 25;
          const corroded = metal * (1 - rust * 0.88) + rustColor[channel] * rust * 0.88;
          pigment.data[offset + channel] = corroded * (1 - dirt) + [38, 39, 28][channel] * dirt;
        }
        pigment.data[offset + 3] = Math.round(255 * (0.66 + rust * 0.13 + dirt * 0.12));
      }
    }
    materialContext.putImageData(pigment, 0, 0);
    surface.drawImage(material, 0, 0);

    const light = surface.createLinearGradient(0, padding, width * 0.55, baseline);
    light.addColorStop(0, 'rgba(255, 240, 199, 0.15)');
    light.addColorStop(0.45, 'rgba(230, 214, 195, 0.015)');
    light.addColorStop(1, 'rgba(32, 29, 21, 0.16)');
    surface.fillStyle = light;
    surface.fillRect(0, 0, width, height);

    // Mineral flecks, fine pits and worn horizontal grain.
    const grain = randomFromSeed(436071);
    const minerals = ['rgba(255,234,184,.25)', 'rgba(33,31,21,.3)', 'rgba(183,88,31,.35)'];
    for (let index = 0; index < 12500; index++) {
      const x = grain() * width;
      const y = grain() * height;
      const size = em * (0.0006 + grain() * 0.0022);
      surface.fillStyle = minerals[index % minerals.length];
      surface.fillRect(x, y, size * (1 + grain() * 1.7), size);
    }

    function trace(context, points) {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index++) context.lineTo(points[index].x, points[index].y);
    }

    function fissure(points, thickness) {
      surface.save();
      surface.lineJoin = 'round';
      surface.lineCap = 'round';
      trace(surface, points);
      surface.strokeStyle = 'rgba(101,43,19,.2)';
      surface.lineWidth = thickness * 8;
      surface.stroke();
      surface.strokeStyle = 'rgba(163,72,25,.43)';
      surface.lineWidth = thickness * 3.8;
      surface.stroke();
      surface.translate(em * 0.0015, em * 0.0018);
      trace(surface, points);
      surface.strokeStyle = 'rgba(231, 179, 104, 0.6)';
      surface.lineWidth = thickness * 1.7;
      surface.stroke();
      surface.restore();
      trace(surface, points);
      surface.strokeStyle = 'rgba(36, 27, 19, 0.76)';
      surface.lineWidth = thickness;
      surface.stroke();
      trace(cut, points);
      cut.strokeStyle = 'rgba(0,0,0,.8)';
      cut.lineWidth = thickness * 0.32;
      cut.stroke();
    }

    const cracks = [];
    const crackCount = 16 + Math.min(120, age);
    for (let index = 0; index < crackCount; index++) {
      const point = anchor(51000 + index * 7919);
      if (!point) continue;
      const random = randomFromSeed(93000 + index * 3571);
      const lived = age - Math.max(0, index - 15);
      const growth = 0.3 + 0.7 * (1 - Math.exp(-(lived + 3) / 42));
      const angle = random() * Math.PI * 2;
      const length = em * (0.08 + random() * 0.18);
      const steps = 12;
      const points = [point];
      let direction = angle;
      // Generate the entire crack first, then expose its growing tip.
      for (let step = 0; step < steps; step++) {
        direction += (random() - 0.5) * 1.05;
        const previous = points[points.length - 1];
        points.push({
          x: previous.x + Math.cos(direction) * length / steps,
          y: previous.y + Math.sin(direction) * length / steps
        });
      }
      cracks.push(points);
      const end = growth * steps;
      const whole = Math.floor(end);
      const visible = points.slice(0, whole + 1);
      if (whole < steps) visible.push({
        x: points[whole].x + (points[whole + 1].x - points[whole].x) * (end - whole),
        y: points[whole].y + (points[whole + 1].y - points[whole].y) * (end - whole)
      });
      const thickness = em * (0.0018 + random() * 0.0022) * (0.7 + growth * 0.55);
      fissure(visible, thickness);
      if (whole > 4) {
        const junction = points[3];
        const turn = angle + (index % 2 ? 1 : -1) * 1.1;
        fissure([junction, {
          x: junction.x + Math.cos(turn) * length * growth * 0.23,
          y: junction.y + Math.sin(turn) * length * growth * 0.23
        }, {
          x: junction.x + Math.cos(turn + 0.4) * length * growth * 0.4,
          y: junction.y + Math.sin(turn + 0.4) * length * growth * 0.4
        }], thickness * 0.5);
      }
    }

    // Chips start at the contours, leaving the counters and glyph shapes intact.
    const chipCount = 24 + Math.min(130, age);
    for (let index = 0; index < chipCount; index++) {
      const point = anchor(171000 + index * 3169, true);
      if (!point) continue;
      const random = randomFromSeed(261000 + index * 1069);
      const lived = age - Math.max(0, index - 23);
      const growth = 0.35 + 0.65 * (1 - Math.exp(-(lived + 5) / 140));
      const radius = em * (0.01 + random() * 0.024) * growth;
      const points = [];
      for (let corner = 0; corner < 7; corner++) {
        const angle = corner / 7 * Math.PI * 2;
        const reach = radius * (0.55 + random() * 0.7);
        points.push({ x: point.x + Math.cos(angle) * reach, y: point.y + Math.sin(angle) * reach });
      }
      trace(surface, [...points, points[0]]);
      surface.strokeStyle = 'rgba(112,49,21,.7)';
      surface.lineWidth = em * 0.008;
      surface.stroke();
      surface.strokeStyle = 'rgba(219,157,82,.55)';
      surface.lineWidth = em * 0.0028;
      surface.stroke();
      if (index % 3 === 0) {
        const length = em * (0.025 + random() * 0.065) * growth;
        const stain = surface.createLinearGradient(point.x, point.y, point.x, point.y + length);
        stain.addColorStop(0, 'rgba(89,43,22,.38)');
        stain.addColorStop(1, 'rgba(89,43,22,0)');
        surface.strokeStyle = stain;
        surface.lineWidth = radius * 0.7;
        surface.beginPath();
        surface.moveTo(point.x, point.y);
        surface.quadraticCurveTo(point.x + radius * 0.3, point.y + length * 0.5, point.x + radius * 0.2, point.y + length);
        surface.stroke();
      }
      trace(cut, points);
      cut.closePath();
      cut.fillStyle = '#000';
      cut.fill();
    }

    const moss = layer();
    const green = moss.context;
    const colonies = [];
    const mossCount = 18 + Math.min(32, Math.floor(age / 4));
    const palette = ['#24351c', '#354b24', '#4a632b', '#758a3d', '#a3ad64'];
    for (let index = 0; index < mossCount; index++) {
      const random = randomFromSeed(371000 + index * 2017);
      const birth = index < 18 ? 0 : (index - 17) * 4;
      const growth = 0.46 + 0.54 * (1 - Math.exp(-(age - birth + 5) / 130));
      let point = anchor(431000 + index * 1249, true, true);
      const hanging = index % 3 !== 0;
      if (!hanging && cracks.length) point = cracks[index % Math.min(16, cracks.length)][2];
      if (!point) continue;
      const radius = em * (0.065 + random() * 0.075);
      const phase = random() * Math.PI * 2;
      colonies.push({ point, growth, radius, hanging, index });
      const haloRadius = radius * growth * 1.5;
      const soil = surface.createRadialGradient(point.x, point.y, 0, point.x, point.y, haloRadius);
      soil.addColorStop(0, 'rgba(29,33,19,.42)');
      soil.addColorStop(0.6, 'rgba(61,54,27,.22)');
      soil.addColorStop(1, 'rgba(61,54,27,0)');
      surface.fillStyle = soil;
      surface.fillRect(point.x - haloRadius, point.y - haloRadius, haloRadius * 2, haloRadius * 2);

      // An irregular dark cushion joins the small leaves into living moss mats.
      green.beginPath();
      for (let corner = 0; corner <= 48; corner++) {
        const angle = corner / 48 * Math.PI * 2;
        const outline = 0.8 + Math.sin(angle * 3 + phase) * 0.12 + Math.sin(angle * 7 - phase) * 0.08;
        const x = point.x + Math.cos(angle) * radius * growth * outline;
        const y = point.y + Math.sin(angle) * radius * growth * outline * 0.64;
        if (corner === 0) green.moveTo(x, y);
        else green.lineTo(x, y);
      }
      green.closePath();
      green.globalAlpha = 0.82;
      green.fillStyle = '#2c3d20';
      green.fill();
      // Leaves have fixed positions; the colony reveals them from its center out.
      for (let leaf = 0; leaf < 1100; leaf++) {
        const angle = random() * Math.PI * 2;
        const distance = Math.sqrt(random());
        const x = point.x + Math.cos(angle) * distance * radius;
        const y = point.y + Math.sin(angle) * distance * radius * 0.64;
        const size = Math.max(0.3, em * (0.0013 + random() * 0.003));
        const shade = Math.floor(random() * palette.length);
        const rotation = random() * Math.PI;
        const outline = 0.8 + Math.sin(angle * 3 + phase) * 0.12 + Math.sin(angle * 7 - phase) * 0.08;
        if (distance > growth * outline) continue;
        green.globalAlpha = 0.62 + (1 - distance) * 0.3;
        green.fillStyle = 'rgba(16,28,12,.42)';
        green.beginPath();
        green.ellipse(x + size * 0.5, y + size * 0.65, size * 1.5, size * 0.7, rotation, 0, Math.PI * 2);
        green.fill();
        green.fillStyle = palette[shade];
        green.beginPath();
        green.ellipse(x, y, size * 1.5, size * 0.65, rotation, 0, Math.PI * 2);
        green.fill();
      }
    }
    surface.globalCompositeOperation = 'destination-in';
    surface.drawImage(erosion.image, 0, 0, width, height);
    green.globalAlpha = 1;
    green.globalCompositeOperation = 'destination-in';
    green.drawImage(erosion.image, 0, 0, width, height);

    // Commit only a complete frame, keeping the original text as a fallback.
    const final = layer();
    const output = final.context;
    output.drawImage(stone.image, 0, 0, width, height);
    output.drawImage(moss.image, 0, 0, width, height);
    for (const colony of colonies) {
      if (!colony.hanging) continue;
      const random = randomFromSeed(571000 + colony.index * 4093);
      for (let stem = 0; stem < 7; stem++) {
        const x = colony.point.x + (random() - 0.5) * colony.radius * 0.65;
        const y = colony.point.y;
        const maxLength = em * (0.008 + random() * 0.018);
        const bendFactor = random() - 0.5;
        const reveal = random() * 0.75;
        if (reveal > colony.growth || !inside(x, y)) continue;
        const length = maxLength * colony.growth;
        const bend = bendFactor * length;
        output.strokeStyle = 'rgba(69,91,43,.65)';
        output.lineWidth = Math.max(0.45, em * 0.0013);
        output.beginPath();
        output.moveTo(x, y);
        output.quadraticCurveTo(x + bend, y + length * 0.6, x + bend * 0.7, y + length);
        output.stroke();
        output.fillStyle = 'rgba(143,157,91,.8)';
        output.beginPath();
        output.ellipse(x + bend * 0.5, y + length * 0.7, em * 0.002, em * 0.0009, -0.6, 0, Math.PI * 2);
        output.fill();
      }
    }

    canvas.width = final.image.width;
    canvas.height = final.image.height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.globalAlpha = onset;
    context.drawImage(final.image, 0, 0);
    context.globalAlpha = 1;
    container.classList.add('has-weathering');
    lastKey = key;
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      try { render(); } catch {
        frame = 0;
        container.classList.remove('has-weathering');
      }
    });
  }

  // Console-only preview; reloading or reset() restores the real date.
  window.adaWeathering = Object.freeze({
    preview(daysFromToday = 0) {
      if (!Number.isFinite(daysFromToday) || daysFromToday < 0) {
        throw new RangeError('Gün sayısı sıfır veya pozitif bir sayı olmalı.');
      }
      previewOffset = Math.floor(daysFromToday);
      schedule();
      return weatheringAge() + previewOffset;
    },
    reset() {
      previewOffset = 0;
      schedule();
      return weatheringAge();
    }
  });

  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(value);
  window.addEventListener('resize', schedule, { passive: true });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  window.addEventListener('pageshow', schedule);
  setInterval(() => { if (!document.hidden) schedule(); }, 60000);
  if (document.fonts) document.fonts.ready.then(schedule);
  else schedule();
})();
