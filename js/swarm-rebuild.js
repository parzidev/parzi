/*
 * Local Swarm Rebuild effect, inspired by:
 * https://github.com/DhvanilPatel/swarm-cursors
 * https://califa.github.io/swarm-site/
 *
 * Independent implementation. Animates the existing page without cloning it
 * or changing its text, event listeners, or live data.
 */
(() => {
    'use strict';

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const palette = ['#db6545', '#9861cf', '#339b79', '#bd8c28', '#cd5e91', '#378e9b'];
    let current = null;

    class Rebuild {
        constructor() {
            this.stopped = false;
            this.skipped = false;
            this.complete = false;
            this.prepared = false;
            this.tasks = [];
            this.agents = [];
            this.styles = new Map();
            this.unbind = [];
            this.frontier = 0;
            this.startedAt = performance.now();
            this.lastFrame = this.startedAt;
            this.lastMeasure = 0;
            this.frame = 0;
        }

        listen(target, type, callback, options) {
            target.addEventListener(type, callback, options);
            this.unbind.push(() => target.removeEventListener(type, callback, options));
        }

        change(element, property, value) {
            let saved = this.styles.get(element);
            if (!saved) {
                saved = new Map();
                this.styles.set(element, saved);
            }
            let entry = saved.get(property);
            if (!entry) {
                entry = {
                    value: element.style.getPropertyValue(property),
                    priority: element.style.getPropertyPriority(property)
                };
                saved.set(property, entry);
            }
            element.style.setProperty(property, value, 'important');
            entry.applied = element.style.getPropertyValue(property);
        }

        restore(element, properties) {
            const saved = this.styles.get(element);
            if (!saved) return;
            for (const property of properties || [...saved.keys()]) {
                const entry = saved.get(property);
                if (!entry) continue;
                if (element.style.getPropertyValue(property) === entry.applied
                    && element.style.getPropertyPriority(property) === 'important') {
                    if (entry.value) element.style.setProperty(property, entry.value, entry.priority);
                    else element.style.removeProperty(property);
                }
                saved.delete(property);
            }
            if (!saved.size) this.styles.delete(element);
        }

        async begin() {
            this.root = document.querySelector('.page-container') || document.body;
            this.mount();
            this.listen(window, 'keydown', event => {
                if (event.key === 'Escape') this.skip();
            }, true);
            this.listen(window, 'scroll', () => this.schedule(), { passive: true });
            this.listen(window, 'resize', () => {
                this.sizeCanvas();
                this.measureWaiting();
                for (const agent of this.agents) {
                    if (agent.job && agent.job.task.kind === 'text') {
                        const task = agent.job.task;
                        task.rect = this.bounds(task.element);
                        agent.job.letters = this.glyphs(task.element, task.rect);
                    }
                }
                this.schedule();
            });
            this.listen(window, 'pagehide', () => this.finish());
            this.listen(motion, 'change', () => {
                if (motion.matches) this.finish();
            });

            this.limit = window.setTimeout(() => this.finish(), 5000);
            this.change(this.root, 'opacity', '0');
            const count = 5;
            for (let index = 0; index < count; index++) {
                this.agents.push({
                    x: index % 2 ? window.innerWidth + 25 : -25,
                    y: window.scrollY + window.innerHeight * (0.15 + Math.random() * 0.7),
                    color: palette[index % palette.length],
                    name: 'agent ' + (index + 1),
                    parked: false,
                    job: null
                });
            }
            this.schedule();

            await Promise.race([
                document.fonts ? document.fonts.ready : Promise.resolve(),
                new Promise(resolve => window.setTimeout(resolve, 650))
            ]);
            await new Promise(resolve => window.setTimeout(resolve, 350));
            if (this.stopped || this.skipped) return;
            this.collect();
            this.restore(this.root, ['opacity']);
            this.prepared = true;
            window.clearTimeout(this.limit);
        }

        mount() {
            this.host = document.createElement('swarm-rebuild');
            this.host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:block;';
            const shadow = this.host.attachShadow({ mode: 'open' });
            shadow.innerHTML = '<style>'
                + ':host{color-scheme:normal}canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}'
                + 'button{position:absolute;right:20px;bottom:20px;width:34px;height:34px;padding:0;'
                + 'border:1px solid var(--panel-border,#c3c3c3);border-radius:0;background:var(--page-bg,#fff);'
                + 'color:var(--text-color,#171717);font:18px/1 Arial,sans-serif;cursor:pointer;pointer-events:auto}'
                + 'button:hover{background:var(--panel-bg,#e9e9e9)}'
                + 'button:focus-visible{outline:2px solid var(--accent-color,#a53332);outline-offset:3px}'
                + '</style><canvas aria-hidden="true"></canvas>'
                + '<button type="button" aria-label="Skip animation" title="Skip animation (Esc)">×</button>';
            this.canvas = shadow.querySelector('canvas');
            this.context = this.canvas.getContext('2d');
            if (!this.context) throw new Error('Canvas is unavailable');
            this.listen(shadow.querySelector('button'), 'click', () => this.skip());
            document.documentElement.appendChild(this.host);
            this.sizeCanvas();
        }

        sizeCanvas() {
            this.width = document.documentElement.clientWidth;
            this.height = window.innerHeight;
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = Math.round(this.width * ratio);
            this.canvas.height = Math.round(this.height * ratio);
            this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        bounds(element) {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height
            };
        }

        hasColor(value) {
            return value && value !== 'transparent'
                && !/^rgba\([^,]+,[^,]+,[^,]+,\s*0(?:\.0+)?\s*\)$|\/\s*0(?:\.0+)?\s*\)$/.test(value);
        }

        collect() {
            const covered = new WeakSet();
            for (const element of this.root.querySelectorAll('*')) {
                if (this.tasks.length >= 900) break;
                if (covered.has(element) || element.closest('.sr-only,.hidden,[hidden]')) continue;
                const tag = element.localName;
                if (['script', 'style', 'noscript', 'iframe'].includes(tag)) continue;
                if (element.closest('svg') && tag !== 'svg') continue;
                const style = getComputedStyle(element);
                if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0) continue;
                const rect = this.bounds(element);
                if (rect.width < 3 || rect.height < 3) continue;

                const properties = [];
                if (this.hasColor(style.backgroundColor)) properties.push('background-color');
                if (style.backgroundImage !== 'none') properties.push('background-image');
                for (const side of ['top', 'right', 'bottom', 'left']) {
                    if (parseFloat(style.getPropertyValue('border-' + side + '-width')) > 0
                        && this.hasColor(style.getPropertyValue('border-' + side + '-color'))) {
                        properties.push('border-' + side + '-color');
                    }
                }
                if (properties.length && !['img', 'svg', 'canvas', 'video'].includes(tag)) {
                    this.addTask(element, 'box', rect, properties);
                    for (const property of properties) {
                        this.change(element, property, property === 'background-image' ? 'none' : 'transparent');
                    }
                }

                const media = ['img', 'svg', 'canvas', 'video'].includes(tag);
                const directText = [...element.childNodes].some(node =>
                    node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                const blockChild = [...element.children].some(child =>
                    !getComputedStyle(child).display.startsWith('inline')
                    && getComputedStyle(child).display !== 'none');
                if (!media && (!directText || blockChild)) continue;

                this.addTask(element, media ? 'media' : 'text', rect, ['opacity', 'clip-path']);
                this.change(element, 'opacity', '0');
                for (const child of element.querySelectorAll('*')) covered.add(child);
            }
            this.tasks.sort((left, right) =>
                left.rect.y - right.rect.y
                || Number(right.kind === 'box') - Number(left.kind === 'box')
                || left.rect.x - right.rect.x);
        }

        addTask(element, kind, rect, properties) {
            this.tasks.push({ element, kind, rect, properties, state: 'waiting' });
        }

        measureWaiting() {
            for (const task of this.tasks) {
                if (task.state !== 'waiting') continue;
                if (!task.element.isConnected) {
                    this.restore(task.element, task.properties);
                    task.state = 'done';
                } else {
                    task.rect = this.bounds(task.element);
                    if (task.rect.width < 3 || task.rect.height < 3
                        || getComputedStyle(task.element).visibility !== 'visible') {
                        this.restore(task.element, task.properties);
                        task.state = 'done';
                    }
                }
            }
        }

        unlocked(task) {
            return task.rect.y < this.frontier;
        }

        parkingLine() {
            const section = document.querySelector('.profile-section') || this.root;
            const rect = section.getBoundingClientRect();
            const style = getComputedStyle(section);
            const leftPadding = parseFloat(style.paddingLeft) || 0;
            const rightPadding = parseFloat(style.paddingRight) || 0;
            const bottomPadding = parseFloat(style.paddingBottom) || 0;
            const width = Math.max(16, rect.width - leftPadding - rightPadding);
            let fontSize = 10;
            let slotWidth;
            do {
                this.context.font = '600 ' + fontSize + 'px Arial,sans-serif';
                slotWidth = 22 + Math.max(0, ...this.agents.map(agent => this.context.measureText(agent.name).width));
                if (slotWidth * this.agents.length <= width || fontSize === 8) break;
                fontSize--;
            } while (true);
            slotWidth = Math.min(slotWidth, width / Math.max(1, this.agents.length));
            const step = Math.min(76, Math.max(0, (width - slotWidth) / Math.max(1, this.agents.length - 1)));
            const rowWidth = step * (this.agents.length - 1) + slotWidth;
            return {
                x: rect.left + window.scrollX + leftPadding + (width - rowWidth) / 2,
                y: rect.bottom + window.scrollY - Math.max(20, bottomPadding / 2 + 8),
                step,
                fontSize,
                labelWidth: Math.max(1, slotWidth - 22)
            };
        }

        glyphs(element, rect) {
            const result = [];
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            const range = document.createRange();
            let node;
            while ((node = walker.nextNode()) && result.length < 400) {
                const parent = node.parentElement;
                if (parent.closest('.sr-only,.hidden,[hidden]')
                    || getComputedStyle(parent).visibility !== 'visible') continue;
                let offset = 0;
                for (const character of node.textContent) {
                    range.setStart(node, offset);
                    offset += character.length;
                    range.setEnd(node, offset);
                    const boxes = range.getClientRects();
                    const box = boxes[boxes.length - 1];
                    if (box && box.width > 0 && box.height > 0) {
                        result.push({
                            x: box.right + window.scrollX - rect.x,
                            y: box.top + window.scrollY - rect.y,
                            height: box.height
                        });
                    }
                    if (result.length >= 400) break;
                }
            }
            return result;
        }

        assign(agent, time) {
            let selected = null;
            let best = Infinity;
            for (const task of this.tasks) {
                if (task.state !== 'waiting' || !this.unlocked(task)) continue;
                const inViewport = task.rect.y + task.rect.height > window.scrollY
                    && task.rect.y < window.scrollY + this.height;
                const cost = Math.abs(task.rect.x - agent.x) * 0.25
                    + Math.abs(task.rect.y - agent.y) + (task.kind === 'box' ? -120 : 0)
                    + (inViewport ? 0 : 1000);
                if (cost < best) {
                    best = cost;
                    selected = task;
                }
            }
            if (!selected) return;
            agent.parked = false;
            selected.rect = this.bounds(selected.element);
            selected.state = 'active';
            const letters = selected.kind === 'text' ? this.glyphs(selected.element, selected.rect) : [];
            const distance = Math.hypot(agent.x - selected.rect.x, agent.y - selected.rect.y);
            agent.job = {
                task: selected,
                letters,
                started: time,
                travel: Math.min(700, 240 + distance * 0.24),
                duration: selected.kind === 'text' ? Math.min(2600, 450 + letters.length * 22) : 650,
                fromX: agent.x,
                fromY: agent.y,
                progress: 0,
                building: false
            };
        }

        advance(agent, time) {
            const job = agent.job;
            if (!job) return;
            const task = job.task;
            if (!task.element.isConnected) {
                this.restore(task.element, task.properties);
                task.state = 'done';
                agent.job = null;
                return;
            }
            const rect = this.bounds(task.element);
            task.rect = rect;
            const elapsed = time - job.started;
            if (elapsed < job.travel) {
                const fraction = elapsed / job.travel;
                const eased = fraction * fraction * (3 - 2 * fraction);
                agent.x = job.fromX + (rect.x - job.fromX) * eased;
                agent.y = job.fromY + (rect.y - job.fromY) * eased
                    + Math.sin(fraction * Math.PI) * 25;
                return;
            }

            job.building = true;
            const progress = Math.min(1, (elapsed - job.travel) / job.duration);
            job.progress = progress;
            if (task.kind === 'text' && job.letters.length) {
                const index = Math.min(job.letters.length - 1, Math.floor(progress * job.letters.length));
                const letter = job.letters[index];
                const top = Math.max(0, letter.y - 1);
                const bottom = Math.min(rect.height, letter.y + letter.height + 2);
                const right = Math.min(rect.width, Math.max(0, letter.x + 1));
                const polygon = 'polygon(0 0,100% 0,100% ' + top + 'px,'
                    + right + 'px ' + top + 'px,' + right + 'px ' + bottom + 'px,0 ' + bottom + 'px)';
                this.change(task.element, 'clip-path', polygon);
                this.change(task.element, 'opacity', '1');
                agent.x = rect.x + right;
                agent.y = rect.y + letter.y + letter.height * 0.55;
                job.caret = { x: agent.x, y: rect.y + letter.y, height: letter.height };
            } else {
                agent.x = rect.x + rect.width * progress;
                agent.y = rect.y + rect.height * progress;
                if (task.kind !== 'box') {
                    this.change(task.element, 'clip-path', 'inset(0 0 ' + ((1 - progress) * 100) + '% 0)');
                    this.change(task.element, 'opacity', '1');
                }
            }
            if (progress >= 1) {
                this.restore(task.element, task.properties);
                task.state = 'done';
                agent.job = null;
            }
        }

        schedule() {
            if (!this.stopped && !this.frame) {
                this.frame = requestAnimationFrame(time => this.tick(time));
            }
        }

        tick(time) {
            this.frame = 0;
            if (this.stopped) return;
            try {
                const delta = Math.min(0.05, (time - this.lastFrame) / 1000);
                this.lastFrame = time;
                this.frontier = Math.max(this.frontier, window.scrollY + this.height);
                if (this.prepared && time - this.lastMeasure > 400) {
                    this.measureWaiting();
                    this.lastMeasure = time;
                }
                const parking = (this.parking = this.parkingLine());
                for (const [index, agent] of this.agents.entries()) {
                    if (this.prepared && !agent.job) this.assign(agent, time);
                    if (agent.job) this.advance(agent, time);
                    else {
                        const x = parking.x + index * parking.step;
                        const y = parking.y;
                        agent.x += (x - agent.x) * Math.min(1, delta * 6);
                        agent.y += (y - agent.y) * Math.min(1, delta * 6);
                        agent.parked = Math.hypot(x - agent.x, y - agent.y) < 0.5;
                        if (agent.parked) {
                            agent.x = x;
                            agent.y = y;
                        }
                    }
                }
                this.draw(time);
                const pending = this.tasks.some(task => task.state !== 'done');
                const busy = this.agents.some(agent => agent.job);
                if (this.prepared && !pending && !busy) {
                    this.complete = true;
                    this.host.shadowRoot.querySelector('button').hidden = true;
                    if (this.agents.every(agent => agent.parked)) return;
                }
                this.schedule();
            } catch (error) {
                console.error('[swarm-rebuild]', error);
                this.finish();
            }
        }

        label(context, text, x, y, color) {
            context.font = '600 10px Arial,sans-serif';
            const width = context.measureText(text).width + 8;
            context.fillStyle = color;
            context.beginPath();
            context.roundRect(x, y, width, 16, 2);
            context.fill();
            context.fillStyle = '#fff';
            context.fillText(text, x + 4, y + 11);
        }

        draw(time) {
            const context = this.context;
            context.clearRect(0, 0, this.width, this.height);
            for (const agent of this.agents) {
                const job = agent.job;
                if (!job || !job.building) continue;
                const rect = job.task.rect;
                const x = rect.x - window.scrollX;
                const y = rect.y - window.scrollY;
                context.strokeStyle = agent.color;
                context.lineWidth = 1;
                if (job.task.kind === 'text') {
                    if (job.caret && Math.floor(time / 260) % 2 === 0) {
                        const caret = job.caret;
                        context.beginPath();
                        context.moveTo(caret.x - window.scrollX, caret.y - window.scrollY);
                        context.lineTo(caret.x - window.scrollX, caret.y - window.scrollY + caret.height);
                        context.stroke();
                    }
                    context.globalAlpha = 0.35;
                    context.strokeRect(x - 3, y - 2, rect.width + 6, rect.height + 4);
                    context.globalAlpha = 1;
                } else {
                    const width = rect.width * job.progress;
                    const height = rect.height * job.progress;
                    context.globalAlpha = 0.07;
                    context.fillStyle = agent.color;
                    context.fillRect(x, y, width, height);
                    context.globalAlpha = 1;
                    context.strokeRect(x, y, width, height);
                    for (const point of [[x, y], [x + width, y], [x, y + height], [x + width, y + height]]) {
                        context.fillStyle = '#fff';
                        context.fillRect(point[0] - 2, point[1] - 2, 4, 4);
                        context.strokeRect(point[0] - 2, point[1] - 2, 4, 4);
                    }
                    this.label(context, Math.round(width) + ' × ' + Math.round(height),
                        x + width / 2 - 24, y + height + 5, agent.color);
                }
            }
            for (const agent of this.agents) {
                if (this.width <= 680 && !agent.job) continue;
                const x = agent.x - window.scrollX;
                const y = agent.y - window.scrollY;
                if (x < -80 || x > this.width + 80 || y < -80 || y > this.height + 80) continue;
                context.save();
                context.translate(x, y);
                context.fillStyle = agent.color;
                context.strokeStyle = '#fff';
                context.lineWidth = 1.4;
                const job = agent.job;
                if (job && job.building && job.task.kind === 'text') {
                    context.strokeStyle = agent.color;
                    context.beginPath();
                    context.moveTo(-3, -7);
                    context.lineTo(3, -7);
                    context.moveTo(0, -7);
                    context.lineTo(0, 7);
                    context.moveTo(-3, 7);
                    context.lineTo(3, 7);
                    context.stroke();
                } else if (job && job.building) {
                    context.strokeStyle = agent.color;
                    context.beginPath();
                    context.moveTo(-6, 0);
                    context.lineTo(6, 0);
                    context.moveTo(0, -6);
                    context.lineTo(0, 6);
                    context.stroke();
                } else {
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(3, 16);
                    context.lineTo(7, 11);
                    context.lineTo(14, 10);
                    context.closePath();
                    context.fill();
                    context.stroke();
                }
                if (agent.parked) {
                    context.font = '600 ' + this.parking.fontSize + 'px Arial,sans-serif';
                    context.fillStyle = agent.color;
                    context.fillText(agent.name, 18, 11, this.parking.labelWidth);
                } else this.label(context, agent.name, 9, 17, agent.color);
                context.restore();
            }
        }

        skip() {
            if (this.stopped) return;
            this.skipped = true;
            this.prepared = true;
            window.clearTimeout(this.limit);
            for (const element of [...this.styles.keys()]) this.restore(element);
            for (const task of this.tasks) task.state = 'done';
            for (const agent of this.agents) agent.job = null;
            this.schedule();
        }

        finish() {
            if (this.stopped) return;
            this.stopped = true;
            window.clearTimeout(this.limit);
            cancelAnimationFrame(this.frame);
            for (const remove of this.unbind) remove();
            for (const element of [...this.styles.keys()]) this.restore(element);
            if (this.host) {
                const host = this.host;
                const button = host.shadowRoot.querySelector('button');
                if (button) button.disabled = true;
                host.style.opacity = '0';
                host.style.transition = 'opacity 250ms ease';
                window.setTimeout(() => host.remove(), 260);
            }
            if (current === this) current = null;
        }
    }

    function launch() {
        if (current || motion.matches || !document.body) return;
        const effect = new Rebuild();
        current = effect;
        effect.begin().catch(error => {
            console.error('[swarm-rebuild]', error);
            effect.finish();
        });
    }

    window.__swarmRebuild = {
        start: launch,
        stop: () => { if (current) current.finish(); },
        toggle: () => { if (current) current.finish(); else launch(); },
        get app() { return current; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', launch, { once: true });
    } else launch();
})();
