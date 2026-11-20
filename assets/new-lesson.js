/* Leitura das novas aulas: cada seção tem controle no FINAL no próprio HTML.
   Progresso reversível e backups versionados; Lido não comprova domínio. */
(()=>{'use strict';
const main=document.body,slug=main.dataset.ceLesson;
if(!/^[a-z][a-z0-9-]{2,40}$/.test(slug||''))return;
const KEY='ce_lesson_read_v1:'+slug;
const $$=s=>[...document.querySelectorAll(s)],$=s=>document.querySelector(s);
const ids=$$('input[data-ce-read]').map(x=>x.dataset.ceRead);
const allowed=new Set(ids);
const parse=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return Array.isArray(x.read)?x:{};}catch{return {};}};
const current=()=>{const read=parse().read;return new Set(Array.isArray(read)?read.filter(x=>allowed.has(x)):[]);};
function status(text){const node=$('#nl-status');if(node)node.textContent=text;}
function save(idsToSave){
 const doc=parse(),read=[...idsToSave].filter(x=>allowed.has(x)).sort((a,b)=>ids.indexOf(a)-ids.indexOf(b));
 try{localStorage.setItem(KEY,JSON.stringify({...doc,version:1,lesson:slug,read,savedAt:new Date().toISOString()}));}
 catch{status('Não foi possível salvar localmente. Exporte um backup para proteger seus dados.');return false;}
 dispatchEvent(new CustomEvent('concurso:read-change'));
 draw();
 return true;
}
function draw(){
 const list=current(),count=list.size;
 for(const x of $$('input[data-ce-read]'))x.checked=list.has(x.dataset.ceRead);
 for(const a of $$('a[data-ce-nav]'))a.dataset.read=list.has(a.dataset.ceNav)?'true':'false';
 const meter=$('#nl-meter'),label=$('#nl-count');
 if(meter)meter.value=count;
 if(label)label.textContent=count+' de '+ids.length+' subseções marcadas como Lido';
 const box=$('#nl-global-status');if(box)box.textContent=count===ids.length?'Todas as subseções estão marcadas como Lido; revise por questões para verificar retenção.':'Ainda restam '+(ids.length-count)+' subseções para ler.';
 for(const section of $$('section.nl-chapter')){
  const chapters=[...section.querySelectorAll('article.nl-section[id]')].map(x=>x.id).filter(x=>allowed.has(x));
  const countEl=section.querySelector('[data-ce-module-count]');if(!chapters.length||!countEl)continue;
  const done=chapters.filter(id=>list.has(id)).length;
  countEl.textContent=done+' de '+chapters.length+' subseções marcadas como Lido';
  const toggle=section.querySelector('[data-ce-module-toggle]');
  if(toggle){toggle.textContent=done===chapters.length?'Desmarcar todas as subseções':'Marcar todas as subseções como Lido';toggle.setAttribute('aria-pressed',String(done===chapters.length));}
 }
}
$$('input[data-ce-read]').forEach(x=>x.addEventListener('change',()=>{
 const next=current();if(x.checked)next.add(x.dataset.ceRead);else next.delete(x.dataset.ceRead);
 if(save(next))status('Marcação atualizada neste aparelho. A sincronização privada tentará enviar as alterações.');
}));
$('#nl-export')?.addEventListener('click',()=>{
 const v={...parse(),version:1,lesson:slug,read:[...current()],exportedAt:new Date().toISOString()};
 const url=URL.createObjectURL(new Blob([JSON.stringify(v,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='concurso-'+slug+'-leitura-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status('Backup JSON baixado.');
});
$('#nl-import')?.addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 try{
  if(file.size>75000)throw Error('arquivo excede 75 kB');
  const v=JSON.parse(await file.text());
  if(v.version!==1||v.lesson!==slug||!Array.isArray(v.read)||v.read.some(x=>!allowed.has(x)))throw Error('backup não corresponde a esta aula');
  const merged=current();for(const id of v.read)merged.add(id);
  if(confirm('Mesclar as marcações Lido do backup com as atuais, sem apagar leituras?')){save(merged);status('Backup importado e mesclado.');}
 }catch(err){status('Importação recusada: '+err.message);}
});
const select=$('#nl-exam'),form=$('[data-ce-quiz]');
if(select&&form){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=k=>parts.find(p=>p.type===k)?.value;const day=get('year')+'-'+get('month')+'-'+get('day');
 select.value=day<='2026-11-22'?'casan':'ima';
 form.dataset.exam=select.value;
 select.addEventListener('change',()=>{form.dataset.exam=select.value;});
}
// Navegação comum: o botão Próxima marca a seção QUE FOI LIDA, nunca a destino.
// Preferência ativada por padrão e reversível nas configurações da aula.
function installModuleControls(){
 for(const section of $$('section.nl-chapter')){
  const sectionIds=[...section.querySelectorAll('article.nl-section[id]')].map(x=>x.id).filter(id=>allowed.has(id));
  const header=section.querySelector(':scope > header');if(!sectionIds.length||!header||section.querySelector('[data-ce-module-count]'))continue;
  const box=document.createElement('div');box.className='ce-module-reading';
  const progress=document.createElement('strong');progress.dataset.ceModuleCount='';progress.setAttribute('role','status');box.append(progress);
  const button=document.createElement('button');button.type='button';button.dataset.ceModuleToggle='';button.setAttribute('aria-label','Marcar ou desmarcar todas as subseções do módulo');box.append(button);
  button.addEventListener('click',()=>{
   const value=current(),allRead=sectionIds.every(id=>value.has(id));
   for(const id of sectionIds){if(allRead)value.delete(id);else value.add(id);}
   if(save(value))status(allRead?'Subseções deste módulo desmarcadas.':'Subseções deste módulo marcadas por ação coletiva.');
  });
  header.append(box);
 }
 draw();
}
function installNextNavigation(){
 const sections=[...document.querySelectorAll('article.nl-section[data-ce-topic]')];
 if(!sections.length)return;
 const preferenceKey='ce_next_read_v1:'+slug;
 let advanceReads=true;
 try{advanceReads=localStorage.getItem(preferenceKey)!=='false';}catch{}
 const tools=$('#ferramentas-da-aula .ce-lesson-tools-content');
 if(tools&&!$('#ce-next-reading-preference')){
   const label=document.createElement('label');
   label.id='ce-next-reading-preference';
   label.style.cssText='display:flex;gap:9px;align-items:center;flex-wrap:wrap';
   const preference=document.createElement('input');
   preference.type='checkbox';preference.checked=advanceReads;
   preference.setAttribute('aria-label','Marcar a subseção atual como Lido ao clicar em Próxima');
   label.append(preference,document.createTextNode('Marcar Lido ao clicar em Próxima (ativado por padrão)'));
   tools.prepend(label);
   preference.addEventListener('change',()=>{
     advanceReads=preference.checked;
     try{localStorage.setItem(preferenceKey,String(advanceReads));}
     catch{status('Não foi possível salvar a preferência neste navegador.');}
   });
 }
 const lessonSteps=sections.filter(node=>allowed.has(node.id));
 for(const [i,section] of lessonSteps.entries()){
   if(section.querySelector('.ce-step-navigation'))continue;
   const nav=document.createElement('nav');
   nav.className='ce-step-navigation';
   nav.setAttribute('aria-label','Navegação da subseção '+(i+1));
   if(i){
     const back=document.createElement('a');back.textContent='← Anterior';
     back.href='#'+lessonSteps[i-1].id;nav.append(back);
   }
   const next=lessonSteps[i+1];
   const questions=document.getElementById('questoes');
   const forward=document.createElement('a');
   forward.className='ce-step-next';
   forward.textContent=next?'Próxima →':questions?'Concluir e ir às questões →':'Concluir e voltar às aulas →';
   forward.href=next?'#'+next.id:questions?'#questoes':'../aulas.html';
   forward.dataset.ceNext=section.id;
   forward.addEventListener('click',()=>{
     if(!advanceReads)return;
     const state=current();
     if(state.has(section.id))return;
     state.add(section.id);
     if(save(state))status('Etapa '+section.id+' marcada como Lido ao avançar. Para desmarcar, use o controle no fim da seção.');
   });
   nav.append(forward);
   section.append(nav);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installModuleControls();setTimeout(installNextNavigation,0);},{once:true});
else {installModuleControls();setTimeout(installNextNavigation,0);}
addEventListener('concurso:sync-status',e=>{if(e.detail?.message?.startsWith('Sincronizado')){draw();status('Leitura sincronizada com seu banco privado.');}});
addEventListener('storage',e=>{if(e.key===KEY)draw();});
draw();
})();