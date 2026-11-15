import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generate,intersects,build} from '../gerar_matriz.js';
import {buildGraph,route} from '../router.worker.js';
const rectangle=(a,b,c,d)=>[[[a,b],[c,b],[c,d],[a,d],[a,b]]];
test('interseção inclui obstáculo pequeno fora do centro e respeita furos',()=>{
  assert.ok(intersects(rectangle(.1,.1,.2,.2),[0,0,1,1]));
  const hole=[...rectangle(0,0,10,10),...rectangle(2,2,8,8)];
  assert.equal(intersects(hole,[3,3,4,4]),false);
  assert.equal(intersects(hole,[1,1,3,3]),true);
});
test('matriz: bounds, orientação sul-norte, custos e prioridade do bloqueio',()=>{
  const m=generate([rectangle(10,20,40,40)],[rectangle(21,21,29,29)],[rectangle(11,21,29,29)],10);
  assert.deepEqual(m.bounds,[[20,10],[40,40]]);assert.deepEqual(m.celulas,[2,0,1,1,1,1]);
  assert.deepEqual(generate([rectangle(0,0,11,10)],[],[],3).bounds,[[0,0],[10,11]]);
});
test('script cria assets e aceita camadas de declividade vazias',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ares-test-'));fs.mkdirSync(path.join(root,'dados_qgis'));
  fs.writeFileSync(path.join(root,'dados_qgis/mapa_base.geojson'),JSON.stringify({type:'Polygon',coordinates:rectangle(0,0,20,20)}));
  fs.writeFileSync(path.join(root,'dados_qgis/declividade_alta.geojson'),JSON.stringify({type:'FeatureCollection',features:[]}));
  t.after(()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));fs.rmSync(root,{recursive:true,force:true});});
  fs.writeFileSync(path.join(root,'dados_qgis/declividade-media.geojson'),JSON.stringify({type:'FeatureCollection',features:[]}));
  assert.deepEqual(build(root,10).celulas,[1,1,1,1]);assert.ok(fs.existsSync(path.join(root,'assets/matriz_navegacao.json')));
});
const matrix=(cells,cols)=>({bounds:[[0,0],[cells.length/cols,cols]],linhas:cells.length/cols,colunas:cols,passo:1,celulas:cells});
test('IDs bloqueados/fora da grade, desconexão, mesma célula e cantos',()=>{
  const g=buildGraph(matrix([1,0,0,1],2));assert.deepEqual(route(g,0,3),[]);assert.deepEqual(route(g,0,0),[0]);assert.deepEqual(route(g,1,3),[]);assert.deepEqual(route(g,-1,3),[]);
});
test('Dijkstra coincide com Bellman-Ford em matrizes ponderadas',()=>{
  let seed=83;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  for(let run=0;run<60;run++){
    const cells=Array.from({length:100},()=>random()<.18?0:random()<.5?1:2);cells[0]=cells[99]=1;
    const g=buildGraph(matrix(cells,10));
    function reference(allowRisk){
      const dist=new Map([[0,0]]);
      for(let i=0;i<99;i++)for(const id of g.keys())for(const e of g.get(id,allowRisk)??[])
        if((dist.get(id)??Infinity)+e.cost<(dist.get(e.to)??Infinity))dist.set(e.to,dist.get(id)+e.cost);
      return dist;
    }
    let dist=reference(false);if(!dist.has(99))dist=reference(true);
    const ids=route(g,0,99);if(!dist.has(99)){assert.deepEqual(ids,[]);continue;}
    let cost=0;for(let i=1;i<ids.length;i++)cost+=g.get(ids[i-1]).find(e=>e.to===ids[i]).cost;
    assert.ok(Math.abs(cost-dist.get(99))<1e-8);
  }
});
test('contrato rejeita dimensões inconsistentes e custos desconhecidos',()=>{
  assert.throws(()=>buildGraph(matrix([1,3],2)),/inválida/);
  const m=matrix([1,1],2);m.bounds[1][1]=3;assert.throws(()=>buildGraph(m),/Extensão/);
});
