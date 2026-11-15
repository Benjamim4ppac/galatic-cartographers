// ============================================================================
// TERRENO REAL E RESTRIÇÕES DE ROTA
// Base: declividade do QGIS (pipeline do Yoshida) — data/terreno.js
//   1 = segura · 2 = declividade média · 0 = declividade alta (bloqueada)
// Camadas de restrição somadas aqui, célula a célula (100 m):
//   3 = zona de desabamento (faixa junto às paredes: deslizamentos, queda de rochas, sismos)
//   4 = terreno caótico (unidade CHT da carta USGS)
// Linha 0 = sul; id = linha * colunas + coluna.
// ============================================================================
const Terreno = (() => {
    const { linhas, colunas, passo, boundsGraus, bordaBloqueadaCelulas: borda } = TERRENO_META;
    const [[sul, oeste], [norte, leste]] = boundsGraus;
    const total = linhas * colunas;
    const GRAU_M = 3396190 * Math.PI / 180; // metros por grau em Marte
    const BLOQUEADA = 0, SEGURA = 1, DECLIVIDADE_MEDIA = 2, DESABAMENTO = 3, CAOTICO = 4;

    // 1. Declividade do QGIS (4 células por byte)
    const bin = atob(TERRENO_B64);
    const declividade = new Uint8Array(total);
    for (let i = 0; i < total; i++) declividade[i] = (bin.charCodeAt(i >> 2) >> ((i & 3) * 2)) & 3;

    const naBorda = (id) => {
        const r = Math.floor(id / colunas), c = id % colunas;
        return r < borda || c < borda || r >= linhas - borda || c >= colunas - borda;
    };

    // Distância em células (passos em cruz, conservador) até as células-semente
    function distanciaAte(ehSemente) {
        const dist = new Uint16Array(total).fill(65535);
        const fila = new Int32Array(total);
        let ini = 0, fim = 0;
        for (let i = 0; i < total; i++) if (ehSemente(i)) { dist[i] = 0; fila[fim++] = i; }
        while (ini < fim) {
            const id = fila[ini++], r = Math.floor(id / colunas), c = id % colunas, d = dist[id] + 1;
            if (r > 0 && dist[id - colunas] > d) { dist[id - colunas] = d; fila[fim++] = id - colunas; }
            if (r < linhas - 1 && dist[id + colunas] > d) { dist[id + colunas] = d; fila[fim++] = id + colunas; }
            if (c > 0 && dist[id - 1] > d) { dist[id - 1] = d; fila[fim++] = id - 1; }
            if (c < colunas - 1 && dist[id + 1] > d) { dist[id + 1] = d; fila[fim++] = id + 1; }
        }
        return dist;
    }

    // Para o pouso: distância até qualquer bloqueio (inclui a borda, por segurança)
    const distBloqueio = distanciaAte(i => declividade[i] === BLOQUEADA);
    // Para a zona de desabamento: só paredes reais (a borda do mapa não é parede)
    const distParede = distanciaAte(i => declividade[i] === BLOQUEADA && !naBorda(i));

    // 2. Terreno caótico: rasteriza os polígonos CHT da geologia na mesma grade
    function mascaraGeologia(unidade) {
        const canvas = document.createElement('canvas');
        canvas.width = colunas; canvas.height = linhas;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        const px = ([lon, lat]) => [(lon - oeste) * GRAU_M / passo, (norte - lat) * GRAU_M / passo];
        for (const f of CANDOR_GEOLOGIA.features) {
            if (f.properties.UName !== unidade) continue;
            const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
            for (const poly of polys) {
                ctx.beginPath();
                for (const anel of poly) anel.forEach((p, k) => { const [x, y] = px(p); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
                ctx.fill('evenodd');
            }
        }
        const dados = ctx.getImageData(0, 0, colunas, linhas).data;
        const mascara = new Uint8Array(total);
        for (let y = 0; y < linhas; y++) for (let c = 0; c < colunas; c++) {
            if (dados[(y * colunas + c) * 4 + 3] > 127) mascara[(linhas - 1 - y) * colunas + c] = 1;
        }
        return mascara;
    }
    const caotico = mascaraGeologia('cht');

    // 3. Tipo final de cada célula (o pior risco vence; bloqueio vence tudo)
    const faixaDesabamento = Math.round(RISCOS_TERRENO.zonaDesabamento.faixaM / passo);
    const tipo = new Uint8Array(total);
    const contagem = [0, 0, 0, 0, 0];
    for (let i = 0; i < total; i++) {
        let t;
        if (declividade[i] === BLOQUEADA) t = BLOQUEADA;
        else if (declividade[i] === DECLIVIDADE_MEDIA) t = DECLIVIDADE_MEDIA;
        else if (caotico[i]) t = CAOTICO;
        else if (distParede[i] <= faixaDesabamento) t = DESABAMENTO;
        else t = SEGURA;
        tipo[i] = t;
        contagem[t]++;
    }

    const CUSTO = new Float32Array(5);
    CUSTO[SEGURA] = 1;
    CUSTO[DECLIVIDADE_MEDIA] = RISCOS_TERRENO.declividadeMedia.custo;
    CUSTO[DESABAMENTO] = RISCOS_TERRENO.zonaDesabamento.custo;
    CUSTO[CAOTICO] = RISCOS_TERRENO.terrenoCaotico.custo;

    const NOMES = {
        [BLOQUEADA]: "Declividade alta (bloqueada)",
        [SEGURA]: "Segura",
        [DECLIVIDADE_MEDIA]: RISCOS_TERRENO.declividadeMedia.nome,
        [DESABAMENTO]: RISCOS_TERRENO.zonaDesabamento.nome,
        [CAOTICO]: RISCOS_TERRENO.terrenoCaotico.nome
    };
    const CORES = { // [r, g, b, alfa] na camada do mapa; texto no painel
        [BLOQUEADA]: { rgba: [147, 51, 234, 185], texto: "text-purple-300" },
        [SEGURA]: { rgba: null, texto: "text-emerald-300" },
        [DECLIVIDADE_MEDIA]: { rgba: [244, 114, 182, 150], texto: "text-pink-300" },
        [DESABAMENTO]: { rgba: [251, 146, 60, 120], texto: "text-orange-300" },
        [CAOTICO]: { rgba: [250, 204, 21, 110], texto: "text-yellow-300" }
    };

    function idEm(latlng) {
        const c = Math.floor((latlng.lng - oeste) * GRAU_M / passo);
        const r = Math.floor((latlng.lat - sul) * GRAU_M / passo);
        if (r < 0 || c < 0 || r >= linhas || c >= colunas) return -1;
        return r * colunas + c;
    }

    function centro(id) {
        const r = Math.floor(id / colunas), c = id % colunas;
        return L.latLng(sul + ((r + 0.5) * passo) / GRAU_M, oeste + ((c + 0.5) * passo) / GRAU_M);
    }

    function tipoEm(latlng) {
        const id = idEm(latlng);
        return id < 0 ? null : tipo[id];
    }

    const distanciaAteBloqueioKm = (id) => distBloqueio[id] * passo / 1000;

    // ------------------------------------------------------------------------
    // A* na grade de 100 m (8 vizinhos, sem cortar cantos não permitidos).
    // Primeiro busca apenas células seguras; só admite risco se não houver rota segura.
    // Custo do passo = distância × média dos custos das duas células.
    // Heurística: distância octil × custo mínimo (1) → sempre acha a rota de menor custo.
    // ------------------------------------------------------------------------
    const g = new Float32Array(total).fill(Infinity);
    const anterior = new Int32Array(total).fill(-1);
    const fechado = new Uint8Array(total);
    const tocados = [];
    const VIZ = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

    function limpar() {
        for (const id of tocados) { g[id] = Infinity; anterior[id] = -1; fechado[id] = 0; }
        tocados.length = 0;
    }

    function criarHeap() {
        const ids = [], fs = [];
        return {
            get tamanho() { return ids.length; },
            push(id, f) {
                let i = ids.length; ids.push(id); fs.push(f);
                while (i > 0) {
                    const p = (i - 1) >> 1;
                    if (fs[p] <= f) break;
                    ids[i] = ids[p]; fs[i] = fs[p]; i = p;
                }
                ids[i] = id; fs[i] = f;
            },
            pop() {
                const topo = ids[0], ultId = ids.pop(), ultF = fs.pop();
                if (ids.length) {
                    let i = 0;
                    while (true) {
                        let c = 2 * i + 1;
                        if (c >= ids.length) break;
                        if (c + 1 < ids.length && fs[c + 1] < fs[c]) c++;
                        if (fs[c] >= ultF) break;
                        ids[i] = ids[c]; fs[i] = fs[c]; i = c;
                    }
                    ids[i] = ultId; fs[i] = ultF;
                }
                return topo;
            }
        };
    }

    function rota(origemLatLng, destinoLatLng) {
        const a = idEm(origemLatLng), b = idEm(destinoLatLng);
        if (a < 0 || b < 0) return { ids: [], motivo: "Ponto fora da área com dados de terreno" };
        if (tipo[a] === BLOQUEADA) return { ids: [], motivo: "A origem está em declividade alta (bloqueada)" };
        if (tipo[b] === BLOQUEADA) return { ids: [], motivo: "O destino está em declividade alta (bloqueada)" };

        const segura = buscarRota(a, b, false);
        return segura.ids.length ? segura : buscarRota(a, b, true);
    }

    function buscarRota(a, b, permitirRisco) {
        const permitida = (id) => tipo[id] !== BLOQUEADA && (permitirRisco || tipo[id] === SEGURA);
        if (!permitida(a) || !permitida(b)) return { ids: [] };
        limpar();
        const rb = Math.floor(b / colunas), cb = b % colunas;
        const h = (id) => {
            const dr = Math.abs(Math.floor(id / colunas) - rb), dc = Math.abs(id % colunas - cb);
            return passo * (Math.max(dr, dc) + (Math.SQRT2 - 1) * Math.min(dr, dc));
        };
        const heap = criarHeap();
        g[a] = 0; tocados.push(a); heap.push(a, h(a));

        while (heap.tamanho) {
            const id = heap.pop();
            if (fechado[id]) continue;
            fechado[id] = 1;
            if (id === b) break;
            const r = Math.floor(id / colunas), c = id % colunas, cA = CUSTO[tipo[id]];
            for (const [dr, dc, mult] of VIZ) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nc < 0 || nr >= linhas || nc >= colunas) continue;
                const n = nr * colunas + nc;
                if (!permitida(n) || fechado[n]) continue;
                if (dr && dc && (!permitida(r * colunas + nc) || !permitida(nr * colunas + c))) continue;
                const novo = g[id] + passo * mult * (cA + CUSTO[tipo[n]]) / 2;
                if (novo < g[n]) {
                    if (g[n] === Infinity) tocados.push(n);
                    g[n] = novo; anterior[n] = id;
                    heap.push(n, novo + h(n));
                }
            }
        }

        if (!fechado[b]) return { ids: [], motivo: "Não existe caminho sem cruzar declividade alta" };
        const ids = [b];
        while (ids[ids.length - 1] !== a) ids.push(anterior[ids[ids.length - 1]]);
        ids.reverse();
        return { ids, usaRisco: ids.some(id => tipo[id] !== SEGURA) };
    }

    // Imagem colorida das restrições para sobrepor ao mapa (segura fica transparente)
    function imagemRestricoes() {
        const canvas = document.createElement('canvas');
        canvas.width = colunas; canvas.height = linhas;
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(colunas, linhas);
        for (let r = 0; r < linhas; r++) {
            for (let c = 0; c < colunas; c++) {
                const cor = CORES[tipo[r * colunas + c]].rgba;
                if (!cor) continue;
                const p = ((linhas - 1 - r) * colunas + c) * 4; // a imagem começa no norte
                img.data[p] = cor[0]; img.data[p + 1] = cor[1]; img.data[p + 2] = cor[2]; img.data[p + 3] = cor[3];
            }
        }
        ctx.putImageData(img, 0, 0);
        return canvas.toDataURL('image/png');
    }

    return {
        linhas, colunas, passo, tipo, contagem, NOMES, CORES, CUSTO,
        BLOQUEADA, SEGURA, DECLIVIDADE_MEDIA, DESABAMENTO, CAOTICO,
        limites: L.latLngBounds([sul, oeste], [norte, leste]),
        idEm, centro, tipoEm, distanciaAteBloqueioKm, rota, imagemRestricoes
    };
})();
