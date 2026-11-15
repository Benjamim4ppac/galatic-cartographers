import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {polygons,intersects,containsBox} from '../gerar_matriz.js';
import {buildGraph,planRoute,validate} from '../router.worker.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../'+name,import.meta.url),'utf8'));
const index=list=>list.map(poly=>{
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const ring of poly)for(const [x,y] of ring){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  return {poly,bounds:[x0,y0,x1,y1]};
});
test('dados reais: matriz publicada, amostras geométricas e rota de ponta a ponta',()=>{
  const m=read('assets/matriz_navegacao.json');validate(m);
  const source=read('dados_qgis/mapa_base.geojson'),base=index(polygons(source));
  const high=index(polygons(read('dados_qgis/declividade_alta.geojson'))),medium=index(polygons(read('dados_qgis/declividade-media.geojson')));
  assert.equal(m.demo,source.demo===true);
  const [[y0,x0],[y1,x1]]=m.bounds;
  assert.deepEqual(m.bounds,[[Math.min(...base.map(p=>p.bounds[1])),Math.min(...base.map(p=>p.bounds[0]))],[Math.max(...base.map(p=>p.bounds[3])),Math.max(...base.map(p=>p.bounds[2]))]]);
  // (cópia em dist/ não existe neste projeto)
  assert.ok(m.celulas.includes(0));assert.ok(m.celulas.includes(1));assert.ok(m.celulas.includes(2));
  const boxAt=id=>{
    const row=Math.floor(id/m.colunas),col=id%m.colunas;
    return [x0+col*m.passo,y0+row*m.passo,Math.min(x1,x0+(col+1)*m.passo),Math.min(y1,y0+(row+1)*m.passo)];
  };
  const overlaps=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
  const hit=(list,box)=>list.some(({poly,bounds})=>overlaps(bounds,box)&&intersects(poly,box));
  const expected=id=>{
    const box=boxAt(id);
    if(!base.some(({poly,bounds})=>overlaps(bounds,box)&&containsBox(poly,box)) || hit(high,box))return 0;
    return hit(medium,box)?2:1;
  };
  let seed=995;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  const samples=new Set([0,m.colunas-1,m.celulas.length-m.colunas,m.celulas.length-1]);
  for(let i=0;i<3000;i++)samples.add(Math.floor(random()*m.celulas.length));
  // Inclui bordas de cada feição, além das amostras uniformes.
  for(const {poly} of [...high,...medium]){
    const [x,y]=poly[0][0],c=Math.floor((x-x0)/m.passo),r=Math.floor((y-y0)/m.passo);
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)
      if(r+dr>=0&&r+dr<m.linhas&&c+dc>=0&&c+dc<m.colunas)samples.add((r+dr)*m.colunas+c+dc);
  }
  for(const id of samples)assert.equal(m.celulas[id],expected(id),'classificação da célula '+id);
  const g=buildGraph(m),start=m.celulas.findIndex(v=>v!==0),end=m.celulas.findLastIndex(v=>v!==0);
  const {ids,usesRisk}=planRoute(g,start,end);
  assert.equal(usesRisk,false,'os extremos deste setor possuem alternativa marrom');
  assert.ok(ids.every(id=>m.celulas[id]===1));
  assert.ok(ids.length>1);assert.equal(ids[0],start);assert.equal(ids.at(-1),end);
  assert.equal(new Set(ids).size,ids.length);
  for(let i=0;i<ids.length;i++){
    assert.notEqual(expected(ids[i]),0,'rota em área proibida '+ids[i]);
    if(i){
      const a=ids[i-1],b=ids[i],ar=Math.floor(a/m.colunas),ac=a%m.colunas,br=Math.floor(b/m.colunas),bc=b%m.colunas;
      assert.ok(Math.abs(ar-br)<=1&&Math.abs(ac-bc)<=1);
      if(ar!==br&&ac!==bc){assert.notEqual(m.celulas[ar*m.colunas+bc],0);assert.notEqual(m.celulas[br*m.colunas+ac],0);}
    }
  }
  console.log(`Dados reais: ${samples.size} células conferidas geometricamente; rota com ${ids.length} células.`);
});
