/* Concurso Estudos — leitura local. Sem transmissão a terceiros. */
(() => {
  'use strict';
  const STEP_KEY = 'concurso_rlm_steps_v1';
  const NEW_STEP_KEY = 'concursos_rlm_sections_read_v3';
  const MODULE_KEY = 'rlm_shared_done_v1';
  const LEGACY_MODULE_KEY = 'casan_rlm_done_v1';
  const MAX_STEP = 71;
  const MOD_RE = /^m(?:[1-9]|10|11)$/;
  const STEP_RE = /^(?:[1-9]|10|11)\.(?:[1-9]|[1-9]\d)$/;
  const $ = id => document.getElementById(id);
  const safeParse = value => { try { return JSON.parse(value); } catch { return null; } };
  const cleanSteps = value => Array.isArray(value) ? [...new Set(value.filter(v => typeof v === 'string' && STEP_RE.test(v)))].slice(0, MAX_STEP) : [];
  function readSteps() {
    try {
      const revised=safeParse(localStorage.getItem(NEW_STEP_KEY));
      if(revised && Array.isArray(revised.readSections)){
        const codes=revised.readSections.map(id=>{
          const match=typeof id==='string'&&id.match(/^m(\d+)-s(\d+)$/);
          return match ? Number(match[1])+'.'+Number(match[2]) : null;
        });
        return cleanSteps(codes);
      }
      return cleanSteps(safeParse(localStorage.getItem(STEP_KEY)));
    } catch { return []; }
  }
  function readModules() {
    try {
      let raw = localStorage.getItem(MODULE_KEY);
      if (raw === null) raw = localStorage.getItem(LEGACY_MODULE_KEY);
      return Array.isArray(safeParse(raw)) ? safeParse(raw).filter(x => typeof x === 'string' && MOD_RE.test(x)) : [];
    } catch { return []; }
  }
  function setStatus(message, error = false) {
    const el = $('saveState') || $('readingStatus');
    if (el) { el.textContent = message; el.style.color = error ? '#ffbd93' : '#9ff4cf'; }
  }
  function storeSteps(steps) {
    try {
      const codes=cleanSteps(steps);
      localStorage.setItem(STEP_KEY,JSON.stringify(codes));
      const before=safeParse(localStorage.getItem(NEW_STEP_KEY));
      const previous=before&&typeof before==='object'?before:{};
      const readSections=codes.map(code=>{const [m,n]=code.split('.');return 'm'+Number(m)+'-s'+Number(n);});
      localStorage.setItem(NEW_STEP_KEY,JSON.stringify({
        ...previous,format:'concursos-rlm-leitura',version:3,documentId:'rlm-aula-completa-17nov',
        readSections,legacyModules:Array.isArray(previous.legacyModules)?previous.legacyModules:[],
        preferences:previous.preferences||{markOnNext:false},
        lastSection:previous.lastSection||'m6-s1',savedAt:new Date().toISOString(),
        interpretation:'Lido registra leitura declarada, não domínio.'
      }));
      setStatus('✓ Leitura salva neste navegador');
      return true;
    } catch {
      setStatus('⚠ Salvamento indisponível. Faça um backup.', true);
      return false;
    }
  }
  function paintDashboard() {
    if (!$('rlmLabel')) return;
    const n = readSteps().length;
    $('rlmLabel').textContent = n + ' de ' + MAX_STEP;
    $('readFact').textContent = String(n);
    $('rlmFill').style.width = (n / MAX_STEP * 100).toFixed(2) + '%';
    $('rlmBar').setAttribute('aria-valuenow', String(n));
    const m = readModules().length;
    $('rlmModules').textContent = m + ' registros legados por módulo (não equivalem a subseções lidas)';
    try { const key = '__concurso_storage_test__'; localStorage.setItem(key, '1'); localStorage.removeItem(key); setStatus('✓ Salvamento local disponível'); }
    catch { setStatus('⚠ Salvamento local indisponível', true); }
  }
  function paintLesson() {
    const complete = new Set(readSteps());
    const nodes = [...document.querySelectorAll('[data-lesson-step]')];
    nodes.forEach(node => {
      const code = node.getAttribute('data-lesson-step');
      const button = node.querySelector('.step-reading-button');
      if (!button) return;
      const active = complete.has(code);
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-read', active);
      button.textContent = active ? '✓ Lido · desfazer' : '○ Marcar como lido';
      const link = document.querySelector('[data-step-link="m' + code.split('.')[0] + '-s' + code.split('.')[1] + '"]');
      if (link) link.classList.toggle('read', active);
    });
    const byModule = {};
    nodes.forEach(n => { const mod = n.getAttribute('data-lesson-step').split('.')[0]; if (!byModule[mod]) byModule[mod] = {total:0,read:0}; byModule[mod].total++; if (complete.has(n.getAttribute('data-lesson-step'))) byModule[mod].read++; });
    Object.entries(byModule).forEach(([m,v]) => {
      const counter = $('step-progress-m' + m);
      if (counter) counter.textContent = v.read + ' de ' + v.total + ' subseções lidas';
    });
    const overall = $('readingTotal');
    if (overall) overall.textContent = complete.size + ' de ' + nodes.length + ' subseções lidas';
  }
  function setupLesson() {
    const nodes = [...document.querySelectorAll('[data-lesson-step]')];
    if (!nodes.length) return;
    nodes.forEach(node => {
      const code = node.getAttribute('data-lesson-step');
      if (!STEP_RE.test(code)) return;
      if (node.querySelector('.step-reading-button')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'step-reading-button';
      button.setAttribute('aria-label', 'Marcar ou desmarcar subseção ' + code + ' como lida');
      button.addEventListener('click', () => {
        const current = new Set(readSteps());
        if (current.has(code)) current.delete(code); else current.add(code);
        storeSteps([...current]);
        paintLesson();
      });
      node.appendChild(button);
    });
    document.querySelectorAll('section[data-chapter]').forEach(section => {
      const module = section.dataset.chapter;
      const h2 = section.querySelector('h2');
      if (!h2 || !module) return;
      const line = document.createElement('div');
      line.className = 'reading-progress-module';
      line.id = 'step-progress-' + module;
      line.setAttribute('aria-live', 'polite');
      h2.insertAdjacentElement('afterend', line);
    });
    const sidebar = document.querySelector('.progressbox');
    if (sidebar) {
      const node = document.createElement('div');
      node.className = 'step-progress-global';
      node.id = 'readingTotal';
      node.setAttribute('aria-live', 'polite');
      sidebar.appendChild(node);
    }
    const top = document.querySelector('.topactions');
    if (top) {
      const home = document.createElement('a'); home.className = 'tiny-btn'; home.href = '../index.html'; home.textContent = '⌂ Painel'; top.insertBefore(home, top.firstChild);
    }
    const style = document.createElement('style');
    style.textContent = '.step-reading-button{display:inline-flex;align-items:center;margin:5px 0 5px 12px;padding:5px 10px;font-size:12px;font-weight:750;line-height:1.5;border-radius:9px;border:1px solid #567286;background:#1f3547;color:#d1e4ee;vertical-align:middle;white-space:nowrap}.step-reading-button:hover{background:#29546b}.step-reading-button.is-read{background:#205040;border-color:#53b89e;color:#c4ffea}.reading-progress-module{font-size:12px;color:#91e8d8;font-weight:750;margin:4px 0 12px}.step-progress-global{font-size:12px;color:#b0f3e5;margin-top:12px;font-weight:800}.steps-nav a.read{border-color:#368c79;background:#1c4a41;color:#c5ffed}.steps-nav a.read::before{content:"✓ ";font-weight:900}@media(max-width:620px){.step-reading-button{margin:6px 0;display:flex}}';
    document.head.appendChild(style);
    paintLesson();
  }
  // Cópia inclui plano e prática: nenhuma marcação é enviada ao GitHub.
  function localJSON(key, fallback) {
    try { const v=JSON.parse(localStorage.getItem(key)); return v===null?fallback:v; }
    catch { return fallback; }
  }
  function validSession(x) {
    return x && typeof x==='object' && typeof x.id==='string' &&
      /^session-\d+-[a-z0-9]+$/.test(x.id) &&
      typeof x.exam==='string' && /^[a-z][a-z0-9_-]{1,39}$/.test(x.exam) &&
      ['ti','portugues','rlm','legislacao','adm','atualidades'].includes(x.subject) &&
      typeof x.topic==='string' && x.topic.length>=2 && x.topic.length<=100 &&
      typeof x.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date) &&
      Number.isInteger(x.valid) && x.valid>=1 && x.valid<=500 &&
      Number.isInteger(x.correct) && x.correct>=0 && x.correct<=x.valid &&
      Number.isInteger(x.annulled) && x.annulled>=0 && x.annulled<=500 &&
      typeof x.kind==='string' && x.kind.length<=40 &&
      typeof x.source==='string' && x.source.length<=240;
  }
  function validateNewData(value) {
    if(!value||typeof value!=='object')throw Error('Dados do painel não encontrados');
    const {planDone, available, questionLogs, reviewDone}=value;
    if(!planDone||typeof planDone!=='object'||Array.isArray(planDone)||
       !Object.entries(planDone).every(([k,v])=>/^\d{4}-\d{2}-\d{2}::[a-z0-9-]{2,30}$/.test(k)&&typeof v==='boolean'))throw Error('Plano inválido');
    if(!Array.isArray(available)||available.length>7||
      !available.every(x=>Number.isInteger(x)&&x>=0&&x<=6))throw Error('Dias disponíveis inválidos');
    if(!Array.isArray(questionLogs)||questionLogs.length>2000||
      !questionLogs.every(validSession))throw Error('Registro de questões inválido');
    const ids=new Set(questionLogs.map(x=>x.id));
    if(ids.size!==questionLogs.length)throw Error('IDs duplicados de questões');
    if(!reviewDone||typeof reviewDone!=='object'||Array.isArray(reviewDone)||
      !Object.entries(reviewDone).every(([k,v])=>{
        const parts=k.match(/^(session-\d+-[a-z0-9]+)-(1|3|7)$/);
        return parts && ids.has(parts[1]) && typeof v==='boolean';
      }))throw Error('Fila de revisões inválida');
    return value;
  }
  const PORTUGUESE_KEY = 'concursos:casan2026:portugues:2026-11-19:subsections:v1';
  const PORTUGUESE_LESSON = 'CASAN_2026_PT_2026_11_19';
  function readPortugueseDocument(){
    const doc=localJSON(PORTUGUESE_KEY,null);
    const read=doc&&doc.lesson===PORTUGUESE_LESSON&&doc.read&&typeof doc.read==='object'&&!Array.isArray(doc.read)?doc.read:{};
    const cleaned={};
    for(const [id,value] of Object.entries(read))if(/^pt19-[1-6]-[1-9]\\d*$/.test(id)&&typeof value==='boolean'&&Object.keys(cleaned).length<21)cleaned[id]=value;
    return {version:1,lesson:PORTUGUESE_LESSON,read:cleaned,legacy:doc&&Array.isArray(doc.legacy)?doc.legacy.slice(0,1000):[]};
  }
  function readPortugueseSteps(){return Object.values(readPortugueseDocument().read).filter(Boolean).length;}
  function backup() {
    const planDone=localJSON('ce_plan_done_v1',{});
    const available=localJSON('ce_available_days_v1',[]);
    const questionLogs=localJSON('ce_question_logs_v1',[]);
    const reviewDone=localJSON('ce_review_done_v1',{});
    return {
      format:'concurso-estudos-progress',
      version:4,
      savedAt:new Date().toISOString(),
      rlm:{readSubsections:readSteps(),readModules:readModules()},
      engenharia:{readSubsections:readEngineeringSteps(),readChapters:readEngineeringChapters()},
      portugues:readPortugueseDocument(),
      site:{
        planDone:planDone && typeof planDone==='object'&&!Array.isArray(planDone)?planDone:{},
        available:Array.isArray(available)?available:[],
        questionLogs:Array.isArray(questionLogs)?questionLogs:[],
        reviewDone:reviewDone&&typeof reviewDone==='object'&&!Array.isArray(reviewDone)?reviewDone:{}
      },
      interpretation:'Leitura, plano marcado e prática autorreportada são evidências diferentes; não equivalem a domínio.'
    };
  }
  function downloadBackup() {
    const data = JSON.stringify(backup(),null,2);
    const url = URL.createObjectURL(new Blob([data], {type:'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'concurso-estudos-backup.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('✓ Backup gerado');
  }
  function installBackup() {
    let exportButton = $('exportButton'), importButton = $('importButton'), input = $('importFile');
    if (!exportButton || !importButton || !input) {
      const target = document.getElementById('backup');
      if (!target) return;
      const wrap = document.createElement('div'); wrap.className = 'unified-backup';
      const heading = document.createElement('p'); heading.textContent = 'Backup completo de leitura (módulos + subseções)';
      heading.style.fontWeight = '800';
      wrap.appendChild(heading);
      exportButton = document.createElement('button'); exportButton.type = 'button'; exportButton.className='tiny-btn'; exportButton.textContent = '↓ Exportar tudo'; exportButton.style.marginRight='8px';
      importButton = document.createElement('button'); importButton.type = 'button'; importButton.className='tiny-btn'; importButton.textContent = '↑ Restaurar tudo';
      input = document.createElement('input'); input.type='file'; input.accept='.json,application/json'; input.hidden=true;
      wrap.append(exportButton,importButton,input);
      target.appendChild(wrap);
    }
    exportButton.addEventListener('click',downloadBackup);
    importButton.addEventListener('click',()=>input.click());
    input.addEventListener('change', async () => {
      const file=input.files?.[0]; if (!file) return;
      try {
        if (file.size>2097152) throw Error('arquivo acima de 2 MB');
        const data=safeParse(await file.text());
        if (!data || typeof data !== 'object') throw Error('JSON inválido');
        let steps, modules, engSteps=null, engChapters=null, newSiteData=null, portugueseDoc=null;
        if(data.format==='concurso-estudos-progress' && [1,2,3,4].includes(data.version) && data.rlm && Array.isArray(data.rlm.readSubsections) && Array.isArray(data.rlm.readModules)){
          steps=data.rlm.readSubsections;modules=data.rlm.readModules;
          if([2,3,4].includes(data.version)){
            if(!data.engenharia || !Array.isArray(data.engenharia.readSubsections) || !Array.isArray(data.engenharia.readChapters))throw Error('Backup de Engenharia incompleto');
            engSteps=data.engenharia.readSubsections;engChapters=data.engenharia.readChapters;
            if(data.version>=3)newSiteData=validateNewData(data.site);
            if(data.version===4){
              const pt=data.portugues;
              if(!pt||pt.lesson!==PORTUGUESE_LESSON||!pt.read||typeof pt.read!=='object'||Array.isArray(pt.read)||Object.keys(pt.read).length>21||!Object.entries(pt.read).every(([id,value])=>/^pt19-[1-6]-[1-9]\\d*$/.test(id)&&typeof value==='boolean'))throw Error('Backup de Português inválido');
              portugueseDoc={version:1,lesson:PORTUGUESE_LESSON,read:pt.read,legacy:Array.isArray(pt.legacy)?pt.legacy.slice(0,1000):[]};
            }
          }
        } else if(['rlm-shared-progress','casan-rlm-progress'].includes(data.format) && Array.isArray(data.markedAsStudied)){
          steps=readSteps(); modules=data.markedAsStudied;
        } else throw Error('formato de backup não reconhecido');
        if(steps.length>MAX_STEP || !steps.every(x=>typeof x==='string' && STEP_RE.test(x))) throw Error('subseções inválidas');
        if(modules.length>11 || !modules.every(x=>typeof x==='string' && MOD_RE.test(x))) throw Error('módulos inválidos');
        if(engSteps!==null && (engSteps.length>37 || !engSteps.every(x=>typeof x==='string' && /^(?:[1-9]|10)\.(?:[1-9]|[1-9]\d)$/.test(x))))throw Error('subseções de Engenharia inválidas');
        if(engChapters!==null && (engChapters.length>10 || !engChapters.every(x=>typeof x==='string' && /^sec(?:[1-9]|10)$/.test(x))))throw Error('capítulos de Engenharia inválidos');
        const validSteps = document.querySelectorAll('[data-lesson-step]').length
          ? new Set([...document.querySelectorAll('[data-lesson-step]')].map(n=>n.getAttribute('data-lesson-step'))) : null;
        if(validSteps && !steps.every(x=>validSteps.has(x))) throw Error('subseção não presente nesta aula');
        if(!confirm('Restaurar o backup e substituir o progresso atual deste navegador?'))return;
        if(!storeSteps(steps)) throw Error('armazenamento indisponível');
        try {
          localStorage.setItem(MODULE_KEY,JSON.stringify([...new Set(modules)]));
          if(engSteps!==null){
            localStorage.setItem('concurso_eng_qualidade_steps_v1',JSON.stringify([...new Set(engSteps)]));
            localStorage.setItem('casan1811_checked',JSON.stringify(Object.fromEntries(engChapters.map(k=>[k,true]))));
          }
          if(portugueseDoc){localStorage.setItem(PORTUGUESE_KEY,JSON.stringify(portugueseDoc));}
          if(newSiteData){
            localStorage.setItem('ce_plan_done_v1',JSON.stringify(newSiteData.planDone));
            localStorage.setItem('ce_available_days_v1',JSON.stringify(newSiteData.available));
            localStorage.setItem('ce_question_logs_v1',JSON.stringify(newSiteData.questionLogs));
            localStorage.setItem('ce_review_done_v1',JSON.stringify(newSiteData.reviewDone));
          }
        } catch {throw Error('não foi possível salvar progresso');}
        setStatus('✓ Progresso restaurado. Atualizando…');
        location.reload();
      } catch(e) {setStatus('⚠ Não foi possível restaurar: '+e.message,true);}
      finally{input.value='';}
    });
  }

  // Catálogo compartilhado: usa somente marcações locais, jamais presume domínio.
  function readEngineeringSteps(){
    try {
      const v=JSON.parse(localStorage.getItem('concurso_eng_qualidade_steps_v1')||'[]');
      return Array.isArray(v) ? [...new Set(v.filter(x=>typeof x==='string' && /^(?:[1-9]|10)\.(?:[1-9]|[1-9]\d)$/.test(x)))].slice(0,37) : [];
    }catch{return [];}
  }
  function readEngineeringChapters(){
    try {
      const v=JSON.parse(localStorage.getItem('casan1811_checked')||'{}');
      return v && typeof v==='object' ? Object.keys(v).filter(k=>/^sec(?:[1-9]|10)$/.test(k)&&v[k]) : [];
    }catch{return [];}
  }
  function updateCatalogStats(){
    const setValue=(textId,barId,fillId,n,total)=>{
      const label=$(textId),bar=$(barId),fill=$(fillId);
      if(label)label.textContent=n+' de '+total;
      if(bar)bar.setAttribute('aria-valuenow',String(n));
      if(fill)fill.style.width=(100*n/total).toFixed(2)+'%';
    };
    setValue('catalogRlmRead','catalogRlmBar','catalogRlmFill',readSteps().length,71);
    setValue('catalogEngRead','catalogEngBar','catalogEngFill',readEngineeringSteps().length,37);
    setValue('catalogPtRead','catalogPtBar','catalogPtFill',readPortugueseSteps(),21);
  }
  function initCatalog(){
    const input=$('lessonSearch'),cards=[...document.querySelectorAll('.catalog-card')];
    if(!input)return;
    const filters=[...document.querySelectorAll('[data-filter]')];
    let active='todas';
    function apply(){
      const q=input.value.trim().toLocaleLowerCase('pt-BR');
      let visible=0;
      cards.forEach(card=>{
        const text=(card.dataset.search||'')+' '+card.textContent.toLocaleLowerCase('pt-BR');
        const show=(active==='todas'||card.dataset.category===active)&&text.includes(q);
        card.hidden=!show;
        if(show)visible++;
      });
      const empty=$('emptyCatalog');if(empty)empty.hidden=visible!==0;
      const count=$('catalogCount');if(count)count.textContent=visible+' aula(s) encontrada(s)';
    }
    input.addEventListener('input',apply);
    filters.forEach(button=>button.addEventListener('click',()=>{
      active=button.dataset.filter;
      filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      apply();
    }));
    apply();
  }
  document.addEventListener('DOMContentLoaded', () => {
    setupLesson();
    installBackup();
    paintDashboard();
    initCatalog();
    updateCatalogStats();
    addEventListener('concurso:read-change',()=>{paintDashboard();updateCatalogStats();});
    addEventListener('storage', e=> {if([STEP_KEY,NEW_STEP_KEY,MODULE_KEY,'concurso_eng_qualidade_steps_v1',PORTUGUESE_KEY].includes(e.key)){paintLesson();paintDashboard();updateCatalogStats();}});
  });
})();
