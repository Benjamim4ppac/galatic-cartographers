// Pointer lighting only. No application state, map data or navigation is changed.
(() => {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const precisePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const surfaces = [document.body];
    let frame = 0;
    let visible = false;
    let targetX = 0, targetY = 0, x = 0, y = 0;

    function enabled() { return precisePointer.matches && !reduceMotion.matches; }
    function hide() {
        visible = false;
        cancelAnimationFrame(frame);
        frame = 0;
        surfaces.forEach(surface => surface.style.setProperty('--aura-visible', '0'));
    }
    function paint() {
        frame = 0;
        if (!visible || !enabled()) return;
        x += (targetX - x) * 0.2;
        y += (targetY - y) * 0.2;
        surfaces.forEach(surface => {
            surface.style.setProperty('--aura-x', `${x.toFixed(1)}px`);
            surface.style.setProperty('--aura-y', `${y.toFixed(1)}px`);
            surface.style.setProperty('--aura-visible', '1');
        });
        if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.3) frame = requestAnimationFrame(paint);
    }
    document.addEventListener('pointermove', event => {
        if (!enabled() || event.pointerType === 'touch') return;
        targetX = event.clientX;
        targetY = event.clientY;
        if (!visible) { x = targetX; y = targetY; }
        visible = true;
        if (!frame) frame = requestAnimationFrame(paint);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
    reduceMotion.addEventListener('change', hide);
    precisePointer.addEventListener('change', hide);
})();
