/* Percurso interativo de leitura: aula RLM e Engenharia de Software. */
(() => {
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const rlm = [...document.querySelectorAll('[data-lesson-step]')];
  const eng = [...document.querySelectorAll('.step-marker[id^="etapa-"]')];
  const isRlm = rlm.length > 0;
  const isEng = !isRlm && eng.length > 0;
  if (!isRlm && !isEng) return;
  const steps = isRlm ? rlm.map(node => ({node,code:node.dataset.lessonStep,id:node.id})) :
    eng.map(node => ({node,code:node.id.replace('etapa-','').replace('-','.'),id:node.id}));
  const progressKey = isRlm ? 'concurso_rlm_steps_v1' : 'concurso_eng_qualidade_steps_v1';
  const autoScrollKey = 'concurso_auto_scroll_' + (isRlm ? 'rlm' : 'eng') + '_v1';
  const autoNextKey = 'concurso_mark_on_next_v1';
  const name = isRlm ? 'RLM' : 'Engenharia e Qualidade';
  const safeRead = key => {try {return localStorage.getItem(key);}catch{return null;}};
  const safeWrite = (key,value) => {try {localStorage.setItem(key,value);return true;}catch{return false;}};
  const knownCodes=new Set(steps.map(s=>s.code));
  let engRead = new Set();
  if(isEng){try{const saved=JSON.parse(safeRead(progressKey)||'[]'); if(Array.isArray(saved)) engRead=new Set(saved.filter(v=>knownCodes.has(v)));}catch{}}
  const menu=document.createElement('details');
  menu.className='study-menu';
  menu.innerHTML='<summary aria-label="Abrir menu de navegação">☰ Menu</summary><nav aria-label="Menu de aulas"><a href="../index.html">Início · Painel</a><a href="../aulas.html">Todas as aulas</a><a href="rlm.html">Raciocínio Lógico-Matemático</a><a href="engenharia-qualidade.html">Engenharia e Qualidade</a></nav>';
  const area=isRlm?document.querySelector('.topactions'):document.querySelector('.header-actions');
  if(area){
    if(isRlm){const old=area.querySelector('a[href="../index.html"]');if(old)old.remove();}
    area.insertBefore(menu,area.firstChild);
  }
  document.addEventListener('click',e=>{if(!menu.contains(e.target))menu.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')menu.open=false;});
  function savedSet(){
    if(isEng)return new Set(engRead);
    try{const x=JSON.parse(safeRead(progressKey)||'[]');return new Set(Array.isArray(x)?x.filter(code=>knownCodes.has(code)):[]);}catch{return new Set();}
  }
  function isRead(code){return savedSet().has(code);}
  function mark(code){
    if(!knownCodes.has(code) || isRead(code))return false;
    if(isRlm){
      const node=steps.find(s=>s.code===code)?.node;
      const btn=node?.querySelector('.step-reading-button');
      if(btn){btn.click();return true;}
      const old=savedSet();old.add(code);if(!safeWrite(progressKey,JSON.stringify([...old])))return false;
      paintRlm();
    }else{engRead.add(code);if(!safeWrite(progressKey,JSON.stringify([...engRead])))return false;paintEng();}
    dispatchEvent(new CustomEvent('concurso:read-change',{detail:{course:isRlm?'rlm':'eng'}}));
    return true;
  }
  function paintRlm(){
    const set=savedSet();
    for (const s of steps){
      const link=document.querySelector('[data-step-link="'+s.id+'"]');
      if(link)link.classList.toggle('read',set.has(s.code));
    }
  }
  function paintEng(){
    const byModule={};
    const set=savedSet();
    for(const s of steps){
      const complete=set.has(s.code);
      const btn=s.node.querySelector('.reader-step-button');
      if(btn){btn.textContent=complete?'✓ Lido · desfazer':'○ Marcar como lido';btn.setAttribute('aria-pressed',String(complete));btn.classList.toggle('is-read',complete);}
      const link=document.querySelector('.step-index a[href="#'+s.id+'"]');
      if(link){link.classList.add('reader-step-link');link.classList.toggle('read',complete);}
      const mod=s.code.split('.')[0];
      if(!byModule[mod])byModule[mod]={total:0,done:0};
      byModule[mod].total++;
      if(complete)byModule[mod].done++;
    }
    Object.entries(byModule).forEach(([mod,x])=>{
      const el=document.getElementById('reader-count-'+mod);
      if(el)el.textContent=x.done+' de '+x.total+' etapas lidas';
    });
    const total=document.getElementById('reader-grand-total');
    if(total)total.textContent=set.size+' de '+steps.length+' etapas lidas';
  }
  if(isEng){
    for(const s of steps){
      const btn=document.createElement('button');
      btn.type='button';btn.className='reader-step-button';btn.setAttribute('aria-label','Marcar ou desmarcar etapa '+s.code+' como lida');
      btn.addEventListener('click',()=>{
        if(engRead.has(s.code))engRead.delete(s.code);else engRead.add(s.code);
        if(!safeWrite(progressKey,JSON.stringify([...engRead]))){alert('Não foi possível salvar o progresso neste navegador.');return;}
        paintEng();
        dispatchEvent(new CustomEvent('concurso:read-change',{detail:{course:'eng'}}));
      });
      s.node.appendChild(btn);
    }
    document.querySelectorAll('.section[id^="sec"]').forEach(section=>{
      const mod=section.id.replace('sec','');
      const el=document.createElement('div');el.className='reader-chapter-count';el.id='reader-count-'+mod;
      const title=section.querySelector('h2');if(title)title.insertAdjacentElement('afterend',el);
    });
    const sidebar=document.querySelector('.side-footer');
    if(sidebar){const el=document.createElement('div');el.className='reader-global-count';el.id='reader-grand-total';sidebar.appendChild(el);}
    paintEng();
  } else paintRlm();
  let current=0;
  const locateHash=()=>steps.findIndex(s=>s.id===location.hash.slice(1));
  const pos=locateHash();if(pos>=0)current=pos;
  const bar=document.createElement('div');bar.className='reader-stepbar';bar.setAttribute('aria-label','Navegação entre subseções');
  const currentEl=document.createElement('div');currentEl.className='reader-current';
  const buttons=document.createElement('div');buttons.className='reader-bar-actions';
  const prev=document.createElement('button');prev.type='button';prev.textContent='← Anterior';
  const next=document.createElement('button');next.type='button';next.className='primary';
  const options=document.createElement('details');options.className='reader-options';
  options.innerHTML='<summary>Opções</summary><div class="reader-options-panel"><label><input id="reader-auto-next" type="checkbox"> Marcar a etapa atual como lida ao clicar em “Próxima”</label><label><input id="reader-auto-scroll" type="checkbox"> Marcação automática experimental ao rolar e avançar após pelo menos 25 segundos na etapa</label><small>O modo de rolagem é opcional e apenas estima o percurso. Mesmo quando a etapa é marcada, isso não significa estudo comprovado ou domínio. Pode desmarcar a qualquer momento.</small></div>';
  buttons.append(prev,next,options);bar.append(currentEl,buttons);document.body.appendChild(bar);
  const spacer=document.createElement('div');spacer.className='reader-sticky-spacer';document.body.appendChild(spacer);
  const autoNext=options.querySelector('#reader-auto-next'),autoScroll=options.querySelector('#reader-auto-scroll');
  autoNext.checked=safeRead(autoNextKey)!=='false';
  autoScroll.checked=safeRead(autoScrollKey)==='true';
  autoNext.addEventListener('change',()=>{safeWrite(autoNextKey,String(autoNext.checked));renderCurrent();});
  autoScroll.addEventListener('change',()=>safeWrite(autoScrollKey,String(autoScroll.checked)));
  let entered=performance.now();
  let skipScrollUntil=0;
  function renderCurrent(){
    const label=steps[current]?.code||'';
    currentEl.replaceChildren();
    const strong=document.createElement('strong');strong.textContent=name+' · '+label;
    const small=document.createElement('small');small.textContent=(current+1)+' de '+steps.length+' etapas';
    currentEl.append(strong,small);
    prev.disabled=current===0;
    next.disabled=current>=steps.length-1;
    next.textContent=autoNext.checked?'✓ Lido e próxima →':'Próxima →';
  }
  function select(i,nav=false){
    if(i<0||i>=steps.length)return;
    current=i;entered=performance.now();renderCurrent();
    if(isEng && document.body.classList.contains('focus')){document.querySelectorAll('.section[id^="sec"]').forEach(section=>section.classList.toggle('current',section.contains(steps[i].node)));}
    if(nav){
      skipScrollUntil=performance.now()+1100;
      const s=steps[i];
      if(location.hash.slice(1)!==s.id)location.hash=s.id;
      else s.node.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  prev.addEventListener('click',()=>select(current-1,true));
  next.addEventListener('click',()=>{
    if(current>=steps.length-1)return;
    if(autoNext.checked)mark(steps[current].code);
    select(current+1,true);
  });
  renderCurrent();
  document.addEventListener('click',e=>{
    const link=e.target.closest?.('a[href^="#"]');
    if(!link)return;
    const target=link.getAttribute('href').slice(1);
    const idx=steps.findIndex(s=>s.id===target);
    if(idx>=0){skipScrollUntil=performance.now()+1200;select(idx);}
  });
  addEventListener('hashchange',()=>{
    const i=locateHash();if(i>=0){skipScrollUntil=performance.now()+1200;select(i);}
  });
  let pending=false;
  function updateByScroll(){
    pending=false;
    if(!steps.length || document.hidden)return;
    const threshold=Math.min(innerHeight*.36,220);
    // A aula de RLM inclui cartões em duas colunas: considerar a posição real
    // dos marcadores em tela e preferir a posição anterior quando empata.
    let idx=0,best=-Infinity;
    for(let i=0;i<steps.length;i++){
      const rect=steps[i].node.getBoundingClientRect();
      if(rect.top<=threshold && rect.top>=best-1 && rect.top<=best+1 && i<idx)continue;
      if(rect.top<=threshold && rect.top>best+1){best=rect.top;idx=i;}
    }
    if(idx===current)return;
    const now=performance.now(),previous=current,elapsed=now-entered;
    if(autoScroll.checked && now>skipScrollUntil && idx===previous+1 && elapsed>=25000 && idx>previous && !document.hidden){
      mark(steps[previous].code);
    }
    select(idx);
  }
  addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateByScroll);}}, {passive:true});
  addEventListener('storage',e=>{if(e.key===progressKey){if(isEng){try{const v=JSON.parse(e.newValue||'[]');engRead=new Set(Array.isArray(v)?v.filter(x=>knownCodes.has(x)):[]);}catch{engRead=new Set();}paintEng();}else paintRlm();}});
  // Entrar no modo de leitura não marca nada; o tempo mínimo é contado apenas
  // enquanto a aba está ativa. Retomar a aba reinicia a contagem.
  document.addEventListener('visibilitychange',()=>{entered=performance.now();});
});
})();
