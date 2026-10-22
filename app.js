'use strict';
const KEY='treinos-db-v1';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtDate=s=>{const [y,m,d]=s.slice(0,10).split('-');return d+'/'+m+'/'+y};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).trim().toLowerCase();
const $=s=>document.querySelector(s);

function defaults(){return{fichas:[],sessions:[],active:null,water:{goal:3000,log:{}},supl:{list:['Multivitamínico','Creatina'],log:{}}}}
let db;
try{db=Object.assign(defaults(),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){db=defaults()}
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));

// Last logged sets for an exercise (by name), excluding the active session
function lastSets(name){
  for(let i=db.sessions.length-1;i>=0;i--){
    const ex=db.sessions[i].exercises.find(e=>norm(e.name)===norm(name));
    if(ex&&ex.sets.some(s=>s.done))return{date:db.sessions[i].date,sets:ex.sets.filter(s=>s.done)};
  }
  return null;
}

let tab='fichas',sub=null;
function go(t,s=null){tab=t;sub=s;render();window.scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>go(b.dataset.tab));
$('#back').onclick=()=>go(tab);

function render(){
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  $('#back').classList.toggle('hidden',!sub);
  const v=$('#view');
  ({fichas:sub?.edit!==undefined?vEdit:sub?.session?vSession:vFichas,historico:sub?.ex?vExHist:vHist,agua:vAgua,supl:vSupl,config:vConfig})[tab](v);
}
const setTitle=t=>$('#title').textContent=t;

// ---------- Fichas ----------
function vFichas(v){
  setTitle('Fichas');
  let h='';
  if(db.active)h+=`<div class="card"><b>Treino em andamento:</b> ${esc(db.active.fichaName)}<button class="primary block" id="resume">Continuar treino</button></div>`;
  h+=db.fichas.map(f=>`<div class="card"><div class="row"><div class="grow"><b>${esc(f.name)}</b><div class="mut">${f.exercises.map(e=>esc(e.name)).join(' · ')||'Sem exercícios'}</div></div><button class="ghost" data-edit="${f.id}">Editar</button></div><button class="primary block" data-start="${f.id}">Iniciar treino</button></div>`).join('')||'<p class="mut">Nenhuma ficha ainda. Crie sua primeira (ex.: Treino A).</p>';
  h+='<button class="block" id="new">+ Nova ficha</button>';
  v.innerHTML=h;
  $('#new').onclick=()=>go('fichas',{edit:null});
  if(db.active)$('#resume').onclick=()=>go('fichas',{session:1});
  v.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>go('fichas',{edit:b.dataset.edit}));
  v.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{
    if(db.active&&!confirm('Já existe um treino em andamento. Descartar e iniciar outro?'))return;
    startSession(b.dataset.start);go('fichas',{session:1});
  });
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
  setTitle(sub.edit?'Editar ficha':'Nova ficha');
  const draw=()=>{
    v.innerHTML=`<div class="card"><label class="mut">Nome da ficha</label><input id="fn" value="${esc(f.name)}" placeholder="Ex.: Treino A - Peito e Tríceps"></div>
    <h2>Exercícios</h2>${f.exercises.map((e,i)=>`<div class="card"><input data-i="${i}" data-k="name" value="${esc(e.name)}" placeholder="Nome do exercício">
    <div class="row" style="margin-top:8px"><div class="grow"><span class="mut">Séries</span><input data-i="${i}" data-k="sets" type="number" inputmode="numeric" value="${esc(e.sets)}"></div><div class="grow"><span class="mut">Repetições</span><input data-i="${i}" data-k="reps" value="${esc(e.reps)}" placeholder="10 ou 8-12"></div></div>
    <div class="row" style="margin-top:8px"><button data-up="${i}">↑</button><button data-dn="${i}">↓</button><span class="grow"></span><button class="ghost" style="color:var(--red)" data-rm="${i}">Remover</button></div></div>`).join('')}
    <button class="block" id="add">+ Adicionar exercício</button><button class="primary block" id="sv">Salvar ficha</button>${sub.edit?'<button class="danger block" id="del">Excluir ficha</button>':''}`;
    $('#fn').oninput=e=>f.name=e.target.value;
    v.querySelectorAll('input[data-i]').forEach(inp=>inp.oninput=()=>f.exercises[inp.dataset.i][inp.dataset.k]=inp.value);
    v.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{f.exercises.splice(+b.dataset.rm,1);draw()});
    v.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.up;if(i>0){[f.exercises[i-1],f.exercises[i]]=[f.exercises[i],f.exercises[i-1]];draw()}});
    v.querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>{const i=+b.dataset.dn;if(i<f.exercises.length-1){[f.exercises[i+1],f.exercises[i]]=[f.exercises[i],f.exercises[i+1]];draw()}});
    $('#add').onclick=()=>{f.exercises.push({id:uid(),name:'',sets:3,reps:'10'});draw();const ins=v.querySelectorAll('input[data-k=name]');ins[ins.length-1].focus()};
    $('#sv').onclick=()=>{
      f.name=f.name.trim()||'Ficha sem nome';f.exercises=f.exercises.filter(e=>e.name.trim());f.exercises.forEach(e=>{e.name=e.name.trim();e.sets=Math.max(parseInt(e.sets)||3,1)});
      const i=db.fichas.findIndex(x=>x.id===f.id);i>=0?db.fichas[i]=f:db.fichas.push(f);save();go('fichas');
    };
    if(sub.edit)$('#del').onclick=()=>{if(confirm('Excluir esta ficha? O histórico de treinos é mantido.')){db.fichas=db.fichas.filter(x=>x.id!==f.id);save();go('fichas')}};
  };draw();
}
function vSession(v){
  const s=db.active;if(!s)return go('fichas');
  setTitle(s.fichaName);
  v.innerHTML=s.exercises.map((e,ei)=>{
    const last=lastSets(e.name);
    return`<div class="card"><b>${esc(e.name)}</b> <span class="mut">${e.target?'alvo '+esc(e.target)+' reps':''}${last?' · último treino '+fmtDate(last.date):' · primeira vez'}</span>
    ${e.sets.map((st,si)=>{const l=last?.sets[si];return`<div class="set"><span class="n">${si+1}</span>
      <input type="number" inputmode="decimal" step="0.5" placeholder="kg" data-e="${ei}" data-s="${si}" data-k="kg" value="${esc(st.kg)}">
      <input type="number" inputmode="numeric" placeholder="reps" data-e="${ei}" data-s="${si}" data-k="reps" value="${esc(st.reps)}">
      <button class="${st.done?'done':''}" data-ok="${ei},${si}">✓</button>
      <span class="last">${l?`Último: ${esc(l.kg)}kg x ${esc(l.reps)}`:'Último: —'}</span></div>`}).join('')}
    <div class="row"><button class="ghost" data-add="${ei}">+ Série</button><button class="ghost" style="color:var(--red)" data-rem="${ei}">− Série</button></div></div>`}).join('')+
    '<button class="primary block" id="fin">Finalizar treino</button><button class="danger block" id="cancel">Descartar treino</button>';
  v.querySelectorAll('input[data-e]').forEach(i=>i.oninput=()=>{s.exercises[i.dataset.e].sets[i.dataset.s][i.dataset.k]=i.value===''?'':+i.value;save()});
  v.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{const[e,i]=b.dataset.ok.split(',');const st=s.exercises[e].sets[i];st.done=!st.done;save();b.classList.toggle('done',st.done)});
  v.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const ss=s.exercises[b.dataset.add].sets;const p=ss[ss.length-1]||{kg:'',reps:''};ss.push({kg:p.kg,reps:p.reps,done:false});save();render()});
  v.querySelectorAll('[data-rem]').forEach(b=>b.onclick=()=>{const ss=s.exercises[b.dataset.rem].sets;if(ss.length>1){ss.pop();save();render()}});
  $('#fin').onclick=()=>{
    const any=s.exercises.some(e=>e.sets.some(x=>x.done));
    if(!any&&!confirm('Nenhuma série marcada com ✓. Salvar todas as séries preenchidas como feitas?'))return;
    s.exercises.forEach(e=>e.sets.forEach(x=>{if(!any&&x.kg!==''&&x.reps!=='')x.done=true}));
    db.sessions.push(s);db.active=null;save();alert('Treino salvo! 💪');go('historico');
  };
  $('#cancel').onclick=()=>{if(confirm('Descartar este treino?')){db.active=null;save();go('fichas')}};
}

// ---------- Histórico ----------
function vHist(v){
  setTitle('Histórico');
  const names={};db.sessions.forEach(s=>s.exercises.forEach(e=>{if(e.sets.some(x=>x.done))names[norm(e.name)]=e.name}));
  const ex=Object.values(names).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  v.innerHTML='<h2>Por exercício</h2>'+(ex.map(n=>{const l=lastSets(n);const best=Math.max(...l.sets.map(x=>+x.kg||0));return`<div class="card row" data-ex="${esc(n)}"><div class="grow"><b>${esc(n)}</b><div class="mut">Último: ${fmtDate(l.date)} · máx ${best}kg</div></div><span>›</span></div>`}).join('')||'<p class="mut">Nenhum treino registrado ainda.</p>')+
  '<h2>Sessões</h2>'+db.sessions.slice().reverse().map(s=>`<div class="card"><div class="row"><b class="grow">${esc(s.fichaName)}</b><span class="mut">${fmtDate(s.date)}</span></div><div class="mut">${s.exercises.filter(e=>e.sets.some(x=>x.done)).map(e=>esc(e.name)+': '+e.sets.filter(x=>x.done).map(x=>x.kg+'×'+x.reps).join(', ')).join('<br>')}</div><button class="ghost" style="color:var(--red)" data-del="${s.id}">Excluir sessão</button></div>`).join('');
  v.querySelectorAll('[data-ex]').forEach(c=>c.onclick=()=>go('historico',{ex:c.dataset.ex}));
  v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta sessão?')){db.sessions=db.sessions.filter(s=>s.id!==b.dataset.del);save();render()}});
}
function vExHist(v){
  setTitle(sub.ex);
  const rows=[];db.sessions.forEach(s=>s.exercises.forEach(e=>{if(norm(e.name)===norm(sub.ex)){const d=e.sets.filter(x=>x.done);if(d.length)rows.push({date:s.date,sets:d,vol:d.reduce((a,x)=>a+(+x.kg||0)*(+x.reps||0),0),max:Math.max(...d.map(x=>+x.kg||0))})}}));
  rows.reverse();
  v.innerHTML=`<div class="card"><table><tr><th>Data</th><th>Séries (kg×reps)</th><th>Máx</th><th>Volume</th></tr>${rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${r.sets.map(x=>x.kg+'×'+x.reps).join(', ')}</td><td>${r.max}</td><td>${r.vol}</td></tr>`).join('')}</table></div>`;
}

// ---------- Água ----------
function vAgua(v){
  setTitle('Água');
  const t=today(),ml=db.water.log[t]||0,g=db.water.goal,p=Math.min(100,ml/g*100);
  const hist=Object.entries(db.water.log).filter(([d])=>d!==t).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,30);
  v.innerHTML=`<div class="card"><div class="big">${ml} <span class="mut">/ ${g} ml</span></div><div class="bar"><div style="width:${p}%"></div></div><div class="mut" style="margin-top:6px">${ml>=g?'Meta batida! 🎉':'Faltam '+(g-ml)+' ml'}</div>
  <div class="row" style="margin-top:12px"><button class="primary grow" data-w="250">+250 ml</button><button class="primary grow" data-w="500">+500 ml</button></div>
  <div class="row" style="margin-top:8px"><input id="cw" type="number" inputmode="numeric" placeholder="Outro valor (ml)"><button id="cwb">+</button></div>
  <div class="row" style="margin-top:8px"><button class="grow" data-w="-250">−250 ml</button><button class="grow" id="wz">Zerar hoje</button></div></div>
  <div class="card"><span class="mut">Meta diária (ml)</span><div class="row"><input id="wg" type="number" inputmode="numeric" value="${g}"><button id="wgb">Salvar</button></div></div>
  <h2>Histórico</h2><div class="card"><table>${hist.map(([d,m])=>`<tr><td>${fmtDate(d)}</td><td>${m} ml</td><td>${m>=g?'✅':Math.round(m/g*100)+'%'}</td></tr>`).join('')||'<tr><td class="mut">Sem registros anteriores</td></tr>'}</table></div>`;
  const add=n=>{db.water.log[t]=Math.max(0,(db.water.log[t]||0)+n);save();render()};
  v.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>add(+b.dataset.w));
  $('#cwb').onclick=()=>{const n=parseInt($('#cw').value);if(n)add(n)};
  $('#wz').onclick=()=>{if(confirm('Zerar a água de hoje?')){db.water.log[t]=0;save();render()}};
  $('#wgb').onclick=()=>{const n=parseInt($('#wg').value);if(n>0){db.water.goal=n;save();render()}};
}

// ---------- Suplementos ----------
function vSupl(v){
  setTitle('Suplementos');
  const t=today(),taken=db.supl.log[t]||[];
  const hist=Object.entries(db.supl.log).filter(([d])=>d!==t).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,30);
  v.innerHTML=`<p class="mut">Hoje, ${fmtDate(t)} — toque para marcar</p>${db.supl.list.map((n,i)=>`<div class="card chk ${taken.includes(n)?'on':''}" data-s="${i}"><span>${esc(n)}</span><span class="box">${taken.includes(n)?'✓':''}</span></div>`).join('')}
  <h2>Gerenciar lista</h2><div class="card">${db.supl.list.map((n,i)=>`<div class="row" style="margin:4px 0"><span class="grow">${esc(n)}</span><button class="ghost" style="color:var(--red)" data-rm="${i}">Remover</button></div>`).join('')}
  <div class="row" style="margin-top:8px"><input id="sn" placeholder="Novo suplemento (ex.: Ômega 3)"><button id="sa">+</button></div></div>
  <h2>Histórico</h2><div class="card"><table>${hist.map(([d,l])=>`<tr><td>${fmtDate(d)}</td><td>${l.length?l.map(esc).join(', '):'—'}</td></tr>`).join('')||'<tr><td class="mut">Sem registros anteriores</td></tr>'}</table></div>`;
  v.querySelectorAll('[data-s]').forEach(c=>c.onclick=()=>{const n=db.supl.list[c.dataset.s];const l=db.supl.log[t]=db.supl.log[t]||[];const i=l.indexOf(n);i>=0?l.splice(i,1):l.push(n);save();render()});
  v.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{if(confirm('Remover da lista?')){db.supl.list.splice(+b.dataset.rm,1);save();render()}});
  $('#sa').onclick=()=>{const n=$('#sn').value.trim();if(n&&!db.supl.list.includes(n)){db.supl.list.push(n);save();render()}};
}

// ---------- Ajustes / backup ----------
function vConfig(v){
  setTitle('Ajustes');
  v.innerHTML=`<div class="card"><b>Backup</b><p class="mut">Os dados ficam só neste iPhone. Exporte um backup de vez em quando (salve no app Arquivos ou envie para você).</p>
  <button class="primary block" id="ex">Exportar backup (JSON)</button><button class="block" id="im">Importar backup</button><input type="file" id="file" accept=".json,application/json" class="hidden"></div>
  <div class="card"><b>Instalar no iPhone</b><p class="mut">No Safari, toque em Compartilhar → "Adicionar à Tela de Início".</p></div>
  <div class="card"><button class="danger block" id="wipe">Apagar todos os dados</button></div>`;
  $('#ex').onclick=async()=>{
    const blob=new Blob([JSON.stringify(db,null,1)],{type:'application/json'});const name=`treinos-backup-${today()}.json`;
    const file=new File([blob],name,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name});return}catch(e){if(e.name==='AbortError')return}}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  $('#im').onclick=()=>$('#file').click();
  $('#file').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(txt=>{try{const d=JSON.parse(txt);if(!Array.isArray(d.fichas)||!Array.isArray(d.sessions))throw 0;if(confirm('Substituir todos os dados atuais pelo backup?')){db=Object.assign(defaults(),d);save();alert('Backup importado!');go('fichas')}}catch(_){alert('Arquivo de backup inválido.')}})};
  $('#wipe').onclick=()=>{if(confirm('Apagar TODOS os dados? Isso não pode ser desfeito.')){db=defaults();save();go('fichas')}};
}

document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()}); // refresh day rollover
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
if(db.active)sub={session:1};
render();
