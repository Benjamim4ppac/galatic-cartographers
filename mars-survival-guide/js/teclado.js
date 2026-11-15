// Keyboard presentation and focus management only; mission rules stay in app.js.
(() => {
    const mapa = map.getContainer();
    const paineis = [...document.querySelectorAll('.floating-panel')];
    const ajuda = document.getElementById('keyboard-dialog');
    const diagnostico = document.getElementById('mission-diagnosis-card');
    let origemUnidade = null;
    let origemPopup = null;
    function focarMapa() {
        paineis.filter(p => p.open).forEach(p => p.querySelector('[data-close-panel]').click());
        if (!diagnostico.classList.contains('hidden')) document.getElementById('close-diagnosis-btn').click();
        mapa.focus({ preventScroll: true });
    }
    paineis.forEach(p => p.addEventListener('cancel', e => {
        e.preventDefault();
        p.querySelector('[data-close-panel]').click();
    }));
    document.addEventListener('keydown', e => {
        if (e.isComposing) { e.stopPropagation(); return; }
        if (e.key === 'Tab') {
            const aberto = ajuda.open ? ajuda : paineis.find(p => p.open);
            if (aberto) {
                const candidatos = [...aberto.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')]
                    .filter(el => el.getClientRects().length && !el.closest('[hidden], .hidden'));
                const itens = candidatos.filter(el => {
                    if (el.type !== 'radio' || !el.name) return true;
                    const grupo = candidatos.filter(outro => outro.type === 'radio' && outro.name === el.name);
                    return el === (grupo.find(outro => outro.checked) || grupo[0]);
                });
                const atual = itens.indexOf(document.activeElement);
                e.preventDefault();
                const proximo = atual < 0 ? (e.shiftKey ? itens.length - 1 : 0)
                    : (atual + (e.shiftKey ? -1 : 1) + itens.length) % itens.length;
                itens[proximo]?.focus();
            }
        }
        const editando = e.target.closest('input, textarea, select, [contenteditable="true"]');
        const entradaTexto = e.target.closest('textarea, select, [contenteditable]:not([contenteditable="false"]), input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"])');
        const aproximar = e.key === '+' || e.key === '=' || e.code === 'NumpadAdd';
        const afastar = e.key === '-' || e.code === 'NumpadSubtract';
        if ((aproximar || afastar) && !e.defaultPrevented && !e.ctrlKey && !e.metaKey && !e.altKey && !entradaTexto) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (aproximar) map.zoomIn();
            else map.zoomOut();
            return;
        }
        const vista = { f: 'btn-view-area', g: 'btn-view-global', l: 'btn-view-local' }[e.key.toLowerCase()];
        if (vista && !e.defaultPrevented && !e.ctrlKey && !e.metaKey && !e.altKey && !entradaTexto) {
            e.preventDefault();
            e.stopImmediatePropagation();
            // Invoke the visible button's action without changing the current focus.
            if (!e.repeat) document.getElementById(vista).click();
            return;
        }
        if (!e.defaultPrevented && !e.isComposing &&
            !e.ctrlKey && !e.metaKey && !e.altKey && !entradaTexto && /^[wasd]$/i.test(e.key)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const seguir = document.getElementById('follow-rover');
            if (seguir.getAttribute('aria-pressed') === 'true') seguir.click();
            const passos = { w: [0, -140], a: [-140, 0], s: [0, 140], d: [140, 0] };
            map.panBy(passos[e.key.toLowerCase()], { animate: true, duration: 0.25 });
            return;
        }
        if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'F1' || (!editando && e.key === '?'))) {
            e.preventDefault();
            e.stopPropagation();
            if (!e.repeat && !ajuda.open) document.getElementById('keyboard-help').click();
        }
        if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            const painel = { c: 'cartography-panel', m: 'operations-panel', t: 'instruments' }[e.key.toLowerCase()];
            if (painel || e.key.toLowerCase() === 'n') {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (ajuda.open || e.repeat) return;
                if (painel) document.querySelector(`[data-panel="${painel}"]`).click();
                else focarMapa();
            }
        }
        if (e.key === 'Escape' && !e.defaultPrevented) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.repeat) return;
            const painel = paineis.find(p => p.open);
            if (ajuda.open) ajuda.close();
            else if (painel?.id === 'cartography-panel' && !document.getElementById('unit-detail-box').classList.contains('hidden')) document.getElementById('close-unit-detail').click();
            else if (painel) painel.querySelector('[data-close-panel]').click();
            else if (!diagnostico.classList.contains('hidden')) document.getElementById('close-diagnosis-btn').click();
            else if (map._popup?.isOpen()) map.closePopup();
            return;
        }
        // Holding a toggle/action must not repeatedly clear routes or start/pause playback.
        if (e.repeat && ((e.target === mapa && ['m', 'p', 'x', 'v', 'h', 'i', 't', 'enter', ' '].includes(e.key.toLowerCase())) ||
            (e.target.closest('button') && ['Enter', ' '].includes(e.key)))) {
            e.preventDefault(); e.stopImmediatePropagation();
        }
    }, true);
    // Let native controls and scroll regions handle keys, without firing map commands.
    document.addEventListener('keydown', e => {
        if (e.target !== mapa) e.stopPropagation();
        else requestAnimationFrame(() => document.dispatchEvent(new Event('navigationchange')));
    });
    document.querySelectorAll('.layer-content, .dossier-content, .simulation-panel, .shortcut-list, .coordinate-strip, #mission-diagnosis-card > div:last-child').forEach(el => {
        el.tabIndex = 0;
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', 'Scrollable information');
    });
    document.querySelectorAll('a[href="#mars-map"]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault(); focarMapa();
    }));
    document.addEventListener('click', e => {
        const botao = e.target.closest('#hydro-legend-body button');
        if (botao) {
            origemUnidade = botao;
            requestAnimationFrame(() => document.getElementById('close-unit-detail').focus());
        }
    }, true);
    document.getElementById('close-unit-detail').addEventListener('click', () => origemUnidade?.focus());
    map.on('popupopen', e => {
        origemPopup = document.activeElement;
        const el = e.popup.getElement();
        el.querySelector('.leaflet-popup-close-button')?.setAttribute('aria-label', 'Close terrain details');
        el.querySelector('.leaflet-popup-content')?.focus({ preventScroll: true });
    });
    map.on('popupclose', () => {
        if (!document.querySelector('dialog[open]')) {
            const destino = origemPopup?.isConnected && origemPopup.getClientRects().length ? origemPopup : mapa;
            destino.focus({ preventScroll: true });
        }
    });
    // Rationale is a local overlay: keep Tab inside it until it is dismissed.
    document.addEventListener('keydown', e => {
        if (e.defaultPrevented || e.key !== 'Tab' || diagnostico.classList.contains('hidden') || ajuda.open || paineis.some(p => p.open)) return;
        const itens = [...diagnostico.querySelectorAll('button, [tabindex="0"], a[href]')];
        const atual = itens.indexOf(document.activeElement);
        e.preventDefault();
        itens[(atual + (e.shiftKey ? -1 : 1) + itens.length) % itens.length].focus();
    }, true);
    function atualizarDica() {
        document.getElementById('map-keyboard-help').textContent =
            'WASD moves the map; + / - zooms (including numeric keypad); F / G / L selects mission / full area / base from any control, except text fields. Map focused: arrows move; + / − zoom; Enter inspect or mark route. Tab next control. Zoom in to move within the full-area view. Alt+N focuses the map.';
        if (astroMarker?._icon) {
            astroMarker._icon.tabIndex = -1;
            astroMarker._icon.setAttribute('role', 'img');
            astroMarker._icon.setAttribute('aria-label', 'Rover position');
        }
    }
    atualizarDica();
})();
