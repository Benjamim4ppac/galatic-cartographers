// Workspace presentation only. Routing, terrain and mission calculations stay in app.js.
(() => {
    const panels = [...document.querySelectorAll('.floating-panel')];
    let panelOpener = null;
    function closePanels(restoreFocus = false) {
        panels.forEach(panel => { if (panel.open) panel.close(); panel.hidden = true; });
        document.querySelectorAll('[data-panel]').forEach(button => button.setAttribute('aria-expanded', 'false'));
        if (restoreFocus) (panelOpener || map.getContainer()).focus({ preventScroll: true });
    }
    function openPanel(id, opener, focus = true) {
        closePanels();
        if (!document.getElementById('mission-diagnosis-card').classList.contains('hidden')) document.getElementById('close-diagnosis-btn').click();
        const panel = document.getElementById(id);
        panel.hidden = false;
        panel.showModal();
        panelOpener = opener || document.querySelector(`[data-panel="${id}"]`);
        document.querySelectorAll(`[data-panel="${id}"]`).forEach(button => button.setAttribute('aria-expanded', 'true'));
        if (focus) (panel.querySelector('.close-panel') || panel).focus({ preventScroll: true });
    }
    function showWorkspace(name) {
        const id = name === 'layers' ? 'cartography-panel' : 'operations-panel';
        if (document.getElementById(id).hidden) openPanel(id, null);
        if (name === 'route') document.getElementById('workspace-route').scrollIntoView({ block: 'nearest' });
    }
    document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
        const panel = document.getElementById(button.dataset.panel);
        if (panel.hidden) openPanel(panel.id, button);
        else closePanels(true);
    }));
    document.querySelectorAll('[data-close-panel]').forEach(button => button.addEventListener('click', () => closePanels(true)));
    document.querySelector('[data-workspace="route"]').addEventListener('click', () => {
        document.getElementById('toggle-test-route-btn').click();
        closePanels();
        map.getContainer().focus({ preventScroll: true });
    });
    document.querySelector('a[href="#operations-panel"]').addEventListener('click', event => {
        event.preventDefault();
        openPanel('operations-panel', event.currentTarget);
    });
    const routePanel = document.getElementById('test-route-panel');
    new MutationObserver(() => {
        const active = !routePanel.classList.contains('hidden');
        updateRouteControls();
        document.getElementById('mars-map').setAttribute('aria-label', active ? 'Mapa de Marte: selecione dois pontos da rota com Enter' : 'Mapa interativo de Marte');
        if (active) closePanels();
    }).observe(routePanel, { attributes: true, attributeFilter: ['class'] });
    const unitPanel = document.getElementById('unit-detail-box');
    new MutationObserver(() => {
        if (!unitPanel.classList.contains('hidden')) showWorkspace('layers');
    }).observe(unitPanel, { attributes: true, attributeFilter: ['class'] });
    document.getElementById('close-unit-detail').setAttribute('aria-label', 'Fechar detalhes da unidade');
    // Leaflet recalculates its viewport when the responsive grid changes dimensions.
    // The square chart starts with the complete packaged image in view.
    const imageBounds = Terreno.limites;
    const originalPanBy = map.panBy.bind(map);
    const originalSetView = map.setView.bind(map);
    // Zoom transitions can expose the image edge before bounds are reapplied.
    map.setView = (center, zoom, options = {}) => originalSetView(center, zoom, {
        ...options, animate: false, zoom: { ...options.zoom, animate: false }
    });
    map.options.zoomSnap = 0;
    map.options.zoomDelta = 0.5;
    map.options.maxBoundsViscosity = 1;
    map.options.bounceAtZoomLimits = false;
    map.setMaxBounds(imageBounds);

    function constrainImageViewport() {
        const wasOverview = Math.abs(map.getZoom() - map.getMinZoom()) < 0.01;
        map.stop();
        map.invalidateSize({ animate: false, pan: false });
        // Reset before measuring: getBoundsZoom otherwise retains the previous minimum
        // when the viewport becomes smaller after a responsive layout change.
        map.setMinZoom(3);
        const minimum = map.getBoundsZoom(imageBounds, false);
        map.setMinZoom(minimum);
        VIEWS.global.center = imageBounds.getCenter();
        VIEWS.global.zoom = minimum;
        if (missaoAtual) {
            const missionBounds = L.latLngBounds([missaoAtual.pouso, missaoAtual.alvo]);
            VIEWS.area.center = missionBounds.getCenter();
            VIEWS.area.zoom = Math.max(minimum, Math.min(12, map.getBoundsZoom(missionBounds) - 1));
        }
        map.setView(wasOverview ? imageBounds.getCenter() : map.getCenter(), wasOverview ? minimum : Math.max(minimum, map.getZoom()), { animate: false });
        map.panInsideBounds(imageBounds, { animate: false });
    }
    // Leaflet flyTo can temporarily zoom out beyond minZoom during its flight.
    // Reframe through setView to keep overview and navigation zooms predictable.
    map.flyTo = (center, zoom = map.getZoom()) => map.setView(center, zoom, { animate: false });
    // Bound keyboard pan destinations before animation, rather than snapping back
    // after an unrestricted pan has already exposed space outside the image.
    function clampCenterAxis(value, minimum, maximum) {
        return minimum > maximum ? (minimum + maximum) / 2 : Math.max(minimum, Math.min(maximum, value));
    }
    map.panBy = (offset, options) => {
        const half = map.getSize().divideBy(2);
        const northwest = map.project(imageBounds.getNorthWest());
        const southeast = map.project(imageBounds.getSouthEast());
        const current = map.project(map.getCenter());
        const requested = current.add(L.point(offset));
        const target = L.point(
            clampCenterAxis(requested.x, northwest.x + half.x, southeast.x - half.x),
            clampCenterAxis(requested.y, northwest.y + half.y, southeast.y - half.y)
        );
        return originalPanBy(target.subtract(current), options);
    };
    constrainImageViewport();
    document.getElementById('btn-view-global').click();
    new ResizeObserver(constrainImageViewport).observe(document.getElementById('mars-map'));

    // Popups must fit the fixed image viewport without asking the map to pan
    // beyond its geographic bounds. Independent CSS translation leaves Leaflet's
    // projected position and the inspected coordinates untouched.
    L.Popup.mergeOptions({ autoPan: false });
    function fitPopupInsideMap(event) {
        const popup = event?.popup || map._popup;
        const element = popup?.getElement();
        if (!element) return;
        element.style.translate = '0px 0px';
        const viewport = map.getContainer().getBoundingClientRect();
        const box = element.getBoundingClientRect();
        const padding = 12;
        let dx = Math.max(viewport.left + padding - box.left,
            Math.min(0, viewport.right - padding - box.right));
        let dy = Math.max(viewport.top + padding - box.top,
            Math.min(0, viewport.bottom - padding - box.bottom));
        const controls = map.getContainer().querySelector('.leaflet-control-zoom')?.getBoundingClientRect();
        if (controls && box.left + dx < controls.right + 8 && box.right + dx > controls.left - 8 &&
            box.top + dy < controls.bottom + 8 && box.bottom + dy > controls.top - 8) {
            const rightOfControls = controls.right + 10 - box.left;
            if (box.right + rightOfControls <= viewport.right - padding) dx = rightOfControls;
            else dy = Math.max(dy, controls.bottom + 10 - box.top);
        }
        element.style.translate = `${dx}px ${dy}px`;
        element.classList.toggle('popup-edge-clamped', Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5);
        const content = element.querySelector('.leaflet-popup-content');
        if (content) {
            content.tabIndex = 0;
            content.setAttribute('role', 'region');
            content.setAttribute('aria-label', 'Detalhes do ponto no mapa');
        }
    }
    map.on('popupopen', fitPopupInsideMap);
    map.on('moveend zoomend resize', () => fitPopupInsideMap());


    // Read-only route drawing. No mission state or route data is written here.
    const svg = document.getElementById('route-profile');
    const ns = 'http://www.w3.org/2000/svg';
    const nodes = [];
    function drawNode(tag, attributes, text) {
        const node = document.createElementNS(ns, tag);
        for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
        if (text !== undefined) node.textContent = text;
        svg.append(node);
        nodes.push(node);
        return node;
    }
    let chartPoints = [];
    let cursor = null;
    function renderProfile() {
        nodes.splice(0).forEach(node => node.remove());
        chartPoints = [];
        cursor = null;
        if (!missaoRota || missaoRota.bloqueada || missaoRota.waypoints.length < 2) {
            document.getElementById('profile-description').textContent = 'Sem rota transitavel para apresentar.';
            drawNode('text', { x: 0, y: 50, class: 'profile-empty' }, 'SEM ROTA TRANSITAVEL');
            return;
        }
        const points = missaoRota.waypoints;
        let total = 0;
        const distances = points.map((point, index) => {
            if (index) total += distanciaMarteKm(points[index - 1], point);
            return total;
        });
        // Use the same altitude model already shown by the application.
        const elevations = points.map(point => getElevacaoEstimada(point));
        let low = Infinity, high = -Infinity;
        for (const elevation of elevations) { low = Math.min(low, elevation); high = Math.max(high, elevation); }
        const span = high - low || 1;
        chartPoints = elevations.map((value, index) => ({
            x: 4 + 292 * (total ? distances[index] / total : index / (points.length - 1)),
            y: 78 - 56 * (value - low) / span
        }));
        for (const y of [22, 50, 78]) drawNode('line', { x1: 0, x2: 300, y1: y, y2: y, class: 'profile-grid' });
        drawNode('text', { x: 0, y: 10, class: 'profile-axis' }, Math.round(high).toLocaleString('pt-BR'));
        drawNode('text', { x: 0, y: 102, class: 'profile-axis' }, Math.round(low).toLocaleString('pt-BR'));
        const path = chartPoints.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
        drawNode('path', { d: `${path} L296,84 L4,84 Z`, class: 'profile-fill' });
        drawNode('path', { d: path, class: 'profile-line' });
        drawNode('text', { x: 300, y: 102, 'text-anchor': 'end', class: 'profile-axis' }, `${total.toFixed(1)} km`);
        cursor = drawNode('circle', { r: 3.5, class: 'profile-position' });
        document.getElementById('profile-description').textContent =
            `Altitude estimada entre ${Math.round(low)} e ${Math.round(high)} metros. Distancia de ida: ${total.toFixed(1)} km. Modelo por unidade geologica; nao representa a declividade real.`;
        updateProfilePosition();
    }
    function updateProfilePosition() {
        if (!cursor || !chartPoints.length) return;
        const index = missaoPassos[astroStepIndex] ?? 0;
        const point = chartPoints[Math.min(index, chartPoints.length - 1)];
        cursor.setAttribute('cx', point.x);
        cursor.setAttribute('cy', point.y);
    }
    renderProfile();
    new MutationObserver(updateProfilePosition).observe(document.getElementById('astro-progress-pct'), { childList: true, subtree: true, characterData: true });
    document.getElementById('locate-landing').addEventListener('click', () => {
        closePanels();
        if (missaoAtual) map.flyTo(missaoAtual.pouso, 12, { duration: 0.8 });
        map.getContainer().focus({ preventScroll: true });
    });
    document.getElementById('locate-target').addEventListener('click', () => {
        closePanels();
        if (missaoAtual) map.flyTo(missaoAtual.alvo, 12, { duration: 0.8 });
        map.getContainer().focus({ preventScroll: true });
    });

    document.querySelectorAll('a[href="#mars-map"]').forEach(link => {
        link.addEventListener('click', () => requestAnimationFrame(() => map.getContainer().focus({ preventScroll: true })));
    });
    document.getElementById('inspect-center').addEventListener('click', () => {
        inspecionarTerreno(map.getCenter());
        map._popup?.getElement()?.querySelector('.leaflet-popup-content')?.focus({ preventScroll: true });
    });
    document.getElementById('mark-route-point').addEventListener('click', () => {
        if (modoRotaTeste) adicionarPontoDeRota(map.getCenter());
        updateRouteControls();
        map.getContainer().focus({ preventScroll: true });
    });
    // Reflect the existing selection state; all point selection still uses app.js.
    function updateRouteControls() {
        const active = modoRotaTeste;
        const mark = document.getElementById('mark-route-point');
        mark.hidden = !active;
        document.getElementById('inspect-center').hidden = active;
        const stage = routePoints.length === 0 ? 'Marcar origem' : routePoints.length === 1 ? 'Marcar destino' : 'Iniciar nova rota';
        mark.textContent = `${stage} [Enter]`;
        document.getElementById('map-mode-state').textContent = active
            ? (routePoints.length < 2 ? `Rota de teste / ${routePoints.length + 1} de 2: ${routePoints.length ? 'destino' : 'origem'}` : 'Rota de teste / percurso calculado')
            : 'Inspecionar terreno';
        const headerButton = document.querySelector('[data-workspace="route"]');
        headerButton.setAttribute('aria-pressed', String(active));
        headerButton.textContent = active ? 'Sair do teste [M]' : 'Testar rota [M]';
        document.querySelector('#toggle-test-route-btn .uppercase').textContent = active ? 'Encerrar seleção' : 'Selecionar dois pontos';
    }
    document.getElementById('toggle-test-route-btn').addEventListener('click', () => {
        updateRouteControls();
        if (modoRotaTeste) { closePanels(); map.getContainer().focus({ preventScroll: true }); }
    });
    map.on('click', updateRouteControls);
    document.getElementById('clear-route').addEventListener('click', () => {
        updateRouteControls();
        if (modoRotaTeste) { closePanels(); map.getContainer().focus({ preventScroll: true }); }
    });
    document.addEventListener('navigationchange', updateRouteControls);
    document.getElementById('toggle-diagnosis-btn').addEventListener('click', () => {
        if (!document.getElementById('mission-diagnosis-card').classList.contains('hidden')) {
            document.getElementById('close-diagnosis-btn').focus({ preventScroll: true });
        }
    });
    updateRouteControls();

    let followRover = true;
    const followButton = document.getElementById('follow-rover');
    function setFollow(enabled) {
        followRover = enabled;
        followButton.setAttribute('aria-pressed', String(enabled));
        followButton.querySelector('span').textContent = enabled ? 'ON' : 'OFF';
    }
    function followPosition() {
        if (followRover && astroMarker) map.panTo(astroMarker.getLatLng(), { animate: false });
    }
    followButton.addEventListener('click', () => { setFollow(!followRover); followPosition(); });
    map.on('dragstart', () => setFollow(false));
    map.getContainer().addEventListener('keydown', event => {
        if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) setFollow(false);
    });
    document.querySelectorAll('[data-mirror]').forEach(readout => {
        const source = document.getElementById(readout.dataset.mirror);
        const sync = () => { readout.textContent = source.textContent; };
        sync();
        new MutationObserver(sync).observe(source, { childList: true, characterData: true, subtree: true });
    });
    const originalPlay = document.getElementById('btn-astro-play');
    const flightPlay = document.getElementById('flight-play');
    function syncPlay() { flightPlay.textContent = originalPlay.textContent; }
    syncPlay();
    new MutationObserver(syncPlay).observe(originalPlay, { childList: true, subtree: true, characterData: true });
    for (const [shortcut, original] of [['flight-play','btn-astro-play'], ['flight-step','btn-astro-step'], ['flight-reset','btn-astro-reset']]) {
        document.getElementById(shortcut).addEventListener('click', () => {
            closePanels();
            document.getElementById(original).click();
            followPosition();
        });
    }
    new MutationObserver(followPosition).observe(document.getElementById('astro-progress-pct'), { childList: true, subtree: true, characterData: true });
})();
