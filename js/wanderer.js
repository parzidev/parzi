// Wandering crow
(function () {
    const messages = [
        'npm install snacks',
        'ship it? maybe',
        'ping 127.0.0.1',
        'cache invalidated',
        'works on my machine',
        'sudo make coffee',
        'segfault avoided',
        'deploying vibes',
        'git blame gravity',
        'undefined is a mood',
        'null pointer nap',
        '404 motivation found',
        'chmod +x confidence',
        'merge conflict in brain',
        'stack overflowed again',
        'linting my feelings',
        'kernel panic? cute',
        'localhost sweet localhost',
        'dns propagation arc',
        'hotfixing reality',
        'async await snacks',
        'promise still pending',
        'garbage collector hungry',
        'recursion wants attention',
        'binary dreams only',
        'bit flipped politely',
        'cron job missed me',
        'api rate limited',
        'docker compose chaos',
        'yaml did nothing wrong',
        'json has trust issues',
        'css is sentient',
        'z-index boss fight',
        'flexbox entered chat',
        'pixel perfect-ish',
        'dark mode supremacy',
        'terminal says hi',
        'ssh into the void',
        'vim exit unlocked',
        'tabs versus spaces',
        'commit: final_final',
        'refactor the universe',
        'prod is watching',
        'rollback spell ready',
        'cache says no',
        'one more console.log',
        'regex summoned rain',
        'semicolon optional boss',
        'heap is cozy',
        'byte me gently',
        'patch notes pending',
        'lag spike detected',
        'fps above feelings',
        'quest accepted',
        'side quest acquired',
        'inventory full',
        'mana too low',
        'critical hit on bug',
        'bug took poison damage',
        'autosave complete',
        'checkpoint reached',
        'boss music starts',
        'final boss: css',
        'respawn in 3...',
        'loading next area',
        'npc behavior enabled',
        'rare drop: motivation',
        'loot table cursed',
        'speedrun strats',
        'any percent chaos',
        'patch 1.0.1 maybe',
        'nerf deadlines pls',
        'buff coffee',
        'skill issue? perhaps',
        'roll for initiative',
        'nat 1 deploy',
        'nat 20 debug',
        'aggro range too wide',
        'stealth check failed',
        'quest marker missing',
        'minimap offline',
        'crafting bug spray',
        'xp gained: 3',
        'level up soon',
        'low hp, high ping',
        'healer disconnected',
        'party wiped by typo',
        'raid starts at midnight',
        'cooldown not ready',
        'achievement unlocked',
        'secret room found',
        'glitch in matrix',
        'texture pack loaded',
        'shader compiling...',
        'press f to debug',
        'wasd brain mode',
        'spacebar to cope',
        'controller drift detected',
        'save scumming reality',
        'mod loader awake',
        'dlc: extra bugs',
        'open world anxiety',
        'sandbox mode active',
        'physics engine tired',
        'ragdolling through tasks',
        'hitbox questionable',
        'enemy ai pathfinding',
        'spawn camping errors',
        'crafting table missing',
        'redstone brain online',
        'creeper? aw man',
        'diamond pickaxe energy',
        'nether portal vibes',
        'enderman stole focus',
        'elytra needs mending',
        'triforce of caffeine',
        'hyrule needs logs',
        'pokemon used git pull',
        'super effective fix',
        'trainer wants coffee',
        'dark souls of css',
        'bonfire lit',
        'you died: typo',
        'estus flask empty',
        'elden bug defeated',
        'tarnished but compiling',
        'portal gun unavailable',
        'the cake is cached',
        'companion cube approved',
        'half-life 3 confirmed?',
        'skyrim intro loading',
        'fus ro debug',
        'doom scroll complete',
        'rip and tear bugs',
        'among us in prod',
        'sus commit detected',
        'minecraft server lag',
        'terraria night begins',
        'stardew deploy day',
        'factorio belt jam',
        'satisfactory spaghetti',
        'rimworld colonist idle',
        'dwarf fortress moment',
        'kerbal stage separation',
        'rocket equation hurts',
        'sim city tax bug',
        'city needs more ram',
        'civilization one more turn',
        'age of deploys',
        'starcraft apm: 12',
        'league queue dodged',
        'valorant whiff logged',
        'cs2 smoke lineup',
        'minecraft bed missing',
        'steam sale damage',
        'backlog boss undefeated',
        'save file corrupted',
        'cloud sync praying',
        'anti-cheat says maybe',
        'patcher stuck at 99%',
        'mod conflict detected'
    ];

    const transitionMessages = [
        'window hop',
        'portal open',
        'teleporting...',
        'dimension shift',
        'alt-tab dodge',
        'loading next window',
        'transfer complete',
        'syncing position',
        'phase shift',
        'warp drive engaged',
        'entering new instance',
        'scene changed',
        'respawned elsewhere'
    ];

    const bot = document.createElement('button');
    bot.type = 'button';
    bot.className = 'wander-bot';
    bot.setAttribute('aria-label', 'Wandering crow');
    bot.dataset.direction = 'right';
    bot.innerHTML = `
        <canvas class="wander-bot__crow" width="144" height="144" aria-hidden="true"></canvas>
        <span class="wander-bot__bubble"></span>
    `;

    const STORAGE_KEY = 'wanderBotState';
    const WINDOWS_KEY = 'wanderBotWindows';
    const BOT_SIZE = 72;
    const OWNER_TIMEOUT = 2200;
    const WINDOW_TIMEOUT = 4000;
    const WRITE_INTERVAL = 90;
    const instanceId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const bubble = bot.querySelector('.wander-bot__bubble');
    const canvas = bot.querySelector('.wander-bot__crow');
    const context = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const flightImage = new Image();
    const perchImage = new Image();
    flightImage.src = 'images/crow-flight-32.png';
    perchImage.src = 'images/crow-perch-8.png';
    // Explicit source bounds isolate every bird from its neighbours in the atlas.
    const flightFrames = [
        [23,41,224,245], [245,55,444,245], [465,69,663,246], [684,83,882,246],
        [905,91,1102,246], [1124,92,1322,246], [1343,106,1543,246], [1563,115,1763,246],
        [23,292,224,432], [244,309,444,432], [465,328,664,433], [685,332,883,433],
        [904,345,1103,433], [1124,345,1321,433], [1341,347,1543,477], [1560,349,1761,466],
        [22,526,224,653], [242,524,443,638], [462,516,662,625], [682,510,881,611],
        [902,509,1101,611], [1122,511,1323,619], [1341,511,1540,612], [1561,484,1760,612],
        [24,679,224,831], [244,684,444,832], [465,680,664,832], [685,667,883,832],
        [903,659,1102,832], [1122,654,1323,832], [1342,646,1545,832], [1562,642,1764,832]
    ];
    const perchFrames = [
        [51,52,448,512], [491,138,887,513], [918,203,1313,501], [1340,274,1743,501],
        [56,583,433,828], [495,583,871,828], [931,583,1306,828], [1352,583,1728,827]
    ];
    const perchSelectors = ['.profile-image', '.profile-details', '.visitor-section', '.now-section', '.github-card', '.details-section', '.server-card'];
    let crowSize = BOT_SIZE;
    let lastDrawnFrame = '';
    let state = readState();
    let lastSharedState = JSON.stringify(state);
    let mouseX = -9999;
    let mouseY = -9999;
    let lastMessageIndex = -1;
    let lastWriteAt = 0;

    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(bot);
        crowSize = bot.offsetWidth || BOT_SIZE;
        startWandering();
    });

    function startWandering() {
        updateWindowRegistry();

        if (!state || isOwnerStale(state)) {
            state = createState();
            writeState(state);
        }

        if (!state.message) {
            setMessage('hello, world');
        }

        setInterval(updateWindowRegistry, 500);
        requestAnimationFrame(tick);
    }

    function tick(now) {
        const sharedState = localStorage.getItem(STORAGE_KEY);
        if (sharedState !== lastSharedState) {
            state = readState() || createState();
            lastSharedState = sharedState;
        }

        if (isOwnerStale(state)) {
            state.ownerId = instanceId;
        }

        if (state.ownerId === instanceId) {
            updateOwnerState(now);
            if (now - lastWriteAt > WRITE_INTERVAL) {
                writeState(state);
                lastWriteAt = now;
            }
        }

        renderBot();
        requestAnimationFrame(tick);
    }

    function updateOwnerState(now) {
        const time = Date.now();
        state.motion ||= 'flight';
        state.nextPerchAt ||= time + randomBetween(2500, 4500);
        const mouseDistance = distance(state.x + crowSize / 2, state.y + crowSize / 2, mouseX, mouseY);

        if (state.perch) {
            const point = getPerchPoint(state.perch);
            if (!point || mouseDistance < 110) {
                takeOff();
            } else {
                state.targetX = point.x;
                state.targetY = point.y;
                if (state.motion === 'landing' || state.motion === 'perched') {
                    state.x = point.x;
                    state.y = point.y;
                    if (time - state.motionAt >= 340) state.motion = 'perched';
                    if (time >= state.perchUntil) takeOff();
                    else {
                        state.updatedAt = time;
                        return;
                    }
                }
            }
        }

        if (state.motion === 'takeoff' && time - state.motionAt >= 280) state.motion = 'flight';
        if (state.motion === 'flight' && time >= state.nextPerchAt) choosePerch();

        if (state.motion === 'flight' && (!state.targetX || !state.targetY || now - state.lastTargetAt > 8500 || distance(state.x, state.y, state.targetX, state.targetY) < 6)) {
            setRandomTarget();
        }

        if (mouseDistance < 120) {
            state.targetX += (state.x - mouseX) * 0.025;
            state.targetY += (state.y - mouseY) * 0.025;
            clampTarget();
        }

        const speed = state.motion === 'approach' ? 0.018 : 0.007;
        state.x += (state.targetX - state.x) * speed;
        state.y += (state.targetY - state.y) * speed;
        state.updatedAt = time;

        if (state.motion === 'approach' && distance(state.x, state.y, state.targetX, state.targetY) < 3) {
            state.x = state.targetX;
            state.y = state.targetY;
            state.motion = 'landing';
            state.motionAt = time;
            state.perchUntil = time + randomBetween(4500, 8500);
        }

        const nextWindowId = getContainingWindowId(state.x, state.y);
        if (nextWindowId && nextWindowId !== state.windowId) {
            state.windowId = nextWindowId;
            setTransitionMessage();
        } else if (!state.windowId) {
            state.windowId = nextWindowId || state.windowId;
        }
    }

    function choosePerch() {
        const candidates = [];
        perchSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((element, index) => {
                const rect = element.getBoundingClientRect();
                if (rect.width > crowSize + 24 && rect.top > crowSize + 8 && rect.top < window.innerHeight - 12 && rect.height > 0) {
                    candidates.push({ windowId: instanceId, selector, index, ratio: randomBetween(0.15, 0.85) });
                }
            });
        });
        state.nextPerchAt = Date.now() + randomBetween(8000, 14000);
        if (!candidates.length) return;
        state.perch = candidates[Math.floor(Math.random() * candidates.length)];
        state.motion = 'approach';
        const point = getPerchPoint(state.perch);
        state.targetX = point.x;
        state.targetY = point.y;
        state.lastTargetAt = performance.now();
    }

    function getPerchPoint(perch) {
        if (perch.windowId !== instanceId) return null;
        const element = document.querySelectorAll(perch.selector)[perch.index];
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        if (rect.top < crowSize || rect.top > window.innerHeight - 8 || rect.width < crowSize || !rect.height) return null;
        const win = getCurrentWindowShape();
        return {
            x: win.x + rect.left + (rect.width - crowSize) * perch.ratio,
            y: win.y + rect.top - crowSize * 68 / 72
        };
    }

    function takeOff() {
        state.perch = null;
        state.motion = 'takeoff';
        state.motionAt = Date.now();
        state.nextPerchAt = Date.now() + randomBetween(8000, 14000);
        setRandomTarget();
    }

    function drawCrow() {
        const time = Date.now();
        const perching = ['landing', 'perched', 'takeoff'].includes(state.motion);
        const image = perching ? perchImage : flightImage;
        if (!context || !image.complete || !image.naturalWidth) return;
        let frame;
        if (reducedMotion.matches) frame = perching ? 4 : 3;
        else if (state.motion === 'landing') frame = Math.min(3, Math.floor((time - state.motionAt) / 85));
        else if (state.motion === 'takeoff') frame = Math.max(0, 3 - Math.floor((time - state.motionAt) / 70));
        else if (state.motion === 'perched') frame = 4 + Math.floor((time - state.motionAt) / 900) % 4;
        else frame = Math.floor(time / 28) % flightFrames.length;
        bot.dataset.motion = state.motion || 'flight';
        bot.dataset.frame = String(frame);
        const key = `${perching}-${frame}`;
        if (key === lastDrawnFrame) return;
        lastDrawnFrame = key;
        const [left, top, right, bottom] = (perching ? perchFrames : flightFrames)[frame];
        const scale = perching ? 0.145 : 0.28;
        const sourceX = Math.max(0, left - 2);
        const sourceY = Math.max(0, top - 2);
        const width = Math.min(image.naturalWidth, right + 2) - sourceX;
        const height = Math.min(image.naturalHeight, bottom + 2) - sourceY;
        const x = perching ? (72 - (right - left) * scale) / 2 - 2 * scale : 55 - (right - 28 - sourceX) * scale;
        const y = perching ? 68 - (bottom - sourceY) * scale : 42 - ([188, 377, 561, 761][Math.floor(frame / 8)] - sourceY) * scale;
        context.setTransform(2, 0, 0, 2, 0, 0);
        context.clearRect(0, 0, 72, 72);
        context.drawImage(image, sourceX, sourceY, width, height, x, y, width * scale, height * scale);
    }

    function setRandomTarget() {
        const win = getRandomWindowShape();
        const margin = 32;
        state.targetX = randomBetween(win.x + margin, win.x + win.w - BOT_SIZE - margin);
        state.targetY = randomBetween(win.y + margin, win.y + win.h - BOT_SIZE - margin);
        state.lastTargetAt = performance.now();
    }

    function clampTarget() {
        const margin = 16;
        const bounds = getWorldBounds();
        state.targetX = Math.max(bounds.minX + margin, Math.min(bounds.maxX - BOT_SIZE - margin, state.targetX));
        state.targetY = Math.max(bounds.minY + margin, Math.min(bounds.maxY - BOT_SIZE - margin, state.targetY));
    }

    function renderBot() {
        const win = getCurrentWindowShape();
        const localX = state.x - win.x;
        const localY = state.y - win.y;
        const isVisible = localX > -BOT_SIZE && localY > -BOT_SIZE && localX < window.innerWidth && localY < window.innerHeight;
        const tilt = ['landing', 'perched'].includes(state.motion) ? 0 : Math.max(-7, Math.min(7, (state.targetX - state.x) * 0.018));

        if (Math.abs(state.targetX - state.x) > 5) {
            bot.dataset.direction = state.targetX < state.x ? 'left' : 'right';
        }

        bot.classList.toggle('is-away', !isVisible);
        bot.style.transform = `translate3d(${localX}px, ${localY}px, 0) rotate(${tilt}deg)`;
        drawCrow();

        if (state.message && state.messageUntil > Date.now() && isVisible) {
            bubble.textContent = state.message;
            bubble.classList.add('is-visible');
        } else {
            bubble.classList.remove('is-visible');
        }
    }

    function setMessage(message) {
        state = readState() || createState();
        state.message = message;
        state.messageUntil = Date.now() + 1800;
        state.ownerId = isOwnerStale(state) ? instanceId : state.ownerId;
        writeState(state);
    }

    function setTransitionMessage() {
        state.message = transitionMessages[Math.floor(Math.random() * transitionMessages.length)];
        state.messageUntil = Date.now() + 1200;
    }

    function randomBetween(min, max) {
        return Math.random() * Math.max(0, max - min) + min;
    }

    function distance(ax, ay, bx, by) {
        return Math.hypot(ax - bx, ay - by);
    }

    function createState() {
        const win = getCurrentWindowShape();
        const nextState = {
            x: win.x + 80,
            y: win.y + 120,
            targetX: win.x + 240,
            targetY: win.y + 220,
            lastTargetAt: performance.now(),
            updatedAt: Date.now(),
            ownerId: instanceId,
            windowId: instanceId,
            message: '',
            messageUntil: 0
        };

        return nextState;
    }

    function readState() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return null;
        }
    }

    function writeState(nextState) {
        lastSharedState = JSON.stringify(nextState);
        localStorage.setItem(STORAGE_KEY, lastSharedState);
    }

    function isOwnerStale(nextState) {
        return !nextState.ownerId || Date.now() - nextState.updatedAt > OWNER_TIMEOUT;
    }

    function updateWindowRegistry() {
        const windows = readWindows();
        windows[instanceId] = {
            id: instanceId,
            ...getCurrentWindowShape(),
            updatedAt: Date.now()
        };

        Object.keys(windows).forEach(id => {
            if (Date.now() - windows[id].updatedAt > WINDOW_TIMEOUT) {
                delete windows[id];
            }
        });

        localStorage.setItem(WINDOWS_KEY, JSON.stringify(windows));
    }

    function readWindows() {
        try {
            return JSON.parse(localStorage.getItem(WINDOWS_KEY)) || {};
        } catch (error) {
            return {};
        }
    }

    function getActiveWindows() {
        const windows = Object.values(readWindows());
        return windows.filter(win => Date.now() - win.updatedAt <= WINDOW_TIMEOUT);
    }

    function getRandomWindowShape() {
        const windows = getActiveWindows();
        if (!windows.length) return getCurrentWindowShape();
        return windows[Math.floor(Math.random() * windows.length)];
    }

    function getContainingWindowId(worldX, worldY) {
        const windows = getActiveWindows();
        for (const win of windows) {
            if (worldX >= win.x && worldX <= win.x + win.w && worldY >= win.y && worldY <= win.y + win.h) {
                return win.id;
            }
        }
        return '';
    }

    function getWorldBounds() {
        const windows = getActiveWindows();
        if (!windows.length) {
            const current = getCurrentWindowShape();
            return {
                minX: current.x,
                minY: current.y,
                maxX: current.x + current.w,
                maxY: current.y + current.h
            };
        }

        return windows.reduce((bounds, win) => ({
            minX: Math.min(bounds.minX, win.x),
            minY: Math.min(bounds.minY, win.y),
            maxX: Math.max(bounds.maxX, win.x + win.w),
            maxY: Math.max(bounds.maxY, win.y + win.h)
        }), {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity
        });
    }

    function getCurrentWindowShape() {
        return {
            x: window.screenX ?? window.screenLeft,
            y: window.screenY ?? window.screenTop,
            w: window.innerWidth,
            h: window.innerHeight
        };
    }

    document.addEventListener('mousemove', event => {
        const win = getCurrentWindowShape();
        mouseX = win.x + event.clientX;
        mouseY = win.y + event.clientY;
        const latestState = readState();
        if (latestState && latestState.ownerId !== instanceId && distance(latestState.x + crowSize / 2, latestState.y + crowSize / 2, mouseX, mouseY) < 120) {
            state = latestState;
            state.ownerId = instanceId;
            state.updatedAt = Date.now();
            writeState(state);
        }
    });

    window.addEventListener('resize', () => {
        crowSize = bot.offsetWidth || BOT_SIZE;
        updateWindowRegistry();
        clampTarget();
    });

    window.addEventListener('beforeunload', () => {
        const windows = readWindows();
        delete windows[instanceId];
        localStorage.setItem(WINDOWS_KEY, JSON.stringify(windows));

        const latestState = readState();
        if (latestState?.ownerId === instanceId) {
            latestState.ownerId = '';
            latestState.updatedAt = 0;
            writeState(latestState);
        }
    });

    bot.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setMessage(getRandomMessage());
    });

    function getRandomMessage() {
        let nextIndex = Math.floor(Math.random() * messages.length);

        if (messages.length > 1) {
            while (nextIndex === lastMessageIndex) {
                nextIndex = Math.floor(Math.random() * messages.length);
            }
        }

        lastMessageIndex = nextIndex;
        return messages[nextIndex];
    }
})();
