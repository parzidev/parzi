(() => {
    'use strict';

    const finePointer = window.matchMedia('(pointer: fine)');
    const label = document.createElement('span');
    label.className = 'visitor-cursor-label';
    label.textContent = 'you';
    label.hidden = true;
    label.setAttribute('aria-hidden', 'true');
    document.body.appendChild(label);

    const hide = () => { label.hidden = true; };

    window.addEventListener('pointermove', event => {
        if (!finePointer.matches || event.pointerType === 'touch') {
            hide();
            return;
        }
        label.hidden = false;
        const x = Math.max(0, Math.min(event.clientX + 12,
            document.documentElement.clientWidth - label.offsetWidth - 6));
        const y = Math.max(0, Math.min(event.clientY + 18,
            window.innerHeight - label.offsetHeight - 6));
        label.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
    }, { passive: true });

    window.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch') hide();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) hide();
    });
    finePointer.addEventListener('change', () => {
        if (!finePointer.matches) hide();
    });
})();
