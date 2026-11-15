// OFFLINE: node scripts/gerar_matriz.js [passo_em_metros].
// Os vetores e o raster devem usar IAU_2015:49912, em metros. Não reprojeta.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EPSILON = 1e-9;

export function polygons(json) {
  if (!json || typeof json !== 'object') throw new Error('Geometria ausente.');
  if (json.type === 'FeatureCollection') return json.features.flatMap(polygons);
  if (json.type === 'Feature') return polygons(json.geometry);
  const list = json.type === 'Polygon' ? [json.coordinates] : json.type === 'MultiPolygon' ? json.coordinates : null;
  if (!list) throw new Error('Use somente Polygon ou MultiPolygon.');
  for (const polygon of list) {
    if (!polygon.length) throw new Error('Polígono vazio.');
    for (const ring of polygon) {
      if (ring.length < 4 || ring.some(p => p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) ||
        ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) throw new Error('Anel inválido ou não fechado.');
    }
  }
  return list;
}
function inRing([x,y], ring) {
  let inside = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [a,b]=ring[i], [c,d]=ring[j];
    if ((b>y)!==(d>y) && x < (c-a)*(y-b)/(d-b)+a) inside=!inside;
  }
  return inside;
}
function inside(point, polygon) { return inRing(point,polygon[0]) && !polygon.slice(1).some(r=>inRing(point,r)); }
function onRing([x,y], ring) {
  return ring.slice(1).some(([bx,by],i)=>{
    const [ax,ay]=ring[i], dx=bx-ax,dy=by-ay;
    return Math.abs((x-ax)*dy-(y-ay)*dx)<=EPSILON*Math.max(1,Math.hypot(dx,dy)) &&
      x>=Math.min(ax,bx)-EPSILON && x<=Math.max(ax,bx)+EPSILON &&
      y>=Math.min(ay,by)-EPSILON && y<=Math.max(ay,by)+EPSILON;
  });
}
// Liang–Barsky: intervalo do segmento contido na caixa, incluindo contato.
function clip(a,b,box) {
  let lo=0,hi=1;
  for (let axis=0;axis<2;axis++) {
    const delta=b[axis]-a[axis];
    if (delta===0) {if(a[axis]<box[axis] || a[axis]>box[axis+2])return null;continue;}
    let t0=(box[axis]-a[axis])/delta,t1=(box[axis+2]-a[axis])/delta;
    if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);
    if(lo>hi)return null;
  }
  return [lo,hi];
}
const corners=box=>[[box[0],box[1]],[box[2],box[1]],[box[2],box[3]],[box[0],box[3]]];
export function intersects(polygon,box) {
  if (corners(box).some(p=>inside(p,polygon))) return true;
  return polygon.some(ring=>ring.slice(1).some((p,i)=>clip(ring[i],p,box)!==null));
}
// A base precisa cobrir a célula inteira. Tocar seu contorno é permitido;
// atravessar o contorno ou conter um furo não é.
export function containsBox(polygon,box) {
  if(!inside([(box[0]+box[2])/2,(box[1]+box[3])/2],polygon))return false;
  if(!corners(box).every(p=>(inRing(p,polygon[0]) || onRing(p,polygon[0])) &&
    !polygon.slice(1).some(r=>inRing(p,r) && !onRing(p,r))))return false;
  return !polygon.some(ring=>ring.slice(1).some((b,i)=>{
    const a=ring[i],range=clip(a,b,box);
    if(!range || range[0]===range[1])return false;
    const t=(range[0]+range[1])/2,x=a[0]+t*(b[0]-a[0]),y=a[1]+t*(b[1]-a[1]);
    return x>box[0]+EPSILON && x<box[2]-EPSILON && y>box[1]+EPSILON && y<box[3]-EPSILON;
  }));
}
function extent(list) {
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const poly of list)for(const ring of poly)for(const [x,y] of ring){
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  return [minX,minY,maxX,maxY];
}
export function generate(base, obstacles, expensive=[], passo=100) {
  if (!Number.isFinite(passo) || passo<=0) throw new Error('passo deve ser positivo, em metros.');
  if(!base.length)throw new Error('mapa_base vazio.');
  const [minX,minY,maxX,maxY]=extent(base);
  // Preserva os bounds do raster; só a última linha/coluna pode ser menor.
  const count=length=>Math.ceil(length/passo-EPSILON);
  const colunas=count(maxX-minX),linhas=count(maxY-minY);
  if(colunas<1 || linhas<1)throw new Error('Extensão do mapa_base inválida.');
  if(!Number.isSafeInteger(linhas*colunas) || linhas*colunas>10_000_000)throw new Error('Grade muito grande: aumente o passo ou divida o setor.');
  const celulas=new Array(linhas*colunas).fill(0);
  const boxAt=(row,col)=>[minX+col*passo,minY+row*passo,Math.min(maxX,minX+(col+1)*passo),Math.min(maxY,minY+(row+1)*passo)];
  const paint=(id,value)=>{if(value!==2 || celulas[id]!==0)celulas[id]=value;};
  // Preenche interiores por linhas de varredura e visita separadamente todas
  // as células tocadas por segmentos. Não perde polígonos menores que o passo.
  function rasterize(list,value) {
    for(const polygon of list) {
      const bounds=extent([polygon]);
      if(bounds[0]>maxX || bounds[2]<minX || bounds[1]>maxY || bounds[3]<minY)continue;
      const firstRow=Math.max(0,Math.ceil((bounds[1]-minY)/passo-EPSILON)-1);
      const lastRow=Math.min(linhas-1,Math.floor((bounds[3]-minY)/passo+EPSILON));
      const boundary=new Set();
      for(const ring of polygon)for(let i=1;i<ring.length;i++){
        const a=ring[i-1],b=ring[i];
        const r0=Math.max(firstRow,Math.ceil((Math.min(a[1],b[1])-minY)/passo-EPSILON)-1);
        const r1=Math.min(lastRow,Math.floor((Math.max(a[1],b[1])-minY)/passo+EPSILON));
        for(let r=r0;r<=r1;r++){
          const range=clip(a,b,[minX,minY+r*passo,maxX,Math.min(maxY,minY+(r+1)*passo)]);
          if(!range)continue;
          const x0=a[0]+range[0]*(b[0]-a[0]),x1=a[0]+range[1]*(b[0]-a[0]);
          const c0=Math.max(0,Math.ceil((Math.min(x0,x1)-minX)/passo-EPSILON)-1);
          const c1=Math.min(colunas-1,Math.floor((Math.max(x0,x1)-minX)/passo+EPSILON));
          for(let c=c0;c<=c1;c++)boundary.add(r*colunas+c);
        }
      }
      for(let r=firstRow;r<=lastRow;r++){
        const y=(minY+r*passo+Math.min(maxY,minY+(r+1)*passo))/2,crossings=[];
        for(const ring of polygon)for(let i=1;i<ring.length;i++){
          const [ax,ay]=ring[i-1],[bx,by]=ring[i];
          if((ay>y)!==(by>y))crossings.push(ax+(y-ay)*(bx-ax)/(by-ay));
        }
        crossings.sort((a,b)=>a-b);
        for(let i=0;i+1<crossings.length;i+=2){
          const left=crossings[i],right=crossings[i+1];
          const c0=Math.max(0,Math.floor((left-minX)/passo)),c1=Math.min(colunas-1,Math.floor((right-minX)/passo));
          for(let c=c0;c<=c1;c++){
            const x=(minX+c*passo+Math.min(maxX,minX+(c+1)*passo))/2,id=r*colunas+c;
            if(x>=left && x<right && (value!==1 || !boundary.has(id)))paint(id,value);
          }
        }
      }
      for(const id of boundary){
        if(value!==1 || containsBox(polygon,boxAt(Math.floor(id/colunas),id%colunas)))paint(id,value);
      }
    }
  }
  rasterize(base,1);       // Marrom: caminhável; exterior e furos continuam 0.
  rasterize(expensive,2);  // Rosa: caminhável com penalidade de risco.
  rasterize(obstacles,0);  // Roxo: bloqueio tem prioridade sobre as outras camadas.
  return {bounds:[[minY,minX],[maxY,maxX]],linhas,colunas,passo,celulas,crs:'IAU_2015:49912'};
}
export function build(directory=root, passo=100) {
  const input=path.join(directory,'dados_qgis');
  const read=name=>{
    try {return JSON.parse(fs.readFileSync(path.join(input,name),'utf8'));}
    catch(error){throw new Error(name+': '+error.message);}
  };
  const base=read('mapa_base.geojson');
  const matrix=generate(polygons(base),polygons(read('declividade_alta.geojson')),polygons(read('declividade-media.geojson')),passo);
  matrix.demo=base.demo===true;
  fs.mkdirSync(path.join(directory,'assets'),{recursive:true});
  fs.writeFileSync(path.join(directory,'assets','matriz_navegacao.json'),JSON.stringify(matrix));
  return matrix;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try {
    const m=build(root,Number(process.argv[2]??100)),counts=[0,0,0];
    for(const value of m.celulas)counts[value]++;
    console.log(`Matriz: ${m.linhas} × ${m.colunas}; passo máximo ${m.passo} m. Bloqueadas: ${counts[0]}; normais: ${counts[1]}; risco: ${counts[2]}.`);
  }
  catch(error){console.error(error.message);process.exitCode=1;}
}
