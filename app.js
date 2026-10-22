'use strict';
const KEY='treinos-db-v1',RKEY='treinos-rest-v1';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dkey(new Date());
const fmtDate=s=>{const[y,m,d]=s.slice(0,10).split('-');return d+'/'+m+'/'+y};
const fmtRel=iso=>{const d=new Date(iso),t=new Date();const diff=Math.round((new Date(dkey(t))-new Date(dkey(d)))/864e5);return diff===0?'Hoje':diff===1?'Ontem':diff<7?`Há ${diff} dias`:fmtDate(dkey(d))};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).trim().toLowerCase();
const $=s=>document.querySelector(s);
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const fmtL=ml=>ml>=1000?(ml/1000).toFixed(ml%1000?1:0).replace('.',',')+' L':ml+' ml';

const I={
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 dumb:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 drop:'<path d="M12 2.7S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.7 12 2.7z"/>',
 pill:'<path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7zM7 10l7 7"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 chev:'<path d="M9 5l7 7-7 7"/>',
 play:'<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
 timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
 up:'<path d="M12 19V5M6 11l6-6 6 6"/>',down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
 body:'<circle cx="12" cy="4.5" r="2"/><path d="M5 8.5h14M12 8.5V14m0 0-3.5 7M12 14l3.5 7"/>',
 trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
 plate:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
 share:'<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/>',
 trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
 box:'<path d="M12 3v12M7 10l5 5 5-5M4 17v3h16v-3"/>'
};
const ic=(n,c='')=>`<svg viewBox="0 0 24 24" class="${c}">${I[n]}</svg>`;

function defaults(){return{fichas:[],sessions:[],active:null,water:{goal:3000,log:{}},supl:{list:['Multivitamínico','Creatina'],log:{}},settings:{rest:true,restSec:90,weekGoal:5,loadInc:2.5,bar:20,plates:[25,20,15,10,5,2.5,1.25]},body:[]}}
let db;
function load(raw){const d=Object.assign(defaults(),raw||{});const D=defaults();d.water=Object.assign(D.water,d.water);d.supl=Object.assign(D.supl,d.supl);d.settings=Object.assign(D.settings,d.settings);if(!Array.isArray(d.body))d.body=[];return d}
try{db=load(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){db=defaults()}
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const buzz=(ms=10)=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
function toast(t){const o=$('#toast');o&&o.remove();const d=document.createElement('div');d.id='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}

function lastSets(name){
  for(let i=db.sessions.length-1;i>=0;i--){
    const ex=db.sessions[i].exercises.find(e=>norm(e.name)===norm(name));
    if(ex&&ex.sets.some(s=>s.done))return{date:db.sessions[i].date,sets:ex.sets.filter(s=>s.done)};
  }return null;
}

// ---------- routing ----------
const TABS=[['home','Início','home'],['fichas','Treinos','dumb'],['historico','Histórico','chart'],['diario','Diário','drop'],['corpo','Corpo','body']];
let diarioSeg='agua';
$('#tabs').innerHTML=TABS.map(([k,l,i])=>`<button data-tab="${k}">${ic(i)}<span>${l}</span></button>`).join('');
let tab='home',sub=null,stack=[];
function go(t,s=null,push=false){if(t==='agua'||t==='supl'){diarioSeg=t;t='diario'}if(push)stack.push([tab,sub]);else stack=[];tab=t;sub=s;render();window.scrollTo(0,0)}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{buzz();go(b.dataset.tab)});
$('#back').onclick=()=>{const p=stack.pop();if(p){tab=p[0];sub=p[1]}else sub=null;render();window.scrollTo(0,0)};
addEventListener('scroll',()=>$('#nav').classList.toggle('scrolled',scrollY>30),{passive:true});
function render(){
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  $('#back').classList.toggle('hidden',!sub);$('#navright').innerHTML='';
  const v=$('#view');v.style.animation='none';v.offsetHeight;v.style.animation='';
  const views={home:vHome,fichas:sub?.edit!==undefined?vEdit:sub?.session?vSession:vFichas,historico:sub?.ex?vExHist:vHist,agua:vAgua,supl:vSupl,diario:v=>(diarioSeg==='agua'?vAgua:vSupl)(v),corpo:vBody,config:vConfig};
  views[sub?.config?'config':tab](v);
  if(tab==='diario'&&!sub){const h=v.querySelector('.lt');h.insertAdjacentHTML('afterend',`<div class="seg" style="margin:-6px 0 16px"><button data-dg="agua" class="${diarioSeg==='agua'?'on':''}">Água</button><button data-dg="supl" class="${diarioSeg==='supl'?'on':''}">Suplementos</button></div>`);v.querySelectorAll('[data-dg]').forEach(b=>b.onclick=()=>{diarioSeg=b.dataset.dg;buzz();render()})}
  renderRest();
}
const head=(t,s)=>{$('#smalltitle').textContent=t;return`<h1 class="lt">${esc(t)}</h1>${s?`<p class="sub">${s}</p>`:''}`};
const navRight=h=>{$('#navright').innerHTML=h};
const empty=(i,t,d,btn='')=>`<div class="empty"><div class="ei">${ic(i)}</div><h3>${t}</h3><p>${d}</p>${btn}</div>`;
function ring(p,size,stroke,inner,cls='',col=''){const r=(size-stroke)/2,c=2*Math.PI*r;return`<div class="ring ${cls}" style="width:${size}px;height:${size}px${col?';--water:'+col:''}"><svg viewBox="0 0 ${size} ${size}"><circle class="bgc" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"/><circle class="fg" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-Math.min(p,1))}"/></svg><div class="in">${inner}</div></div>`}

function weekStart(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function sessDays(){return new Set(db.sessions.map(s=>dkey(new Date(s.date))))}
function weekCard(){
  const goal=db.settings.weekGoal||5,days=sessDays(),ws=weekStart(new Date()),tk=today(),L=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  let n=0;const pills=L.map((l,i)=>{const d=new Date(ws);d.setDate(d.getDate()+i);const k=dkey(d),done=days.has(k);if(done)n++;
    const cls=(done?'done ':'')+(k===tk?'today':k>tk?'fut':'');return`<div class="wd ${cls}"><span>${l}</span><i>${done?ic('check'):d.getDate()}</i></div>`}).join('');
  let streak=0;const w=new Date(ws);if(n<goal)w.setDate(w.getDate()-7);
  for(let g=0;g<520;g++){let c=0;for(let i=0;i<7;i++){const d=new Date(w);d.setDate(d.getDate()+i);if(days.has(dkey(d)))c++}if(c>=goal){streak++;w.setDate(w.getDate()-7)}else break}
  return`<div class="card" id="wk"><div class="row"><div class="grow"><div class="t3" style="text-transform:uppercase;letter-spacing:.04em;font-weight:600">Esta semana</div><div class="title num" style="font-size:22px">${n} de ${goal} treinos</div></div>${n>=goal?'<span class="chip" style="background:var(--acc-d);color:var(--acc)">Meta batida</span>':''}</div>
  <div class="prog mt"><div style="width:${Math.min(1,n/goal)*100}%"></div></div><div class="wdays">${pills}</div>
  ${streak?`<div class="t2 mt" style="font-size:14px">🔥 Semanas seguidas batendo a meta: <b style="color:var(--txt)">${streak}</b></div>`:''}</div>`;
}
// ---------- Home ----------
function vHome(v){
  const t=today(),ml=db.water.log[t]||0,g=db.water.goal,taken=(db.supl.log[t]||[]).filter(n=>db.supl.list.includes(n));
  const last=db.sessions[db.sessions.length-1];
  const h=new Date().getHours(),greet=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const dstr=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  // suggest next ficha: the one after last session's ficha
  let next=db.fichas[0];if(last&&db.fichas.length){const i=db.fichas.findIndex(f=>f.id===last.fichaId);if(i>=0)next=db.fichas[(i+1)%db.fichas.length]}
  navRight(`<button class="navbtn" id="cfg" aria-label="Ajustes">${ic('gear')}</button>`);
  let hero;
  if(db.active)hero=`<div class="card hero press" id="resume"><div class="k">Em andamento</div><div class="title" style="font-size:22px;margin:4px 0 2px">${esc(db.active.fichaName)}</div><div class="t2">Iniciado ${new Date(db.active.date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div><button class="btn pri mt">${ic('play')}Continuar treino</button></div>`;
  else if(next)hero=`<div class="card hero"><div class="k">Próximo treino</div><div class="title" style="font-size:22px;margin:4px 0 2px">${esc(next.name)}</div><div class="t2 ell">${next.exercises.length} exercício${next.exercises.length===1?"":"s"} · ${next.exercises.map(e=>esc(e.name)).join(', ')||'—'}</div><button class="btn pri mt" data-start="${next.id}">${ic('play')}Iniciar treino</button></div>`;
  else hero=`<div class="card hero"><div class="k">Comece aqui</div><div class="title" style="font-size:22px;margin:4px 0 2px">Crie sua primeira ficha</div><div class="t2">Monte seu Treino A, B, C com exercícios, séries e repetições.</div><button class="btn pri mt" id="newf">${ic('plus')}Nova ficha</button></div>`;
  const sp=db.supl.list.length?taken.length/db.supl.list.length:0;
  v.innerHTML=head(greet+', Roberto',dstr.charAt(0).toUpperCase()+dstr.slice(1))+weekCard()+hero+
  `<div class="grid2"><div class="card stat press" id="hw">${ring(ml/g,110,11,`<div class="v num">${Math.round(ml/g*100)}%</div><div class="t3">${fmtL(ml)}</div>`)}<div class="title mt" style="font-size:15px">Água</div><div class="t3">Meta ${fmtL(g)}</div></div>
  <div class="card stat press" id="hs">${ring(sp,110,11,`<div class="v num">${taken.length}/${db.supl.list.length}</div><div class="t3">tomados</div>`,'','#30d158')}<div class="title mt" style="font-size:15px">Suplementos</div><div class="t3">${sp>=1?'Tudo certo hoje':'Faltam '+(db.supl.list.length-taken.length)}</div></div></div>`+
  `<div class="list"><div class="li press" id="hbody"><div class="ico b">${ic('body')}</div><div class="grow"><div class="title">Corpo</div><div class="t3">${(()=>{const w=[...db.body].sort((a,b)=>a.date.localeCompare(b.date)).reverse().find(x=>x.weight);return w?'Peso '+fmtKg(w.weight)+' kg · '+fmtDate(w.date):'Registrar peso e medidas'})()}</div></div>${ic('chev','chev')}</div><div class="li press" id="hvol"><div class="ico g">${ic('trend')}</div><div class="grow"><div class="title">Volume por músculo</div><div class="t3">Séries desta semana</div></div>${ic('chev','chev')}</div></div>`+`<div class="sec">Último treino</div>`+(last?`<div class="list"><div class="li press" data-sess="${last.id}"><div class="ico g">${ic('dumb')}</div><div class="grow"><div class="title ell">${esc(last.fichaName)}</div><div class="t2">${fmtRel(last.date)} · ${last.exercises.filter(e=>e.sets.some(x=>x.done)).length} exercícios · ${Math.round(vol(last))} kg volume</div></div>${ic('chev','chev')}</div></div>`:`<div class="card t2">Nenhum treino registrado ainda.</div>`);
  $('#hbody').onclick=()=>go('corpo');$('#hvol').onclick=()=>{go('historico');setTimeout(()=>$('#volcard')?.scrollIntoView({behavior:'smooth',block:'center'}),50)};
  $('#cfg').onclick=()=>go('home',{config:1},true);
  $('#hw').onclick=()=>(diarioSeg='agua',go('diario'));$('#hs').onclick=()=>(diarioSeg='supl',go('diario'));
  $('#resume')&&($('#resume').onclick=()=>go('fichas',{session:1}));
  $('#newf')&&($('#newf').onclick=()=>go('fichas',{edit:null}));
  bindStart(v);v.querySelectorAll('[data-sess]').forEach(b=>b.onclick=()=>go('historico'));
}
const vol=s=>s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.done).reduce((b,x)=>b+(+x.kg||0)*(+x.reps||0),0),0);
function bindStart(v){v.querySelectorAll('[data-start]').forEach(b=>b.onclick=e=>{e.stopPropagation();
  if(db.active&&!confirm('Já existe um treino em andamento. Descartar e iniciar outro?'))return;
  buzz(15);startSession(b.dataset.start);go('fichas',{session:1})})}

const PRESET_NAME='Hipertrofia 5 dias (foco tronco)';
const PRESET=[
['Dia 1 - Push','Supino reto com barra 4x6-8;Supino inclinado com halteres 3x8-10;Desenvolvimento com halteres 3x8-10;Crucifixo no cross over 3x12-15;Elevação lateral 4x12-15;Tríceps na polia com corda 3x10-12'],
['Dia 2 - Pull','Barra fixa ou puxada aberta 4x6-10;Remada curvada com barra 4x8-10;Remada baixa no triângulo 3x10-12;Pullover na polia 3x12-15;Crucifixo inverso 3x12-15;Rosca direta com barra 3x8-10'],
['Dia 3 - Pernas','Agachamento livre 4x6-8;Leg press 3x10-12;Stiff 3x8-10;Cadeira extensora 3x12-15;Mesa flexora 3x10-12;Panturrilha em pé 4x10-15'],
['Dia 4 - Upper','Supino inclinado com barra 4x6-8;Remada unilateral com halter 3x8-10;Supino reto com halteres 3x8-10;Puxada fechada 3x10-12;Peck deck 3x12-15;Face pull 3x15'],
['Dia 5 - Ombros e Braços','Desenvolvimento militar 4x6-8;Elevação lateral na polia 4x12-15;Crucifixo inverso na máquina 3x12-15;Rosca alternada com halteres 3x10-12;Tríceps francês 3x10-12;Rosca martelo 3x10-12;Tríceps testa 3x10-12']];
function loadPreset(){
  if(!confirm('Adicionar as 5 fichas do programa "'+PRESET_NAME+'"? Suas fichas e histórico atuais são mantidos.'))return;
  let added=0;
  PRESET.forEach(([name,list])=>{
    if(db.fichas.some(f=>norm(f.name)===norm(name)))return;
    db.fichas.push({id:uid(),name,exercises:list.split(';').map(x=>{const m=x.trim().match(/^(.*) (\d+)x(\S+)$/);return{id:uid(),name:m[1],sets:+m[2],reps:m[3]}})});added++;
  });
  save();buzz(20);toast(added?`Programa carregado: ${added} ficha${added>1?'s':''} adicionada${added>1?'s':''}`:'Essas fichas já existem');render();
}
const presetBtn=(cls='btn tint mt')=>`<button class="${cls}" data-preset>${ic('box')}Carregar programa: ${PRESET_NAME}</button>`;
const bindPreset=v=>v.querySelectorAll('[data-preset]').forEach(b=>b.onclick=loadPreset);
// ---------- Fichas ----------
function vFichas(v){
  navRight(`<button class="navbtn" id="new">${ic('plus')}</button>`);
  let h=head('Treinos');
  if(db.active)h+=`<div class="card hero press" id="resume"><div class="k">Em andamento</div><div class="title" style="font-size:20px;margin-top:4px">${esc(db.active.fichaName)}</div><button class="btn pri mt">${ic('play')}Continuar treino</button></div>`;
  if(!db.fichas.length)h+=empty('dumb','Nenhuma ficha ainda','Crie fichas como Treino A, B e C para começar a registrar suas cargas.',`<button class="btn pri mt2" id="new2">${ic('plus')}Criar ficha</button>`+presetBtn());
  else h+=`<div class="sec">Minhas fichas</div>`+db.fichas.map(f=>{const ls=[...db.sessions].reverse().find(s=>s.fichaId===f.id);return`<div class="card"><div class="row"><div class="grow"><div class="title" style="font-size:19px">${esc(f.name)}</div><div class="t3">${f.exercises.length} exercícios${ls?' · último '+fmtRel(ls.date).toLowerCase():''}</div></div><button class="link" data-edit="${f.id}">Editar</button></div>
  <div class="t2 mt" style="font-size:14px">${f.exercises.map(e=>`${esc(e.name)} <span class="t3">${e.sets}×${esc(e.reps)}</span>`).join('<br>')||'Sem exercícios'}</div>
  <button class="btn tint mt" data-start="${f.id}">${ic('play')}Iniciar</button></div>`}).join('')+`<div class="sec">Programas prontos</div>`+presetBtn('btn');
  v.innerHTML=h;
  const nf=()=>go('fichas',{edit:null},true);$('#new').onclick=nf;$('#new2')&&($('#new2').onclick=nf);
  $('#resume')&&($('#resume').onclick=()=>go('fichas',{session:1},true));
  v.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>go('fichas',{edit:b.dataset.edit},true));
  bindStart(v);bindPreset(v);
}
function startSession(fid){
  const f=db.fichas.find(x=>x.id===fid);
  db.active={id:uid(),fichaId:f.id,fichaName:f.name,date:new Date().toISOString(),exercises:f.exercises.map(e=>{
    const last=lastSets(e.name);const n=Math.max(+e.sets||1,1);
    return{name:e.name,muscle:e.muscle||autoMuscle(e.name),target:e.reps,sets:Array.from({length:n},(_,i)=>{const l=last?.sets[i]||last?.sets[last.sets.length-1];return{kg:l?l.kg:'',reps:l?l.reps:(parseInt(e.reps)||''),done:false}})};
  })};save();
}
function vEdit(v){
  const f=sub.edit?structuredClone(db.fichas.find(x=>x.id===sub.edit)):{id:uid(),name:'',exercises:[]};
  const draw=()=>{
    v.innerHTML=head(sub.edit?'Editar ficha':'Nova ficha')+`<label class="f">Nome da ficha</label><input id="fn" value="${esc(f.name)}" placeholder="Ex.: Treino A – Peito e Tríceps">
    <div class="sec">Exercícios</div>${f.exercises.map((e,i)=>`<div class="card"><div class="row"><span class="t3 num" style="width:20px">${i+1}</span><input class="grow" data-i="${i}" data-k="name" value="${esc(e.name)}" placeholder="Nome do exercício"></div>
    <div class="row mt"><span style="width:20px"></span><div class="grow"><label class="f">Séries</label><input data-i="${i}" data-k="sets" type="number" inputmode="numeric" value="${esc(e.sets)}"></div><div class="grow"><label class="f">Repetições</label><input data-i="${i}" data-k="reps" value="${esc(e.reps)}" placeholder="10 ou 8-12"></div></div>
    <div class="row mt"><span style="width:20px"></span><div class="grow"><label class="f">Músculo</label><select data-i="${i}" data-k="muscle"><option value="">Automático${autoMuscle(e.name)?' ('+autoMuscle(e.name)+')':''}</option>${MUSCLES.map(m=>`<option ${e.muscle===m?'selected':''}>${m}</option>`).join('')}</select></div></div>
    <div class="row mt"><span style="width:20px"></span><button class="btn sm" data-up="${i}" aria-label="Subir">${ic('up')}</button><button class="btn sm" data-dn="${i}" aria-label="Descer">${ic('down')}</button><span class="grow"></span><button class="link red" data-rm="${i}">Remover</button></div></div>`).join('')||'<p class="t2" style="padding:0 16px 8px">Adicione os exercícios desta ficha.</p>'}
    <button class="btn tint" id="add">${ic('plus')}Adicionar exercício</button><button class="btn pri mt" id="sv">Salvar ficha</button>${sub.edit?`<button class="btn danger mt2" id="del">${ic('trash')}Excluir ficha</button>`:''}`;
    $('#fn').oninput=e=>f.name=e.target.value;
    v.querySelectorAll('input[data-i],select[data-i]').forEach(inp=>inp.oninput=inp.onchange=()=>f.exercises[inp.dataset.i][inp.dataset.k]=inp.value);
    v.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{f.exercises.splice(+b.dataset.rm,1);draw()});
    v.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.up;if(i>0){[f.exercises[i-1],f.exercises[i]]=[f.exercises[i],f.exercises[i-1]];draw()}});
    v.querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>{const i=+b.dataset.dn;if(i<f.exercises.length-1){[f.exercises[i+1],f.exercises[i]]=[f.exercises[i],f.exercises[i+1]];draw()}});
    $('#add').onclick=()=>{f.exercises.push({id:uid(),name:'',sets:3,reps:'10'});draw();const ins=v.querySelectorAll('input[data-k=name]');ins[ins.length-1].focus()};
    $('#sv').onclick=()=>{
      f.name=f.name.trim()||'Ficha sem nome';f.exercises=f.exercises.filter(e=>e.name.trim());f.exercises.forEach(e=>{e.name=e.name.trim();e.sets=Math.max(parseInt(e.sets)||3,1)});
      const i=db.fichas.findIndex(x=>x.id===f.id);i>=0?db.fichas[i]=f:db.fichas.push(f);save();buzz();toast('Ficha salva');go('fichas');
    };
    sub.edit&&($('#del').onclick=()=>{if(confirm('Excluir esta ficha? O histórico de treinos é mantido.')){db.fichas=db.fichas.filter(x=>x.id!==f.id);save();go('fichas')}});
  };draw();
}
let clock;
function vSession(v){
  const s=db.active;if(!s)return go('fichas');
  const doneN=()=>s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.done).length,0),totN=()=>s.exercises.reduce((a,e)=>a+e.sets.length,0);
  navRight(`<button class="btn pri sm" id="fin2" style="margin-right:8px">Finalizar</button>`);
  v.innerHTML=head(s.fichaName)+`<div class="sesshead"><span>${ic('timer')} <b id="el">0:00</b></span><span>Séries <b id="sd">${doneN()}/${totN()}</b></span><span>Volume <b id="sv">${Math.round(vol(s))} kg</b></span></div>`+
  s.exercises.map((e,ei)=>{const last=lastSets(e.name),sg=suggestion(e);
    return`<div class="card ex"><h3>${esc(e.name)}</h3><div class="t3">${e.target?'Meta '+esc(e.target)+' reps · ':''}${last?'Último treino '+fmtRel(last.date).toLowerCase():'Primeira vez'}</div>
    ${sg?(sg.up?`<div class="hint up">${ic('trend')}<span class="grow">Bateu ${sg.top} reps em todas. <b>Tente ${fmtKg(sg.kg)} kg</b></span><button class="btn sm pri" data-sg="${ei}" data-kg="${sg.kg}">Aplicar</button></div>`:`<div class="hint">${ic('timer')}<span class="grow">Mantenha ${fmtKg(sg.kg)} kg, busque +1 rep (meta ${sg.top})</span></div>`):''}
    <div class="sets"><div class="sr h"><span>#</span><span>Anterior</span><span>kg</span><span>Reps</span><span></span><span></span></div>
    ${e.sets.map((st,si)=>{const l=last?.sets[si];return`<div class="sr ${st.done?'done':''} ${st.pr?'pr':''}" id="r${ei}_${si}"><span class="n">${si+1}</span>
      <span class="prev">${l?`<b>${esc(l.kg)}</b>kg × <b>${esc(l.reps)}</b>`:'—'}</span>
      <input type="number" inputmode="decimal" step="0.5" placeholder="kg" data-e="${ei}" data-s="${si}" data-k="kg" value="${esc(st.kg)}" aria-label="kg">
      <input type="number" inputmode="numeric" placeholder="reps" data-e="${ei}" data-s="${si}" data-k="reps" value="${esc(st.reps)}" aria-label="reps">
      <button class="pl" data-pl="${ei},${si}" aria-label="Calculadora de anilhas">${ic('plate')}</button>
      <button class="ck" data-ok="${ei},${si}" aria-label="Concluir série">${ic('check')}</button></div>`}).join('')}</div>
    <div class="row mt"><button class="btn sm tint" data-add="${ei}">${ic('plus')}Série</button><span class="grow"></span>${e.sets.length>1?`<button class="link red" data-rem="${ei}">Remover série</button>`:''}</div></div>`}).join('')+
  `<button class="btn pri mt" id="fin">Finalizar treino</button><button class="btn danger mt" id="cancel">Descartar treino</button>`;
  const upd=()=>{$('#sd').textContent=doneN()+'/'+totN();$('#sv').textContent=Math.round(vol(s))+' kg'};
  clearInterval(clock);const tick=()=>{const e=$('#el');if(!e)return clearInterval(clock);e.textContent=mmss((Date.now()-new Date(s.date))/1000).replace(/^(\d+):/,(m,a)=>a>=60?Math.floor(a/60)+'h'+String(a%60).padStart(2,'0')+':':m)};tick();clock=setInterval(tick,1000);
  v.querySelectorAll('input[data-e]').forEach(i=>{i.oninput=()=>{s.exercises[i.dataset.e].sets[i.dataset.s][i.dataset.k]=i.value===''?'':+i.value;save();upd()};i.onfocus=()=>i.select()});
  v.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{const[e,i]=b.dataset.ok.split(',');const st=s.exercises[e].sets[i];st.done=!st.done;save();
    $('#r'+e+'_'+i).classList.toggle('done',st.done);upd();
    const ex=s.exercises[e],base=prMap(db.sessions);ex.sets.forEach((x,j)=>{if(j!==+i&&x.done&&x.pr){/*keep*/}});
    const prior=prMap([...db.sessions,{exercises:[{name:ex.name,sets:ex.sets.filter((x,j)=>j!==+i&&x.done)}]}]);
    const t=st.done?setPRs(ex.name,st,prior):[];st.pr=t.length?t:undefined;save();$('#r'+e+'_'+i).classList.toggle('pr',!!t.length);if(t.length&&base[norm(ex.name)]){toast('🏆 Novo recorde! '+t.join(' · '));buzz([30,50,30])}buzz(st.done?20:8);if(st.done&&db.settings.rest)startRest(db.settings.restSec)});
  v.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{const[e,i]=b.dataset.pl.split(',');plateSheet(s.exercises[e].sets[i].kg)});
  v.querySelectorAll('[data-sg]').forEach(b=>b.onclick=()=>{s.exercises[b.dataset.sg].sets.forEach(x=>{if(!x.done)x.kg=+b.dataset.kg});save();buzz(15);toast('Carga atualizada: '+fmtKg(+b.dataset.kg)+' kg');render()});
  v.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const ss=s.exercises[b.dataset.add].sets;const p=ss[ss.length-1]||{kg:'',reps:''};ss.push({kg:p.kg,reps:p.reps,done:false});save();render()});
  v.querySelectorAll('[data-rem]').forEach(b=>b.onclick=()=>{const ss=s.exercises[b.dataset.rem].sets;if(ss.length>1){ss.pop();save();render()}});
  const fin=()=>{
    const any=s.exercises.some(e=>e.sets.some(x=>x.done));
    if(!any&&!confirm('Nenhuma série marcada com ✓. Salvar todas as séries preenchidas como feitas?'))return;
    s.exercises.forEach(e=>e.sets.forEach(x=>{if(!any&&x.kg!==''&&x.reps!=='')x.done=true}));
    s.end=new Date().toISOString();s.exercises.forEach(e=>e.sets.forEach(x=>delete x.pr));db.sessions.push(s);db.active=null;save();clearRest();buzz(30);go('historico');showSummary(s);
  };$('#fin').onclick=fin;$('#fin2').onclick=fin;
  $('#cancel').onclick=()=>{if(confirm('Descartar este treino?')){db.active=null;save();clearRest();go('fichas')}};
}

// ---------- Músculos ----------
const MUSCLES=['Peito','Costas','Ombros','Bíceps','Tríceps','Quadríceps','Posteriores','Glúteos','Panturrilha','Abdômen'];
const MRULES=[[/panturrilha|gêmeos|soleo|sóleo/,'Panturrilha'],[/abdom|abdôm|prancha|crunch|infra|oblíq/,'Abdômen'],[/tr[ií]ceps|franc[eê]s|testa|mergulho|paralela/,'Tríceps'],[/rosca|b[ií]ceps/,'Bíceps'],
[/stiff|flexora|romeno|posterior de coxa|good morning/,'Posteriores'],[/gl[uú]teo|hip thrust|pélvica|pelvica|abdu[cç]/,'Glúteos'],[/agachamento|leg press|extensora|afundo|hack|búlgaro|bulgaro|passada|sissy/,'Quadríceps'],
[/crucifixo inverso|face pull|eleva[cç][aã]o (lateral|frontal)|desenvolvimento|militar|ombro|arnold|encolhimento/,'Ombros'],[/supino|crucifixo|peck deck|voador|cross ?over|flex[aã]o de bra|peito/,'Peito'],
[/remada|puxada|barra fixa|pullover|pulldown|serrote|terra|costas|graviton/,'Costas']];
const autoMuscle=n=>{n=norm(n);for(const[r,m]of MRULES)if(r.test(n))return m;return''};
function muscleOf(e){if(e.muscle)return e.muscle;for(const f of db.fichas){const x=f.exercises.find(y=>norm(y.name)===norm(e.name));if(x&&x.muscle)return x.muscle}return autoMuscle(e.name)}
function weekVolume(){const ws=weekStart(new Date()),c={};MUSCLES.forEach(m=>c[m]=0);
  db.sessions.forEach(s=>{if(new Date(s.date)<ws)return;s.exercises.forEach(e=>{const m=muscleOf(e);if(m)c[m]+=e.sets.filter(x=>x.done).length})});return c}
function volumeCard(){const c=weekVolume(),mx=Math.max(24,...Object.values(c));
  return`<div class="card" id="volcard"><div class="row"><div class="grow"><div class="title">Séries por músculo</div><div class="t3">Esta semana · faixa ideal 10–20 séries</div></div></div><div class="mv">${MUSCLES.map(m=>{const n=c[m],cls=n>=10&&n<=20?'ok':n>20?'hi':'';return`<div class="mvr"><span class="ml">${m}</span><div class="mt-bar"><div class="band" style="left:${10/mx*100}%;width:${10/mx*100}%"></div><div class="fill ${cls}" style="width:${n/mx*100}%"></div></div><b class="num">${n}</b></div>`}).join('')}</div></div>`}

// ---------- Recordes ----------
const e1rm=(kg,r)=>(+kg||0)*(1+(+r||0)/30);
function prMap(sessions){const m={};sessions.forEach(s=>s.exercises.forEach(e=>e.sets.forEach(x=>{if(!x.done||!(+x.kg))return;const k=norm(e.name),p=m[k]=m[k]||{name:e.name,kg:0,e1rm:0,vol:0,date:s.date};
  if(+x.kg>p.kg)p.kg=+x.kg;const r=e1rm(x.kg,x.reps);if(r>p.e1rm)p.e1rm=r;const v=x.kg*x.reps;if(v>p.vol)p.vol=v;})));return m}
function setPRs(name,x,base){const p=base[norm(name)];if(!p||!x.done||!(+x.kg))return[];const t=[];if(+x.kg>p.kg)t.push('Carga');if(e1rm(x.kg,x.reps)>p.e1rm+.01)t.push('1RM');if(x.kg*x.reps>p.vol)t.push('Volume');return t}
function sessionPRs(s){const base=prMap(db.sessions.filter(o=>o.id!==s.id&&new Date(o.date)<new Date(s.date)));const out=[];
  s.exercises.forEach(e=>{const types=new Set();let best=null;e.sets.forEach(x=>{const t=setPRs(e.name,x,base);t.forEach(y=>types.add(y));if(t.length&&(!best||+x.kg>+best.kg))best=x});if(types.size)out.push({name:e.name,types:[...types],kg:best.kg,reps:best.reps})});return out}
const fmtKg=n=>(Math.round(n*100)/100).toLocaleString('pt-BR');
function prCard(name){const p=prMap(db.sessions)[norm(name)];if(!p)return'';return`<div class="grid3"><div class="card pr"><div class="t3">Carga máx.</div><div class="pv num">${fmtKg(p.kg)}<small>kg</small></div></div><div class="card pr"><div class="t3">1RM estimado</div><div class="pv num">${fmtKg(p.e1rm)}<small>kg</small></div></div><div class="card pr"><div class="t3">Melhor série</div><div class="pv num">${fmtKg(p.vol)}<small>kg</small></div></div></div>`}

// ---------- Sugestão de carga ----------
function suggestion(e){const last=lastSets(e.name);if(!last||!e.target)return null;const m=String(e.target).match(/(\d+)\D*$/);if(!m)return null;const top=+m[1];
  const kg=Math.max(...last.sets.map(x=>+x.kg||0));if(!kg)return null;
  return last.sets.every(x=>+x.reps>=top)?{up:true,kg:Math.round((kg+db.settings.loadInc)*100)/100,top}:{up:false,kg,top}}

// ---------- Sheet / anilhas ----------
function sheet(html,onbind){let o=$('#sheet');o&&o.remove();o=document.createElement('div');o.id='sheet';o.innerHTML=`<div class="sh-bg"></div><div class="sh"><div class="grab"></div>${html}</div>`;document.body.appendChild(o);
  o.querySelector('.sh-bg').onclick=closeSheet;onbind&&onbind(o)}
function closeSheet(){const o=$('#sheet');if(!o)return;o.classList.add('out');setTimeout(()=>o.remove(),220)}
const PCOL={25:'#ff453a',20:'#0a84ff',15:'#ffd60a',10:'#30d158',5:'#f2f2f7',2.5:'#ff9f0a',1.25:'#8e8e93'};
function plates(kg){const st=db.settings;let side=(kg-st.bar)/2;const out=[];if(side<0)return{out,rest:0,neg:true};
  [...st.plates].sort((a,b)=>b-a).forEach(p=>{while(side>=p-1e-9){out.push(p);side=Math.round((side-p)*1000)/1000}});return{out,rest:side}}
function plateSheet(kg){const st=db.settings;kg=+kg||st.bar;
  const draw=o=>{const r=plates(kg);const ALL=[25,20,15,10,5,2.5,1.25];
    o.querySelector('.pc').innerHTML=`<div class="row"><div class="grow"><label class="f">Peso total (kg)</label><input id="pk" type="number" inputmode="decimal" step="0.5" value="${kg}"></div><div style="width:110px"><label class="f">Barra (kg)</label><input id="pb" type="number" inputmode="decimal" value="${st.bar}"></div></div>
    <div class="barviz"><span class="shaft"></span><span class="collar"></span>${r.out.map(p=>`<i style="background:${PCOL[p]||'#aaa'};height:${40+p*3.2}px">${fmtKg(p)}</i>`).join('')}<span class="sleeve"></span></div><div class="t3" style="text-align:center;margin-top:-8px">Um lado da barra (repita no outro)</div>
    <div class="t2" style="text-align:center">${r.neg?'Peso menor que a barra':r.out.length?`Por lado: <b style="color:var(--txt)">${r.out.map(fmtKg).join(' + ')}</b>`:'Só a barra'}${r.rest>0?`<br><span style="color:#ff9f0a">Sobra ${fmtKg(r.rest*2)} kg sem anilha disponível</span>`:''}</div>
    <label class="f mt2">Anilhas disponíveis</label><div class="pchips">${ALL.map(p=>`<button class="chipb ${st.plates.includes(p)?'on':''}" data-p="${p}">${fmtKg(p)}</button>`).join('')}</div>`;
    o.querySelector('#pk').onchange=e=>{kg=+e.target.value||0;draw(o)};o.querySelector('#pb').onchange=e=>{st.bar=+e.target.value||0;save();draw(o)};
    o.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const p=+b.dataset.p,i=st.plates.indexOf(p);i>=0?st.plates.splice(i,1):st.plates.push(p);save();buzz();draw(o)});};
  sheet(`<div class="row"><h2 class="grow" style="font-size:22px">Calculadora de anilhas</h2><button class="link" id="shx">OK</button></div><div class="pc"></div>`,o=>{o.querySelector('#shx').onclick=closeSheet;draw(o)})}

// ---------- Corpo ----------
const BM=[['weight','Peso','kg'],['braco','Braço','cm'],['peito','Peito','cm'],['cintura','Cintura','cm'],['quadril','Quadril','cm'],['coxa','Coxa','cm']];
let bodyMetric='weight';
function lineChart(pts,unit){if(pts.length<1)return'<div class="t2" style="padding:24px 0;text-align:center">Sem dados ainda</div>';const W=340,H=150,P=24;
  const ys=pts.map(p=>p.v),mn=Math.min(...ys),mx=Math.max(...ys),rg=mx-mn||1,t0=new Date(pts[0].d),t1=new Date(pts[pts.length-1].d),tr=(t1-t0)||1;
  const xy=pts.map(p=>[P+(pts.length===1?(W-2*P)/2:(new Date(p.d)-t0)/tr*(W-2*P)),H-P-(p.v-mn)/rg*(H-2*P)]);
  const path=xy.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
  return`<svg viewBox="0 0 ${W} ${H}" class="lc"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#30d158" stop-opacity=".35"/><stop offset="1" stop-color="#30d158" stop-opacity="0"/></linearGradient></defs>
  <path d="${path} L${xy[xy.length-1][0]} ${H-P} L${xy[0][0]} ${H-P}Z" fill="url(#lg)" stroke="none"/><path d="${path}" fill="none" stroke="#30d158" stroke-width="2.5"/>${xy.map(q=>`<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="#30d158" stroke="#1c1c1e" stroke-width="2"/>`).join('')}
  <text x="${P}" y="14" fill="rgba(235,235,245,.6)" font-size="11">${fmtKg(mx)} ${unit}</text><text x="${P}" y="${H-6}" fill="rgba(235,235,245,.6)" font-size="11">${fmtKg(mn)} ${unit}</text></svg>`}
function vBody(v){
  const list=[...db.body].sort((a,b)=>a.date.localeCompare(b.date));const lastW=[...list].reverse().find(x=>x.weight);
  const [k,l,u]=BM.find(m=>m[0]===bodyMetric);const pts=list.filter(x=>x[k]).map(x=>({d:x.date,v:+x[k]}));
  const delta=pts.length>1?pts[pts.length-1].v-pts[0].v:0;
  v.innerHTML=head('Corpo',lastW?`Peso atual ${fmtKg(lastW.weight)} kg`:'Registre peso e medidas')+
  `<div class="card"><div class="seg bm">${BM.map(m=>`<button data-m="${m[0]}" class="${m[0]===k?'on':''}">${m[1]}</button>`).join('')}</div>
  <div class="row mt"><div class="grow"><div class="title num" style="font-size:28px">${pts.length?fmtKg(pts[pts.length-1].v)+' '+u:'—'}</div><div class="t3">${l}${pts.length>1?` · ${delta>0?'+':''}${fmtKg(delta)} ${u} desde ${fmtDate(pts[0].d)}`:''}</div></div></div>${lineChart(pts,u)}</div>
  <div class="sec">Novo registro</div><div class="card"><label class="f">Data</label><input id="bd" type="date" value="${today()}">
  <div class="bgrid mt">${BM.map(m=>`<div><label class="f">${m[1]} (${m[2]})</label><input id="b_${m[0]}" type="number" inputmode="decimal" step="0.1" placeholder="—"></div>`).join('')}</div>
  <button class="btn pri mt" id="bsv">Salvar registro</button></div>
  <div class="sec">Histórico</div>${list.length?`<div class="list">${[...list].reverse().map(x=>`<div class="li"><div class="grow"><div class="title">${fmtDate(x.date)}</div><div class="t3">${BM.filter(m=>x[m[0]]).map(m=>`${m[1]} ${fmtKg(x[m[0]])}${m[2]==='kg'?' kg':''}`).join(' · ')}</div></div><button class="link red" data-bdel="${x.id}">${ic('trash')}</button></div>`).join('')}</div>`:empty('body','Nenhum registro','Anote seu peso e medidas para acompanhar a evolução.')}`;
  v.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{bodyMetric=b.dataset.m;buzz();render()});
  $('#bsv').onclick=()=>{const r={id:uid(),date:$('#bd').value||today()};let any=0;BM.forEach(m=>{const x=parseFloat($('#b_'+m[0]).value);if(x>0){r[m[0]]=x;any=1}});if(!any)return toast('Preencha ao menos um campo');db.body.push(r);save();buzz(20);toast('Registro salvo');render()};
  v.querySelectorAll('[data-bdel]').forEach(b=>b.onclick=()=>{if(confirm('Excluir este registro?')){db.body=db.body.filter(x=>x.id!==b.dataset.bdel);save();render()}});
}

// ---------- Resumo (story) ----------
const COMPARE=[[30000,'baleia jubarte','baleias jubarte','🐋'],[12000,'ônibus','ônibus','🚌'],[6000,'elefante africano','elefantes africanos','🐘'],[1500,'hipopótamo','hipopótamos','🦛'],[1000,'carro popular','carros populares','🚗'],[500,'piano de cauda','pianos de cauda','🎹'],[180,'moto','motos','🏍️'],[80,'geladeira','geladeiras','🧊'],[30,'golden retriever','golden retrievers','🐕']];
function compare(kg){for(const c of COMPARE){const n=kg/c[0];if(n>=1){const r=n>=10?Math.round(n):Math.round(n*10)/10;return{t:`equivale a ${r.toLocaleString('pt-BR')} ${r<2?c[1]:c[2]}`,e:c[3]}}}return{t:'todo começo conta!',e:'💪'}}
function weekStats(){const goal=db.settings.weekGoal||5,days=sessDays(),ws=weekStart(new Date());let n=0;for(let i=0;i<7;i++){const d=new Date(ws);d.setDate(d.getDate()+i);if(days.has(dkey(d)))n++}
  let streak=0;const w=new Date(ws);if(n<goal)w.setDate(w.getDate()-7);for(let g=0;g<520;g++){let c=0;for(let i=0;i<7;i++){const d=new Date(w);d.setDate(d.getDate()+i);if(days.has(dkey(d)))c++}if(c>=goal){streak++;w.setDate(w.getDate()-7)}else break}return{n,goal,streak}}
function sumData(s){const ex=s.exercises.filter(e=>e.sets.some(x=>x.done));const sets=ex.reduce((a,e)=>a+e.sets.filter(x=>x.done).length,0),reps=ex.reduce((a,e)=>a+e.sets.filter(x=>x.done).reduce((b,x)=>b+(+x.reps||0),0),0);
  const dur=s.end?Math.round((new Date(s.end)-new Date(s.date))/60000):null;
  return{total:Math.round(vol(s)),sets,reps,ex:ex.length,dur:dur==null?'—':dur>=60?Math.floor(dur/60)+'h '+String(dur%60).padStart(2,'0')+'min':dur+' min',prs:sessionPRs(s),cmp:compare(vol(s)),wk:weekStats(),
    date:new Date(s.date).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}}
function showSummary(s){const d=sumData(s);let o=$('#sum');o&&o.remove();o=document.createElement('div');o.id='sum';
  o.innerHTML=`<div class="story"><div class="st-brand">${ic('dumb')}<b>Gym App</b></div><div class="st-k">Treino concluído</div><div class="st-f">${esc(s.fichaName)}</div><div class="st-d">${d.date.charAt(0).toUpperCase()+d.date.slice(1)}</div>
  <div class="st-tot"><span id="cu" class="num">0</span><small>kg</small></div><div class="st-lbl">levantados no total</div><div class="st-cmp">${d.cmp.e} ${d.cmp.t}</div>
  <div class="st-grid"><div><b>${d.dur}</b><span>duração</span></div><div><b>${d.ex}</b><span>exercícios</span></div><div><b>${d.sets}</b><span>séries</span></div><div><b>${d.reps}</b><span>reps</span></div></div>
  ${d.prs.length?`<div class="st-prs"><div class="st-k" style="margin:0 0 6px">🏆 ${d.prs.length} novo${d.prs.length>1?'s':''} recorde${d.prs.length>1?'s':''}</div>${d.prs.slice(0,3).map(p=>`<div>${esc(p.name)} · <b>${fmtKg(p.kg)} kg × ${p.reps}</b></div>`).join('')}</div>`:''}
  <div class="st-wk">🔥 ${d.wk.n} de ${d.wk.goal} treinos na semana${d.wk.streak?` · ${d.wk.streak} semana${d.wk.streak>1?'s':''} seguida${d.wk.streak>1?'s':''}`:''}</div></div>
  <div class="st-btns"><button class="btn pri" id="sshare">Compartilhar</button><button class="btn" id="sclose">Fechar</button></div>`;
  document.body.appendChild(o);
  const el=o.querySelector('#cu'),t0=performance.now(),D=1400;const step=t=>{const p=Math.min(1,(t-t0)/D),e=1-Math.pow(1-p,3);el.textContent=Math.round(d.total*e).toLocaleString('pt-BR');if(p<1&&document.body.contains(el))requestAnimationFrame(step)};requestAnimationFrame(step);
  o.querySelector('#sclose').onclick=()=>{o.classList.add('out');setTimeout(()=>o.remove(),250)};
  o.querySelector('#sshare').onclick=()=>shareStory(s);
}
function storyCanvas(s){const d=sumData(s),c=document.createElement('canvas');c.width=1080;c.height=1920;const x=c.getContext('2d');
  let g=x.createLinearGradient(0,0,1080,1920);g.addColorStop(0,'#04140b');g.addColorStop(.45,'#0b4d2a');g.addColorStop(1,'#30d158');x.fillStyle=g;x.fillRect(0,0,1080,1920);
  g=x.createRadialGradient(900,300,0,900,300,700);g.addColorStop(0,'rgba(255,214,10,.28)');g.addColorStop(1,'rgba(255,214,10,0)');x.fillStyle=g;x.fillRect(0,0,1080,1920);
  const F='-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif',T=(t,y,sz,w=700,col='#fff',al='left',xx=96)=>{x.font=`${w} ${sz}px ${F}`;x.fillStyle=col;x.textAlign=al;x.fillText(t,al==='center'?540:xx,y)};
  x.fillStyle='#30d158';x.beginPath();x.roundRect(96,110,76,76,20);x.fill();x.strokeStyle='#002910';x.lineWidth=7;x.lineCap='round';[[118,128,118,168],[150,128,150,168],[106,138,106,158],[162,138,162,158],[118,148,150,148]].forEach(l=>{x.beginPath();x.moveTo(l[0],l[1]);x.lineTo(l[2],l[3]);x.stroke()});
  T('Gym App',164,46,800,'#fff','left',196);
  T('TREINO CONCLUÍDO',330,36,700,'#30d158');
  const fit=(t,max,sz)=>{x.font=`800 ${sz}px ${F}`;while(x.measureText(t).width>max&&sz>40){sz-=4;x.font=`800 ${sz}px ${F}`}return sz};
  T(s.fichaName,420,fit(s.fichaName,888,76),800);T(d.date.charAt(0).toUpperCase()+d.date.slice(1),490,38,500,'rgba(255,255,255,.75)');
  const tot=d.total.toLocaleString('pt-BR');T(tot,820,fit(tot+' kg',888,230),900,'#fff');x.font=`900 ${fit(tot+' kg',888,230)}px ${F}`;const tw=x.measureText(tot).width;T('kg',820,80,800,'#ffd60a','left',96+tw+20);
  T('levantados no total',890,44,600,'rgba(255,255,255,.85)');T(d.cmp.e+' '+d.cmp.t,980,fit(d.cmp.e+' '+d.cmp.t,888,52),800,'#ffd60a');
  const S=[[d.dur,'duração'],[d.ex,'exercícios'],[d.sets,'séries'],[d.reps,'reps']];S.forEach((q,i)=>{const cx=96+(i%2)*450,cy=1080+Math.floor(i/2)*190;x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.roundRect(cx,cy,438,170,32);x.fill();T(String(q[0]),cy+95,64,800,'#fff','left',cx+36);T(q[1],cy+140,32,600,'rgba(255,255,255,.7)','left',cx+36)});
  let y=1520;if(d.prs.length){T(`🏆 ${d.prs.length} novo${d.prs.length>1?'s':''} recorde${d.prs.length>1?'s':''}`,y,46,800,'#ffd60a');d.prs.slice(0,2).forEach((p,i)=>T(`${p.name} · ${fmtKg(p.kg)} kg × ${p.reps}`,y+60+i*52,36,600,'#fff'));y+=190}
  T(`🔥 ${d.wk.n} de ${d.wk.goal} treinos na semana${d.wk.streak?` · ${d.wk.streak} sem. seguida${d.wk.streak>1?'s':''}`:''}`,Math.max(y,1700),40,700,'#fff');
  T('gym app',1860,30,600,'rgba(255,255,255,.5)','center');return c}
async function shareStory(s){const c=storyCanvas(s);const blob=await new Promise(r=>c.toBlob(r,'image/png'));const name=`treino-${dkey(new Date(s.date))}.png`,file=new File([blob],name,{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file]});return}catch(e){if(e.name==='AbortError')return}}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>window.open(url,'_blank'),300);toast('Imagem gerada — salve em Fotos')}

// ---------- Rest timer (end-timestamp based, persisted) ----------
let rest=null;try{rest=JSON.parse(localStorage.getItem(RKEY)||'null')}catch(e){}
let actx=null,restTick=null;
const unlockAudio=()=>{try{if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume()}catch(e){}};
addEventListener('touchstart',unlockAudio,{passive:true});addEventListener('click',unlockAudio);
function beep(){try{unlockAudio();const t=actx.currentTime;[0,.18,.36].forEach((d,i)=>{const o=actx.createOscillator(),g=actx.createGain();o.type='sine';o.frequency.value=i===2?1320:880;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.3,t+d+.01);g.gain.exponentialRampToValueAtTime(.001,t+d+.15);o.connect(g).connect(actx.destination);o.start(t+d);o.stop(t+d+.16)})}catch(e){}}
const saveRest=()=>rest?localStorage.setItem(RKEY,JSON.stringify(rest)):localStorage.removeItem(RKEY);
function startRest(sec){rest={end:Date.now()+sec*1000,total:sec,notified:false};saveRest();renderRest()}
function clearRest(){rest=null;saveRest();renderRest()}
function adjRest(d){if(!rest)return;const rem=Math.max(0,rest.end-Date.now());rest.end=Date.now()+Math.max(0,rem+d*1000);rest.total=Math.max(rest.total+d,1);rest.notified=false;saveRest();renderRest()}
function renderRest(){
  const el=$('#rest');clearInterval(restTick);
  if(!rest){document.body.classList.remove('resting');el.classList.add('hidden');el.innerHTML='';return}
  el.classList.remove('hidden');document.body.classList.add('resting');
  const paint=()=>{
    const rem=(rest.end-Date.now())/1000,ended=rem<=0;
    if(ended&&!rest.notified){rest.notified=true;saveRest();if(document.visibilityState==='visible'){beep();buzz([200,100,200])}}
    const st=ended?'end':'run';
    if(el.dataset.st!==st){el.dataset.st=st;el.classList.toggle('end',ended);
      el.innerHTML=ended?`<div class="row"><div class="ico g">${ic('check')}</div><div class="grow"><div class="lbl">Descanso</div><div class="rt">Descanso terminado</div></div><button class="rbtn g" id="rx">OK</button></div>`
      :`<div class="row"><div class="grow"><div class="lbl">Descanso</div><div class="rt" id="rt"></div></div><button class="rbtn" id="rm">−15</button><button class="rbtn" id="rp">+15</button><button class="rbtn g" id="rs">Pular</button></div><div class="pb" id="pb"></div>`;
      ended?$('#rx').onclick=()=>{buzz();clearRest()}:($('#rm').onclick=()=>{buzz();adjRest(-15)},$('#rp').onclick=()=>{buzz();adjRest(15)},$('#rs').onclick=()=>{buzz();clearRest()});
    }
    if(!ended){$('#rt').textContent=mmss(Math.ceil(rem));$('#pb').style.width=(rem/rest.total*100)+'%'}else clearInterval(restTick);
  };
  el.dataset.st='';paint();restTick=setInterval(paint,250);
}

// ---------- Histórico ----------
let showAllPR=false;
function vHist(v){
  const names={};db.sessions.forEach(s=>s.exercises.forEach(e=>{if(e.sets.some(x=>x.done))names[norm(e.name)]=e.name}));
  const ex=Object.values(names).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if(!db.sessions.length){v.innerHTML=head('Histórico')+empty('chart','Sem treinos ainda','Finalize um treino e seu progresso aparece aqui.');return}
  const prs=Object.values(prMap(db.sessions)).sort((a,b)=>b.e1rm-a.e1rm);
  v.innerHTML=head('Histórico',`${db.sessions.length} treinos registrados`)+volumeCard()+
  '<div class="sec">Recordes</div><div class="list">'+prs.slice(0,showAllPR?999:5).map(p=>`<div class="li" data-ex="${esc(p.name)}"><div class="ico o">${ic('trophy')}</div><div class="grow"><div class="title ell">${esc(p.name)}</div><div class="t3">1RM est. ${fmtKg(p.e1rm)} kg · melhor série ${fmtKg(p.vol)} kg</div></div><b class="num">${fmtKg(p.kg)} kg</b></div>`).join('')+'</div>'+(prs.length>5&&!showAllPR?'<button class="link" id="allpr">Ver todos os recordes</button>':'')+
  '<div class="sec">Exercícios</div><div class="list">'+ex.map(n=>{const l=lastSets(n);const best=Math.max(...l.sets.map(x=>+x.kg||0));return`<div class="li" data-ex="${esc(n)}"><div class="grow"><div class="title ell">${esc(n)}</div><div class="t3">${fmtRel(l.date)} · máx ${best} kg</div></div>${ic('chev','chev')}</div>`}).join('')+'</div>'+
  '<div class="sec">Sessões</div>'+db.sessions.slice().reverse().map(s=>`<div class="card"><div class="row"><div class="grow"><div class="title">${esc(s.fichaName)}</div><div class="t3">${fmtRel(s.date)} · ${Math.round(vol(s))} kg volume</div></div><button class="link" data-sum="${s.id}" aria-label="Resumo">${ic('share')}</button><button class="link red" data-del="${s.id}" aria-label="Excluir">${ic('trash')}</button></div>
  <div class="mt">${s.exercises.filter(e=>e.sets.some(x=>x.done)).map(e=>`<div style="margin:6px 0"><div class="t2" style="font-size:14px">${esc(e.name)}</div>${e.sets.filter(x=>x.done).map(x=>`<span class="chip">${x.kg} × ${x.reps}</span>`).join('')}</div>`).join('')}</div></div>`).join('');
  v.querySelectorAll('[data-ex]').forEach(c=>c.onclick=()=>go('historico',{ex:c.dataset.ex},true));
  $('#allpr')&&($('#allpr').onclick=()=>{showAllPR=true;render()});
  v.querySelectorAll('[data-sum]').forEach(b=>b.onclick=()=>showSummary(db.sessions.find(x=>x.id===b.dataset.sum)));
  v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta sessão?')){db.sessions=db.sessions.filter(s=>s.id!==b.dataset.del);save();render()}});
}
function vExHist(v){
  const rows=[];db.sessions.forEach(s=>s.exercises.forEach(e=>{if(norm(e.name)===norm(sub.ex)){const d=e.sets.filter(x=>x.done);if(d.length)rows.push({date:s.date,sets:d,vol:d.reduce((a,x)=>a+(+x.kg||0)*(+x.reps||0),0),max:Math.max(...d.map(x=>+x.kg||0))})}}));
  const best=Math.max(0,...rows.map(r=>r.max));
  const pts=rows.slice(-12),mx=Math.max(1,...pts.map(r=>r.max));
  rows.reverse();
  v.innerHTML=head(sub.ex,autoMuscle(sub.ex)?muscleOf({name:sub.ex}):'')+prCard(sub.ex)+`<div class="grid2"><div class="card"><div class="t3">Recorde</div><div class="title num" style="font-size:28px">${best} kg</div></div><div class="card"><div class="t3">Sessões</div><div class="title num" style="font-size:28px">${rows.length}</div></div></div>
  <div class="card"><div class="t3" style="margin-bottom:8px">Carga máxima por treino</div><div class="bars">${pts.map(r=>`<div><i style="height:${r.max/mx*70}px;background:var(--acc)"></i><span>${r.date.slice(8,10)}/${r.date.slice(5,7)}</span></div>`).join('')}</div></div>
  <div class="card"><table><tr><th>Data</th><th>Séries</th><th>Máx</th><th>Vol.</th></tr>${rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${r.sets.map(x=>x.kg+'×'+x.reps).join(', ')}</td><td>${r.max}</td><td>${r.vol}</td></tr>`).join('')}</table></div>`;
}

// ---------- Água ----------
function vAgua(v){
  const t=today(),ml=db.water.log[t]||0,g=db.water.goal;
  const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=dkey(d);return{k,ml:db.water.log[k]||0,l:d.toLocaleDateString('pt-BR',{weekday:'narrow'})}});
  const mx=Math.max(g,...days.map(d=>d.ml));
  const hist=Object.entries(db.water.log).filter(([d])=>d!==t).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,30);
  v.innerHTML=head('Água')+`<div class="card stat">${ring(ml/g,220,18,`<div class="v num">${fmtL(ml)}</div><div class="t2">de ${fmtL(g)}</div>`,'big')}
  <div class="t2 mt">${ml>=g?'<span style="color:var(--acc);font-weight:600">Meta batida! 🎉</span>':'Faltam '+fmtL(g-ml)}</div></div>
  <div class="qa"><button class="btn tint" data-w="250">+250<small>ml · copo</small></button><button class="btn tint" data-w="500">+500<small>ml · garrafa</small></button><button class="btn" data-w="-250">−250<small>desfazer</small></button></div>
  <div class="row mt"><input id="cw" type="number" inputmode="numeric" placeholder="Outro valor (ml)"><button class="btn sm pri" id="cwb" style="min-height:44px">Adicionar</button></div>
  <div class="sec">Últimos 7 dias</div><div class="card"><div class="bars">${days.map(d=>`<div><i class="${d.ml?'':'m'}" style="height:${d.ml/mx*70}px;${d.ml>=g?'background:var(--acc)':''}"></i><span>${d.l}</span></div>`).join('')}</div></div>
  <div class="sec">Meta diária</div><div class="list"><div class="li"><span class="grow">Meta (ml)</span><input id="wg" type="number" inputmode="numeric" value="${g}" style="width:110px;text-align:right"></div><div class="li press" id="wz" style="color:var(--red)">Zerar hoje</div></div>
  <div class="sec">Histórico</div><div class="card">${hist.length?`<table>${hist.map(([d,m])=>`<tr><td>${fmtDate(d)}</td><td>${fmtL(m)}</td><td style="text-align:right">${m>=g?'<span style="color:var(--acc)">✓ Meta</span>':Math.round(m/g*100)+'%'}</td></tr>`).join('')}</table>`:'<span class="t2">Sem registros anteriores</span>'}</div>`;
  const add=n=>{db.water.log[t]=Math.max(0,(db.water.log[t]||0)+n);save();buzz(n>0?15:8);const was=ml<g;render();if(was&&db.water.log[t]>=g)toast('Meta de água batida! 💧')};
  v.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>add(+b.dataset.w));
  $('#cwb').onclick=()=>{const n=parseInt($('#cw').value);if(n)add(n)};
  $('#wz').onclick=()=>{if(confirm('Zerar a água de hoje?')){db.water.log[t]=0;save();render()}};
  $('#wg').onchange=()=>{const n=parseInt($('#wg').value);if(n>0){db.water.goal=n;save();toast('Meta atualizada');render()}};
}

// ---------- Suplementos ----------
function vSupl(v){
  const t=today(),taken=db.supl.log[t]||[],n=db.supl.list.filter(x=>taken.includes(x)).length;
  const hist=Object.entries(db.supl.log).filter(([d])=>d!==t).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,30);
  v.innerHTML=head('Suplementos',`Hoje · ${n} de ${db.supl.list.length} tomados`)+
  `<div class="prog" style="margin-bottom:16px"><div style="width:${db.supl.list.length?n/db.supl.list.length*100:0}%"></div></div>`+
  (db.supl.list.length?`<div class="list">${db.supl.list.map((s,i)=>`<div class="li sup ${taken.includes(s)?'on':''}" data-s="${i}"><div class="ico o">${ic('pill')}</div><span class="grow title">${esc(s)}</span><span class="cb">${ic('check')}</span></div>`).join('')}</div>`:empty('pill','Lista vazia','Adicione seus suplementos abaixo.'))+
  `<div class="sec">Gerenciar</div><div class="list">${db.supl.list.map((s,i)=>`<div class="li"><span class="grow">${esc(s)}</span><button class="link red" data-rm="${i}">Remover</button></div>`).join('')}
  <div class="li"><input id="sn" placeholder="Novo suplemento (ex.: Ômega 3)" class="grow"><button class="btn sm pri" id="sa" style="min-height:44px">${ic('plus')}</button></div></div>
  <div class="sec">Histórico</div><div class="card">${hist.length?`<table>${hist.map(([d,l])=>`<tr><td style="width:100px">${fmtDate(d)}</td><td>${l.length?l.map(x=>`<span class="chip">${esc(x)}</span>`).join(''):'<span class="t3">Nada</span>'}</td></tr>`).join('')}</table>`:'<span class="t2">Sem registros anteriores</span>'}</div>`;
  v.querySelectorAll('[data-s]').forEach(c=>c.onclick=()=>{const s=db.supl.list[c.dataset.s];const l=db.supl.log[t]=db.supl.log[t]||[];const i=l.indexOf(s);i>=0?l.splice(i,1):l.push(s);save();buzz(i>=0?8:20);
    c.classList.toggle('on',i<0);const k=db.supl.list.filter(x=>l.includes(x)).length;$('.sub').textContent=`Hoje · ${k} de ${db.supl.list.length} tomados`;$('.prog>div').style.width=k/db.supl.list.length*100+'%';if(k===db.supl.list.length&&i<0)toast('Tudo tomado hoje ✓')});
  v.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{if(confirm('Remover da lista?')){db.supl.list.splice(+b.dataset.rm,1);save();render()}});
  $('#sa').onclick=()=>{const s=$('#sn').value.trim();if(s&&!db.supl.list.includes(s)){db.supl.list.push(s);save();render()}};
}

// ---------- Ajustes ----------
function vConfig(v){
  const st=db.settings;
  v.innerHTML=head('Ajustes')+`<div class="sec">Timer de descanso</div><div class="list"><div class="li"><span class="grow">Iniciar ao concluir série</span><button class="toggle ${st.rest?'on':''}" id="rt"></button></div>
  <div class="li"><span class="grow">Duração</span><div class="seg" style="width:200px">${[60,90,120,180].map(s=>`<button data-rs="${s}" class="${st.restSec===s?'on':''}">${mmss(s)}</button>`).join('')}</div></div></div>
  <div class="sec">Meta semanal</div><div class="list"><div class="li"><span class="grow">Treinos por semana</span><button class="btn sm" id="wgm">−</button><b class="num" id="wgv" style="min-width:24px;text-align:center">${st.weekGoal}</b><button class="btn sm" id="wgp">+</button></div></div>
  <div class="sec">Progressão de carga</div><div class="list"><div class="li"><span class="grow">Incremento sugerido</span><div class="seg" style="width:200px">${[1,2,2.5,5].map(x=>`<button data-li="${x}" class="${st.loadInc===x?'on':''}">${fmtKg(x)}</button>`).join('')}</div></div></div>
  <div class="sec">Ferramentas</div><div class="list"><div class="li press" id="tpl"><div class="ico o">${ic('plate')}</div><span class="grow">Calculadora de anilhas</span>${ic('chev','chev')}</div><div class="li press" id="tbody"><div class="ico b">${ic('body')}</div><span class="grow">Peso corporal e medidas</span>${ic('chev','chev')}</div></div>
  <div class="sec">Programas prontos</div>${presetBtn('btn')}
  <div class="sec">Backup</div><div class="list"><div class="li press" id="ex"><div class="ico g">${ic('box')}</div><span class="grow">Exportar backup (JSON)</span>${ic('chev','chev')}</div><div class="li press" id="im"><div class="ico b">${ic('up')}</div><span class="grow">Importar backup</span>${ic('chev','chev')}</div></div>
  <p class="t3" style="padding:0 16px">Os dados ficam só neste iPhone. Exporte um backup de vez em quando e salve no app Arquivos.</p><input type="file" id="file" accept=".json,application/json" class="hidden">
  <div class="sec">Instalar</div><div class="card t2" style="font-size:15px">No Safari, toque em Compartilhar → <b style="color:var(--txt)">Adicionar à Tela de Início</b>.</div>
  <button class="btn danger mt2" id="wipe">Apagar todos os dados</button><p class="t3" style="text-align:center;margin-top:16px">Treinos · versão 5</p>`;
  bindPreset(v);$('#tpl').onclick=()=>plateSheet(st.bar+40);$('#tbody').onclick=()=>go('corpo');
  v.querySelectorAll('[data-li]').forEach(b=>b.onclick=()=>{st.loadInc=+b.dataset.li;save();buzz();v.querySelectorAll('[data-li]').forEach(x=>x.classList.toggle('on',x===b))});
  const wg=d=>{st.weekGoal=Math.min(7,Math.max(1,st.weekGoal+d));save();buzz();$('#wgv').textContent=st.weekGoal};$('#wgm').onclick=()=>wg(-1);$('#wgp').onclick=()=>wg(1);
  $('#rt').onclick=()=>{st.rest=!st.rest;save();buzz();$('#rt').classList.toggle('on',st.rest)};
  v.querySelectorAll('[data-rs]').forEach(b=>b.onclick=()=>{st.restSec=+b.dataset.rs;save();buzz();v.querySelectorAll('[data-rs]').forEach(x=>x.classList.toggle('on',x===b))});
  $('#ex').onclick=async()=>{
    const blob=new Blob([JSON.stringify(db,null,1)],{type:'application/json'});const name=`treinos-backup-${today()}.json`;
    const file=new File([blob],name,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name});return}catch(e){if(e.name==='AbortError')return}}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  $('#im').onclick=()=>$('#file').click();
  $('#file').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(txt=>{try{const d=JSON.parse(txt);if(!Array.isArray(d.fichas)||!Array.isArray(d.sessions))throw 0;if(confirm('Substituir todos os dados atuais pelo backup?')){db=load(d);save();toast('Backup importado');go('home')}}catch(_){alert('Arquivo de backup inválido.')}})};
  $('#wipe').onclick=()=>{if(confirm('Apagar TODOS os dados? Isso não pode ser desfeito.')){db=defaults();save();clearRest();go('home')}};
}

let lastDay=today();
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;
  try{rest=JSON.parse(localStorage.getItem(RKEY)||'null')}catch(e){}
  if(today()!==lastDay){lastDay=today();render()}else renderRest()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
if(db.active){tab='fichas';sub={session:1}}
render();
