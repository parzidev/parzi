// Wandering pixel bot
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
    bot.setAttribute('aria-label', 'Wandering bot');
    bot.innerHTML = `
        <span class="wander-bot__antenna"></span>
        <span class="wander-bot__face">
            <span class="wander-bot__eye"></span>
            <span class="wander-bot__eye"></span>
        </span>
        <span class="wander-bot__bubble"></span>
    `;

    const STORAGE_KEY = 'wanderBotState';
    const WINDOWS_KEY = 'wanderBotWindows';
    const BOT_SIZE = 58;
    const OWNER_TIMEOUT = 2200;
    const WINDOW_TIMEOUT = 4000;
    const WRITE_INTERVAL = 90;
    const instanceId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const bubble = bot.querySelector('.wander-bot__bubble');
    let state = readState();
    let mouseX = -9999;
    let mouseY = -9999;
    let lastMessageIndex = -1;
    let lastWriteAt = 0;

    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(bot);
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
        state = readState() || createState();

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
        if (!state.targetX || !state.targetY || now - state.lastTargetAt > 8500 || distance(state.x, state.y, state.targetX, state.targetY) < 6) {
            setRandomTarget();
        }

        const mouseDistance = distance(state.x, state.y, mouseX, mouseY);
        if (mouseDistance < 120) {
            state.targetX += (state.x - mouseX) * 0.025;
            state.targetY += (state.y - mouseY) * 0.025;
            clampTarget();
        }

        state.x += (state.targetX - state.x) * 0.007;
        state.y += (state.targetY - state.y) * 0.007;
        state.updatedAt = Date.now();

        const nextWindowId = getContainingWindowId(state.x, state.y);
        if (nextWindowId && nextWindowId !== state.windowId) {
            state.windowId = nextWindowId;
            setTransitionMessage();
        } else if (!state.windowId) {
            state.windowId = nextWindowId || state.windowId;
        }
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
        const tilt = Math.max(-7, Math.min(7, (state.targetX - state.x) * 0.018));

        bot.classList.toggle('is-away', !isVisible);
        bot.style.transform = `translate3d(${localX}px, ${localY}px, 0) rotate(${tilt}deg)`;

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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
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
    });

    window.addEventListener('resize', () => {
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
