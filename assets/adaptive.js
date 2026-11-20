/* Atualização adaptativa do Concurso Estudos, v1.
 * A cada 60 minutos enquanto o site estiver aberto, e ao voltar/abrir a página:
 * consulta os dados públicos do plano e o progresso privado já sincronizado.
 * Não gera aulas inexistentes; não atribui Estudado/Avaliado a partir de Lido.
 * Não envia progresso ao GitHub nem modifica planos oficiais ou arquivos privados.
 */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const prefix = location.pathname.includes('/aulas/') ? '../' : '';
const hourMs = 60 * 60 * 1000;
const rlmKey='concursos_rlm_sections_read_v3';
const engKey='concurso_eng_qualidade_steps_v1';
const ptKey='concursos:casan2026:portugues:2026-11-19:subsections:v1';
const logsKey='ce_question_logs_v1', reviewKey='ce_review_done_v1',planKey='ce_plan_done_v1';
let config=null,panel=null,details=null,status=null,button=null,refreshing=false,nextRefresh=false,updateTime=0,renderedSignature='';
const parse=(key,fallback)=>{try{const text=localStorage.getItem(key);const value=text===null?null:JSON.parse(text);return value===null?fallback:value;}catch{return fallback;}};
const isRecord=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const isoToday=()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=k=>parts.find(p=>p.type===k)?.value;return get('year')+'-'+get('month')+'-'+get('day');};
const formatTime=d=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}).format(d);
const localHref=url=>prefix+url;
function sectionId(lesson,module,step){
 if(lesson.section_prefix==='m')return 'm'+module+'-s'+step;
 return lesson.section_prefix+'-'+module+'-'+step;
}
function readSet(id){
 const out=new Set();
 if(id==='rlm'){
   const v=parse(rlmKey,null);
   const source=Array.isArray(v?.readSections)?v.readSections:null;
   if(source)source.forEach(x=>{if(typeof x==='string')out.add(x);});
   else{
     const old=parse('concurso_rlm_steps_v1',[]);
     if(Array.isArray(old))old.forEach(x=>{const m=typeof x==='string'&&x.match(/^(\d+)\.(\d+)$/);if(m)out.add('m'+Number(m[1])+'-s'+Number(m[2]));});
   }
 }
 if(id==='engenharia'){
   const shared=parse(engKey,null);
   if(Array.isArray(shared))shared.forEach(x=>{const m=typeof x==='string'&&x.match(/^(\d+)\.(\d+)$/);if(m)out.add('etapa-'+Number(m[1])+'-'+Number(m[2]));});
   else{
     const doc=parse('casan1811_subsections_v3',{});
     if(isRecord(doc?.subsections))for(const [key,value] of Object.entries(doc.subsections))if(value===true)out.add(key);
   }
 }
 if(id==='portugues'){
   const doc=parse(ptKey,{});
   if(isRecord(doc?.read))for(const [key,value] of Object.entries(doc.read))if(value===true)out.add(key);
 }
 return out;
}
function courseState(lesson,exam){
 const seen=readSet(lesson.id);
 const modules=lesson.sections_per_module;
 const count=modules.reduce((sum,n)=>sum+n,0);
 let read=0,first=null,completed=0,lastFinished=0;
 for(let m=1;m<=modules.length;m++){
   let countThis=0;
   for(let s=1;s<=modules[m-1];s++){
     const id=sectionId(lesson,m,s);
     if(seen.has(id)){read++;countThis++;}
     else if(!first)first={module:m,step:s,id};
   }
   if(countThis===modules[m-1]){completed++;lastFinished=m;}
 }
 const subject=lesson.subjects?.[exam]||'';
 const matrix=config.exams?.[exam]?.subjects||[];
 const weight=matrix.find(pair=>pair[0]===subject)?.[1]||0;
 const totalQuestions=config.exams?.[exam]?.total||0;
 const ratio=count?read/count:0;
 const score=first?weight*(0.32+0.68*(1-ratio)):0;
 return {...lesson,read,total:count,completed,first,lastFinished,weight,totalQuestions,subject,ratio,score};
}
function getSessionLogs(){
 const data=parse(logsKey,[]);
 if(!Array.isArray(data))return [];
 return data.filter(x=>isRecord(x)&&typeof x.id==='string'&&/^session-\d+-[a-z0-9]+$/.test(x.id)&&
 typeof x.exam==='string'&&typeof x.topic==='string'&&x.topic.length>=2&&x.topic.length<=100&&
 /^\d{4}-\d{2}-\d{2}$/.test(x.date||'')&&Number.isInteger(x.valid)&&x.valid>=1&&
 Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=x.valid);
}
function nextDue(exam,today){
 const done=parse(reviewKey,{});
 const flags=isRecord(done)?done:{};
 const intervals=config.review_policy?.interval_days||[1,3,7];
 const due=[];
 for(const s of getSessionLogs()){
   if(exam&&s.exam!==exam)continue;
   if(s.correct>=s.valid)continue;
   for(const offset of intervals){
     if(!Number.isInteger(offset)||offset<1||offset>90)continue;
     const date=new Date(s.date+'T12:00:00Z');
     if(!Number.isFinite(date.valueOf()))continue;
     date.setUTCDate(date.getUTCDate()+offset);
     const when=date.toISOString().slice(0,10);
     if(when>today||flags[s.id+'-'+offset]===true)continue;
     due.push({exam:s.exam,topic:s.topic,when,errors:s.valid-s.correct,id:s.id+'-'+offset});
   }
 }
 return due.sort((a,b)=>a.when.localeCompare(b.when)||b.errors-a.errors);
}
function agenda(today){
 const calendar=config.calendar;
 const dateTasks=calendar?.special?.[today];
 let tasks=Array.isArray(dateTasks)?dateTasks:null;
 if(!tasks){
   const cyc=calendar?.cycles?.find(c=>c.from<=today&&today<=c.through);
   if(cyc){
     const weekday=(new Date(today+'T12:00:00Z').getUTCDay()+6)%7;
     tasks=cyc.weekdays?.[String(weekday)]||[];
   }
 }
 const done=parse(planKey,{});
 const pending=(tasks||[]).filter(t=>!t.event&&!(isRecord(done)&&done[today+'::'+t.id]===true));
 return pending.slice(0,3).map(t=>t.title);
}
function model(){
 const today=isoToday();
 const windowRule=config.priority_windows.find(w=>w.from<=today&&today<=w.through)||config.after_last_window;
 const exam=windowRule?.exam&&config.exams?.[windowRule.exam]?windowRule.exam:null;
 const lessons=(config.adaptive_study?.lessons||[]).map(l=>courseState(l,exam));
 const sorted=lessons.filter(c=>c.first&&c.weight>0).sort((a,b)=>b.score-a.score||b.weight-a.weight);
 const due=nextDue(exam,today);
 const picks=[];
 if(due.length){
   const d=due[0];
   picks.push({type:'review',title:'Revisar: '+d.topic,href:'revisoes.html',
     description:due.length+' revisão(ões) com prazo até hoje, gerada(s) por erros efetivamente registrados. '+d.errors+' erro(s) na sessão desta prioridade.'});
 }
 for(const c of sorted.slice(0,due.length?2:3)){
   picks.push({type:'lesson',title:c.title+' · etapa '+c.first.module+'.'+c.first.step,
     href:c.url+'#'+c.first.id,
     description:c.subject+': '+c.weight+'/'+c.totalQuestions+' questões no edital '+config.exams[exam].name+'. '+c.read+'/'+c.total+' subseções marcadas como Lido. A etapa sugerida ainda não foi marcada.'});
 }
 if(!picks.length){
   if(!exam)picks.push({type:'plan',title:'Revisar a prioridade do concurso',href:'planejamento.html',
     description:'As janelas de prova cadastradas terminaram. Evite seguir automaticamente editais antigos.'});
   else picks.push({type:'review',title:'Verificar retenção com questões',href:'revisoes.html',
     description:'O material disponível está integralmente marcado como Lido. Isso não comprova retenção: registre diagnóstico e erros reais.'});
 }
 const path=location.pathname;
 const active=lessons.find(l=>path.endsWith('/'+l.url)||path.endsWith(l.url));
 return {today,exam,windowRule,lessons,picks,due,agenda:agenda(today),active};
}
function el(tag,className,text){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=text;
 return node;
}
function anchor(href,label,primary=false){
 const a=el('a','ce-adaptive-link'+(primary?' ce-adaptive-primary':''),label);
 a.href=localHref(href);
 return a;
}
function createPanel(){
 const main=document.querySelector('main');
 if(!main)return;
 panel=el('section','ce-adaptive');
 panel.id='adaptiveRecommendations';
 panel.setAttribute('aria-labelledby','adaptiveTitle');
 const head=el('div','ce-adaptive-head');
 const titleGroup=el('div','ce-adaptive-title');
 titleGroup.append(el('span','ce-adaptive-eyebrow','Atualização adaptativa · a cada 1 hora'));
 const title=el('h2','','Próximos passos sugeridos');title.id='adaptiveTitle';titleGroup.append(title);
 head.append(titleGroup);
 button=el('button','ce-adaptive-refresh','Atualizar agora');
 button.type='button';
 button.addEventListener('click',()=>{void refresh(true);});
 head.append(button);
 status=el('p','ce-adaptive-status','Lendo o progresso salvo…');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 details=el('div','ce-adaptive-body');
 panel.append(head,status,details);
 main.prepend(panel);
}
function render(data){
 if(!details)return;
 const signature=JSON.stringify({
   exam:data.exam,head:data.picks,lesson:data.active?.id,lessonNext:data.active?.first,
   evidence:data.lessons.map(l=>[l.id,l.read,l.total]),due:data.due.length,agenda:data.agenda
 });
 if(signature!==renderedSignature){
   renderedSignature=signature;
   details.replaceChildren();
   const n=el('p','ce-adaptive-evidence',data.lessons.map(x=>x.title.split(':')[0]+': '+x.read+'/'+x.total+' Lido').join(' · '));
   details.append(n);
   const namedLesson=data.active;
   if(namedLesson){
     const current=el('div','ce-adaptive-current');
     const title=namedLesson.first?'Nesta aula: continue na etapa '+namedLesson.first.module+'.'+namedLesson.first.step:'Nesta aula: todas as subseções estão marcadas como Lido';
     current.append(el('strong','',title));
     current.append(el('p','',namedLesson.first?'Leitura registrada: '+namedLesson.read+'/'+namedLesson.total+'. Continue sem repetir etapas já marcadas.':'Próximo passo sugerido: recuperação ativa e questões, sem presumir domínio.'));
     current.append(anchor(namedLesson.first?namedLesson.url+'#'+namedLesson.first.id:'revisoes.html',namedLesson.first?'Abrir próxima subseção':'Ver revisões',true));
     details.append(current);
   }
   const recommendationList=el('div','ce-adaptive-list');
   for(const [i,rec] of data.picks.entries()){
     const item=el('article','ce-adaptive-item');
     item.append(el('span','ce-adaptive-index',String(i+1).padStart(2,'0')));
     const body=el('div','ce-adaptive-item-body');
     body.append(el('strong','',rec.title),el('p','',rec.description),anchor(rec.href,rec.type==='review'?'Abrir revisões':'Abrir conteúdo'));
     item.append(body);
     recommendationList.append(item);
   }
   details.append(recommendationList);
   if(data.agenda.length&&document.body.dataset.workspace==='planning'){
     details.append(el('p','ce-adaptive-agenda','Agenda prevista para hoje (não comprova execução): '+data.agenda.join(' · ')+'.'));
   }
   details.append(el('p','ce-adaptive-disclaimer','Recomendação baseada em leitura declarada, prazos do edital e erros realmente registrados. Não marca como Estudado, Avaliado, Revisado ou Dominado; não altera tarefas realizadas.'));
 }
 const primary=data.picks[0];
 for(const id of ['dynamicFocusLink','nextLessonLink']){
   const link=$(id);
   if(link&&primary){
     link.href=localHref(primary.href);
     link.textContent='Seguir sugestão: '+primary.title;
   }
 }
 const focus=$('dynamicFocus');
 if(focus&&primary)focus.textContent=primary.title+'. '+primary.description;
}
function statusText(now,message=''){
 const sync= parse('ce_private_sync_pair_meta_v2',null);
 const pair=(()=>{try{return !!localStorage.getItem('ce_private_sync_pair_v1');}catch{return false;}})();
 let base='Sugestões recalculadas em '+formatTime(now)+' · revisão por hora, quando o site estiver aberto; ao reabrir, recalcula novamente.';
 if(pair&&sync?.last_sync){
   const when=new Date(sync.last_sync);
   base+=' Última sincronização remota confirmada: '+(Number.isFinite(when.valueOf())?formatTime(when):'não identificada')+'.';
 }else if(pair)base+=' Pareamento identificado; aguardando confirmação de sincronização.';
 else base+=' Somente dados locais deste navegador; pareie os aparelhos para sincronizar.';
 if(message)base+=' '+message;
 return base;
}
async function getConfig(){
 const response=await fetch(localHref('dados/concursos.json'),{cache:'no-store'});
 if(!response.ok)throw Error('dados/concursos.json indisponível');
 const next=await response.json();
 if(next.schema_version!==1||next.adaptive_study?.schema_version!==1||
 !Array.isArray(next.adaptive_study.lessons)||!next.exams||!next.priority_windows||!next.calendar)throw Error('Configuração adaptativa incompleta');
 for(const lesson of next.adaptive_study.lessons){
   if(!Array.isArray(lesson.sections_per_module)||lesson.sections_per_module.length>20||lesson.sections_per_module.some(n=>!Number.isInteger(n)||n<1||n>40)||
      !/^aulas\/[a-z0-9-]+\.html$/.test(lesson.url)||!['rlm','portugues','engenharia'].includes(lesson.id))throw Error('Catálogo de aulas inválido');
 }
 config=next;
 return config;
}
async function refresh(forceSync=false){
 if(refreshing){nextRefresh=true;return;}
 refreshing=true;
 if(button)button.disabled=true;
 let message='';
 try{
   if(forceSync&&window.ConcursoSync?.configured?.()){
     try{await window.ConcursoSync.sync();}catch{message='Não foi possível confirmar o servidor; exibindo apenas as marcações locais.';}
   }
   try{await getConfig();}
   catch(e){if(!config)throw e;message+=' O edital não pôde ser atualizado agora; usando a configuração anterior.';}
   render(model());
   updateTime=Date.now();
   if(status)status.textContent=statusText(new Date(),message);
 }catch(e){
   if(status)status.textContent='Falha ao recalcular recomendações: '+(e?.message||'erro de leitura')+'. A leitura salva não foi alterada.';
 }finally{
   refreshing=false;if(button)button.disabled=false;
   if(nextRefresh){nextRefresh=false;setTimeout(()=>{void refresh();},100);}
 }
}
function init(){
 createPanel();
 void refresh();
 // A renovação do painel é horária; o envio das marcações continua imediato pelo sincronizador.
 setInterval(()=>{if(!document.hidden)void refresh(true);},hourMs);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-updateTime>=hourMs)void refresh(true);});
 addEventListener('concurso:read-change',()=>{void refresh();});
 addEventListener('concurso:progress-change',()=>{void refresh();});
 addEventListener('storage',e=>{if(e.key&&/^(concursos_rlm_|concurso_rlm_|concurso_eng_|casan1811_|concursos:casan2026:portugues|ce_)/.test(e.key))void refresh();});
 addEventListener('concurso:sync-status',e=>{
   if(!e.detail?.error&&typeof e.detail?.message==='string'&&e.detail.message.startsWith('Sincronizado'))void refresh();
 });
 addEventListener('concurso:planner-ready',()=>{if(config)render(model());});
}
window.ConcursoAdaptive={refresh:()=>refresh(true),model:()=>config?model():null};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
