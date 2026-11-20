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
   const text=(idx+1)+'. '+(isAnnulled?'ANULADA':pass?'CORRETA':'INCORRETA — gabarito '+answer.toUpperCase())+'. '+reason+(wrong?' '+wrong:'');
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
window.ConcursoQuiz={submit:recordQuiz};
})();
