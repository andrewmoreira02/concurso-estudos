/* Concurso Estudos — integração opt-in de questões HTML com o registro de erros.
   O HTML define questões verificadas/autoria identificada. O JavaScript não infere
   tipo cognitivo do erro: usa "nao-classificado". Dados permanecem no navegador. */
(() => {
'use strict';
const KEY='ce_question_logs_v1';
const DATE=()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const find=x=>parts.find(p=>p.type===x)?.value;return find('year')+'-'+find('month')+'-'+find('day');};
function safeRead(){
 try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter(v=>v&&typeof v==='object'):[];}catch{return [];}
}
function save(session){
 try{localStorage.setItem(KEY,JSON.stringify([...safeRead(),session]));return true;}catch{return false;}
}
function report(form,message,isError=false){
 let status=form.querySelector('[data-ce-feedback]');
 if(!status){status=document.createElement('p');status.setAttribute('data-ce-feedback','');status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(status);}
 status.textContent=message;
 status.classList.toggle('quiz-error',!!isError);
}
function isValidMeta(form){
 const a=form.dataset;
 const validExam=typeof a.exam==='string'&&/^[a-z][a-z0-9_-]{1,39}$/.test(a.exam);
 const validSub=['ti','portugues','rlm','legislacao','adm','atualidades'].includes(a.subject);
 return validExam&&validSub&&typeof a.topic==='string'&&a.topic.trim().length>=2&&a.topic.length<=100;
}
function recordQuiz(form){
 if(!isValidMeta(form)){report(form,'Metadados da questão incompletos. Verifique concurso, disciplina e assunto.',true);return;}
 const questions=[...form.querySelectorAll('[data-ce-question]')];
 if(!questions.length||questions.length>100){report(form,'O quiz precisa conter entre 1 e 100 questões.',true);return;}
 const seenIds=new Set();let valid=0,correct=0,annulled=0;
 const feedback=[];
 for(const item of questions){
   const id=item.dataset.ceQuestion;
   const answer=item.dataset.correct;
   if(!id||!/^[\w-]{1,60}$/.test(id)||seenIds.has(id)||!answer){report(form,'Identificadores ou gabaritos inválidos no quiz.',true);return;}
   seenIds.add(id);
   const radios=[...item.querySelectorAll('input[type="radio"]')];
   if(!radios.length||!radios.every(r=>r.name===id)){report(form,'Marcação de respostas inválida na questão '+id+'.',true);return;}
   const values=new Set(radios.map(r=>r.value));
   if(!values.has(answer)){report(form,'Gabarito inválido na questão '+id+'.',true);return;}
   const selected=radios.find(x=>x.checked);
   if(!selected){report(form,'Responda todas as questões antes de enviar. Falta: '+id+'.',true);return;}
   const cancelled=item.dataset.annulled==='true';
   const passed=selected.value===answer;
   if(cancelled)annulled++;else{valid++;if(passed)correct++;}
   const explanation=item.querySelector('[data-ce-explanation]')?.textContent?.trim()||'';
   feedback.push({id,annulled:cancelled,passed,correctAnswer:answer,explanation});
 }
 if(valid===0){report(form,'Todas as questões foram anuladas; não há avaliação válida a registrar.',true);return;}
 if(form.dataset.ceSubmitted==='true'){report(form,'Esta tentativa já foi registrada. Para uma nova tentativa, recarregue a página.',true);return;}
 const result={id:'session-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
   date:DATE(),exam:form.dataset.exam,subject:form.dataset.subject,topic:form.dataset.topic.trim(),
   valid,correct,annulled,kind:'nao-classificado',source:(form.dataset.source||'Quiz interativo (origem informada na aula)').slice(0,240)};
 const stored=save(result);
 if(stored)form.dataset.ceSubmitted='true';
 let message='Resultado: '+correct+' de '+valid+' questões válidas corretas; '+annulled+' anulada(s). ';
 message+=stored?'Registrado neste navegador. Revisões por erro aparecerão na página Revisões.':'Não foi possível salvar no navegador; anote ou faça backup do resultado.';
 const list=feedback.map(x=>x.id+': '+(x.annulled?'anulada':x.passed?'correta':'incorreta (gabarito: '+x.correctAnswer+')')+(x.explanation?' — '+x.explanation:'')).join(' | ');
 report(form,message+list,!stored);
 if(stored)dispatchEvent(new CustomEvent('ce:practice-recorded',{detail:{exam:result.exam,topic:result.topic}}));
}
document.addEventListener('submit',event=>{
 const form=event.target;
 if(!(form instanceof HTMLFormElement)||!form.matches('[data-ce-quiz]'))return;
 event.preventDefault();
 recordQuiz(form);
});
})();