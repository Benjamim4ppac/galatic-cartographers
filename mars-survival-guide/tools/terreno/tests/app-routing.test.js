import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const terrainSource = fs.readFileSync(new URL('../../../js/terreno.js', import.meta.url), 'utf8');

// Executa o planejador usado pelo navegador em uma grade pequena e controlada.
function terrain(rows) {
    const linhas = rows.length, colunas = rows[0].length, cells = rows.flat();
    const packed = Buffer.alloc(Math.ceil(cells.length / 4));
    cells.forEach((value, i) => { packed[i >> 2] |= Math.min(value, 2) << ((i & 3) * 2); });
    const grauM = 3396190 * Math.PI / 180;
    const context = vm.createContext({
        TERRENO_META: { linhas, colunas, passo: 100, boundsGraus: [[0, 0], [linhas * 100 / grauM, colunas * 100 / grauM]], bordaBloqueadaCelulas: 0 },
        TERRENO_B64: packed.toString('base64'),
        atob: value => Buffer.from(value, 'base64').toString('binary'),
        RISCOS_TERRENO: {
            declividadeMedia: { custo: 4 },
            zonaDesabamento: { custo: 3, faixaM: 0 },
            terrenoCaotico: { custo: 4 }
        },
        CANDOR_GEOLOGIA: { features: [] },
        L: { latLng: (lat, lng) => ({ lat, lng }), latLngBounds: () => ({}) },
        document: { createElement: () => ({ getContext: () => ({
            getImageData: () => ({ data: new Uint8ClampedArray(cells.length * 4) })
        }) }) }
    });
    const result = vm.runInContext(terrainSource + '\nTerreno;', context);
    result.tipo.set(cells);
    return result;
}

function route(t, a, b) { return t.rota(t.centro(a), t.centro(b)); }

test('prefere desvio seguro mesmo quando o atalho arriscado tem custo menor', () => {
    const t = terrain([...Array.from({ length: 11 }, () => [1, 2, 1]), [1, 1, 1]]);
    const result = route(t, 0, 2);
    assert.equal(result.usaRisco, false);
    assert.ok(result.ids.every(id => t.tipo[id] === t.SEGURA));
    assert.ok(result.ids.includes(34), 'deve contornar toda a barreira de declividade média');
});

test('permite declividade média somente quando não existe caminho seguro', () => {
    const t = terrain([[1, 2, 1]]);
    const result = route(t, 0, 2);
    assert.deepEqual(Array.from(result.ids), [0, 1, 2]);
    assert.equal(result.usaRisco, true);
});

test('busca segura não corta cantos de terreno arriscado', () => {
    const t = terrain([[1, 2], [1, 1]]);
    assert.deepEqual(Array.from(route(t, 0, 3).ids), [0, 2, 3]);
});

test('origem e destino arriscados acionam a busca com risco', () => {
    const t = terrain([[2, 1, 2]]);
    assert.equal(route(t, 0, 1).usaRisco, true);
    assert.equal(route(t, 1, 2).usaRisco, true);
    assert.equal(route(t, 0, 0).usaRisco, true);
});

test('declividade alta continua bloqueada, inclusive nas diagonais', () => {
    const t = terrain([[1, 0], [0, 1]]);
    assert.equal(route(t, 0, 3).ids.length, 0);
    assert.equal(route(t, 0, 1).ids.length, 0);
    assert.equal(route(t, 1, 3).ids.length, 0);
    assert.equal(t.rota({ lat: -1, lng: -1 }, t.centro(0)).ids.length, 0);
});

test('buscas consecutivas limpam o estado entre rota segura, arriscada e bloqueada', () => {
    const t = terrain([[1, 2, 1, 0, 1], [1, 1, 1, 0, 1]]);
    assert.equal(route(t, 0, 2).usaRisco, false);
    assert.equal(route(t, 0, 1).usaRisco, true);
    assert.equal(route(t, 0, 4).ids.length, 0);
    assert.equal(route(t, 2, 0).usaRisco, false);
    assert.equal(route(t, 0, 0).usaRisco, false);
});

test('também evita desabamento e terreno caótico quando há caminho seguro', () => {
    for (const risk of [3, 4]) {
        const t = terrain([[1, risk, 1], [1, 1, 1]]);
        assert.equal(route(t, 0, 2).usaRisco, false);
        const corridor = terrain([[1, risk, 1]]);
        assert.equal(route(corridor, 0, 2).usaRisco, true);
    }
});
