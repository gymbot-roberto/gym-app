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
 box:'<path d="M12 3v12M7 10l5 5 5-5M4 17v3h16v-3"/>'
};
const ic=(n,c='')=>`<svg viewBox="0 0 24 24" class="${c}">${I[n]}</svg>`;

function defaults(){return{fichas:[],sessions:[],active:null,water:{goal:3000,log:{}},supl:{list:['Multivitamínico','Creatina'],log:{}},settings:{rest:true,restSec:90,weekGoal:5}}}
let db;
function load(raw){const d=Object.assign(defaults(),raw||{});const D=defaults();d.water=Object.assign(D.water,d.water);d.supl=Object.assign(D.supl,d.supl);d.settings=Object.assign(D.settings,d.settings);return d}
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
const TABS=[['home','Início','home'],['fichas','Treinos','dumb'],['historico','Histórico','chart'],['agua','Água','drop'],['supl','Suplementos','pill']];
$('#tabs').innerHTML=TABS.map(([k,l,i])=>`<button data-tab="${k}">${ic(i)}<span>${l}</span></button>`).join('');
let tab='home',sub=null,stack=[];
function go(t,s=null,push=false){if(push)stack.push([tab,sub]);else stack=[];tab=t;sub=s;render();window.scrollTo(0,0)}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{buzz();go(b.dataset.tab)});
$('#back').onclick=()=>{const p=stack.pop();if(p){tab=p[0];sub=p[1]}else sub=null;render();window.scrollTo(0,0)};
addEventListener('scroll',()=>$('#nav').classList.toggle('scrolled',scrollY>30),{passive:true});
function render(){
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  $('#back').classList.toggle('hidden',!sub);$('#navright').innerHTML='';
  const v=$('#view');v.style.animation='none';v.offsetHeight;v.style.animation='';
  const views={home:vHome,fichas:sub?.edit!==undefined?vEdit:sub?.session?vSession:vFichas,historico:sub?.ex?vExHist:vHist,agua:vAgua,supl:vSupl,config:vConfig};
  views[sub?.config?'config':tab](v);renderRest();
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
  `<div class="sec">Último treino</div>`+(last?`<div class="list"><div class="li press" data-sess="${last.id}"><div class="ico g">${ic('dumb')}</div><div class="grow"><div class="title ell">${esc(last.fichaName)}</div><div class="t2">${fmtRel(last.date)} · ${last.exercises.filter(e=>e.sets.some(x=>x.done)).length} exercícios · ${Math.round(vol(last))} kg volume</div></div>${ic('chev','chev')}</div></div>`:`<div class="card t2">Nenhum treino registrado ainda.</div>`);
  $('#cfg').onclick=()=>go('home',{config:1},true);
  $('#hw').onclick=()=>go('agua');$('#hs').onclick=()=>go('supl');
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
    return{name:e.name,target:e.reps,sets:Array.from({length:n},(_,i)=>{const l=last?.sets[i]||last?.sets[last.sets.length-1];return{kg:l?l.kg:'',reps:l?l.reps:(parseInt(e.reps)||''),done:false}})};
  })};save();
}
function vEdit(v){
  const f=sub.edit?structuredClone(db.fichas.find(x=>x.id===sub.edit)):{id:uid(),name:'',exercises:[]};
  const draw=()=>{
    v.innerHTML=head(sub.edit?'Editar ficha':'Nova ficha')+`<label class="f">Nome da ficha</label><input id="fn" value="${esc(f.name)}" placeholder="Ex.: Treino A – Peito e Tríceps">
    <div class="sec">Exercícios</div>${f.exercises.map((e,i)=>`<div class="card"><div class="row"><span class="t3 num" style="width:20px">${i+1}</span><input class="grow" data-i="${i}" data-k="name" value="${esc(e.name)}" placeholder="Nome do exercício"></div>
    <div class="row mt"><span style="width:20px"></span><div class="grow"><label class="f">Séries</label><input data-i="${i}" data-k="sets" type="number" inputmode="numeric" value="${esc(e.sets)}"></div><div class="grow"><label class="f">Repetições</label><input data-i="${i}" data-k="reps" value="${esc(e.reps)}" placeholder="10 ou 8-12"></div></div>
    <div class="row mt"><span style="width:20px"></span><button class="btn sm" data-up="${i}" aria-label="Subir">${ic('up')}</button><button class="btn sm" data-dn="${i}" aria-label="Descer">${ic('down')}</button><span class="grow"></span><button class="link red" data-rm="${i}">Remover</button></div></div>`).join('')||'<p class="t2" style="padding:0 16px 8px">Adicione os exercícios desta ficha.</p>'}
    <button class="btn tint" id="add">${ic('plus')}Adicionar exercício</button><button class="btn pri mt" id="sv">Salvar ficha</button>${sub.edit?`<button class="btn danger mt2" id="del">${ic('trash')}Excluir ficha</button>`:''}`;
    $('#fn').oninput=e=>f.name=e.target.value;
    v.querySelectorAll('input[data-i]').forEach(inp=>inp.oninput=()=>f.exercises[inp.dataset.i][inp.dataset.k]=inp.value);
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
  s.exercises.map((e,ei)=>{const last=lastSets(e.name);
    return`<div class="card ex"><h3>${esc(e.name)}</h3><div class="t3">${e.target?'Meta '+esc(e.target)+' reps · ':''}${last?'Último treino '+fmtRel(last.date).toLowerCase():'Primeira vez'}</div>
    <div class="sets"><div class="sr h"><span>Série</span><span>Anterior</span><span>kg</span><span>Reps</span><span></span></div>
    ${e.sets.map((st,si)=>{const l=last?.sets[si];return`<div class="sr ${st.done?'done':''}" id="r${ei}_${si}"><span class="n">${si+1}</span>
      <span class="prev">${l?`<b>${esc(l.kg)}</b>kg × <b>${esc(l.reps)}</b>`:'—'}</span>
      <input type="number" inputmode="decimal" step="0.5" placeholder="kg" data-e="${ei}" data-s="${si}" data-k="kg" value="${esc(st.kg)}" aria-label="kg">
      <input type="number" inputmode="numeric" placeholder="reps" data-e="${ei}" data-s="${si}" data-k="reps" value="${esc(st.reps)}" aria-label="reps">
      <button class="ck" data-ok="${ei},${si}" aria-label="Concluir série">${ic('check')}</button></div>`}).join('')}</div>
    <div class="row mt"><button class="btn sm tint" data-add="${ei}">${ic('plus')}Série</button><span class="grow"></span>${e.sets.length>1?`<button class="link red" data-rem="${ei}">Remover série</button>`:''}</div></div>`}).join('')+
  `<button class="btn pri mt" id="fin">Finalizar treino</button><button class="btn danger mt" id="cancel">Descartar treino</button>`;
  const upd=()=>{$('#sd').textContent=doneN()+'/'+totN();$('#sv').textContent=Math.round(vol(s))+' kg'};
  clearInterval(clock);const tick=()=>{const e=$('#el');if(!e)return clearInterval(clock);e.textContent=mmss((Date.now()-new Date(s.date))/1000).replace(/^(\d+):/,(m,a)=>a>=60?Math.floor(a/60)+'h'+String(a%60).padStart(2,'0')+':':m)};tick();clock=setInterval(tick,1000);
  v.querySelectorAll('input[data-e]').forEach(i=>{i.oninput=()=>{s.exercises[i.dataset.e].sets[i.dataset.s][i.dataset.k]=i.value===''?'':+i.value;save();upd()};i.onfocus=()=>i.select()});
  v.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{const[e,i]=b.dataset.ok.split(',');const st=s.exercises[e].sets[i];st.done=!st.done;save();
    $('#r'+e+'_'+i).classList.toggle('done',st.done);upd();buzz(st.done?20:8);if(st.done&&db.settings.rest)startRest(db.settings.restSec)});
  v.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const ss=s.exercises[b.dataset.add].sets;const p=ss[ss.length-1]||{kg:'',reps:''};ss.push({kg:p.kg,reps:p.reps,done:false});save();render()});
  v.querySelectorAll('[data-rem]').forEach(b=>b.onclick=()=>{const ss=s.exercises[b.dataset.rem].sets;if(ss.length>1){ss.pop();save();render()}});
  const fin=()=>{
    const any=s.exercises.some(e=>e.sets.some(x=>x.done));
    if(!any&&!confirm('Nenhuma série marcada com ✓. Salvar todas as séries preenchidas como feitas?'))return;
    s.exercises.forEach(e=>e.sets.forEach(x=>{if(!any&&x.kg!==''&&x.reps!=='')x.done=true}));
    db.sessions.push(s);db.active=null;save();clearRest();buzz(30);toast('Treino salvo 💪');go('historico');
  };$('#fin').onclick=fin;$('#fin2').onclick=fin;
  $('#cancel').onclick=()=>{if(confirm('Descartar este treino?')){db.active=null;save();clearRest();go('fichas')}};
}

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
function vHist(v){
  const names={};db.sessions.forEach(s=>s.exercises.forEach(e=>{if(e.sets.some(x=>x.done))names[norm(e.name)]=e.name}));
  const ex=Object.values(names).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if(!db.sessions.length){v.innerHTML=head('Histórico')+empty('chart','Sem treinos ainda','Finalize um treino e seu progresso aparece aqui.');return}
  v.innerHTML=head('Histórico',`${db.sessions.length} treinos registrados`)+'<div class="sec">Exercícios</div><div class="list">'+ex.map(n=>{const l=lastSets(n);const best=Math.max(...l.sets.map(x=>+x.kg||0));return`<div class="li" data-ex="${esc(n)}"><div class="grow"><div class="title ell">${esc(n)}</div><div class="t3">${fmtRel(l.date)} · máx ${best} kg</div></div>${ic('chev','chev')}</div>`}).join('')+'</div>'+
  '<div class="sec">Sessões</div>'+db.sessions.slice().reverse().map(s=>`<div class="card"><div class="row"><div class="grow"><div class="title">${esc(s.fichaName)}</div><div class="t3">${fmtRel(s.date)} · ${Math.round(vol(s))} kg volume</div></div><button class="link red" data-del="${s.id}" aria-label="Excluir">${ic('trash')}</button></div>
  <div class="mt">${s.exercises.filter(e=>e.sets.some(x=>x.done)).map(e=>`<div style="margin:6px 0"><div class="t2" style="font-size:14px">${esc(e.name)}</div>${e.sets.filter(x=>x.done).map(x=>`<span class="chip">${x.kg} × ${x.reps}</span>`).join('')}</div>`).join('')}</div></div>`).join('');
  v.querySelectorAll('[data-ex]').forEach(c=>c.onclick=()=>go('historico',{ex:c.dataset.ex},true));
  v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta sessão?')){db.sessions=db.sessions.filter(s=>s.id!==b.dataset.del);save();render()}});
}
function vExHist(v){
  const rows=[];db.sessions.forEach(s=>s.exercises.forEach(e=>{if(norm(e.name)===norm(sub.ex)){const d=e.sets.filter(x=>x.done);if(d.length)rows.push({date:s.date,sets:d,vol:d.reduce((a,x)=>a+(+x.kg||0)*(+x.reps||0),0),max:Math.max(...d.map(x=>+x.kg||0))})}}));
  const best=Math.max(0,...rows.map(r=>r.max));
  const pts=rows.slice(-12),mx=Math.max(1,...pts.map(r=>r.max));
  rows.reverse();
  v.innerHTML=head(sub.ex)+`<div class="grid2"><div class="card"><div class="t3">Recorde</div><div class="title num" style="font-size:28px">${best} kg</div></div><div class="card"><div class="t3">Sessões</div><div class="title num" style="font-size:28px">${rows.length}</div></div></div>
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
  <div class="sec">Programas prontos</div>${presetBtn('btn')}
  <div class="sec">Backup</div><div class="list"><div class="li press" id="ex"><div class="ico g">${ic('box')}</div><span class="grow">Exportar backup (JSON)</span>${ic('chev','chev')}</div><div class="li press" id="im"><div class="ico b">${ic('up')}</div><span class="grow">Importar backup</span>${ic('chev','chev')}</div></div>
  <p class="t3" style="padding:0 16px">Os dados ficam só neste iPhone. Exporte um backup de vez em quando e salve no app Arquivos.</p><input type="file" id="file" accept=".json,application/json" class="hidden">
  <div class="sec">Instalar</div><div class="card t2" style="font-size:15px">No Safari, toque em Compartilhar → <b style="color:var(--txt)">Adicionar à Tela de Início</b>.</div>
  <button class="btn danger mt2" id="wipe">Apagar todos os dados</button><p class="t3" style="text-align:center;margin-top:16px">Treinos · versão 4</p>`;
  bindPreset(v);
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
