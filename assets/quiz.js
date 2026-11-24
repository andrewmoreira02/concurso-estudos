/* Quiz de concursos — correção e registro automáticos somente após envio real.
 * Suporta questões por disciplina e simulados interdisciplinares.
 * Nunca interpreta leitura como avaliação ou marca revisão sem respostas enviadas.
 */
(() => {
'use strict';
const LOG_KEY='ce_question_logs_v1',REVIEW_KEY='ce_review_done_v1';
const SUBJECTS=['ti','portugues','rlm','legislacao','adm','atualidades'];
const SUBJECT_LABEL={ti:'TI',portugues:'Português',rlm:'Raciocínio Lógico',legislacao:'Legislação',adm:'Administração Pública',atualidades:'Atualidades'};
const DATE=()=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const p=k=>parts.find(x=>x.type===k)?.value;
 return p('year')+'-'+p('month')+'-'+p('day');
};
const safeJSON=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback;}catch{return fallback;}};
const safeLogs=()=>{const v=safeJSON(LOG_KEY,[]);return Array.isArray(v)?v.filter(s=>s&&typeof s==='object'&&typeof s.id==='string'&&/^session-\d+-[a-z0-9]+$/.test(s.id)):[];};
function report(form,message,isError=false,details=[]){
 let status=form.querySelector('[data-ce-feedback]');
 if(!status){status=document.createElement('div');status.dataset.ceFeedback='';status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(status);}
 status.replaceChildren();
 const lead=document.createElement('p');lead.textContent=message;status.append(lead);
 if(details.length){
   const list=document.createElement('ol');list.className='ce-quiz-feedback-list';
   for(const d of details){
     const li=document.createElement('li');li.textContent=d;list.append(li);
   }
   status.append(list);
 }
 status.classList.toggle('quiz-error',Boolean(isError));
}
function validateMeta(form){
 const m=form.dataset;
 const exam=typeof m.exam==='string'&&/^[a-z][a-z0-9_-]{1,39}$/.test(m.exam)?m.exam:null;
 const subject=typeof m.subject==='string'&&(SUBJECTS.includes(m.subject)||m.subject==='mixed')?m.subject:null;
 const topic=typeof m.topic==='string'&&m.topic.trim().length>=2&&m.topic.length<=100?m.topic.trim():null;
 return exam&&subject&&topic?{exam,subject,topic}:null;
}
function score(form){
 const meta=validateMeta(form);
 if(!meta){report(form,'Metadados incompletos do quiz. Não foi registrado resultado.',true);return null;}
 if(form.dataset.ceSubmitted==='true'){report(form,'Esta tentativa já foi enviada. Reabra a página para uma nova tentativa.',true);return null;}
 const questions=[...form.querySelectorAll('[data-ce-question]')];
 if(questions.length<1||questions.length>100){report(form,'O quiz precisa conter de 1 a 100 questões.',true);return null;}
 const seen=new Set(),grouped=new Map(),feedback=[];
 let correct=0,valid=0,annulled=0;
 for(const [idx,item] of questions.entries()){
   const id=item.dataset.ceQuestion,answer=item.dataset.correct;
   if(!id||!/^[a-zA-Z0-9_-]{1,60}$/.test(id)||seen.has(id)||!answer){
     report(form,'Identificadores ou gabaritos inválidos na questão '+(idx+1)+'.',true);return null;
   }
   seen.add(id);
   const subject=meta.subject==='mixed'?item.dataset.ceSubject:meta.subject;
   if(!SUBJECTS.includes(subject)){
     report(form,'Disciplina ausente ou inválida na questão '+(idx+1)+'.',true);return null;
   }
   const radios=[...item.querySelectorAll('input[type="radio"]')];
   if(!radios.length||!radios.every(r=>r.name===id)||!radios.some(r=>r.value===answer)){
     report(form,'Alternativas incorretamente configuradas na questão '+(idx+1)+'.',true);return null;
   }
   const selected=radios.find(r=>r.checked);
   if(!selected){
     report(form,'Responda todas as questões antes de enviar. Falta a questão '+(idx+1)+'.',true);
     radios[0]?.focus();return null;
   }
   const state=grouped.get(subject)||{subject,valid:0,correct:0,annulled:0,questionIds:[],wrongQuestionIds:[]};
   state.questionIds.push(id);
   const isAnnulled=item.dataset.annulled==='true';
   const pass=selected.value===answer;
   if(isAnnulled){annulled++;state.annulled++;}
   else{
     valid++;state.valid++;
     if(pass){correct++;state.correct++;}
     else state.wrongQuestionIds.push(id);
   }
   grouped.set(subject,state);
   const reason=item.querySelector('[data-ce-explanation]')?.textContent?.trim()||'Consulte o fundamento e o exemplo da aula.';
   const wrong=item.querySelector('[data-ce-distractors]')?.textContent?.trim()||'';
   const correctRadio=radios.find(r=>r.value===answer);
   const answerText=correctRadio?.closest('label')?.textContent?.trim()||answer.toUpperCase();
   const selectedText=selected.closest('label')?.textContent?.trim()||selected.value.toUpperCase();
   const text=(idx+1)+'. '+(isAnnulled?'ANULADA':pass?'CORRETA':'INCORRETA')+'. Sua resposta: '+selectedText+(isAnnulled?'':'. Gabarito: '+answerText)+'. '+reason+(wrong?' '+wrong:'');
   feedback.push(text);
 }
 if(!valid){report(form,'Todas as questões foram anuladas; nenhuma sessão válida será criada.',true);return null;}
 return {meta,grouped:[...grouped.values()].filter(x=>x.valid>0),correct,valid,annulled,feedback};
}
function persist(assessment,form){
 const existing=safeLogs();
 const now=Date.now();
 const sessions=assessment.grouped.map((g,i)=>({
   id:'session-'+(now+i)+'-'+Math.random().toString(36).slice(2,8),
   date:DATE(),exam:assessment.meta.exam,subject:g.subject,
   topic:assessment.meta.subject==='mixed'?assessment.meta.topic+' — '+SUBJECT_LABEL[g.subject]:assessment.meta.topic,
   valid:g.valid,correct:g.correct,annulled:g.annulled,kind:'nao-classificado',
   source:(form.dataset.source||'Questões autorais — material do site').slice(0,240),
   questionIds:g.questionIds,wrongQuestionIds:g.wrongQuestionIds,
   ...(form.dataset.reviewId?{reviewOf:form.dataset.reviewId}:{})
 }));
 try{localStorage.setItem(LOG_KEY,JSON.stringify([...existing,...sessions]));}
 catch{return {ok:false,review:false,sessions:[]};}
 let reviewSaved=true;
 const reviewId=form.dataset.reviewId;
 if(reviewId){
   if(!/^session-\d+-[a-z0-9]+-\d{1,2}$/.test(reviewId)){reviewSaved=false;}
   else{
     try{
       const o=safeJSON(REVIEW_KEY,{});
       const map=o&&typeof o==='object'&&!Array.isArray(o)?o:{};
       localStorage.setItem(REVIEW_KEY,JSON.stringify({...map,[reviewId]:true}));
     }catch{reviewSaved=false;}
   }
 }
 form.dataset.ceSubmitted='true';
 return {ok:true,review:reviewSaved,sessions};
}
function recordQuiz(form){
 const assessment=score(form);
 if(!assessment)return false;
 const saved=persist(assessment,form);
 const head='Resultado: '+assessment.correct+'/'+assessment.valid+' questões válidas corretas; '+assessment.annulled+' anulada(s). ';
 const message=saved.ok
   ?head+'Sessão registrada automaticamente.'+(form.dataset.reviewId&&saved.review?' Revisão realizada registrada pelo envio das respostas.':'')+(!saved.review?' Não foi possível registrar a conclusão da revisão.':'')
   :head+'Falha ao salvar no navegador. Este resultado NÃO foi sincronizado; faça backup do seu progresso.';
 report(form,message,!saved.ok||!saved.review,assessment.feedback);
 if(saved.ok){
   // A sincronização Supabase é chamada pelos eventos, sem transmitir dados ao GitHub.
   dispatchEvent(new CustomEvent('ce:practice-recorded',{detail:{
     exam:assessment.meta.exam,topic:assessment.meta.topic,reviewId:form.dataset.reviewId||null,
     sessionIds:saved.sessions.map(s=>s.id),valid:assessment.valid,correct:assessment.correct
   }}));
   dispatchEvent(new CustomEvent('concurso:progress-change'));
   afterBlock(form);
 }
 return saved.ok;
}
document.addEventListener('submit',event=>{
 const form=event.target;
 if(!(form instanceof HTMLFormElement)||!form.matches('[data-ce-quiz]'))return;
 event.preventDefault();
 recordQuiz(form);
});
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('[data-ce-quiz] [data-ce-explanation],[data-ce-quiz] [data-ce-distractors]').forEach(el=>el.hidden=true);
});

// Blocos curtos e fila de práticas. IDs, gabaritos e esquema dos registros preservados.
const FLOW_KEY='ce_question_flow_v1',blockStates=new WeakMap();
const normalUrl=value=>{const u=new URL(value,location.href);u.searchParams.delete('ceFlow');u.hash='';return u.href;};
function getFlow(){
 if(new URLSearchParams(location.search).get('ceFlow')!=='1')return null;
 try{
  const f=JSON.parse(sessionStorage.getItem(FLOW_KEY)||'null');
  if(f?.version!==1||!Array.isArray(f.list)||!Array.isArray(f.doneIds))return null;
  const safe=v=>{const u=new URL(v,location.href);return u.origin===location.origin&&u.pathname.replace(/[^/]+$/,'')===location.pathname.replace(/[^/]+$/,'');};
  if(!safe(f.lesson)||!f.list.every(x=>safe(x.href)&&/^questoes-[a-z0-9-]+\.html$/.test(new URL(x.href).pathname.split('/').pop())))return null;
  const at=f.list.findIndex(x=>normalUrl(x.href)===normalUrl(location.href));
  return at>=0?{f,at}:null;
 }catch{return null;}
}
function saveFlow(flow){try{sessionStorage.setItem(FLOW_KEY,JSON.stringify(flow.f));return true;}catch{return false;}}
function queueLink(flow,actions){
 const a=document.createElement('a'),next=flow?.f.list[flow.at+1];
 if(next){const u=new URL(next.href);u.searchParams.set('ceFlow','1');a.href=u.href;a.textContent='Próximo questionário → '+next.label;}
 else if(flow){a.href=flow.f.lesson;a.textContent='Concluir questões · voltar à aula';}
 else{a.href='../aulas.html';a.textContent='Concluir questões · voltar ao catálogo';}
 actions.append(a);
}
function newActions(form){form.querySelector('.ce-quiz-block-actions')?.remove();const div=document.createElement('div');div.className='ce-quiz-block-actions';form.append(div);return div;}
function showBlock(form,state){
 for(const field of state.all)field.remove();
 form.querySelector('.ce-quiz-block-actions')?.remove();
 form.querySelector('[data-ce-feedback]')?.replaceChildren();
 form.removeAttribute('data-ce-submitted');
 const group=state.groups[state.index];
 state.submit.hidden=!group;state.submit.disabled=!group;
 if(!group){
  state.status.textContent='Nenhuma questão inédita neste questionário: os IDs já foram respondidos nesta sequência.';
  queueLink(state.flow,newActions(form));return;
 }
 for(const field of group){form.insertBefore(field,state.submit);field.querySelectorAll('input[type=radio]').forEach(x=>{x.disabled=false;x.checked=false;});}
 const key=group[0].dataset.ceQuestion.replace(/-q\d+$/,'');
 const label=state.titles?.get(key);
 form.dataset.topic=(label||state.topic).slice(0,100);
 state.status.textContent=(state.flow?'Questionário '+(state.flow.at+1)+' de '+state.flow.f.list.length+' · ':'')+'Bloco '+(state.index+1)+' de '+state.groups.length+' · '+(label?label+' · ':'')+group.length+' questão(ões)';
 state.submit.textContent='Enviar respostas e conferir correção';
}
function afterBlock(form){
 const state=blockStates.get(form);if(!state)return;
 const group=state.groups[state.index];if(!group)return;
 state.submit.disabled=true;
 for(const field of group)field.querySelectorAll('input[type=radio]').forEach(x=>x.disabled=true);
 if(state.flow){
  state.flow.f.doneIds=[...new Set([...state.flow.f.doneIds,...group.map(x=>x.dataset.ceQuestion)])];
  saveFlow(state.flow);
 }
 const actions=newActions(form);
 if(state.index<state.groups.length-1){
  const b=document.createElement('button');b.type='button';b.textContent='Próximo bloco de questões →';
  b.addEventListener('click',()=>{state.index++;showBlock(form,state);state.status.scrollIntoView({block:'start',behavior:'smooth'});state.status.focus({preventScroll:true});});
  actions.append(b);
 }else queueLink(state.flow,actions);
}
function setupBlocks(form){
 if(blockStates.has(form))return;
 const flow=getFlow();
 if(!form.matches('.ce-generated-quiz')&&!flow)return;
 const all=[...form.querySelectorAll('fieldset[data-ce-question]')],submit=form.querySelector('button[type=submit]');
 if(!all.length||!submit)return;
 const prior=new Set(flow?.f.doneIds||[]),eligible=all.filter(x=>!prior.has(x.dataset.ceQuestion)),groups=[];
 for(const field of eligible){
  const key=field.dataset.ceQuestion.replace(/-q\d+$/,'');
  const last=groups.at(-1),prev=last?.[0].dataset.ceQuestion.replace(/-q\d+$/,'');
  if(!last||last.length>=3||(form.matches('.ce-generated-quiz')&&/-q\d+$/.test(field.dataset.ceQuestion)&&key!==prev))groups.push([field]);
  else last.push(field);
 }
 const status=document.createElement('p');status.className='ce-quiz-block-status';status.tabIndex=-1;status.setAttribute('role','status');form.prepend(status);
 const state={all,groups,index:0,submit,status,flow,topic:form.dataset.topic,titles:null};
 blockStates.set(form,state);showBlock(form,state);
 if(form.matches('.ce-generated-quiz')&&form.dataset.exam==='ima'){
  fetch('../dados/microaulas-ima.json').then(r=>r.ok?r.json():null).then(d=>{
   if(!d||!Array.isArray(d.units))return;
   state.titles=new Map(d.units.map(x=>[x.id,x.title]));
   const group=state.groups[state.index];if(!group||form.dataset.ceSubmitted==='true')return;
   const label=state.titles.get(group[0].dataset.ceQuestion.replace(/-q\d+$/,''));
   if(label){form.dataset.topic=label.slice(0,100);state.status.textContent=state.status.textContent.replace(' · '+group.length+' questão(ões)',' · '+label+' · '+group.length+' questão(ões)');}
  }).catch(()=>{});
 }
}
function initBlocks(){
 const scan=()=>document.querySelectorAll('form[data-ce-quiz]').forEach(setupBlocks);
 scan();if(getFlow())new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initBlocks,{once:true});else initBlocks();

window.ConcursoQuiz={submit:recordQuiz};
})();
