import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generate,polygons,intersects,containsBox,build} from '../gerar_matriz.js';
import {buildGraph,route,validate} from '../router.worker.js';
const rectangle=(a,b,c,d)=>[[[a,b],[c,b],[c,d],[a,d],[a,b]]];
const cost=(g,ids)=>ids.slice(1).reduce((sum,id,i)=>sum+g.get(ids[i]).find(e=>e.to===id).cost,0);

test('base irregular, ilhas e furos não liberam o retângulo envolvente',()=>{
  const l=[[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4],[0,0]]];
  assert.deepEqual(generate([l],[],[],1).celulas,[1,1,1,1,1,0,0,0,1,0,0,0,1,0,0,0]);
  const withHole=[...rectangle(0,0,4,4),...rectangle(1.2,1.2,1.4,1.4)];
  const m=generate([withHole],[],[],1);
  assert.equal(m.celulas[5],0);assert.equal(m.celulas.filter(v=>v===1).length,15);
  assert.deepEqual(generate([rectangle(0,0,1,1),rectangle(3,0,4,1)],[],[],1).celulas,[1,0,0,1]);
  const triangle=[[[0,0],[3,0],[0,3],[0,0]]];
  assert.deepEqual(generate([triangle],[],[],1).celulas,[1,1,0,1,0,0,0,0,0]);
  assert.equal(containsBox(withHole,[1,1,2,2]),false);
  const alignedHole=[...rectangle(0,0,3,3),...rectangle(1,1,2,2)];
  assert.equal(containsBox(alignedHole,[1,1,2,2]),false);
  assert.deepEqual(generate([alignedHole],[],[],1).celulas,[1,1,1,1,0,1,1,1,1]);
});

test('marrom=1, rosa=2, roxo=0; contato e sobreposição preservam bloqueio',()=>{
  const m=generate([rectangle(0,0,5,3)],[rectangle(2.2,1.2,2.3,1.3)],[rectangle(.2,1.2,4.8,1.8)],1);
  assert.deepEqual(m.celulas.slice(5,10),[2,2,0,2,2]);
  assert.deepEqual(generate([rectangle(0,0,3,3)],[rectangle(1,1,2,2)],[],1).celulas,new Array(9).fill(0));
  const hole=[...rectangle(.1,.1,4.9,4.9),...rectangle(.9,.9,4.1,4.1)];
  const holed=generate([rectangle(0,0,5,5)],[hole],[],1);
  assert.equal(holed.celulas[12],1);assert.equal(holed.celulas[0],0);
  const island=generate([rectangle(0,0,1,1),rectangle(3,0,4,1)],[],[rectangle(0,0,4,1)],1);
  assert.deepEqual(island.celulas,[2,0,0,2]);
});

test('extensão fracionária mantém bounds, células finais e distâncias corretas',()=>{
  const m=generate([rectangle(-4,-3,7,9)],[],[],5);
  assert.deepEqual(m.bounds,[[-3,-4],[9,7]]);assert.equal(m.colunas,3);assert.equal(m.linhas,3);
  assert.deepEqual(m.celulas,new Array(9).fill(1));validate(m);
  const g=buildGraph(m);
  assert.equal(cost(g,[1,2]),3);assert.equal(cost(g,[3,6]),3.5);
  assert.equal(cost(g,[4,8]),Math.hypot(3,3.5));
  assert.deepEqual(route(g,4,8),[4,8]);
  const small=generate([rectangle(0,0,.5,.8)],[],[],1);
  assert.deepEqual(small.celulas,[1]);validate(small);
  assert.throws(()=>validate({...m,colunas:4,celulas:new Array(12).fill(1)}),/Extensão/);
});

test('build lê o arquivo rosa real e falha claramente se ele estiver ausente',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ares-colors-'));
  t.after(()=>{assert.equal(path.dirname(dir),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});});
  fs.mkdirSync(path.join(dir,'dados_qgis'));
  const write=(name,coordinates)=>fs.writeFileSync(path.join(dir,'dados_qgis',name),JSON.stringify({type:'Polygon',coordinates}));
  write('mapa_base.geojson',rectangle(0,0,30,10));
  write('declividade_alta.geojson',rectangle(21,1,29,9));
  assert.throws(()=>build(dir,10),/declividade-media.geojson/);
  write('declividade-media.geojson',rectangle(11,1,29,9));
  assert.deepEqual(build(dir,10).celulas,[1,2,0]);
});

test('varredura coincide com interseção geométrica em grades aleatórias',()=>{
  let seed=429;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  for(let run=0;run<50;run++){
    const origin=run%2 ? -4741975.801864498 : 0,base=rectangle(origin,0,origin+12.3,11.7);
    const make=()=>{
      const x=origin+random()*14-1,y=random()*14-1,w=.05+random()*4,h=.05+random()*4;
      return random()<.5 ? rectangle(x,y,x+w,y+h) : [[[x,y],[x+w,y+.1],[x+.2,y+h],[x,y]]];
    };
    const obstacles=Array.from({length:5},make),risk=Array.from({length:5},make);
    const m=generate([base],obstacles,risk,1);
    for(let r=0;r<m.linhas;r++)for(let c=0;c<m.colunas;c++){
      const box=[origin+c,r,Math.min(origin+12.3,origin+c+1),Math.min(11.7,r+1)];
      const expected=obstacles.some(p=>intersects(p,box))?0:risk.some(p=>intersects(p,box))?2:1;
      assert.equal(m.celulas[r*m.colunas+c],expected,`run=${run}, row=${r}, col=${c}`);
    }
  }
});

test('rota marrom evita também cantos rosas e permite risco quando necessário',()=>{
  const m={bounds:[[0,0],[3,7]],linhas:3,colunas:7,passo:1,celulas:[1,1,1,1,1,1,1,1,2,2,2,2,2,1,1,1,1,1,1,1,1]};
  const g=buildGraph(m),ids=route(g,7,13);
  assert.ok(ids.every(id=>m.celulas[id]===1));assert.ok(Math.abs(cost(g,ids)-8)<1e-9);
  const corridor=buildGraph({bounds:[[0,0],[1,3]],linhas:1,colunas:3,passo:1,celulas:[1,2,1]});
  assert.deepEqual(route(corridor,0,2),[0,1,2]);assert.equal(cost(corridor,[0,1,2]),3);
});

test('custos e conexões coincidem com referência independente de Floyd–Warshall',()=>{
  let seed=86;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  for(let run=0;run<25;run++){
    const cols=5,rows=4,n=cols*rows,cells=Array.from({length:n},()=>Math.floor(random()*3));
    const m={bounds:[[0,0],[rows,cols]],linhas:rows,colunas:cols,passo:1,celulas:cells},g=buildGraph(m);
    function reference(allowRisk){
    const walkable=id=>cells[id]!==0 && (allowRisk || cells[id]===1);
    const dist=Array.from({length:n},()=>new Array(n).fill(Infinity));
    for(let a=0;a<n;a++){
      if(!walkable(a))continue;dist[a][a]=0;
      for(let b=0;b<n;b++){
        if(a===b || !walkable(b))continue;
        const ar=Math.floor(a/cols),ac=a%cols,br=Math.floor(b/cols),bc=b%cols;
        if(Math.abs(ar-br)>1 || Math.abs(ac-bc)>1)continue;
        if(ar!==br && ac!==bc && (!walkable(ar*cols+bc) || !walkable(br*cols+ac)))continue;
        dist[a][b]=Math.hypot(ar-br,ac-bc)*(cells[a]+cells[b])/2;
      }
    }
    for(let k=0;k<n;k++)for(let a=0;a<n;a++)for(let b=0;b<n;b++)dist[a][b]=Math.min(dist[a][b],dist[a][k]+dist[k][b]);
    return dist;
    }
    const safe=reference(false),full=reference(true);
    for(let a=0;a<n;a++)for(let b=0;b<n;b++){
      const dist=Number.isFinite(safe[a][b])?safe:full;
      const ids=route(g,a,b);
      if(Number.isFinite(safe[a][b]))assert.ok(ids.every(id=>cells[id]===1));
      if(!Number.isFinite(dist[a][b])){assert.deepEqual(ids,[]);continue;}
      assert.equal(ids[0],a);assert.equal(ids.at(-1),b);
      assert.ok(Math.abs(cost(g,ids)-dist[a][b])<1e-9);
    }
  }
});

test('Polygon/MultiPolygon e geometrias inválidas',()=>{
  const coordinates=[rectangle(0,0,1,1),rectangle(3,0,4,1)];
  assert.deepEqual(polygons({type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'MultiPolygon',coordinates}}]}),coordinates);
  assert.throws(()=>polygons({type:'Feature',geometry:null}),/ausente/);
  assert.throws(()=>polygons({type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1]]]}),/fechado/);
});
