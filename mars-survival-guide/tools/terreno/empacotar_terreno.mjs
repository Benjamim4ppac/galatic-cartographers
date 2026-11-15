// Empacota o terreno do QGIS para o app (roda UMA vez, na Terra).
//
// 1. Usa o gerador do Yoshida (gerar_matriz.js) para transformar os polígonos de
//    declividade (dados_qgis/) numa grade de células de 100 m:
//      1 = segura (marrom) · 2 = declividade média, risco (rosa) · 0 = declividade alta, bloqueada (roxo)
// 2. Bloqueia uma faixa de 500 m na borda do mapa: os dados de declividade não cobrem
//    a beirada e, sem isso, rotas "escapavam" pela borda sem passar pelas paredes.
// 3. Compacta 4 células por byte e grava data/terreno.js (abre sem servidor).
//
// Uso: node tools/terreno/empacotar_terreno.mjs [passo_em_metros=100]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './gerar_matriz.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const saida = path.resolve(aqui, '../../data/terreno.js');
const R_MARTE = 3396190;
const BORDA_CELULAS = 5;

const passo = Number(process.argv[2] ?? 100);
const m = build(aqui, passo); // grava tools/terreno/assets/matriz_navegacao.json (ignorado pelo git)
const {linhas, colunas} = m;
const celulas = Uint8Array.from(m.celulas);

let bloqueadasBorda = 0;
for (let r = 0; r < linhas; r++) {
  for (let c = 0; c < colunas; c++) {
    if (r < BORDA_CELULAS || c < BORDA_CELULAS || r >= linhas - BORDA_CELULAS || c >= colunas - BORDA_CELULAS) {
      const id = r * colunas + c;
      if (celulas[id] !== 0) { celulas[id] = 0; bloqueadasBorda++; }
    }
  }
}

const pacote = new Uint8Array(Math.ceil(celulas.length / 4));
for (let i = 0; i < celulas.length; i++) pacote[i >> 2] |= celulas[i] << ((i & 3) * 2);

const graus = v => (v / R_MARTE) * 180 / Math.PI;
const [[minY, minX], [maxY, maxX]] = m.bounds;
const meta = {
  linhas, colunas, passo,
  crs: m.crs,
  boundsMetros: m.bounds,
  boundsGraus: [[graus(minY), graus(minX)], [graus(maxY), graus(maxX)]],
  bordaBloqueadaCelulas: BORDA_CELULAS,
  fonte: 'Declividade derivada no QGIS (pipeline ARES, Yoshida)',
  preparadoEm: new Date().toISOString().slice(0, 10)
};
fs.writeFileSync(saida,
  '// Gerado por tools/terreno/empacotar_terreno.mjs — não editar à mão.\n' +
  `const TERRENO_META = ${JSON.stringify(meta)};\n` +
  `const TERRENO_B64 = "${Buffer.from(pacote).toString('base64')}";\n`);

const contagem = [0, 0, 0];
for (const v of celulas) contagem[v]++;
console.log(`${linhas} × ${colunas} células de ${passo} m · seguras ${contagem[1]} · risco ${contagem[2]} · bloqueadas ${contagem[0]} (borda: ${bloqueadasBorda})`);
console.log(`Gravado ${path.relative(process.cwd(), saida)} (${(fs.statSync(saida).size / 1e6).toFixed(1)} MB)`);
