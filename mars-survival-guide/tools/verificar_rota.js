// Verificação do planejador de rota.
// Como usar: abra o index.html, aperte F12, vá em "Console", cole este arquivo inteiro e aperte Enter.
// Compara a rota do app (A*) com um Dijkstra de referência (lento, mas garantidamente correto)
// em 25 pares de pontos aleatórios: tenta primeiro apenas terreno seguro e depois
// permite risco se necessário, usando os mesmos custos. Resultado esperado: 25/25 iguais.
(() => {
 const {linhas:R, colunas:C, passo, tipo, CUSTO} = Terreno;
 function dijkstra(a,b,permitirRisco){ const permitida=id=>tipo[id]!==0&&(permitirRisco||tipo[id]===1); if(!permitida(a)||!permitida(b))return Infinity; const g=new Float64Array(R*C).fill(Infinity), done=new Uint8Array(R*C); const heap=[[0,a]]; g[a]=0;
  const push=it=>{heap.push(it);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const t=heap[0],l=heap.pop();if(heap.length){heap[0]=l;let i=0;for(;;){let c=2*i+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=heap[i][0])break;[heap[c],heap[i]]=[heap[i],heap[c]];i=c;}}return t;};
  while(heap.length){const [d,id]=pop(); if(done[id])continue; done[id]=1; if(id===b) return d;
   const r=Math.floor(id/C), c=id%C;
   for(const [dr,dc,m] of [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]]){
    const nr=r+dr,nc=c+dc; if(nr<0||nc<0||nr>=R||nc>=C)continue; const n=nr*C+nc; if(!permitida(n)||done[n])continue;
    if(dr&&dc&&(!permitida(r*C+nc)||!permitida(nr*C+c)))continue;
    const nd=d+passo*m*(CUSTO[tipo[id]]+CUSTO[tipo[n]])/2; if(nd<g[n]){g[n]=nd;push([nd,n]);}}}
  return Infinity;}
 const custoRota=ids=>{let s=0;for(let i=1;i<ids.length;i++){const a=ids[i-1],b=ids[i];const m=(Math.floor(a/C)!==Math.floor(b/C)&&a%C!==b%C)?Math.SQRT2:1;s+=passo*m*(CUSTO[tipo[a]]+CUSTO[tipo[b]])/2;}return s;};
 let seed=11; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const livre=()=>{for(;;){const id=Math.floor(rnd()*R*C); if(tipo[id]!==0) return id;}};
 let ok=0, max=0, n=0;
 while(n<25){ const a=livre(), b=livre(); if(Math.hypot(Math.floor(a/C)-Math.floor(b/C),a%C-b%C)>600) continue; n++;
  const r=Terreno.rota(Terreno.centro(a),Terreno.centro(b)); const meu=r.ids.length?custoRota(r.ids):Infinity; const segura=dijkstra(a,b,false); const ref=Number.isFinite(segura)?segura:dijkstra(a,b,true);
  const dif=(meu===ref)?0:Math.abs(meu-ref)/ref; if(dif<1e-5) ok++; max=Math.max(max,isFinite(dif)?dif:1);}
 return `iguais ao Dijkstra: ${ok}/25, diferença máxima ${(max*100).toFixed(5)}%`;
})()
