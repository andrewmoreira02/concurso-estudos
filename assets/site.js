/* Concurso Estudos — leitura local. Sem transmissão a terceiros. */
(() => {
  'use strict';
  const STEP_KEY = 'concurso_rlm_steps_v1';
  const MODULE_KEY = 'rlm_shared_done_v1';
  const LEGACY_MODULE_KEY = 'casan_rlm_done_v1';
  const MAX_STEP = 71;
  const MOD_RE = /^m(?:[1-9]|10|11)$/;
  const STEP_RE = /^(?:[1-9]|10|11)\.(?:[1-9]|[1-9]\d)$/;
  const $ = id => document.getElementById(id);
  const safeParse = value => { try { return JSON.parse(value); } catch { return null; } };
  const cleanSteps = value => Array.isArray(value) ? [...new Set(value.filter(v => typeof v === 'string' && STEP_RE.test(v)))].slice(0, MAX_STEP) : [];
  function readSteps() {
    try { return cleanSteps(safeParse(localStorage.getItem(STEP_KEY))); } catch { return []; }
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
      localStorage.setItem(STEP_KEY, JSON.stringify(cleanSteps(steps)));
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
    $('rlmModules').textContent = m + ' de 11 módulos marcados como lidos (controle separado)';
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
  function backup() {
    return {
      format:'concurso-estudos-progress',
      version:1,
      savedAt:new Date().toISOString(),
      rlm:{readSubsections:readSteps(),readModules:readModules()},
      interpretation:'As marcações são de leitura, não evidência de domínio.'
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
        if (file.size>120000) throw Error('arquivo acima de 120 KB');
        const data=safeParse(await file.text());
        if (!data || typeof data !== 'object') throw Error('JSON inválido');
        let steps, modules;
        if(data.format==='concurso-estudos-progress' && data.version===1 && data.rlm && Array.isArray(data.rlm.readSubsections) && Array.isArray(data.rlm.readModules)){
          steps=data.rlm.readSubsections;modules=data.rlm.readModules;
        } else if(['rlm-shared-progress','casan-rlm-progress'].includes(data.format) && Array.isArray(data.markedAsStudied)){
          steps=readSteps(); modules=data.markedAsStudied;
        } else throw Error('formato de backup não reconhecido');
        if(steps.length>MAX_STEP || !steps.every(x=>typeof x==='string' && STEP_RE.test(x))) throw Error('subseções inválidas');
        if(modules.length>11 || !modules.every(x=>typeof x==='string' && MOD_RE.test(x))) throw Error('módulos inválidos');
        const validSteps = document.querySelectorAll('[data-lesson-step]').length
          ? new Set([...document.querySelectorAll('[data-lesson-step]')].map(n=>n.getAttribute('data-lesson-step'))) : null;
        if(validSteps && !steps.every(x=>validSteps.has(x))) throw Error('subseção não presente nesta aula');
        if(!storeSteps(steps)) throw Error('armazenamento indisponível');
        try{localStorage.setItem(MODULE_KEY,JSON.stringify([...new Set(modules)]));} catch {throw Error('não foi possível salvar módulos');}
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
    addEventListener('storage', e=> {if([STEP_KEY,MODULE_KEY,'concurso_eng_qualidade_steps_v1'].includes(e.key)){paintLesson();paintDashboard();updateCatalogStats();}});
  });
})();
