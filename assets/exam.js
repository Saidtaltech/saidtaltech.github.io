(function(){
const E=window.EXAM,qs=E.qs,N=qs.length,$=s=>document.querySelector(s);
const SUB=SUBJECTS[E.sub],KEY='exam-'+E.sub+E.id+'-best';
const app=$('#app');
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LET='ABCD';
let S;
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fresh(mode,only){
  const idxs=only||qs.map((_,i)=>i);
  S={mode,list:idxs,i:0,ans:{},checked:{},flag:{},pts:{},perm:{},start:Date.now(),done:false};
  idxs.forEach(k=>{const q=qs[k];if(q.t==='qcm')S.perm[k]=shuffle(q.o.map((_,j)=>j))});
}
/* ---- scoring ---- */
function fillOK(q,v){const n=norm(v);return !!n&&q.ans.some(a=>norm(a)===n)}
function score(k){
  const q=qs[k],a=S.ans[k];
  if(q.t==='open'){const c=(S.pts[k]||[]).filter(Boolean).length;return c/q.pts.length}
  if(a===undefined||a==='')return 0;
  if(q.t==='qcm')return a===0?1:0;          // a = index d'origine
  if(q.t==='vf')return a===q.a?1:0;
  return fillOK(q,a)?1:0;
}
const total=()=>S.list.reduce((s,k)=>s+score(k),0);
const fmt=n=>(Math.round(n*10)/10).toString().replace('.',',');
function isAnswered(k){const q=qs[k];if(q.t==='open')return !!(S.ans[k]&&S.ans[k].trim());return S.ans[k]!==undefined&&S.ans[k]!==''}
function stateOf(k){ // pour la carte
  if(S.done||(S.mode==='train'&&S.checked[k])){const s=score(k);return s===1?'ok':(s===0?'ko':'done')}
  return isAnswered(k)?'done':''
}
/* ---- intro ---- */
function intro(){
  const best=store.get(KEY);
  app.innerHTML=`<div class="hero"><div class="kicker">Examen ${E.id} sur 5 · ${esc(SUB.name)}</div>
  <h1>${esc(E.title)}</h1><p>${esc(E.desc)}</p></div>
  <div class="card"><div class="stats">
   <div class="stat"><b>${N}</b>questions</div><div class="stat"><b>30 min</b>conseillées</div>
   <div class="stat"><b>/ 20</b>1 point par question</div>${best?`<div class="stat"><b>${fmt(best.score)} / 20</b>meilleur score</div>`:''}</div>
   <div class="seg" role="radiogroup" aria-label="Mode">
    <label><input type="radio" name="m" value="exam" checked><span><b>Mode examen</b><small>Corrigé et explications à la fin, chronomètre de 30 min.</small></span></label>
    <label><input type="radio" name="m" value="train"><span><b>Mode entraînement</b><small>Correction immédiate après chaque réponse, sans limite de temps.</small></span></label>
   </div>
   <p class="hint">Types de questions : QCM, vrai/faux, texte à compléter, développement à auto-évaluer. Raccourcis : <span class="kbd">A</span>–<span class="kbd">D</span> choisir, <span class="kbd">Entrée</span> valider/suivant, <span class="kbd">←</span> <span class="kbd">→</span> naviguer, <span class="kbd">F</span> marquer.</p>
   <div class="nav"><a class="btn" href="index.html">← Tous les examens</a><span class="sp"></span><button class="btn primary" id="go">Commencer l'examen →</button></div></div>`;
  $('#go').onclick=()=>{fresh(document.querySelector('input[name=m]:checked').value);run()};
}
/* ---- timer ---- */
let tick;
function timerStart(){clearInterval(tick);if(S.mode!=='exam')return;tick=setInterval(()=>{const el=$('#tm');if(!el)return;const left=Math.max(0,1800-Math.floor((Date.now()-S.start)/1000));el.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');el.classList.toggle('warn',left<300);if(left===0){clearInterval(tick);finish()}},500)}
/* ---- question ---- */
function run(){timerStart();draw()}
function draw(){
  const k=S.list[S.i],q=qs[k],n=S.list.length,locked=S.mode==='train'&&S.checked[k];
  const typeTag={qcm:'QCM',vf:'Vrai ou faux',fill:'À compléter',open:'Développement'}[q.t];
  let body='';
  if(q.t==='qcm'||q.t==='vf'){
    const opts=q.t==='qcm'?S.perm[k].map((oi,p)=>({v:oi,t:q.o[oi],p})):[{v:true,t:'Vrai',p:0},{v:false,t:'Faux',p:1}];
    body='<ul class="opts" role="radiogroup">'+opts.map(o=>{
      const sel=S.ans[k]===o.v;let c='o'+(sel?' sel':'');
      if(locked){const right=q.t==='qcm'?o.v===0:o.v===q.a;if(right)c='o ok';else if(sel)c='o ko'}
      return `<li><button class="${c}" data-v="${o.v}" ${locked?'disabled':''} role="radio" aria-checked="${sel}"><span class="k">${LET[o.p]}</span><span>${esc(o.t)}</span></button></li>`}).join('')+'</ul>';
  }else if(q.t==='fill'){
    const v=S.ans[k]||'';const ok=locked&&fillOK(q,v);
    body=`<label for="fi" class="hint" style="display:block;margin:0 0 6px">Votre réponse</label><input id="fi" class="o ${locked?(ok?'ok':'ko'):''}" style="font:inherit" autocomplete="off" value="${esc(v)}" ${locked?'disabled':''}>`;
  }else{
    body=`<label for="ta" class="hint" style="display:block;margin:0 0 6px">Rédigez votre réponse (elle ne sera pas envoyée : elle sert à vous auto-évaluer)</label><textarea id="ta" class="o" rows="6" style="font:inherit;width:100%">${esc(S.ans[k]||'')}</textarea>`;
  }
  let fb='';
  if(locked||(q.t==='open'&&S.checked[k]))fb=feedback(k);
  const t=q.t==='fill'||q.t==='open';
  const trainAct=S.mode==='train'&&!locked&&(q.t!=='qcm'&&q.t!=='vf'?true:S.ans[k]!==undefined);
  app.innerHTML=`<div class="qhead"><span>Question <b>${S.i+1}</b> / ${n}</span><span>${S.mode==='exam'?'⏱ <span class="timer" id="tm">--:--</span>':'Entraînement'}</span></div>
  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${S.list.filter(isAnswered).length}"><b style="width:${S.list.filter(isAnswered).length/n*100}%"></b></div>
  <div class="card q" style="margin-top:14px"><span class="tag">${typeTag}</span><h2>${esc(q.q).replace('________','<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>')}</h2>${body}${fb}
  <div class="nav"><button class="btn" id="pv" ${S.i===0?'disabled':''}>← Précédent</button>
   <button class="btn ghost" id="fl" aria-pressed="${!!S.flag[k]}">${S.flag[k]?'⚑ Marquée':'⚐ Marquer'}</button><span class="sp"></span>
   ${S.mode==='train'&&!locked&&(t||q.t==='qcm'||q.t==='vf')?`<button class="btn primary" id="ck" ${(q.t==='qcm'||q.t==='vf')&&S.ans[k]===undefined?'disabled':''}>${q.t==='open'?'Voir le corrigé':'Valider'}</button>`:''}
   ${S.i<n-1?`<button class="btn ${S.mode==='train'&&!locked?'':'primary'}" id="nx">Suivant →</button>`:`<button class="btn primary" id="fin">Terminer l'examen</button>`}</div></div>
  <div class="map" aria-label="Navigation entre les questions">${S.list.map((kk,j)=>`<button class="${stateOf(kk)} ${j===S.i?'cur':''} ${S.flag[kk]?'flag':''}" data-j="${j}" aria-label="Question ${j+1}${S.flag[kk]?' marquée':''}">${j+1}</button>`).join('')}</div>
  <div class="legend"><span>■ répondue</span><span>● marquée</span>${S.mode==='train'?'<span>vert/rouge : corrigée</span>':''}</div>`;
  bind(k,q,locked);
}
function bind(k,q,locked){
  app.querySelectorAll('.o[data-v]').forEach(b=>b.onclick=()=>{let v=b.dataset.v;v=q.t==='vf'?v==='true':+v;S.ans[k]=v;draw();const f=app.querySelector('.o.sel');f&&f.focus()});
  const fi=$('#fi');if(fi){fi.oninput=()=>{S.ans[k]=fi.value;const ck=$('#ck');updateBar()};fi.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();act()}}}
  const ta=$('#ta');if(ta)ta.oninput=()=>{S.ans[k]=ta.value;updateBar()};
  $('#pv').onclick=()=>go(S.i-1);const nx=$('#nx');if(nx)nx.onclick=()=>go(S.i+1);
  const fin=$('#fin');if(fin)fin.onclick=confirmFinish;
  $('#fl').onclick=()=>{S.flag[k]=!S.flag[k];draw()};
  const ck=$('#ck');if(ck)ck.onclick=check;
  app.querySelectorAll('.map button').forEach(b=>b.onclick=()=>go(+b.dataset.j));
  app.querySelectorAll('.pt').forEach(c=>c.onchange=()=>{S.pts[k]=S.pts[k]||[];S.pts[k][+c.dataset.i]=c.checked;});
  if(!locked&&q.t==='fill'&&fi&&!S.checked[k]){}
}
function updateBar(){const b=app.querySelector('.bar>b');if(b)b.style.width=S.list.filter(isAnswered).length/S.list.length*100+'%'}
function go(j){if(j<0||j>=S.list.length)return;S.i=j;draw();window.scrollTo({top:0,behavior:'smooth'})}
function check(){const k=S.list[S.i],q=qs[k];if(q.t==='fill'&&!(S.ans[k]||'').trim()){return}S.checked[k]=true;if(q.t==='open')S.pts[k]=S.pts[k]||[];draw()}
function act(){const k=S.list[S.i];if(S.mode==='train'&&!S.checked[k]&&$('#ck')&&!$('#ck').disabled)check();else go(S.i+1)}
function expBlock(k){const q=qs[k];return `<div class="expl"><b>Explication.</b> ${esc(q.e||'')}${q.r?`<br><b class="ref">📖 ${esc(q.r)}</b>`:''}</div>`}
function correctText(k){const q=qs[k];if(q.t==='qcm')return q.o[0];if(q.t==='vf')return q.a?'Vrai':'Faux';if(q.t==='fill')return q.ans[0];return q.model}
function feedback(k,review){
  const q=qs[k];
  if(q.t==='open'){
    const p=S.pts[k]||[];
    return `<div class="expl"><b>Corrigé type.</b> ${esc(q.model)}<br><br><b>Auto-évaluation :</b> cochez les éléments présents dans votre réponse.
    <div style="margin-top:8px;display:grid;gap:6px">${q.pts.map((t,i)=>`<label style="display:flex;gap:10px;align-items:flex-start;min-height:32px"><input type="checkbox" class="pt" data-i="${i}" ${p[i]?'checked':''} style="margin-top:5px;accent-color:var(--brand)"> <span>${esc(t)}</span></label>`).join('')}</div>${q.r?`<b class="ref">📖 ${esc(q.r)}</b>`:''}</div>`;
  }
  const s=score(k)===1;
  return `<div class="expl ${s?'':'bad'}"><b>${s?'✓ Correct.':'✗ Incorrect.'}</b> ${s?'':`Bonne réponse : <b>${esc(correctText(k))}</b>. `}${esc(q.e||'')}${q.r?`<br><b class="ref">📖 ${esc(q.r)}</b>`:''}</div>`;
}
function confirmFinish(){
  const un=S.list.filter(k=>!isAnswered(k)).length;
  if(un&&!confirm(un+' question(s) sans réponse. Terminer quand même ?'))return;
  finish();
}
/* ---- résultats ---- */
function finish(){
  clearInterval(tick);S.done=true;
  S.list.forEach(k=>{if(qs[k].t==='open'&&!S.pts[k])S.pts[k]=[]});
  results();
}
function mention(s,max){const r=s/max*20;return r>=16?'Excellent':r>=14?'Très bien':r>=12?'Bien':r>=10?'Passable':'À retravailler'}
function results(filter){
  filter=filter||'all';
  const max=S.list.length,sc=total(),pct=sc/max,R=78,C=2*Math.PI*R;
  const full=S.list.length===N;
  if(full){const b=store.get(KEY);if(!b||sc>b.score)store.set(KEY,{score:Math.round(sc*10)/10,date:new Date().toISOString().slice(0,10)})}
  const ok=S.list.filter(k=>score(k)===1).length,ko=S.list.filter(k=>score(k)===0).length;
  const secs=Math.floor((Date.now()-S.start)/1000);
  const shown=S.list.filter(k=>filter==='all'||(filter==='ko'&&score(k)<1)||(filter==='flag'&&S.flag[k]));
  app.innerHTML=`<div class="hero" style="padding-bottom:12px"><div class="kicker">Résultats · ${esc(SUB.name)} · Examen ${E.id}</div><h1>${esc(E.title)}</h1></div>
  <div class="card score"><div class="ring"><svg width="180" height="180" viewBox="0 0 180 180"><circle cx="90" cy="90" r="${R}" fill="none" stroke="var(--line)" stroke-width="12"/><circle cx="90" cy="90" r="${R}" fill="none" stroke="${pct>=.5?'var(--ok)':'var(--bad)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct)}"/></svg>
   <div class="t"><b id="sc">${fmt(sc/max*20)}</b><span>sur 20</span></div></div>
   <div><h2 style="font-size:26px">${mention(sc,max)}</h2><div class="stats"><div class="stat"><b>${ok}</b>correctes</div><div class="stat"><b>${ko}</b>fausses</div><div class="stat"><b>${Math.floor(secs/60)} min ${secs%60}s</b>durée</div></div>
   <div class="nav noprint" style="margin-top:6px"><button class="btn primary" id="rt">↻ Recommencer</button>${ko+S.list.filter(k=>score(k)>0&&score(k)<1).length?'<button class="btn" id="rw">Refaire les erreurs</button>':''}<button class="btn" onclick="print()">🖨 Imprimer</button><a class="btn" href="index.html">Tous les examens</a></div></div></div>
  <div class="filters noprint" role="group" aria-label="Filtrer"><button class="chip" data-f="all" aria-pressed="${filter==='all'}">Toutes (${max})</button><button class="chip" data-f="ko" aria-pressed="${filter==='ko'}">À revoir (${S.list.filter(k=>score(k)<1).length})</button><button class="chip" data-f="flag" aria-pressed="${filter==='flag'}">Marquées (${S.list.filter(k=>S.flag[k]).length})</button></div>
  ${shown.map(k=>review(k)).join('')||'<p class="hint">Aucune question dans ce filtre.</p>'}`;
  $('#rt').onclick=()=>{fresh(S.mode);run()};
  const rw=$('#rw');if(rw)rw.onclick=()=>{const l=S.list.filter(k=>score(k)<1);fresh(S.mode==='exam'?'train':S.mode,l);run()};
  app.querySelectorAll('.chip').forEach(c=>c.onclick=()=>results(c.dataset.f));
  app.querySelectorAll('.pt').forEach(c=>c.onchange=()=>{const k=+c.closest('.rev').dataset.k;S.pts[k]=S.pts[k]||[];S.pts[k][+c.dataset.i]=c.checked;const s=total()/max*20;$('#sc').textContent=fmt(s)});
  window.scrollTo({top:0});
}
function review(k){
  const q=qs[k],a=S.ans[k],idx=S.list.indexOf(k)+1;
  let ans='';
  if(q.t==='qcm'){ans='<ul class="opts">'+S.perm[k].map((oi,p)=>{let c='o';if(oi===0)c+=' ok';else if(a===oi)c+=' ko';return `<li><div class="${c}"><span class="k">${LET[p]}</span><span>${esc(q.o[oi])}</span></div></li>`}).join('')+'</ul>';if(a===undefined)ans+='<p class="hint">Sans réponse.</p>'}
  else if(q.t==='vf'){ans='<ul class="opts">'+[true,false].map(v=>{let c='o';if(v===q.a)c+=' ok';else if(a===v)c+=' ko';return `<li><div class="${c}"><span class="k">${v?'V':'F'}</span><span>${v?'Vrai':'Faux'}</span></div></li>`}).join('')+'</ul>'}
  else if(q.t==='fill'){ans=`<p>Votre réponse : <b>${a?esc(a):'—'}</b></p>`}
  else ans=`<p class="hint">Votre réponse :</p><div class="o" style="white-space:pre-wrap;display:block;min-height:0">${a&&a.trim()?esc(a):'—'}</div>`;
  return `<div class="card rev" data-k="${k}"><span class="tag" style="display:inline-block;font:700 12px system-ui;color:var(--gold);background:var(--gold-soft);padding:3px 9px;border-radius:99px;margin-bottom:10px">Q${idx} · ${fmt(score(k))} pt${S.flag[k]?' · ⚑':''}</span><h3 style="font-size:18px;margin-bottom:12px">${esc(q.q).replace('________','<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>')}</h3>${ans}${feedback(k,true)}</div>`;
}
/* ---- clavier ---- */
document.addEventListener('keydown',e=>{
  if(!S||S.done||e.ctrlKey||e.metaKey||e.altKey)return;
  const tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea')return;
  const k=S.list[S.i],q=qs[k];
  const key=e.key.toLowerCase();
  if(key==='arrowright'){go(S.i+1)}else if(key==='arrowleft'){go(S.i-1)}
  else if(key==='f'){S.flag[k]=!S.flag[k];draw()}
  else if(key==='enter'&&tag!=='button'){act()}
  else if(['a','b','c','d','1','2','3','4'].includes(key)&&!(S.mode==='train'&&S.checked[k])){
    const p='abcd'.includes(key)?'abcd'.indexOf(key):+key-1;
    if(q.t==='qcm'&&p<4){S.ans[k]=S.perm[k][p];draw()}
    if(q.t==='vf'&&p<2){S.ans[k]=p===0;draw()}
  }
});
/* thème */
const th=$('#theme');if(th){const root=document.documentElement;const sv=store.get('theme');if(sv)root.dataset.theme=sv;
 th.onclick=()=>{const dark=root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;const n=dark?'light':'dark';root.dataset.theme=n;store.set('theme',n)}}
intro();
})();
