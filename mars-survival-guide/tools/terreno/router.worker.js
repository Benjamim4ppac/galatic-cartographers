// RUNTIME: nenhum GeoJSON é carregado. As conexões são calculadas sob demanda.
export function validate(m) {
  if(!m || !Number.isInteger(m.linhas)||m.linhas<1||!Number.isInteger(m.colunas)||m.colunas<1||
    !Number.isFinite(m.passo)||m.passo<=0||!Array.isArray(m.celulas)||m.celulas.length!==m.linhas*m.colunas||
    m.celulas.some(v=>![0,1,2].includes(v)))throw new Error('Matriz inválida: dimensões, passo ou custos.');
  if(!Array.isArray(m.bounds)||m.bounds.length!==2||m.bounds.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v))))throw new Error('bounds inválido.');
  const [[y0,x0],[y1,x1]]=m.bounds;
  const fits=(length,count)=>length>0 && Math.ceil(length/m.passo-1e-9)===count;
  if(!fits(x1-x0,m.colunas) || !fits(y1-y0,m.linhas))throw new Error('Extensão incompatível com a matriz.');
  return m;
}
const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
// Uma lista de oito arestas por célula consumiria vários GB nos dados reais.
// Mantém apenas custos compactos e expõe a mesma consulta/iteração do grafo.
class GridGraph {
  constructor(m) {
    this.cells=Uint8Array.from(m.celulas);
    this.cellCount=this.cells.length;
    this.rows=m.linhas;this.cols=m.colunas;this.step=m.passo;
    this.lastWidth=m.bounds[1][1]-m.bounds[0][1]-(m.colunas-1)*m.passo;
    this.lastHeight=m.bounds[1][0]-m.bounds[0][0]-(m.linhas-1)*m.passo;
    this.size=0;for(const value of this.cells)if(value!==0)this.size++;
  }
  has(id){return Number.isInteger(id) && id>=0 && id<this.cellCount && this.cells[id]!==0;}
  get(id,allowRisk=true) {
    const walkable=id=>this.has(id) && (allowRisk || this.cells[id]===1);
    if(!walkable(id))return undefined;
    const row=Math.floor(id/this.cols),col=id%this.cols,edges=[];
    for(const [dr,dc] of directions){
      const r=row+dr,c=col+dc,next=r*this.cols+c;
      if(r<0||c<0||r>=this.rows||c>=this.cols||!walkable(next))continue;
      if(dr&&dc&&(!walkable(row*this.cols+c)||!walkable(r*this.cols+col)))continue;
      const dx=dc ? (Math.max(col,c)===this.cols-1 ? (this.step+this.lastWidth)/2 : this.step) : 0;
      const dy=dr ? (Math.max(row,r)===this.rows-1 ? (this.step+this.lastHeight)/2 : this.step) : 0;
      edges.push({to:next,cost:Math.hypot(dx,dy)*(this.cells[id]+this.cells[next])/2});
    }
    return edges;
  }
  *keys(){for(let id=0;id<this.cellCount;id++)if(this.cells[id]!==0)yield id;}
  *entries(){for(const id of this.keys())yield [id,this.get(id)];}
  [Symbol.iterator](){return this.entries();}
}
export function buildGraph(matrix) {return new GridGraph(validate(matrix));}
// Segurança tem prioridade absoluta, independentemente da distância do desvio.
export function planRoute(graph,start,end) {
  if(!graph.has(start)||!graph.has(end))return {ids:[],usesRisk:false};
  if(graph.cells[start]===1 && graph.cells[end]===1){
    const ids=shortestPath(graph,start,end,false);
    if(ids.length)return {ids,usesRisk:false};
  }
  const ids=shortestPath(graph,start,end,true);
  return {ids,usesRisk:ids.length>0};
}
export function route(graph,start,end) {return planRoute(graph,start,end).ids;}
function shortestPath(graph,start,end,allowRisk) {
  if(start===end)return [start];
  const distances=new Float64Array(graph.cellCount).fill(Infinity),previous=new Int32Array(graph.cellCount).fill(-1),heap=[];
  distances[start]=0;
  function push(item){let i=heap.length;heap.push(item);while(i>0){const p=(i-1)>>1;if(heap[p][0]<=item[0])break;heap[i]=heap[p];i=p;}heap[i]=item;}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;}
  push([0,start]);
  while(heap.length){
    const [cost,id]=pop();if(cost!==distances[id])continue;
    if(id===end){const ids=[end];while(ids.at(-1)!==start)ids.push(previous[ids.at(-1)]);return ids.reverse();}
    for(const edge of graph.get(id,allowRisk)){const next=cost+edge.cost;if(next<distances[edge.to]){distances[edge.to]=next;previous[edge.to]=id;push([next,edge.to]);}}
  }
  return [];
}
if(typeof self!=='undefined' && typeof self.postMessage==='function'){
  let graph;
  self.onmessage=async({data})=>{
    try{
      if(data.type==='init'){
        const response=await fetch('./assets/matriz_navegacao.json');
        if(!response.ok)throw new Error(`Matriz: HTTP ${response.status}`);
        graph=buildGraph(await response.json());self.postMessage({type:'ready'});
      }else if(data.type==='route'){
        if(!graph)throw new Error('Motor ainda não carregado.');
        const result=planRoute(graph,data.originId,data.destinationId);
        self.postMessage(data.details ? {type:'route',...result} : result.ids);
      }
    }catch(error){self.postMessage({type:'error',message:error.message});}
  };
}
