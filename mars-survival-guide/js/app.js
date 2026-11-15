// ============================================================================
// MARS SURVIVAL GUIDE — oeste de Candor Chasma (Valles Marineris)
// Terreno real: declividade do QGIS (js/terreno.js + data/terreno.js) — pipeline do Yoshida
// Geologia: carta USGS I-897 (data/candor_geologia.js)
// Missão, sobrevivência e interface: data/parametros.js + este arquivo
// ============================================================================

// ============================================================================
// 1. MAPA E CAMADAS
// ============================================================================
const VIEWS = {
    global: { center: [-10.0, -66.0], zoom: 5 },
    area:   { center: [AREA_OPERACIONAL.centro.lat, AREA_OPERACIONAL.centro.lon], zoom: 8 },
    local:  { center: [AREA_OPERACIONAL.centro.lat, AREA_OPERACIONAL.centro.lon], zoom: 10 }
};

const map = L.map('mars-map', {
    center: VIEWS.area.center,
    zoom: VIEWS.area.zoom,
    minZoom: 3,
    maxZoom: 14,
    preferCanvas: true,
    keyboard: false
});

map.createPane('basePane');
map.getPane('basePane').style.zIndex = 200;
map.createPane('slopePane');
map.getPane('slopePane').style.zIndex = 420;
map.createPane('geologyPane');
map.getPane('geologyPane').style.zIndex = 450;
map.createPane('thermalPane');
map.getPane('thermalPane').style.zIndex = 500;
map.createPane('missionOverlayPane');
map.getPane('missionOverlayPane').style.zIndex = 650;

// Imagem real da área, exportada do QGIS e guardada no projeto (funciona sem internet)
const imagemReal = L.imageOverlay('data/imagem_candor_oeste.jpg', Terreno.limites, {
    pane: 'basePane',
    attribution: 'Imagem e declividade: QGIS (equipe) · Geologia: USGS I-897'
}).addTo(map);

// Restrições de rota: declividade do QGIS + zona de desabamento + terreno caótico (segura fica transparente)
const camadaDeclividade = L.imageOverlay(Terreno.imagemRestricoes(), Terreno.limites, {
    pane: 'slopePane', opacity: 0.85, interactive: false
}).addTo(map);
camadaDeclividade.getElement()?.style.setProperty('image-rendering', 'pixelated');

// Contorno da área com dados
L.rectangle(Terreno.limites, {
    pane: 'missionOverlayPane', color: '#38bdf8', weight: 1.5, dashArray: '8, 6', fill: false, interactive: false
}).addTo(map);

const geologyGroup = L.layerGroup();
const targetsGroup = L.layerGroup().addTo(map);

// Mosaicos online (opcionais, para contexto fora da área)
let falhasDeMosaico = 0;
Object.values(nasaLayers).forEach((camada) => {
    camada.on('tileerror', () => {
        falhasDeMosaico++;
        if (falhasDeMosaico === 6) document.getElementById('offline-banner')?.classList.remove('hidden');
    });
});

// ============================================================================
// 2. FUNÇÕES GEOGRÁFICAS DE MARTE
// ============================================================================
const RAIO_MARTE_KM = 3396.19;

function distanciaMarteKm(a, b) {
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lng - a.lng) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 +
              Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * RAIO_MARTE_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function centroDaMissao() {
    return L.latLng(MISSION_CENTER.lat, MISSION_CENTER.lon);
}

function identificarSetorMarte(lat, lon) {
    if (lon >= -77.2 && lat >= -7.2 && lat <= -4.8) return "Candor Chasma (oeste)";
    return "Valles Marineris";
}

// ============================================================================
// 3. CATÁLOGO GEOLÓGICO (siglas reais da carta USGS I-897)
// "confirmado: false" = interpretação da equipe pela posição da unidade no mapa;
// conferir na legenda oficial da carta antes de citar como fato.
// ============================================================================
const geologyCatalog = {
    cf: {
        code: "CF", name: "Fundo do cânion", original: "Chasma floor material", confirmado: true,
        classe: "canyon", potencial: "MODERADO", risco: "BAIXO", color: "#10b981",
        desc: "Material plano no fundo do cânion, formado por deslizamentos das paredes cobertos por sedimentos. É o terreno mais seguro para pouso e deslocamento.",
        uso: "Pouso e trânsito"
    },
    lc: {
        code: "LC", name: "Depósitos em camadas", original: "Layered chasma material", confirmado: true,
        classe: "canyon", potencial: "ALTO", risco: "MÉDIO", color: "#06b6d4",
        desc: "Rochas em camadas interpretadas como sedimentos de antigos lagos. Em Candor, orbitadores detectaram sulfatos hidratados nesses depósitos: minerais que guardam água na própria estrutura.",
        uso: "Alvo de água (aquecer o material libera H₂O)"
    },
    sb: {
        code: "SB", name: "Parede do cânion", original: "Faixa entre fundo e planalto", confirmado: false,
        classe: "wall", potencial: "BAIXO", risco: "PROIBIDO", color: "#ef4444",
        desc: "Faixa estreita entre o fundo do cânion e o planalto, com milhares de metros de desnível. No mapa de declividade do QGIS, essas paredes aparecem como declividade alta (bloqueada).",
        uso: "Evitar: paredes do cânion"
    },
    cht: {
        code: "CHT", name: "Terreno caótico", original: "Chaotic terrain", confirmado: false,
        classe: "canyon", potencial: "MODERADO", risco: "ALTO", color: "#f59e0b",
        desc: "Blocos fraturados e desabados, ligados à saída de água subterrânea no passado. Interessante para a ciência, perigoso para veículos.",
        uso: "Evitar: terreno instável"
    },
    pr: {
        code: "PR", name: "Planície com cristas", original: "Ridged plains", confirmado: true,
        classe: "plateau", potencial: "BAIXO", risco: "BAIXO", color: "#6366f1",
        desc: "Planície vulcânica do planalto, milhares de metros acima do fundo do cânion.",
        uso: "Fora do alcance a partir do cânion"
    },
    pc: {
        code: "PC", name: "Planície do planalto", original: "Sigla PC da carta", confirmado: false,
        classe: "plateau", potencial: "BAIXO", risco: "BAIXO", color: "#a855f7",
        desc: "Planície do planalto acima do cânion.",
        uso: "Fora do alcance a partir do cânion"
    },
    plc: {
        code: "PLC", name: "Planalto craterizado", original: "Sigla PLC da carta", confirmado: false,
        classe: "plateau", potencial: "BAIXO", risco: "BAIXO", color: "#8b5cf6",
        desc: "Terreno antigo do planalto com muitas crateras.",
        uso: "Fora do alcance a partir do cânion"
    },
    tf: {
        code: "TF", name: "Terreno fraturado", original: "Sigla TF da carta", confirmado: false,
        classe: "plateau", potencial: "BAIXO", risco: "ALTO", color: "#64748b",
        desc: "Planalto cortado por fraturas tectônicas.",
        uso: "Fora do alcance a partir do cânion"
    },
    c1: {
        code: "C1", name: "Cratera antiga", original: "Crater material (C1)", confirmado: false,
        classe: "plateau", potencial: "BAIXO", risco: "MÉDIO", color: "#94a3b8",
        desc: "Cratera de impacto antiga e degradada.",
        uso: "Amostragem científica"
    },
    c2: {
        code: "C2", name: "Cratera de impacto", original: "Crater material (C2)", confirmado: false,
        classe: "plateau", potencial: "BAIXO", risco: "MÉDIO", color: "#cbd5e1",
        desc: "Cratera de impacto com fundo modificado por erosão.",
        uso: "Amostragem científica"
    }
};

const CORES_POTENCIAL = { ALTO: "text-cyan-300", MODERADO: "text-amber-300", BAIXO: "text-slate-400" };

function infoUnidade(uName) {
    const key = String(uName).toLowerCase();
    if (!geologyCatalog[key]) {
        geologyCatalog[key] = {
            code: key.toUpperCase(), name: `Unidade ${key.toUpperCase()}`, original: "Sem descrição", confirmado: false,
            classe: "other", potencial: "BAIXO", risco: "MÉDIO", color: "#d946ef",
            desc: `Unidade da carta de Coprates (sigla ${key.toUpperCase()}).`, uso: "—"
        };
    }
    return geologyCatalog[key];
}

// ============================================================================
// 4. CONSULTA DE GEOLOGIA NUM PONTO
// ============================================================================
const geologyLayersList = []; // { properties, layer, bounds }

function isPointInRing(latlng, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i].lat, yi = ring[i].lng;
        const xj = ring[j].lat, yj = ring[j].lng;
        const intersect = ((yi > latlng.lng) !== (yj > latlng.lng)) &&
            (latlng.lat < (xj - xi) * (latlng.lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Polígono = [anel externo, buracos...]; considera os buracos
function isPointInPolygonRings(latlng, rings) {
    if (!isPointInRing(latlng, rings[0])) return false;
    for (let k = 1; k < rings.length; k++) {
        if (isPointInRing(latlng, rings[k])) return false;
    }
    return true;
}

function isPointInLayer(latlng, layer) {
    const ll = layer.getLatLngs();
    if (!ll || !ll.length) return false;
    // Polygon: [[LatLng...], ...]   MultiPolygon: [[[LatLng...], ...], ...]
    if (ll[0] && ll[0][0] && typeof ll[0][0].lat === 'number') return isPointInPolygonRings(latlng, ll);
    return ll.some(poly => isPointInPolygonRings(latlng, poly));
}

function consultarGeologiaNoPonto(latlng) {
    let encontrada = null;
    for (const item of geologyLayersList) {
        if (!item.bounds.contains(latlng)) continue;
        if (isPointInLayer(latlng, item.layer)) {
            if (item.properties.classe === "wall") return item.properties; // parede tem prioridade
            encontrada = item.properties;
        }
    }
    return encontrada;
}

// ============================================================================
// 5. ELEVAÇÃO ESTIMADA (modelo simplificado — NÃO é o DEM MOLA)
// Fora das unidades mapeadas usa um perfil genérico do cânion;
// dentro delas usa a altitude típica de cada tipo de terreno.
// ============================================================================
function elevacaoPerfilGenerico(lat, lon) {
    const eixoCanionLat = -6.5 + ((lon + 72.0) / 22.0) * -6.5;
    const dist = Math.abs(lat - eixoCanionLat);
    let base;
    if (dist < 1.35) base = -4250 + dist * 480;
    else if (dist < 2.6) base = -3600 + ((dist - 1.35) / 1.25) * 5100;
    else base = 1500 + Math.sin(lon * 0.5) * 280;
    return Math.round(base + Math.sin(lat * 22) * Math.cos(lon * 22) * 140);
}

function getElevacaoEstimada(latlng, geo) {
    if (geo === undefined) geo = consultarGeologiaNoPonto(latlng);
    if (!geo) return elevacaoPerfilGenerico(latlng.lat, latlng.lng);
    const micro = Math.round(Math.sin(latlng.lat * 45) * Math.cos(latlng.lng * 45) * 120);
    switch (geo.code.toLowerCase()) {
        case "cf":  return -4200 + micro;
        case "lc":  return -4150 + micro;  // base dos depósitos, onde a coleta acontece
        case "cht": return -3500 + micro;
        case "sb":  return -1200 + micro;  // meio da parede
        default:
            return geo.classe === "plateau"
                ? 1500 + Math.round(Math.sin(latlng.lng * 0.5) * 280) + micro
                : elevacaoPerfilGenerico(latlng.lat, latlng.lng);
    }
}

// Altitude usada nas contas da rota: sem micro-relevo e sem a unidade SB.
// A SB (parede) da carta USGS é grosseira (escala 1:5 milhões) e invade o fundo do cânion;
// quem decide onde estão as paredes é a declividade real do QGIS. Retorna null para SB.
function elevacaoParaRota(latlng) {
    const geo = consultarGeologiaNoPonto(latlng);
    if (!geo) return elevacaoPerfilGenerico(latlng.lat, latlng.lng);
    switch (geo.code.toLowerCase()) {
        case "cf":  return -4200;
        case "lc":  return -4150;
        case "cht": return -3500;
        case "sb":  return null;
        default:    return geo.classe === "plateau" ? 1500 + Math.round(Math.sin(latlng.lng * 0.5) * 280) : elevacaoPerfilGenerico(latlng.lat, latlng.lng);
    }
}

// ============================================================================
// 6. AMBIENTE (modelo simplificado)
// ============================================================================
function calcularAmbienteMarte(altitudeM, lat) {
    const pressaoPa = Math.round(AMBIENTE.pressaoReferenciaPa * Math.exp(-altitudeM / AMBIENTE.alturaEscalaM));
    const efeitoLatitude = Math.max(0, Math.abs(lat) - 6.5) * 0.95;
    const tempC = Math.round(-28 - (altitudeM / 1000) * 3.2 - efeitoLatitude);
    const radTaxaHora = (AMBIENTE.radiacaoMsvDiaReferencia / 24) *
        Math.exp((altitudeM - AMBIENTE.altitudeReferenciaM) / 22000);
    return { pressaoPa, tempC, radTaxaHora };
}

// ============================================================================
// 7. ROTA (A* sobre o terreno real de 100 m)
// ============================================================================
function estiloRota(rota) {
    return {
        color: rota.bloqueada ? '#ef4444' : rota.usaRisco ? '#f59e0b' : '#22c55e',
        dashArray: '8, 7'
    };
}

function calcularRota(inicio, fim) {
    const r = Terreno.rota(inicio, fim);
    if (!r.ids.length) return { ids: [], waypoints: [inicio, fim], bloqueada: true, motivo: r.motivo, usaRisco: false };
    const waypoints = r.ids.map(Terreno.centro);
    waypoints[0] = inicio;
    waypoints[waypoints.length - 1] = fim;
    return { ids: r.ids, waypoints, bloqueada: false, usaRisco: r.usaRisco };
}

// ============================================================================
// 8. ANÁLISE DA MISSÃO: ida + coleta + volta, recursos, risco e regras de decisão
// ============================================================================
function analisarTrajetoria(rota) {
    const wp = rota.waypoints;
    const ids = rota.ids || [];
    const riscoPorTipo = { [Terreno.DECLIVIDADE_MEDIA]: 0, [Terreno.DESABAMENTO]: 0, [Terreno.CAOTICO]: 0 };
    let distanciaKm = 0, riscoKm = 0, horasIda = 0, horasCaminhada = 0, energiaIdaKwh = 0, radiacaoIdaMsv = 0;
    let subidaM = 0, descidaM = 0;
    const amostra = Math.max(1, Math.floor(wp.length / 200)); // altitude a cada N pontos
    let altAnterior = null;
    for (let k = 0; k < wp.length && altAnterior === null; k += amostra) altAnterior = elevacaoParaRota(wp[k]);
    if (altAnterior === null) altAnterior = getElevacaoEstimada(wp[0]);
    const altInicial = altAnterior;
    let altFinal = altInicial, altMin = altInicial, altMax = altInicial;

    for (let i = 1; i < wp.length; i++) {
        const segKm = distanciaMarteKm(wp[i - 1], wp[i]);
        let tipoRisco = null;
        if (!rota.bloqueada && ids.length) {
            const tA = Terreno.tipo[ids[i - 1]], tB = Terreno.tipo[ids[i]];
            const pior = Math.max(tA === Terreno.SEGURA ? 0 : Terreno.CUSTO[tA], tB === Terreno.SEGURA ? 0 : Terreno.CUSTO[tB]);
            if (pior > 0) tipoRisco = Terreno.CUSTO[tB] === pior && tB !== Terreno.SEGURA ? tB : tA;
        }
        distanciaKm += segKm;
        if (tipoRisco !== null) { riscoKm += segKm; riscoPorTipo[tipoRisco] += segKm; }
        const h = segKm / (tipoRisco !== null ? ROVER.velocidadeRiscoKmh : ROVER.velocidadeMaxKmh);
        horasIda += h;
        horasCaminhada += segKm / (tipoRisco !== null ? TRAJE.velocidadeCaminhadaRiscoKmh : TRAJE.velocidadeCaminhadaKmh);
        energiaIdaKwh += segKm * ROVER.energiaPlanoKwhPorKm * (tipoRisco !== null ? ROVER.fatorEnergiaRisco : 1);

        if (i % amostra === 0 || i === wp.length - 1) {
            const alt = elevacaoParaRota(wp[i]);
            if (alt !== null) {
                if (alt > altAnterior) subidaM += alt - altAnterior; else descidaM += altAnterior - alt;
                altAnterior = alt;
                altFinal = alt;
                altMin = Math.min(altMin, alt);
                altMax = Math.max(altMax, alt);
            }
        }
        radiacaoIdaMsv += h * calcularAmbienteMarte(altAnterior, wp[i].lat).radTaxaHora;
    }

    // Subir gasta energia na ida; na volta, a descida da ida vira subida
    const energiaSubida = (m) => (ROVER.massaKg * 3.72 * m) / (3600000 * ROVER.eficiencia);
    energiaIdaKwh += energiaSubida(subidaM);
    const energiaVoltaKwh = energiaIdaKwh - energiaSubida(subidaM) + energiaSubida(descidaM);
    const energiaKwh = energiaIdaKwh + energiaVoltaKwh;
    const horasTotal = 2 * horasIda + REGRAS.tempoColetaHoras;
    const o2Gramas = Math.round(horasTotal * TRIPULACAO.pessoas * TRIPULACAO.o2GramasPorPessoaHora);
    const ambAlvo = calcularAmbienteMarte(altFinal, wp[wp.length - 1].lat);
    const radiacaoMsv = 2 * radiacaoIdaMsv + REGRAS.tempoColetaHoras * ambAlvo.radTaxaHora;
    const desnivelMaxM = altMax - altMin; // diferença entre o ponto mais alto e o mais baixo da rota

    const usoBateriaPct = Math.round((energiaKwh / ROVER.bateriaKwh) * 100);
    const usoO2Pct = Math.round((o2Gramas / TRIPULACAO.reservaO2Gramas) * 100);
    const usoTrajePct = Math.round((horasCaminhada / TRAJE.autonomiaHoras) * 100);

    // Regras de decisão: cada uma que dispara vira um alerta explicado no painel
    const bloqueios = [], atencoes = [];
    if (rota.bloqueada) bloqueios.push(rota.motivo);
    else {
        if (usoBateriaPct > 100) bloqueios.push(`Bateria insuficiente para ida e volta (${usoBateriaPct}%)`);
        else if (usoBateriaPct > REGRAS.alertaRecursoPct) atencoes.push(`Bateria no limite (${usoBateriaPct}% para ida e volta)`);
        if (usoO2Pct > 100) bloqueios.push(`O₂ insuficiente para a missão completa (${usoO2Pct}%)`);
        else if (usoO2Pct > REGRAS.alertaRecursoPct) atencoes.push(`O₂ no limite (${usoO2Pct}% da reserva)`);
        if (usoTrajePct > 100) bloqueios.push(`Se o rover falhar no alvo, a volta a pé leva ${formatarHoras(horasCaminhada)}: mais que as ${TRAJE.autonomiaHoras} h do traje`);
        else if (usoTrajePct > REGRAS.alertaTrajePct) atencoes.push(`Volta a pé de emergência no limite do traje (${usoTrajePct}%)`);
        if (desnivelMaxM > REGRAS.limiteDesnivelM) bloqueios.push(`Desnível estimado de ${desnivelMaxM.toLocaleString('pt-BR')} m: a rota transpõe a parede do cânion`);
        if (horasTotal > REGRAS.horasDeLuz) bloqueios.push(`Missão de ${formatarHoras(horasTotal)} não cabe nas ~${REGRAS.horasDeLuz} h de luz do dia`);
        else if (horasTotal > REGRAS.janelaSeguraHoras) atencoes.push(`Missão de ${formatarHoras(horasTotal)} passa da janela segura de ${REGRAS.janelaSeguraHoras} h (ventos do amanhecer e do anoitecer)`);
        for (const [t, km] of Object.entries(riscoPorTipo)) {
            if (km > 0) atencoes.push(`${km.toFixed(1)} km em ${Terreno.NOMES[t].toLowerCase()}`);
        }
    }
    const decisao = bloqueios.length ? "NÃO SAIR" : atencoes.length ? "ATENÇÃO" : "PODE SAIR";

    return {
        distanciaKm, riscoKm, riscoPorTipo, subidaM: Math.round(subidaM), descidaM: Math.round(descidaM), desnivelMaxM,
        variacaoM: altFinal - altInicial, horasIda, horasTotal, horasCaminhada,
        energiaKwh, energiaIdaKwh, o2Gramas, radiacaoMsv, radiacaoIdaMsv,
        usoBateriaPct, usoO2Pct, usoTrajePct, decisao, bloqueios, atencoes,
        destinoGeo: consultarGeologiaNoPonto(wp[wp.length - 1]),
        bloqueada: rota.bloqueada, motivo: rota.motivo, usaRisco: rota.usaRisco
    };
}

function classeRetornoAPe(pct) {
    if (pct > 100) return { texto: "INVIÁVEL", cor: "text-red-400" };
    if (pct > REGRAS.alertaTrajePct) return { texto: "NO LIMITE", cor: "text-amber-300" };
    return { texto: "VIÁVEL", cor: "text-emerald-400" };
}

const ESTILO_DECISAO = {
    "PODE SAIR": "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    "ATENÇÃO": "bg-amber-500/20 text-amber-300 border-amber-500/50",
    "NÃO SAIR": "bg-red-500/20 text-red-300 border-red-500/50"
};

function formatarHoras(h) {
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return mm === 60 ? `${hh + 1}h00` : `${hh}h${String(mm).padStart(2, '0')}`;
}

function setTexto(id, texto, classe) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = texto;
    if (classe) el.className = classe;
}

// Preenche um painel de telemetria (prefixo "mission" ou "route")
function preencherTelemetria(prefixo, st) {
    const b = "font-bold";
    if (st.bloqueada) {
        setTexto(`${prefixo}-dist`, "ROTA INVIÁVEL", `text-red-400 ${b}`);
        ['time', 'elev', 'energy', 'o2', 'walk'].forEach(k => setTexto(`${prefixo}-${k}`, "—", `text-slate-400 ${b}`));
        setTexto(`${prefixo}-risk`, "BLOQUEADA", `text-red-400 ${b}`);
    } else {
        setTexto(`${prefixo}-dist`, `${st.distanciaKm.toFixed(1)} km (ida)`, `text-amber-300 ${b}`);
        setTexto(`${prefixo}-time`, `${formatarHoras(st.horasTotal)} (ida ${formatarHoras(st.horasIda)})`,
            `${st.horasTotal > REGRAS.janelaSeguraHoras ? "text-amber-300" : "text-slate-200"} ${b}`);
        setTexto(`${prefixo}-elev`, `${st.desnivelMaxM.toLocaleString('pt-BR')} m (↑${st.subidaM} · ↓${st.descidaM})`,
            `${st.desnivelMaxM > REGRAS.limiteDesnivelM ? "text-red-400" : "text-slate-200"} ${b}`);
        setTexto(`${prefixo}-risk`, st.riscoKm > 0 ? `${st.riscoKm.toFixed(1)} km` : "Nenhum",
            `${st.riscoKm > 0 ? "text-amber-300" : "text-emerald-400"} ${b} text-right`);
        setTexto(`${prefixo}-energy`, `${st.energiaKwh.toFixed(1)} kWh (${st.usoBateriaPct}%)`,
            `${st.usoBateriaPct > REGRAS.alertaRecursoPct ? "text-red-400" : "text-cyan-300"} ${b}`);
        setTexto(`${prefixo}-o2`, `${st.o2Gramas} g (${st.usoO2Pct}%)`,
            `${st.usoO2Pct > REGRAS.alertaRecursoPct ? "text-red-400" : "text-cyan-300"} ${b}`);
        const ret = classeRetornoAPe(st.usoTrajePct);
        setTexto(`${prefixo}-walk`, `${formatarHoras(st.horasCaminhada)} de ${TRAJE.autonomiaHoras}h · ${ret.texto}`,
            `${ret.cor} ${b} text-right`);
    }
    setTexto(`${prefixo}-decision`, st.decisao,
        `px-2 py-0.5 text-[11px] font-['JetBrains_Mono'] font-bold rounded border ${ESTILO_DECISAO[st.decisao]}`);

    const elAlertas = document.getElementById(`${prefixo}-alerts`);
    if (elAlertas) {
        const itens = st.bloqueios.map(t => `<li class="text-red-300">✕ ${t}</li>`)
            .concat(st.atencoes.map(t => `<li class="text-amber-200">! ${t}</li>`));
        elAlertas.innerHTML = itens.length
            ? itens.join('')
            : `<li class="text-emerald-300">✓ Todas as regras de segurança atendidas</li>`;
    }

    const elRes = document.getElementById(`${prefixo}-resource`);
    if (elRes) {
        const geo = st.destinoGeo;
        elRes.innerText = geo ? `[${geo.code}] ${geo.name} · H₂O ${geo.potencial}` : "Terreno não mapeado";
        elRes.className = `${geo ? CORES_POTENCIAL[geo.potencial] : "text-slate-400"} font-bold text-right`;
    }
}

// ============================================================================
// 9. GEOLOGIA (embutida em data/candor_geologia.js, recortada na área da missão)
// ============================================================================
L.geoJSON(CANDOR_GEOLOGIA, {
    pane: 'geologyPane',
    interactive: false,
    style: (f) => {
        const info = infoUnidade(f.properties.UName);
        const planalto = info.classe === "plateau";
        return {
            stroke: true, color: info.color, weight: planalto ? 1 : 1.5, opacity: planalto ? 0.6 : 0.95,
            fillColor: info.color, fillOpacity: planalto ? 0.12 : 0.35
        };
    },
    onEachFeature: (f, layer) => {
        geologyLayersList.push({ properties: infoUnidade(f.properties.UName), layer, bounds: layer.getBounds() });
    }
}).addTo(geologyGroup);

const dataPacote = TERRENO_META.preparadoEm > CANDOR_GEOLOGIA.preparado_em ? TERRENO_META.preparadoEm : CANDOR_GEOLOGIA.preparado_em;
document.getElementById('data-pack-date').innerText = dataPacote.split('-').reverse().join('/');

function montarLegenda() {
    const corpo = document.getElementById('hydro-legend-body');
    const unidades = [...new Set(geologyLayersList.map(g => g.properties.code.toLowerCase()))];
    const ordem = { ALTO: 0, MODERADO: 1, BAIXO: 2 };
    unidades.sort((a, b) => ordem[geologyCatalog[a].potencial] - ordem[geologyCatalog[b].potencial]);
    corpo.innerHTML = unidades.map(u => {
        const info = geologyCatalog[u];
        return `
            <button type="button" data-unit="${u}" class="unit-row-btn w-full flex items-center justify-between text-xs py-1.5 px-1.5 rounded hover:bg-slate-800/90 transition text-left cursor-pointer">
                <div class="flex items-center gap-2 truncate pr-2">
                    <span class="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/40" style="background:${info.color}"></span>
                    <span class="font-['JetBrains_Mono'] font-bold text-slate-200">${info.code}</span>
                    <span class="text-slate-300 truncate">${info.name}</span>
                </div>
                <span class="font-['JetBrains_Mono'] ${CORES_POTENCIAL[info.potencial]} font-bold shrink-0">${info.potencial}</span>
            </button>`;
    }).join('');
    corpo.querySelectorAll('.unit-row-btn').forEach(btn =>
        btn.addEventListener('click', () => mostrarExplicacaoUnidade(btn.dataset.unit)));
}

function mostrarExplicacaoUnidade(uName) {
    const info = geologyCatalog[uName];
    if (!info) return;
    setTexto('unit-detail-title', `[${info.code}] ${info.name}`);
    setTexto('unit-detail-mineral',
        `Nome na carta: ${info.original}${info.confirmado ? '' : ' (interpretação da equipe)'} · H₂O ${info.potencial}`);
    setTexto('unit-detail-desc', info.desc);
    setTexto('unit-detail-extract', `Uso na missão: ${info.uso}`);
    document.getElementById('unit-detail-box').classList.remove('hidden');
}

document.getElementById('close-unit-detail')?.addEventListener('click', () =>
    document.getElementById('unit-detail-box').classList.add('hidden'));

// ============================================================================
// 10. ESCOLHA AUTOMÁTICA DO POUSO E DO ALVO DE ÁGUA
// Pousa no fundo do cânion (CF), em terreno seguro e a pelo menos 5 km de qualquer
// declividade alta, e escolhe o depósito em camadas (LC) mais próximo com rota segura.
// ============================================================================
function escolherPousoEAlvo() {
    const passoAmostra = 20; // células de 100 m → amostra a cada 2 km
    const pousos = [], alvos = [];
    for (let r = 0; r < Terreno.linhas; r += passoAmostra) {
        for (let c = 0; c < Terreno.colunas; c += passoAmostra) {
            const id = r * Terreno.colunas + c;
            if (Terreno.tipo[id] !== Terreno.SEGURA) continue;
            const pt = Terreno.centro(id);
            const geo = consultarGeologiaNoPonto(pt);
            if (!geo) continue;
            if (geo.code === "CF") {
                const folga = Terreno.distanciaAteBloqueioKm(id);
                if (folga >= DISTANCIA_SEGURA_PAREDE_KM) pousos.push({ pt, folga });
            } else if (geo.code === "LC" && Terreno.distanciaAteBloqueioKm(id) >= 1) {
                alvos.push(pt);
            }
        }
    }

    const pares = [];
    for (const p of pousos) {
        for (const a of alvos) {
            const d = distanciaMarteKm(p.pt, a);
            if (d >= 3) pares.push({ pouso: p.pt, folga: p.folga, alvo: a, d });
        }
    }
    pares.sort((x, y) => x.d - y.d);

    let reserva = null;
    for (const par of pares.slice(0, 12)) {
        const rota = calcularRota(par.pouso, par.alvo);
        if (rota.bloqueada) continue;
        const resultado = { ...par, rota, automatico: true, candidatos: pousos.length };
        if (!rota.usaRisco) return resultado;
        reserva = reserva || resultado;
    }
    if (reserva) return reserva;

    const pouso = L.latLng(-6.0, -76.6), alvo = L.latLng(-6.1, -76.3);
    return { pouso, alvo, folga: null, rota: calcularRota(pouso, alvo), automatico: false };
}

// ============================================================================
// 11. MISSÃO OFICIAL
// ============================================================================
let missaoRota = null;
let missaoPassos = [];  // índices da rota usados na animação
let missaoAtivaStats = null;
let missaoAtual = null;

function iniciarMissao() {
    montarLegenda();

    const m = escolherPousoEAlvo();
    missaoAtual = m;
    missaoRota = m.rota;
    missaoAtivaStats = analisarTrajetoria(m.rota);

    const n = m.rota.waypoints.length;
    const nPassos = Math.min(40, n - 1);
    missaoPassos = Array.from({ length: nPassos + 1 }, (_, i) => Math.round(i * (n - 1) / Math.max(1, nPassos)));

    MISSION_CENTER.lat = m.pouso.lat;
    MISSION_CENTER.lon = m.pouso.lng;
    VIEWS.local.center = [m.pouso.lat, m.pouso.lng];

    const geoPouso = consultarGeologiaNoPonto(m.pouso);
    const geoAlvo = consultarGeologiaNoPonto(m.alvo);
    const setor = identificarSetorMarte(m.pouso.lat, m.pouso.lng);
    const altPouso = getElevacaoEstimada(m.pouso, geoPouso);

    setTexto('mission-landing-unit', `${setor} · ${geoPouso ? geoPouso.code : '—'}`);
    setTexto('mission-target-unit', geoAlvo ? `${geoAlvo.name} (${geoAlvo.code})` : 'Terreno não mapeado');
    preencherTelemetria('mission', missaoAtivaStats);

    const textoPouso = m.automatico
        ? `<b>${setor}, unidade ${geoPouso.code} (${geoPouso.name})</b>. Escolhido automaticamente entre ${m.candidatos} pontos do fundo do cânion em terreno seguro. Fica a <b>${m.folga.toFixed(1)} km</b> da área de declividade alta mais próxima (mínimo exigido: ${DISTANCIA_SEGURA_PAREDE_KM} km). Altitude estimada: <b>${altPouso.toLocaleString('pt-BR')} m</b>; quanto mais baixo, mais atmosfera acima da nave para frear no pouso e para proteger da radiação.`
        : `A busca automática não encontrou um ponto do fundo do cânion com ${DISTANCIA_SEGURA_PAREDE_KM} km de folga e rota até um depósito em camadas. Usando ponto padrão.`;
    const textoAlvo = geoAlvo
        ? `<b>${geoAlvo.name} (${geoAlvo.code})</b>: ${geoAlvo.desc} Potencial de água: <b>${geoAlvo.potencial}</b>. É o depósito desse tipo mais próximo do pouso com rota ${missaoAtivaStats.usaRisco ? 'possível (passa por declividade média)' : 'inteiramente em terreno seguro'}.`
        : `Alvo fora das unidades mapeadas.`;
    document.getElementById('diag-landing-text').innerHTML = textoPouso;
    document.getElementById('diag-water-text').innerHTML = textoAlvo;

    L.polyline(m.rota.waypoints, {
        pane: 'missionOverlayPane',
        ...estiloRota(m.rota),
        weight: 3.5, interactive: false
    }).addTo(targetsGroup);

    L.circleMarker(m.pouso, {
        pane: 'missionOverlayPane', radius: 11, fillColor: "#ef4444", color: "#ffffff", weight: 3, fillOpacity: 1
    }).bindPopup(`
        <div class="font-sans max-w-xs">
            <span class="text-[10px] uppercase font-bold text-red-400">Base de pouso · ${setor}</span>
            <h3 class="font-bold text-sm mt-0.5">${geoPouso ? geoPouso.name : 'Ponto padrão'}</h3>
            <div class="text-xs font-mono text-cyan-300 mt-1">Lat ${m.pouso.lat.toFixed(3)}° · Lon ${m.pouso.lng.toFixed(3)}° · Alt. est. ${altPouso} m</div>
            <p class="text-xs text-slate-300 mt-1.5">Distância até o alvo de água pela rota: <b>${missaoAtivaStats.distanciaKm.toFixed(1)} km</b>.</p>
        </div>`).addTo(targetsGroup);

    L.circleMarker(m.alvo, {
        pane: 'missionOverlayPane', radius: 9, fillColor: "#06b6d4", color: "#ffffff", weight: 2.5, fillOpacity: 1
    }).bindPopup(`
        <div class="font-sans max-w-xs">
            <span class="text-[10px] uppercase font-bold text-cyan-400">Alvo de água · ${setor}</span>
            <h3 class="font-bold text-sm mt-0.5">${geoAlvo ? geoAlvo.name : 'Alvo'}</h3>
            <div class="text-xs font-mono text-cyan-300 mt-1">Lat ${m.alvo.lat.toFixed(3)}° · Lon ${m.alvo.lng.toFixed(3)}°</div>
            <p class="text-xs text-slate-300 mt-1.5">${geoAlvo ? geoAlvo.uso : ''}</p>
        </div>`).addTo(targetsGroup);

    inicializarAstronauta();
    map.flyTo(m.pouso, 10, { duration: 1.2 });
}

// ============================================================================
// 12. CAMADA DE TEMPERATURA ESTIMADA (calculada pelo modelo, não é dado de satélite)
// ============================================================================
const thermalLayer = L.gridLayer({ pane: 'thermalPane', tileSize: 256, updateWhenZooming: false, bounds: Terreno.limites });

thermalLayer.createTile = function (coords, done) {
    const tile = document.createElement('canvas');
    const tam = this.options.tileSize, cel = 16, amostra = tam / cel;
    tile.width = tam; tile.height = tam;
    const ctx = tile.getContext('2d');
    const cAmostra = document.createElement('canvas');
    cAmostra.width = amostra; cAmostra.height = amostra;
    const ctxA = cAmostra.getContext('2d');
    const paradas = [
        { t: -60, c: [37, 99, 235] }, { t: -40, c: [6, 182, 212] },
        { t: -25, c: [250, 204, 21] }, { t: -5, c: [239, 68, 68] }
    ];
    for (let y = 0; y < tam; y += cel) {
        for (let x = 0; x < tam; x += cel) {
            const ll = map.unproject(L.point(coords.x * tam + x + cel / 2, coords.y * tam + y + cel / 2), coords.z);
            if (!Terreno.limites.contains(ll)) continue;
            const temp = calcularAmbienteMarte(getElevacaoEstimada(ll), ll.lat).tempC;
            const tb = Math.max(paradas[0].t, Math.min(paradas[3].t, temp));
            let lo = paradas[0], hi = paradas[3];
            for (let i = 0; i < paradas.length - 1; i++) {
                if (tb <= paradas[i + 1].t) { lo = paradas[i]; hi = paradas[i + 1]; break; }
            }
            const r = (tb - lo.t) / (hi.t - lo.t || 1);
            const cor = lo.c.map((v, i) => Math.round(v + (hi.c[i] - v) * r));
            ctxA.fillStyle = `rgba(${cor[0]}, ${cor[1]}, ${cor[2]}, 0.5)`;
            ctxA.fillRect(x / cel, y / cel, 1, 1);
        }
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cAmostra, 0, 0, tam, tam);
    requestAnimationFrame(() => done(null, tile));
    return tile;
};

// ============================================================================
// 13. SIMULAÇÃO DA TRAVESSIA
// ============================================================================
let astroMarker = null, astroStepIndex = 0, astroTimer = null;

function inicializarAstronauta() {
    if (!missaoRota) return;
    if (astroMarker) map.removeLayer(astroMarker);
    const icone = L.divIcon({
        className: 'astro-hud-marker',
        html: `<div style="width:28px;height:28px;background:#0f172a;border:2px solid #facc15;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 12px #facc15;">🧑‍🚀</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14]
    });
    astroStepIndex = 0;
    astroMarker = L.marker(missaoRota.waypoints[0], { icon: icone, zIndexOffset: 1000 }).addTo(map);
    atualizarTelemetriaAstronauta();
}

function atualizarTelemetriaAstronauta() {
    if (!missaoRota || !astroMarker) return;
    const k = missaoPassos[astroStepIndex];
    const pos = missaoRota.waypoints[k];
    astroMarker.setLatLng(pos);

    const parcial = analisarTrajetoria({
        waypoints: missaoRota.waypoints.slice(0, k + 1).concat(k === 0 ? [pos] : []),
        ids: (missaoRota.ids || []).slice(0, k + 1).concat(k === 0 && missaoRota.ids?.length ? [missaoRota.ids[0]] : []),
        bloqueada: false, usaRisco: false
    });
    const alt = getElevacaoEstimada(pos);
    const amb = calcularAmbienteMarte(alt, pos.lat);
    const total = missaoPassos.length - 1;
    const pct = total > 0 ? Math.round((astroStepIndex / total) * 100) : 0;
    // Durante a simulação da ida, conta só o que já foi gasto até este ponto
    const o2Gasto = Math.round(parcial.horasIda * TRIPULACAO.pessoas * TRIPULACAO.o2GramasPorPessoaHora);
    const o2Restante = Math.max(0, TRIPULACAO.reservaO2Gramas - o2Gasto);
    const kwhRestante = Math.max(0, ROVER.bateriaKwh - parcial.energiaIdaKwh);

    setTexto('astro-progress-pct', `${pct}% (${parcial.distanciaKm.toFixed(1)} km)`);
    document.getElementById('astro-progress-bar').style.width = `${pct}%`;
    setTexto('astro-o2', `${o2Restante} g (${Math.round(o2Restante / TRIPULACAO.reservaO2Gramas * 100)}%)`);
    setTexto('astro-battery', `${kwhRestante.toFixed(1)} kWh`);
    setTexto('astro-alt', `${alt.toLocaleString('pt-BR')} m`);
    setTexto('astro-pressure', `${amb.pressaoPa} Pa`);
    setTexto('astro-temp', `${amb.tempC}°C`);
    setTexto('astro-rad', `${parcial.radiacaoIdaMsv.toFixed(3)} mSv`);
}

const btnAstroPlay = document.getElementById('btn-astro-play');
function alternarSimulacao() {
    if (astroTimer) {
        clearInterval(astroTimer); astroTimer = null;
        btnAstroPlay.innerText = "▶ Iniciar";
        return;
    }
    if (astroStepIndex >= missaoPassos.length - 1) astroStepIndex = 0;
    btnAstroPlay.innerText = "⏸ Pausar";
    astroTimer = setInterval(() => {
        if (astroStepIndex < missaoPassos.length - 1) {
            astroStepIndex++;
            atualizarTelemetriaAstronauta();
        } else {
            clearInterval(astroTimer); astroTimer = null;
            btnAstroPlay.innerText = "▶ Iniciar";
        }
    }, 400);
}
btnAstroPlay.addEventListener('click', alternarSimulacao);

document.getElementById('btn-astro-step').addEventListener('click', () => {
    if (astroStepIndex < missaoPassos.length - 1) { astroStepIndex++; atualizarTelemetriaAstronauta(); }
});

document.getElementById('btn-astro-reset').addEventListener('click', () => {
    if (astroTimer) { clearInterval(astroTimer); astroTimer = null; btnAstroPlay.innerText = "▶ Iniciar"; }
    astroStepIndex = 0;
    atualizarTelemetriaAstronauta();
});

// ============================================================================
// 14. CONTROLES DA BARRA LATERAL
// ============================================================================
const btnGlobal = document.getElementById('btn-view-global');
const btnArea = document.getElementById('btn-view-area');
const btnLocal = document.getElementById('btn-view-local');
const ATIVO = "px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold transition";
const INATIVO = "px-3 py-1.5 rounded text-slate-400 hover:text-white transition";

function irPara(view, botao) {
    map.flyTo(view.center, view.zoom, { duration: 1.2 });
    [btnGlobal, btnArea, btnLocal].forEach(b => b.className = b === botao ? ATIVO : INATIVO);
}
btnGlobal.addEventListener('click', () => irPara(VIEWS.global, btnGlobal));
btnArea.addEventListener('click', () => irPara(VIEWS.area, btnArea));
btnLocal.addEventListener('click', () => irPara(VIEWS.local, btnLocal));

document.getElementById('toggle-slope').addEventListener('change', (e) => {
    if (e.target.checked) map.addLayer(camadaDeclividade); else map.removeLayer(camadaDeclividade);
});

document.getElementById('toggle-hydro').addEventListener('change', (e) => {
    const legenda = document.getElementById('hydro-legend');
    if (e.target.checked) { map.addLayer(geologyGroup); legenda.style.display = 'block'; }
    else { map.removeLayer(geologyGroup); legenda.style.display = 'none'; }
});

document.getElementById('toggle-targets').addEventListener('change', (e) => {
    if (e.target.checked) { map.addLayer(targetsGroup); if (astroMarker) map.addLayer(astroMarker); }
    else { map.removeLayer(targetsGroup); if (astroMarker) map.removeLayer(astroMarker); }
});

document.getElementById('toggle-thermal').addEventListener('change', (e) => {
    const legenda = document.getElementById('thermal-legend');
    if (e.target.checked) { map.addLayer(thermalLayer); legenda.classList.remove('hidden'); }
    else { map.removeLayer(thermalLayer); legenda.classList.add('hidden'); }
});

let mosaicoOnline = null;
document.querySelectorAll('input[name="baseLayer"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
        if (mosaicoOnline) { map.removeLayer(mosaicoOnline); mosaicoOnline = null; }
        const valor = e.target.value;
        if (valor === 'imagem') { imagemReal.setOpacity(1); return; }
        imagemReal.setOpacity(0.35);
        mosaicoOnline = nasaLayers[valor];
        map.addLayer(mosaicoOnline);
        mosaicoOnline.bringToBack();
    });
});

// ============================================================================
// 15. INSPEÇÃO DO TERRENO E ROTA DE TESTE
// ============================================================================
let modoRotaTeste = false;
let routePoints = [], routeLine = null, routeMarkers = [];

const testRoutePanel = document.getElementById('test-route-panel');
const testRouteBadge = document.getElementById('test-route-badge');

function alternarRotaTeste() {
    modoRotaTeste = !modoRotaTeste;
    if (modoRotaTeste) {
        testRoutePanel.classList.remove('hidden');
        testRouteBadge.innerText = "CLIQUE EM 2 PONTOS";
        testRouteBadge.className = "text-[10px] font-['JetBrains_Mono'] text-cyan-300 font-bold";
    } else {
        testRoutePanel.classList.add('hidden');
        testRouteBadge.innerText = routeLine ? "ROTA SALVA" : "FECHADO";
        testRouteBadge.className = "text-[10px] font-['JetBrains_Mono'] text-slate-400";
    }
}
document.getElementById('toggle-test-route-btn').addEventListener('click', alternarRotaTeste);

function inspecionarTerreno(latlng) {
    const geo = consultarGeologiaNoPonto(latlng);
    const alt = getElevacaoEstimada(latlng, geo);
    const amb = calcularAmbienteMarte(alt, latlng.lat);
    const tipo = Terreno.tipoEm(latlng);
    const distBase = distanciaMarteKm(latlng, centroDaMissao()).toFixed(1);
    const titulo = geo ? `[${geo.code}] ${geo.name}` : "Terreno não mapeado";
    const linhaDecl = tipo === null
        ? `<span class="text-slate-400">Fora da área com dados de terreno</span>`
        : `Terreno para a rota: <b class="${Terreno.CORES[tipo].texto}">${Terreno.NOMES[tipo]}</b>`;
    const corpo = geo
        ? `${geo.desc}<br><b>Potencial de água:</b> ${geo.potencial}`
        : `Fora das unidades da carta geológica carregada.`;
    L.popup().setLatLng(latlng).setContent(`
        <div class="font-sans max-w-xs">
            <span class="text-[10px] uppercase font-bold text-amber-400">Inspeção · ${identificarSetorMarte(latlng.lat, latlng.lng)}</span>
            <h3 class="font-bold text-sm mt-0.5 text-white">${titulo}</h3>
            <div class="text-xs mt-1">${linhaDecl}</div>
            <div class="text-xs font-mono text-cyan-300 mt-1">Lat ${latlng.lat.toFixed(3)}° · Lon ${latlng.lng.toFixed(3)}° · Alt. est. ${alt} m</div>
            <div class="text-[11px] font-mono text-emerald-300 mt-0.5">Pressão ~${amb.pressaoPa} Pa · Temp. ~${amb.tempC}°C · Base a ${distBase} km</div>
            <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">${corpo}</p>
        </div>`).openOn(map);
}

function adicionarPontoDeRota(latlng) {
    if (routePoints.length >= 2) clearRoute();
    routePoints.push(latlng);
    routeMarkers.push(L.circleMarker(latlng, {
        pane: 'missionOverlayPane', radius: 5, fillColor: '#f8fafc', color: '#0284c7', weight: 2, fillOpacity: 1
    }).addTo(map));
    if (routePoints.length < 2) return;

    setTexto('route-dist', 'Calculando…', 'text-slate-400 font-bold');
    setTimeout(() => {
        const rota = calcularRota(routePoints[0], routePoints[1]);
        const st = analisarTrajetoria(rota);
        routeLine = L.polyline(rota.waypoints, {
            pane: 'missionOverlayPane', weight: 3.5,
            ...estiloRota(rota)
        }).addTo(map);
        if (st.bloqueada) {
            routeLine.bindPopup(`
                <div class="font-sans text-xs">
                    <div class="font-bold text-red-400 uppercase">⚠ Travessia bloqueada</div>
                    <p class="text-slate-300 mt-1">${st.motivo}.</p>
                </div>`).openPopup();
        }
        preencherTelemetria('route', st);
    }, 30);
}

map.on('click', (e) => {
    if (modoRotaTeste) adicionarPontoDeRota(e.latlng);
    else inspecionarTerreno(e.latlng);
});

function clearRoute() {
    routePoints = [];
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    routeMarkers.forEach(m => map.removeLayer(m));
    routeMarkers = [];
    ['dist', 'time', 'elev', 'risk', 'energy', 'o2', 'walk', 'resource'].forEach(k =>
        setTexto(`route-${k}`, "—", "text-slate-400 font-bold text-right"));
    const alertas = document.getElementById('route-alerts');
    if (alertas) alertas.innerHTML = '';
    setTexto('route-decision', "—", "text-[11px] font-['JetBrains_Mono'] text-slate-400");
}
document.getElementById('clear-route').addEventListener('click', clearRoute);

// ============================================================================
// 16. HUD DE COORDENADAS
// ============================================================================
map.on('mousemove', (e) => {
    const { lat, lng } = e.latlng;
    const alt = getElevacaoEstimada(e.latlng);
    const tipo = Terreno.tipoEm(e.latlng);
    const dist = distanciaMarteKm(e.latlng, centroDaMissao()).toFixed(1);
    const decl = tipo === null ? '' :
        ` · <span class="${Terreno.CORES[tipo].texto}">${Terreno.NOMES[tipo].toUpperCase()}</span>`;
    document.getElementById('coords-display').innerHTML =
        `LAT ${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} · LON ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'} · <span class="text-amber-400 font-bold">ALT. EST. ${alt.toLocaleString('pt-BR')} m</span>${decl} · <span class="text-cyan-300">BASE ${dist} km</span>`;
});

// ============================================================================
// 17. DIAGNÓSTICO E ATALHOS DE TECLADO
// ============================================================================
const diagCard = document.getElementById('mission-diagnosis-card');
document.getElementById('toggle-diagnosis-btn').addEventListener('click', (e) => {
    e.stopPropagation(); diagCard.classList.toggle('hidden');
});
document.getElementById('close-diagnosis-btn').addEventListener('click', (e) => {
    e.stopPropagation(); diagCard.classList.add('hidden');
});

window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('button, input, textarea, select, a, [contenteditable], dialog')) return;
    if (e.key === '?') { e.preventDefault(); abrirAjudaTeclado(); return; }
    if (e.key === 'Escape') {
        if (!diagCard.classList.contains('hidden')) {
            diagCard.classList.add('hidden');
            document.getElementById('toggle-diagnosis-btn').focus();
        }
        map.closePopup();
        return;
    }
    if (e.key.startsWith('Arrow') && e.target !== map.getContainer()) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    const k = e.key.toLowerCase();
    const passo = 140;
    if (k === 'w' || e.key === 'ArrowUp') map.panBy([0, -passo], { animate: true, duration: 0.25 });
    else if (k === 's' || e.key === 'ArrowDown') map.panBy([0, passo], { animate: true, duration: 0.25 });
    else if (k === 'a' || e.key === 'ArrowLeft') map.panBy([-passo, 0], { animate: true, duration: 0.25 });
    else if (k === 'd' || e.key === 'ArrowRight') map.panBy([passo, 0], { animate: true, duration: 0.25 });
    else if (k === '+' || k === '=') map.zoomIn();
    else if (k === '-') map.zoomOut();
    else if (k === 'g') btnGlobal.click();
    else if (k === 'f') btnArea.click();
    else if (k === 'l' || k === 'c' || e.key === 'Home') btnLocal.click();
    else if (k === '1' && missaoAtual) map.flyTo(missaoAtual.pouso, 12, { duration: 0.8 });
    else if (k === '2' && missaoAtual) map.flyTo(missaoAtual.alvo, 12, { duration: 0.8 });
    else if (k === 'p') alternarSimulacao();
    else if (k === 'm') alternarRotaTeste();
    else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (modoRotaTeste) adicionarPontoDeRota(map.getCenter());
        else inspecionarTerreno(map.getCenter());
    }
    else if (k === 'v') document.getElementById('toggle-slope').click();
    else if (k === 'h') document.getElementById('toggle-hydro').click();
    else if (k === 'i') document.getElementById('toggle-targets').click();
    else if (k === 't') document.getElementById('toggle-thermal').click();
    else if (k === 'x') clearRoute();
});

// ============================================================================
// INÍCIO
// ============================================================================
setTexto('leg-media', `${RISCOS_TERRENO.declividadeMedia.nome} (${RISCOS_TERRENO.declividadeMedia.custo}×)`);
setTexto('leg-desab', `${RISCOS_TERRENO.zonaDesabamento.nome} (${RISCOS_TERRENO.zonaDesabamento.custo}×)`);
setTexto('leg-caot', `${RISCOS_TERRENO.terrenoCaotico.nome} (${RISCOS_TERRENO.terrenoCaotico.custo}×)`);
iniciarMissao();

const ajudaTeclado = document.getElementById('keyboard-dialog');
let focoAntesDaAjuda = null;
function abrirAjudaTeclado() {
    focoAntesDaAjuda = document.activeElement;
    ajudaTeclado.showModal();
}
document.getElementById('keyboard-help').addEventListener('click', abrirAjudaTeclado);
document.getElementById('close-keyboard').addEventListener('click', () => ajudaTeclado.close());
ajudaTeclado.addEventListener('close', () => focoAntesDaAjuda?.focus());
const botaoDiagnostico = document.getElementById('toggle-diagnosis-btn');
botaoDiagnostico.setAttribute('aria-controls', 'mission-diagnosis-card');
function sincronizarPaineis() {
    botaoDiagnostico.setAttribute('aria-expanded', String(!diagCard.classList.contains('hidden')));
    document.getElementById('toggle-test-route-btn').setAttribute('aria-expanded', String(modoRotaTeste));
    testRouteBadge.textContent = modoRotaTeste ? 'SELECIONE 2 PONTOS' : (routeLine ? 'ROTA SALVA' : 'FECHADO');
}
new MutationObserver(sincronizarPaineis).observe(diagCard, { attributes: true, attributeFilter: ['class'] });
new MutationObserver(sincronizarPaineis).observe(testRoutePanel, { attributes: true, attributeFilter: ['class'] });
document.getElementById('toggle-test-route-btn').setAttribute('aria-controls', 'test-route-panel');
document.getElementById('close-diagnosis-btn').addEventListener('click', () => botaoDiagnostico.focus());
map.on('moveend', () => map.fire('mousemove', { latlng: map.getCenter() }));
sincronizarPaineis();
