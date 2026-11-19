/* Concurso Estudos — planejamento, distribuição do edital e revisão por erros.
   Dados de base: planos CASAN/IMA e histórico compartilhado em 18/11/2026.
   Somente interações explícitas do usuário geram registros de realização. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const KEY={done:'ce_plan_done_v1',available:'ce_available_days_v1',logs:'ce_question_logs_v1',review:'ce_review_done_v1'};
let EXAMS=Object.create(null);
let CONFIG=null;
const SUBJECTS={ti:'Tecnologia da Informação',portugues:'Português',rlm:'Raciocínio Lógico',legislacao:'Legislação',adm:'Administração Pública',atualidades:'Atualidades'};
const WEEKDAYS=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
let REVIEW_OFFSETS=[1,3,7];
function saoPauloToday(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=x=>parts.find(p=>p.type===x)?.value;
  return get('year')+'-'+get('month')+'-'+get('day');
}
const TODAY=saoPauloToday();
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
function utcDate(iso){return new Date(iso+'T12:00:00Z');}
function isoAdd(iso,d){const o=utcDate(iso);o.setUTCDate(o.getUTCDate()+d);return o.toISOString().slice(0,10);}
function dayIndex(iso){return (utcDate(iso).getUTCDay()+6)%7;}
function weekStart(iso){return isoAdd(iso,-dayIndex(iso));}
function localDateLabel(iso,short=false){return new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',...(short?{}:{year:'numeric'})}).format(utcDate(iso));}
function read(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return value===null?fallback:value;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function getPlanDone(){const v=read(KEY.done,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
function getAvailable(){const v=read(KEY.available,[]);return Array.isArray(v)?v.filter(n=>Number.isInteger(n)&&n>=0&&n<7):[];}
function validLog(x){
 return x&&typeof x==='object'&&typeof x.id==='string'&&x.id.startsWith('session-')&&
 (typeof x.exam==='string'&&/^[a-z][a-z0-9_-]{1,39}$/.test(x.exam))&&SUBJECTS[x.subject]&&
 typeof x.topic==='string'&&x.topic.trim().length>=2&&x.topic.length<=100&&
 DATE_RE.test(x.date)&&!Number.isNaN(utcDate(x.date).getTime())&&x.date<=TODAY&&
 Number.isInteger(x.valid)&&x.valid>=1&&x.valid<=500&&
 Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=x.valid&&
 Number.isInteger(x.annulled)&&x.annulled>=0&&x.annulled<=500;
}
function getLogs(){const v=read(KEY.logs,[]);return Array.isArray(v)?v.filter(validLog):[];}
function getReviewDone(){const v=read(KEY.review,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
async function loadConfig(){
 const response=await fetch('dados/concursos.json',{cache:'no-store'});
 if(!response.ok)throw Error('HTTP '+response.status);
 const c=await response.json();
 if(c.schema_version!==1 || !c.exams || typeof c.exams!=='object' || !Object.keys(c.exams).length ||
   !Array.isArray(c.priority_windows) || !c.calendar || !c.calendar.special ||
   !Array.isArray(c.calendar.cycles) || !c.after_last_window)throw Error('Dados de concurso incompletos');
 for(const [id,exam] of Object.entries(c.exams)){
   if(!/^[a-z][a-z0-9_-]{1,39}$/.test(id) || !Array.isArray(exam.subjects) ||
     !Number.isInteger(exam.total) || exam.total<=0 ||
     exam.subjects.some(x=>!Array.isArray(x) || typeof x[0]!=='string' || !Number.isInteger(x[1]) || x[1]<0) ||
     exam.subjects.reduce((a,x)=>a+x[1],0)!==exam.total)throw Error('Matriz inválida: '+id);
 }
 if(c.review_policy && Array.isArray(c.review_policy.interval_days)){
   const intervals=c.review_policy.interval_days;
   if(intervals.length && intervals.length<=8 && intervals.every(x=>Number.isInteger(x)&&x>=1&&x<=90)){
     REVIEW_OFFSETS=[...new Set(intervals)].sort((a,b)=>a-b);
   }
 }
 CONFIG=c;EXAMS=c.exams;
}
function configError(message){
 const node=document.querySelector('main');
 if(!node)return;
 const alert=elem('div',{class:'soft-notice warn',role:'alert'},
   'Não foi possível carregar dados/concursos.json ('+message+'). O site não pode confirmar datas ou recalcular o planejamento. Consulte o Projeto e tente atualizar a página.');
 node.prepend(alert);
}

function elem(tag,attrs,text){
  const x=document.createElement(tag);
  for(const [key,value] of Object.entries(attrs||{})){
    if(key==='class')x.className=value;
    else if(key==='dataset')for(const [k,v] of Object.entries(value))x.dataset[k]=v;
    else x.setAttribute(key,String(value));
  }
  if(text!==undefined)x.textContent=String(text);
  return x;
}
function clear(x){x.replaceChildren();}
function attach(parent,...elements){parent.append(...elements);return parent;}
function bar(n,total){const track=elem('div',{class:'subject-meter',role:'meter','aria-valuemin':'0','aria-valuemax':total,'aria-valuenow':n});
  const fill=elem('div');fill.style.width=(total?100*n/total:0).toFixed(2)+'%';track.append(fill);return track;}
function link(text,href){return elem('a',{href,class:'ui-btn'},text);}
function heading(target,label,title){return attach(target,elem('span',{class:'panel-label'},label),elem('h2',{},title));}
function weeklyTasks(iso){
 const dates=CONFIG.calendar;
 if(Object.prototype.hasOwnProperty.call(dates.special,iso))return dates.special[iso];
 const cycle=dates.cycles.find(c=>iso>=c.from && iso<=c.through);
 return cycle ? (cycle.weekdays[String(dayIndex(iso))]||[]) : [];
}
function priorityFor(iso){
 const candidate=CONFIG.priority_windows.find(x=>iso>=x.from && iso<=x.through);
 return candidate||CONFIG.after_last_window;
}
function initPlanning(){
 const weekLabel=$('weekLabel');if(!weekLabel)return;
 const pr=priorityFor(TODAY);
 $('priorityContest').textContent=pr.contest;$('priorityTitle').textContent=pr.title;
 $('priorityDescription').textContent=pr.desc;$('focusSummary').textContent=pr.desc;
 $('planOrigin').textContent=pr.origin;
 const weightSummary=$('examWeightSummary');
 if(weightSummary){
   clear(weightSummary);
   for(const exam of Object.values(EXAMS)){
     const parts=exam.subjects.map(([name,count])=>count+' '+name);
     const p=elem('p');
     attach(p,elem('strong',{},exam.name+': '),document.createTextNode(parts.join('; ')+'.'));
     weightSummary.append(p);
   }
 }
 $('nextLessonLink').href=pr.href;$('nextLessonLink').textContent=pr.link;
 const choices=$('availabilityDays');
 const available=new Set(getAvailable());
 WEEKDAYS.forEach((name,i)=>{
   const label=elem('label',{class:'option-day'});
   const checkbox=elem('input',{type:'checkbox',value:i,'aria-label':name});
   checkbox.checked=available.has(i);
   checkbox.addEventListener('change',()=>{
     if(checkbox.checked)available.add(i);else available.delete(i);
     if(!write(KEY.available,[...available].sort((a,b)=>a-b)))$('availabilityText').textContent='Não foi possível salvar a disponibilidade.';
     else $('availabilityText').textContent=available.size+' dia(s) selecionado(s), registro local.';
     render();
   });
   attach(label,elem('span',{},name),checkbox);choices.append(label);
 });
 $('availabilityText').textContent=available.size?available.size+' dia(s) selecionado(s), registro local.':'Nenhum dia selecionado. Os dias de IMA são sugestões, não compromisso confirmado.';
 let week=weekStart(TODAY);
 function render(){
   $('weekLabel').textContent=localDateLabel(week)+' – '+localDateLabel(isoAdd(week,6));
   const area=$('weekDays');clear(area);
   const saved=getPlanDone();let total=0,checked=0;
   for(let i=0;i<7;i++){
      const iso=isoAdd(week,i),today=iso===TODAY,isIMADay=CONFIG.calendar.cycles.some(c=>c.exam==='ima'&&iso>=c.from&&iso<=c.through);
      const card=elem('article',{class:'day-card'+(today?' today':'')+((iso<'2026-11-18'||iso>'2027-02-14')?' outside':'')});
      const head=elem('header');
      attach(head,elem('strong',{},WEEKDAYS[i]),elem('small',{},localDateLabel(iso,true)));
      card.append(head);
      if(today)card.append(elem('span',{class:'ui-pill focus'},'Hoje'));
      if(isIMADay&&!available.has(i)){
        card.append(elem('small',{class:'muted-line'},'Disponibilidade não confirmada — roteiro opcional'));
      }
      const tasks=weeklyTasks(iso);
      if(!tasks.length)card.append(elem('p',{class:'note-small'},iso>'2027-02-14'?'Após a data da prova; reavaliar concurso.':'Sem bloco programado neste registro.'));
      for(const task of tasks){
        const row=elem('div',{class:'day-task'});attach(row,elem('strong',{},task.title),elem('p',{class:'task-extra'},task.detail));
        if(task.href){const l=elem('a',{href:task.href},'Abrir material');row.append(l);}
        if(!task.event){
          const key=iso+'::'+task.id;
          total++;if(saved[key]===true)checked++;
          const b=elem('button',{type:'button',class:'task-done'+(saved[key]===true?' is-done':'')},saved[key]===true?'✓ Realizado · desfazer':'○ Marcar realizado');
          b.setAttribute('aria-pressed',String(saved[key]===true));
          b.addEventListener('click',()=>{
            const current=getPlanDone();current[key]=!(current[key]===true);
            if(!write(KEY.done,current)){$('plannerStorage').textContent='⚠ Salvamento bloqueado neste navegador';return;}
            $('plannerStorage').textContent='✓ Atividades salvas neste navegador';
            render();
          });
          row.append(b);
        }
        card.append(row);
      }
      area.append(card);
   }
   $('activityCount').textContent=checked+'/'+total;
 }
 $('weekPrev').addEventListener('click',()=>{week=isoAdd(week,-7);render();});
 $('weekNext').addEventListener('click',()=>{week=isoAdd(week,7);render();});
 $('weekToday').addEventListener('click',()=>{week=weekStart(TODAY);render();});
 $('plannerStorage').textContent='✓ Marcações salvas somente neste navegador, quando permitido.';
 render();
 addEventListener('storage',e=>{if(Object.values(KEY).includes(e.key))render();});
}
function stepsCount(key,max){
 const v=read(key,[]);
 return Array.isArray(v)?Math.min(new Set(v.filter(x=>typeof x==='string')).size,max):0;
}
// Nunca publicar histórico pessoal de desempenho no JavaScript do repositório.
// Somente respostas registradas no navegador originam indicadores individuais.
function initProgress(){
 const chooser=$('examSelect');if(!chooser)return;
 const param=new URLSearchParams(location.search).get('concurso');
 clear(chooser);
 for(const [id,info] of Object.entries(EXAMS))chooser.append(elem('option',{value:id},info.name));
 const suggested=priorityFor(TODAY).exam;
 chooser.value=EXAMS[param]?param:(EXAMS[suggested]?suggested:Object.keys(EXAMS)[0]);
 function render(){
   const exam=EXAMS[chooser.value],isIMA=chooser.value==='ima';
   $('examDate').textContent=exam.name+' · '+exam.deadlineLabel;
   $('matrixSource').textContent='Fonte: '+exam.source+'. Verificar retificações antes da prova.';
   const matrix=$('examMatrix');clear(matrix);
   for(const [name,n] of exam.subjects){
     const item=elem('div',{class:'subject-row'});
     const h=elem('div',{class:'subject-head'});
     attach(h,elem('strong',{class:'subject-title'},name),elem('span',{class:'subject-metric'},n+' / '+exam.total+' questões'));
     attach(item,h,bar(n,exam.total),elem('span',{class:'note-small'},(100*n/exam.total).toFixed(1).replace('.',',')+'% da prova — não é nível de domínio'));
     matrix.append(item);
   }
   const read=$('readingStats');clear(read);
   const rlmc=stepsCount('concurso_rlm_steps_v1',71),engc=stepsCount('concurso_eng_qualidade_steps_v1',37);
   [
     {label:'RLM · material compartilhado',count:rlmc,max:71},
     {label:'Engenharia/Qualidade · HTML',count:engc,max:37}
   ].forEach(x=>{
     const entry=elem('div',{class:'evidence-item'});
     attach(entry,elem('strong',{},x.label),elem('p',{},x.count+' de '+x.max+' subseções marcadas como lidas neste navegador'),bar(x.count,x.max));
     read.append(entry);
   });
   const tags=$('topicEvidence');clear(tags);
   const topicLogs=getLogs().filter(x=>x.exam===chooser.value);
   if(topicLogs.length){
     const grouped=new Map();
     for(const log of topicLogs){
       const key=log.subject+'|'+log.topic.toLocaleLowerCase('pt-BR');
       const old=grouped.get(key)||{subject:log.subject,topic:log.topic,valid:0,correct:0,sessions:0};
       old.valid+=log.valid;old.correct+=log.correct;old.sessions++;grouped.set(key,old);
     }
     for(const x of [...grouped.values()].sort((a,b)=>(b.valid-b.correct)-(a.valid-a.correct))){
       const card=elem('article',{class:'panel span-6'});
       card.append(elem('span',{class:'ui-pill focus'},'Avaliação registrada neste navegador'));
       card.append(elem('h3',{},x.topic));
       card.append(elem('p',{class:'note-small'},(SUBJECTS[x.subject]||x.subject)+' · '+x.correct+'/'+x.valid+' válidas corretas, '+x.sessions+' sessão(ões). '+(x.correct<x.valid?'Erros registrados; revisar e verificar retenção.':'Sem erro neste conjunto; não equivale a domínio geral.')));
       tags.append(card);
     }
   }else tags.append(elem('div',{class:'empty-state span-12'},'Sem questões registradas neste navegador para este concurso. O histórico pessoal da Biblioteca do ChatGPT permanece privado e não é transferido automaticamente ao GitHub Pages.'));
   if(isIMA)tags.prepend(elem('p',{class:'soft-notice span-12'},'Nenhuma avaliação CASAN é contabilizada como resultado IMA sem nova evidência.'));
   const logs=getLogs().filter(x=>x.exam===chooser.value);
   const count=$('userLogSummary');clear(count);
   if(!logs.length){count.append(elem('p',{class:'empty-state'},'Nenhuma sessão de questões deste concurso foi registrada neste site. O histórico de estudos da Biblioteca continua preservado separadamente.'));return;}
   const valid=logs.reduce((s,x)=>s+x.valid,0),correct=logs.reduce((s,x)=>s+x.correct,0),annulled=logs.reduce((s,x)=>s+x.annulled,0);
   const stats=elem('div',{class:'mini-facts'});
   [[logs.length,'sessões registradas'],[correct+' / '+valid,'acertos / questões válidas'],[annulled,'questões anuladas']].forEach(x=>{
     const e=elem('div',{class:'fact'});attach(e,elem('strong',{},x[0]),elem('span',{},x[1]));stats.append(e);
   });
   count.append(stats);
   count.append(elem('p',{class:'note-small'},'Estes totais representam apenas as sessões registradas neste navegador; não constituem estimativa de domínio de todo o edital.'));
 }
 chooser.addEventListener('change',()=>{history.replaceState(null,'',location.pathname+'?concurso='+chooser.value);render();});
 addEventListener('storage',e=>{if([KEY.logs,'concurso_rlm_steps_v1','concurso_eng_qualidade_steps_v1'].includes(e.key))render();});
 render();
}
const REVIEW_GUIDANCE=[
 {topic:'Erro conceitual',details:'Revisar conceito e contraexemplo antes de responder a nova questão.'},
 {topic:'Erro de leitura ou atenção',details:'Reler comando, quantificadores e restrições; testar uma estratégia de checagem.'},
 {topic:'Revisão espaçada',details:'As datas são geradas por erros registrados neste navegador; não provam domínio e podem ser desmarcadas.'}
];
function reviewTasks(){
 const logs=getLogs(),completed=getReviewDone();
 const out=[];
 for(const s of logs){
   const errors=s.valid-s.correct;
   if(errors<=0)continue;
   for(const offset of REVIEW_OFFSETS){
     const id=s.id+'-'+offset, date=isoAdd(s.date,offset);
     out.push({id,date,offset,session:s,errors,done:completed[id]===true});
   }
 }
 return out.sort((a,b)=>a.date.localeCompare(b.date)||a.session.topic.localeCompare(b.session.topic)||a.offset-b.offset);
}
function initReviews(){
 const form=$('practiceForm');if(!form)return;
 $('practiceDate').value=TODAY;$('practiceDate').max=TODAY;
 const contestChoice=$('practiceExam');clear(contestChoice);
 for(const [id,info] of Object.entries(EXAMS))contestChoice.append(elem('option',{value:id},info.name));
 const active=priorityFor(TODAY).exam;
 if(EXAMS[active])contestChoice.value=active;
 function render(){
   const history=$('practiceHistory');clear(history);
   const logs=getLogs().sort((a,b)=>b.date.localeCompare(a.date));
   if(!logs.length)history.append(elem('div',{class:'empty-state'},'Nenhuma sessão registrada neste navegador.'));
   for(const s of logs){
     const row=elem('article',{class:'history-item'});const info=elem('div');
     const errors=s.valid-s.correct;
     attach(info,elem('strong',{},s.topic+' · '+(EXAMS[s.exam]?.name||s.exam)),elem('p',{},localDateLabel(s.date)+' · '+(SUBJECTS[s.subject]||s.subject)+' · '+s.correct+'/'+s.valid+' válidas corretas · '+errors+' erros · '+s.annulled+' anuladas'),elem('p',{},'Tipo de erro: '+s.kind+(s.source?' · '+s.source:'')));
     const del=elem('button',{type:'button','aria-label':'Excluir sessão '+s.topic},'Excluir');
     del.addEventListener('click',()=>{
       if(!confirm('Excluir este registro e suas revisões programadas?'))return;
       const next=getLogs().filter(x=>x.id!==s.id);
       const states=getReviewDone();
       for(const k of Object.keys(states))if(k.startsWith(s.id+'-'))delete states[k];
       if(!write(KEY.logs,next)||!write(KEY.review,states)){$('practiceStatus').textContent='Não foi possível salvar a exclusão.';return;}
       render();
     });
     attach(row,info,del);history.append(row);
   }
   const current=reviewTasks(),filter=$('queueFilter').value;
   const queue=$('reviewQueue');clear(queue);
   const shown=current.filter(x=>filter==='all'||(filter==='done'?x.done:!x.done));
   const pending=current.filter(x=>!x.done),due=pending.filter(x=>x.date<=TODAY);
   $('queueSummary').textContent=pending.length+' pendente(s); '+due.length+' com data até hoje. Geradas somente a partir de sessões com erro.';
   if(!shown.length)queue.append(elem('div',{class:'empty-state'},'Sem revisões neste filtro. Novos erros registrados criam sugestões para +1, +3 e +7 dias.'));
   for(const t of shown){
      const row=elem('article',{class:'review-item'+(!t.done&&t.date<TODAY?' overdue':'')});
      const h=elem('div',{class:'review-head'});
      attach(h,elem('strong',{},t.session.topic),elem('span',{class:'ui-pill'+(!t.done&&t.date<=TODAY?' warn':'')},t.done?'Revisada':(t.date<TODAY?'Atrasada':t.date===TODAY?'Hoje':'Agendada')));
      attach(row,h,elem('p',{},EXAMS[t.session.exam].name+' · '+localDateLabel(t.date)+' · '+t.offset+' dia(s) após a sessão · '+t.errors+' erro(s) naquela sessão'));
      const b=elem('button',{type:'button',class:'ui-btn'+(!t.done?' primary':'')},t.done?'✓ Revisada · desfazer':'Marcar revisão realizada');
      b.addEventListener('click',()=>{
         const states=getReviewDone();states[t.id]=!states[t.id];
         if(!write(KEY.review,states)){$('practiceStatus').textContent='Não foi possível salvar revisão.';return;}
         render();
      });
      row.append(b);queue.append(row);
   }
 }
 const historyCards=$('historicalSignals');
 REVIEW_GUIDANCE.forEach(p=>{
   const e=elem('div',{class:'evidence-item'});
   attach(e,elem('strong',{},p.topic),elem('p',{},p.details));
   historyCards.append(e);
 });
 form.addEventListener('submit',e=>{
   e.preventDefault();
   const date=$('practiceDate').value,exam=$('practiceExam').value,subject=$('practiceSubject').value,
     topic=$('practiceTopic').value.trim(),valid=Number($('practiceValid').value),
     correct=Number($('practiceCorrect').value),annulled=Number($('practiceAnnulled').value),
     kind=$('practiceKind').value,source=$('practiceSource').value.trim();
   const status=$('practiceStatus');
   if(!DATE_RE.test(date)||date>TODAY){status.textContent='Escolha uma data válida, até hoje.';return;}
   if(!EXAMS[exam]||!SUBJECTS[subject]||topic.length<2||topic.length>100){status.textContent='Confira concurso, disciplina e assunto.';return;}
   if(![valid,correct,annulled].every(Number.isInteger)||valid<1||valid>500||correct<0||correct>valid||annulled<0||annulled>500){status.textContent='Questões válidas devem ser ≥ acertos e anuladas são contabilizadas separadamente.';return;}
   const entry={id:'session-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),date,exam,subject,topic,valid,correct,annulled,kind,source};
   const existing=getLogs();
   if(!write(KEY.logs,[...existing,entry])){status.textContent='⚠ Armazenamento indisponível.';return;}
   form.reset();$('practiceDate').value=TODAY;$('practiceDate').max=TODAY;
   status.textContent='✓ Sessão registrada. '+(valid-correct>0?'Revisões +1, +3, +7 dias geradas.':'Sem erros; nenhuma revisão obrigatória gerada.');
   render();
 });
 $('queueFilter').addEventListener('change',render);
 addEventListener('storage',e=>{if([KEY.logs,KEY.review].includes(e.key))render();});
 render();
}
function initHome(){
 const panel=$('dynamicFocus');
 if(!panel)return;
 const p=priorityFor(TODAY);
 panel.textContent=p.desc;
 const t=$('dynamicFocusTitle');if(t)t.textContent=TODAY<='2026-11-22'?'RLM · Módulo 6':TODAY<='2027-02-14'?'IMA-SC · início do ciclo':'Revisar prioridade';
 const b=$('dynamicFocusLink');if(b){b.textContent=p.link;b.href=p.href;}
 const note=$('dynamicFocusNote');if(note)note.textContent=p.origin;
 const examSummary=$('examSummary');
 if(examSummary){clear(examSummary);for(const [id,e] of Object.entries(EXAMS)){
   const para=elem('p');attach(para,elem('strong',{},e.name+': '),document.createTextNode('prova '+e.deadlineLabel+'.'));examSummary.append(para);
 }}
}
document.addEventListener('DOMContentLoaded',async()=>{
 try{await loadConfig();}
 catch(error){configError(error.message||'falha desconhecida');return;}
 initPlanning();initProgress();initReviews();initHome();
});
})();