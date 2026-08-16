const PASSWORD = "1453";
const pin = [];

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const lockScreen = document.getElementById("lockScreen");
const siteShell = document.getElementById("siteShell");
const pinDots = Array.from(document.querySelectorAll("#pinDots span"));
const lockMessage = document.getElementById("lockMessage");
const lockPanel = document.querySelector(".lock-panel");
const galleryGrid = document.getElementById("galleryGrid");
const statsGrid = document.getElementById("statsGrid");
const counterDays = document.getElementById("counterDays");
const counterHours = document.getElementById("counterHours");
const counterMinutes = document.getElementById("counterMinutes");
const counterSeconds = document.getElementById("counterSeconds");
const photoDialog = document.getElementById("photoDialog");
const dialogImage = document.getElementById("dialogImage");
const dialogCaption = document.getElementById("dialogCaption");
const dialogClose = document.getElementById("dialogClose");
const dialogPrev = document.getElementById("dialogPrev");
const dialogNext = document.getElementById("dialogNext");
const typeOracle = document.getElementById("typeOracle");
const typedBufferEl = document.getElementById("typedBuffer");
const typeOracleMessage = document.getElementById("typeOracleMessage");
const secretFlowerSky = document.getElementById("secretFlowerSky");
const birthdayCake = document.querySelector(".birthday-cake");
const finalSection = document.querySelector(".final-section");
const cakeWrapper = document.getElementById("cakeWrapper");
const candleFlames = document.getElementById("candleFlames");

let activePhotoIndex = 0;
let typedBuffer = "";
let typeHideTimer = null;

const galleryItems = window.TIMELAPSE_ITEMS || [];

const ANNIVERSARY = new Date(2025, 7, 6, 23, 37, 0);

const funStats = [
  { emoji: "🌸", label: "Alınan çiçek", value: 6 },
  { emoji: "📦", label: "Gönderilen kargo", value: 4 },
  { emoji: "🎧", label: "Discord arama (saat)", value: 2306 },
  { emoji: "📱", label: "WP araması (saat)", value: 763 },
  { emoji: "🎮", label: "Birlikte LoL maçı", value: 734 }
];

function updatePin() {
  pinDots.forEach((dot, index) => {
    dot.classList.toggle("filled", index < pin.length);
  });
}

function resetPin(message = "♡ ♡ ♡ ♡") {
  pin.length = 0;
  lockMessage.textContent = message;
  updatePin();
}

function forceTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function unlock() {
  if (document.activeElement && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }
  forceTop();
  document.body.classList.remove("locked");
  lockScreen.classList.add("is-hidden");
  lockScreen.style.display = "none";
  siteShell.classList.add("is-visible");
  siteShell.removeAttribute("aria-hidden");
  siteShell.focus({ preventScroll: true });
  requestAnimationFrame(forceTop);
  setTimeout(forceTop, 80);
  setTimeout(forceTop, 260);
  setTimeout(forceTop, 520);
}

function checkPassword() {
  if (pin.join("") === PASSWORD) {
    lockMessage.textContent = "Açıldı ♡";
    setTimeout(unlock, 280);
    return;
  }

  lockMessage.textContent = "Bir daha dene ♡";
  lockPanel.classList.remove("shake");
  window.requestAnimationFrame(() => lockPanel.classList.add("shake"));
  setTimeout(() => resetPin("♡ ♡ ♡ ♡"), 520);
}

function handleKey(value) {
  if (pin.length >= 4) return;
  pin.push(value);
  updatePin();
  lockMessage.textContent = "♡".repeat(pin.length);

  if (pin.length === 4) {
    setTimeout(checkPassword, 150);
  }
}

function handleAction(action) {
  if (action === "backspace") {
    pin.pop();
    updatePin();
    lockMessage.textContent = pin.length ? "♡".repeat(pin.length) : "♡ ♡ ♡ ♡";
  }

  if (action === "enter" && pin.length === 4) {
    checkPassword();
  }
}

function renderGallery() {
  galleryGrid.innerHTML = "";
  let currentMonth = "";
  let monthItems = null;

  galleryItems.forEach((item, index) => {
    if (item.monthKey !== currentMonth) {
      currentMonth = item.monthKey;

      const month = document.createElement("section");
      month.className = "timelapse-month";
      month.setAttribute("aria-label", item.monthLabel);

      const monthLabel = document.createElement("h3");
      monthLabel.className = "timelapse-month-label";
      monthLabel.textContent = item.monthLabel;

      monthItems = document.createElement("div");
      monthItems.className = "timelapse-month-items";

      month.append(monthLabel, monthItems);
      galleryGrid.appendChild(month);
    }

    const figure = document.createElement("figure");
    figure.className = "timelapse-item";

    const button = document.createElement("button");
    button.className = "timelapse-card";
    button.type = "button";
    button.setAttribute("aria-label", `${item.dialogLabel} fotoğrafını aç`);

    const img = document.createElement("img");
    img.src = item.thumb;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";

    const node = document.createElement("span");
    node.className = "timelapse-node";
    node.setAttribute("aria-hidden", "true");

    const caption = document.createElement("figcaption");
    caption.className = "timelapse-date";
    caption.innerHTML = `<strong>${String(item.day).padStart(2, "0")}</strong><span>${item.month}</span>`;

    button.appendChild(img);
    button.addEventListener("click", () => openPhoto(index));
    figure.append(button, node, caption);
    monthItems.appendChild(figure);
  });
}

function updateCounter() {
  const now = new Date();
  const diff = now - ANNIVERSARY;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  counterDays.textContent = days.toLocaleString("tr-TR");
  counterHours.textContent = String(hours).padStart(2, "0");
  counterMinutes.textContent = String(minutes).padStart(2, "0");
  counterSeconds.textContent = String(seconds).padStart(2, "0");

  return days;
}

function renderStats() {
  updateCounter();
  statsGrid.innerHTML = funStats.map(stat => {
    const display = stat.value.toLocaleString("tr-TR");
    return `
      <article class="stat-card">
        <span class="stat-emoji">${stat.emoji}</span>
        <strong class="stat-value">${display}</strong>
        <span class="stat-label">${stat.label}</span>
      </article>
    `;
  }).join("");

  setInterval(updateCounter, 1000);
}

function openPhoto(index) {
  activePhotoIndex = index;
  const item = galleryItems[activePhotoIndex];
  showDialogPhoto(item);

  if (typeof photoDialog.showModal === "function") {
    photoDialog.showModal();
  }
}

function showPhoto(offset) {
  activePhotoIndex = (activePhotoIndex + offset + galleryItems.length) % galleryItems.length;
  showDialogPhoto(galleryItems[activePhotoIndex]);
}

function showDialogPhoto(item) {
  photoDialog.dataset.orientation = item.orientation;
  dialogImage.src = item.src;
  dialogImage.alt = item.dialogLabel;
  dialogCaption.textContent = item.dialogLabel;
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ block: "start", behavior: "smooth" });
}

function normalizeCommand(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

function removeParticleAfter(particle, lifetime) {
  window.setTimeout(() => particle.remove(), lifetime);
}

function releaseLilyRain(count = 14) {
  Array.from({ length: count }, (_, index) => {
    const lily = document.createElement("img");
    const duration = 4300 + Math.round(Math.random() * 2100);
    const delay = index * 70 + Math.round(Math.random() * 240);
    lily.className = "secret-lily";
    lily.src = "assets/decor-lily-sprig.png";
    lily.alt = "";
    lily.style.setProperty("--left", `${Math.round(Math.random() * 94)}%`);
    lily.style.setProperty("--size", `${(4.5 + Math.random() * 4.4).toFixed(2)}rem`);
    lily.style.setProperty("--delay", `${delay}ms`);
    lily.style.setProperty("--duration", `${duration}ms`);
    lily.style.setProperty("--drift", `${Math.round(-22 + Math.random() * 44)}vw`);
    lily.style.setProperty("--start-spin", `${Math.round(-28 + Math.random() * 56)}deg`);
    lily.style.setProperty("--end-spin", `${Math.round(170 + Math.random() * 210)}deg`);
    secretFlowerSky.appendChild(lily);
    removeParticleAfter(lily, duration + delay + 500);
  });
}

function releaseHeartRain(count = 22) {
  Array.from({ length: count }, (_, index) => {
    const heart = document.createElement("span");
    const duration = 2400 + Math.round(Math.random() * 1700);
    const delay = index * 36 + Math.round(Math.random() * 180);
    heart.className = "secret-heart";
    heart.textContent = Math.random() > 0.32 ? "♡" : "♥";
    heart.style.setProperty("--left", `${Math.round(Math.random() * 96)}%`);
    heart.style.setProperty("--size", `${(1.1 + Math.random() * 1.55).toFixed(2)}rem`);
    heart.style.setProperty("--delay", `${delay}ms`);
    heart.style.setProperty("--duration", `${duration}ms`);
    heart.style.setProperty("--drift", `${Math.round(-12 + Math.random() * 24)}vw`);
    secretFlowerSky.appendChild(heart);
    removeParticleAfter(heart, duration + delay + 400);
  });
}

function lightCandles() {
  const original = "assets/decor-birthday-cake.png";
  const lit = "assets/decor-birthday-cake-lit.png";
  birthdayCake.src = lit;
  birthdayCake.classList.add("is-lit");
  setTimeout(() => {
    birthdayCake.classList.remove("is-lit");
    birthdayCake.src = original;
  }, 5000);
}

function releaseBalloons(count = 14) {
  const colors = ["#ff7aa8", "#c93b70", "#e1b54d", "#6f9b79", "#b088d4", "#ff9a5c", "#7ec8e3", "#ffb7d5"];
  Array.from({ length: count }, (_, i) => {
    const balloon = document.createElement("div");
    const duration = 3800 + Math.round(Math.random() * 2600);
    const delay = i * 100 + Math.round(Math.random() * 220);
    const color = colors[Math.floor(Math.random() * colors.length)];
    balloon.className = "flying-balloon";
    balloon.style.setProperty("--left", `${Math.round(4 + Math.random() * 92)}%`);
    balloon.style.setProperty("--size", `${(1.8 + Math.random() * 1.6).toFixed(2)}rem`);
    balloon.style.setProperty("--delay", `${delay}ms`);
    balloon.style.setProperty("--duration", `${duration}ms`);
    balloon.style.setProperty("--drift", `${Math.round(-18 + Math.random() * 36)}vw`);
    balloon.style.setProperty("--color", color);
    balloon.style.setProperty("--wobble", `${(2 + Math.random() * 4).toFixed(1)}deg`);
    secretFlowerSky.appendChild(balloon);
    removeParticleAfter(balloon, duration + delay + 500);
  });
}

function celebrateCake() {
  finalSection.scrollIntoView({ block: "center", behavior: "smooth" });
  birthdayCake.classList.remove("is-celebrating");
  void birthdayCake.offsetWidth;
  birthdayCake.classList.add("is-celebrating");
  window.setTimeout(() => birthdayCake.classList.remove("is-celebrating"), 1100);
  lightCandles();
  releaseBalloons(16);
  releaseHeartRain(12);
}

const secretCommands = [
  {
    keys: ["ada"],
    message: "Ada modu açıldı: 花みたいにかわいい",
    run: () => {
      releaseHeartRain(24);
      scrollToSection("galeri");
    }
  },
  {
    keys: ["galeri", "timelapse"],
    message: "Timelapse'e gidiyorum.",
    run: () => scrollToSection("galeri")
  },
  {
    keys: ["mektup"],
    message: "Mektup hazır.",
    run: () => {
      releaseLilyRain(8);
      scrollToSection("mektup");
    }
  },
  {
    keys: ["zambak", "cicek", "lily"],
    message: "Biraz zambak bıraktım.",
    run: () => releaseLilyRain()
  },
  {
    keys: ["kalp", "ask"],
    message: "Kalpler bulundu.",
    run: () => releaseHeartRain()
  },
  {
    keys: ["pasta", "mum"],
    message: "Mumlar hazır. Dilek tut.",
    run: celebrateCake
  }
];

function showTypeOracle(message = "Yazmaya devam.") {
  typedBufferEl.textContent = typedBuffer || " ";
  typeOracleMessage.textContent = message;
  typeOracle.classList.add("is-visible");
  typeOracle.setAttribute("aria-hidden", "false");
  clearTimeout(typeHideTimer);
  typeHideTimer = setTimeout(hideTypeOracle, 2400);
}

function hideTypeOracle() {
  typeOracle.classList.remove("is-visible");
  typeOracle.setAttribute("aria-hidden", "true");
}

function handleSecretTyping(event) {
  if (!lockScreen.classList.contains("is-hidden")) return;
  if (photoDialog.open) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.matches("input, textarea, select, [contenteditable='true']")) return;

  if (event.key === "Escape") {
    typedBuffer = "";
    hideTypeOracle();
    return;
  }

  if (event.key === "Backspace") {
    typedBuffer = typedBuffer.slice(0, -1);
    showTypeOracle("Silindi.");
    return;
  }

  if (event.key.length !== 1) return;
  const normalizedKey = normalizeCommand(event.key);
  if (!/^[a-z0-9]$/.test(normalizedKey)) return;

  typedBuffer = normalizeCommand(`${typedBuffer}${normalizedKey}`).slice(-18);
  const exactCommand = secretCommands.find(command => command.keys.some(key => typedBuffer.endsWith(key)));
  const partialCommand = secretCommands.find(command => command.keys.some(key => key.startsWith(typedBuffer) || typedBuffer.endsWith(key.slice(0, Math.min(key.length, typedBuffer.length)))));

  if (exactCommand) {
    showTypeOracle(exactCommand.message);
    exactCommand.run();
    typedBuffer = "";
    return;
  }

  showTypeOracle(partialCommand ? `${partialCommand.keys[0]} olabilir.` : "Gizli komut aranıyor.");
}

document.querySelectorAll("[data-key]").forEach(button => {
  button.addEventListener("click", () => handleKey(button.dataset.key));
});

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => handleAction(button.dataset.action));
});

document.addEventListener("keydown", event => {
  if (!lockScreen.classList.contains("is-hidden")) {
    if (/^\d$/.test(event.key)) handleKey(event.key);
    if (event.key === "Backspace") handleAction("backspace");
    if (event.key === "Enter") handleAction("enter");
    return;
  }

  if (photoDialog.open) {
    if (event.key === "ArrowLeft") showPhoto(-1);
    if (event.key === "ArrowRight") showPhoto(1);
    return;
  }

  handleSecretTyping(event);
});

document.getElementById("lockAgainButton").addEventListener("click", () => {
  forceTop();
  siteShell.classList.remove("is-visible");
  siteShell.setAttribute("aria-hidden", "true");
  lockScreen.style.display = "";
  lockScreen.classList.remove("is-hidden");
  document.body.classList.add("locked");
  resetPin();
});

dialogClose.addEventListener("click", () => photoDialog.close());
dialogPrev.addEventListener("click", () => showPhoto(-1));
dialogNext.addEventListener("click", () => showPhoto(1));
photoDialog.addEventListener("click", event => {
  if (event.target === photoDialog) photoDialog.close();
});

renderGallery();
renderStats();
cakeWrapper.addEventListener("click", celebrateCake);
document.body.classList.add("locked");
forceTop();
