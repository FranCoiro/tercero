'use strict';
const specs=[{id:'triangular',n:3,name:'triangular',flat:'Triángulo'},{id:'pentagonal',n:5,name:'pentagonal',flat:'Pentágono'},{id:'hexagonal',n:6,name:'hexagonal',flat:'Hexágono'},{id:'cuadrado',n:4,name:'cuadrado',flat:'Cuadrado'},{id:'rectangular',n:4,name:'rectangular',flat:'Rectángulo',rect:true}];
let category='prisma',selected='triangular',part=null,component=null,animation=0;
const states={};
const $=id=>document.getElementById(id);
const current=()=>states[category+selected]??(states[category+selected]={height:0,rx:-.5,ry:.55});
const items=()=>category==='prisma'?specs:specs.filter(s=>!s.rect);
const spec=()=>specs.find(s=>s.id===selected);
const name=s=>(category==='prisma'?'Prisma ':'Pirámide ')+(category==='piramide'&&s.n===4?'cuadrada':s.name);
const svgNS='http://www.w3.org/2000/svg';
function el(tag,attrs={}){const e=document.createElementNS(svgNS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
function geometry(s,h,type){
 const ring=Array.from({length:s.n},(_,i)=>{const a=2*Math.PI*i/s.n-Math.PI/2;return s.n===4?[[ -.78,-.78],[.78,-.78],[.78,.78],[-.78,.78]][i]:[Math.cos(a),Math.sin(a)];}).map(([x,z])=>[x*(s.rect?1.4:1),.7,z*(s.rect?.7:1)]);
 if(h===0)return {vertices:ring,faces:[{ids:ring.map((_,i)=>i),kind:'base'}]};
 const vertices=type==='prisma'?[...ring,...ring.map(([x,y,z])=>[x,y-1.65*h,z])]:[...ring,[0,.7-1.85*h,0]];
 const faces=[{ids:ring.map((_,i)=>i),kind:'base'}];
 if(type==='prisma')faces.push({ids:ring.map((_,i)=>i+s.n),kind:'base'});
 for(let i=0;i<s.n;i++){let j=(i+1)%s.n;faces.push({ids:type==='prisma'?[i,j,j+s.n,i+s.n]:[i,j,s.n],kind:'lateral'});}
 return {vertices,faces};
}
function rotate(p,st){let [x,y,z]=p;const cy=Math.cos(st.ry),sy=Math.sin(st.ry),cx=Math.cos(st.rx),sx=Math.sin(st.rx);let xx=x*cy+z*sy,zz=-x*sy+z*cy;return [xx,y*cx-zz*sx,y*sx+zz*cx];}
function renderModel(svg,s,st,interactive=false){
 svg.replaceChildren();const g=geometry(s,st.height,category),center=g.vertices.reduce((a,p)=>a.map((v,i)=>v+p[i]/g.vertices.length),[0,0,0]);
 const pts=g.vertices.map(p=>rotate(p.map((v,i)=>v-center[i]),st));
 const isSelected=s.id===selected;const scale=105;const xy=i=>[220+pts[i][0]*scale,155+pts[i][1]*scale];
 const front=[];
 g.faces.forEach((f,index)=>{
 const [a,b,c]=f.ids.map(i=>g.vertices[i]);let u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);let normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 const fc=f.ids.reduce((q,i)=>q.map((v,k)=>v+g.vertices[i][k]/f.ids.length),[0,0,0]);if(normal.reduce((v,n,i)=>v+n*(fc[i]-center[i]),0)<0)normal=normal.map(v=>-v);
 if(st.height===0||rotate(normal,st)[2]>.00001)front.push({...f,index,depth:f.ids.reduce((v,i)=>v+pts[i][2],0)/f.ids.length});
 });
 front.sort((a,b)=>a.depth-b.depth);const edges=new Map(),vertices=new Set();
 function bind(node,kind,id){if(!interactive)return;node.classList.add('component');node.setAttribute('role','button');node.setAttribute('tabindex','0');node.setAttribute('aria-label',({base:'Base',lateral:'Cara lateral',edge:'Arista',vertex:'Vértice'})[kind]);const act=e=>{e.stopPropagation();if(dragMoved)return;stop();selected=s.id;part=kind;component=id;render();};node.addEventListener('click',act);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act(e);}});}
 for(const f of front){const active=interactive&&isSelected&&part===f.kind&&(component===null||component==='f'+f.index);const poly=el('polygon',{points:f.ids.map(i=>xy(i).join(',')).join(' '),fill:active?'#f7d47c':f.kind==='base'?'#c5dda0':`hsl(104 28% ${57+f.index%3*8}%)`,stroke:'#4c7051','stroke-width':1.8,'stroke-linejoin':'round'});bind(poly,f.kind,'f'+f.index);svg.append(poly);f.ids.forEach((a,i)=>{const b=f.ids[(i+1)%f.ids.length];edges.set([a,b].sort((a,b)=>a-b).join('-'),[a,b]);vertices.add(a);});}
 for(const [id,[a,b]]of edges){const active=interactive&&isSelected&&part==='edge'&&(component===null||component===id);const [x1,y1]=xy(a),[x2,y2]=xy(b);svg.append(el('line',{x1,y1,x2,y2,stroke:active?'#a6602f':'#4c7051','stroke-width':active?5:2,'pointer-events':'none','stroke-linecap':'round'}));if(interactive){const hit=el('line',{x1,y1,x2,y2,stroke:'transparent','stroke-width':15});bind(hit,'edge',id);svg.append(hit);}}
 for(const id of vertices){const [cx,cy]=xy(id);const active=interactive&&isSelected&&part==='vertex'&&(component===null||component===String(id));if(interactive){const point=el('circle',{cx,cy,r:active?7:4,fill:active?'#a6602f':'#4c7051',stroke:'white','stroke-width':1.5,'pointer-events':'none'});svg.append(point);const hit=el('circle',{cx,cy,r:11,fill:'transparent'});bind(hit,'vertex',String(id));svg.append(hit);}}

 if(isSelected&&part){
 let ids=null;
 if(part==='base'||part==='lateral'){const f=front.find(f=>f.kind===part&&(component===null||component==='f'+f.index));if(f)ids=f.ids;}
 if(part==='edge'){const edge=[...edges].find(([id])=>component===null||component===id);if(edge)ids=edge[1];}
 if(part==='vertex'){const vertex=[...vertices].find(id=>component===null||component===String(id));if(vertex!==undefined)ids=[vertex];}
 if(ids){const anchor=ids.reduce((a,i)=>a.map((v,k)=>v+xy(i)[k]/ids.length),[0,0]);const label=st.height===0?({base:'Polígono',edge:'Lado',vertex:'Vértice'})[part]:({base:'Base',lateral:'Cara lateral',edge:'Arista',vertex:'Vértice'})[part];const w=label.length*9+30;const group=el('g',{'pointer-events':'none','aria-hidden':'true'});group.append(el('line',{x1:220,y1:44,x2:anchor[0],y2:anchor[1],stroke:'#986132','stroke-width':2,'stroke-dasharray':'4 3'}));group.append(el('rect',{x:220-w/2,y:10,width:w,height:34,rx:12,fill:'#fff2c6',stroke:'#a6602f'}));const text=el('text',{x:220,y:33,'text-anchor':'middle',fill:'#76502f','font-size':18,'font-weight':700});text.textContent=label;group.append(text);svg.append(group);}
 }
}
function selectFigure(id){if(selected!==id){part=null;component=null;}selected=id;}
function buildGallery(){
 const gallery=$('gallery');gallery.replaceChildren();
 items().forEach((s,index)=>{
 const card=document.createElement('article');card.className='figure-card';card.dataset.id=s.id;
 card.innerHTML=`<details class="figure-name"><summary>Nombre ${category==='prisma'?'del prisma':'de la pirámide'}</summary><strong>${name(s)}</strong></details>
 <svg viewBox="0 0 440 310" aria-label="Figura ${index+1}: arrastra para girar y toca sus partes"></svg>
 <div class="local-controls"><div class="range-labels"><label for="height-${s.id}">De 2D a 3D</label><output class="height-value"></output></div>
 <input id="height-${s.id}" type="range" min="0" max="100" value="0" aria-label="Construcción de la figura ${index+1}">
 <div class="action-row"><button class="primary local-animate">▶ Construir</button><button class="secondary local-reset">Volver a 2D</button></div>
 <div class="rotate-row"><span>Girar</span><button data-rotate="left" aria-label="Girar a la izquierda">↶</button><button data-rotate="right" aria-label="Girar a la derecha">↷</button><button data-rotate="up" aria-label="Girar hacia arriba">↑</button><button data-rotate="down" aria-label="Girar hacia abajo">↓</button></div></div>`;
 const model=card.querySelector('svg');
 model.addEventListener('click',e=>{if(dragMoved||e.target.closest('.component'))return;stop();selectFigure(s.id);part=null;component=null;render();});
 card.querySelector('input').oninput=e=>{stop();selectFigure(s.id);current().height=Number(e.target.value)/100;render();};
 card.querySelector('.local-animate').onclick=()=>{selectFigure(s.id);animate();};
 card.querySelector('.local-reset').onclick=()=>{stop();selectFigure(s.id);current().height=0;part=null;component=null;render();};
 card.querySelectorAll('[data-rotate]').forEach(button=>button.onclick=()=>{stop();selectFigure(s.id);const st=current(),direction=button.dataset.rotate;if(['left','right'].includes(direction))st.ry+=direction==='left'?-.3:.3;else st.rx+=direction==='up'?-.3:.3;render();});
 attachDrag(model,s.id);gallery.append(card);
 });
}
function render(){for(const card of $('gallery').children){const s=specs.find(s=>s.id===card.dataset.id);const state=states[category+s.id]||{height:0,rx:-.5,ry:.55};renderModel(card.querySelector('svg'),s,state,true);card.classList.toggle('selected',s.id===selected);card.querySelector('input').value=Math.round(state.height*100);card.querySelector('output').textContent=Math.round(state.height*100)+' %';}}

function changeCategory(value){stop();category=value;if(!items().some(s=>s.id===selected))selected='triangular';part=null;component=null;document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===value);b.setAttribute('aria-pressed',b.dataset.category===value);});$('family-title').textContent=category==='prisma'?'La familia de los prismas':'La familia de las pirámides';$('family-description').textContent=category==='prisma'?'Estira un polígono y observa cómo se forma un prisma.':'Levanta una punta sobre un polígono y observa cómo se forma una pirámide.';$('family-note').innerHTML=category==='prisma'?'<strong>Busca las dos bases.</strong> Son iguales y paralelas. Las caras laterales de estos prismas son rectángulos.':'<strong>Busca la punta.</strong> Las caras laterales son triángulos que se juntan en un mismo vértice.';buildGallery();render();}
function stop(){cancelAnimationFrame(animation);animation=0;}
function animate(all=false){stop();part=null;component=null;const targets=all?items().map(s=>states[category+s.id]??(states[category+s.id]={height:0,rx:-.5,ry:.55})):[current()];const start=performance.now();targets.forEach(st=>st.height=0);const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1500;function step(now){const t=duration?Math.min(1,(now-start)/duration):1;targets.forEach(st=>st.height=t*t*(3-2*t));render();if(t<1)animation=requestAnimationFrame(step);else animation=0;}animation=requestAnimationFrame(step);}
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>changeCategory(b.dataset.category));$('all-animate').onclick=()=>animate(true);
let drag=null,dragMoved=false;
function attachDrag(model,id){model.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,id};dragMoved=false;});model.addEventListener('pointermove',e=>{if(!drag||drag.id!==id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!dragMoved&&Math.abs(dx)+Math.abs(dy)<5)return;dragMoved=true;stop();if(selected!==id){selected=id;part=null;component=null;}model.setPointerCapture(e.pointerId);current().ry+=dx*.01;current().rx-=dy*.01;drag={x:e.clientX,y:e.clientY,id};render();});model.addEventListener('pointerup',()=>{drag=null;setTimeout(()=>dragMoved=false,0);});model.addEventListener('pointercancel',()=>{drag=null;dragMoved=false;});}

changeCategory('prisma');
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'explorar_cuerpo',description:'Selecciona una figura y su avance de construcción en la aplicación.',inputSchema:{type:'object',properties:{categoria:{type:'string',enum:['prisma','piramide']},figura:{type:'string',enum:specs.map(s=>s.id)},avance:{type:'number',minimum:0,maximum:100}},required:['categoria','figura','avance'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!['prisma','piramide'].includes(input.categoria)||!specs.some(s=>s.id===input.figura)||(input.categoria==='piramide'&&input.figura==='rectangular')||!Number.isFinite(input.avance)||input.avance<0||input.avance>100)throw new Error('Figura o avance no válido');changeCategory(input.categoria);selected=input.figura;current().height=input.avance/100;render();return {categoria:category,figura:selected,avance:input.avance};}})).catch(()=>{});}catch{}}
