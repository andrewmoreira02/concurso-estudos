/* Questões completas adaptadas dos temas de FURB 2023, com link de origem opcional.
 * O banco autoral é reserva para lacunas; resultados ficam locais/privados.
 * Não presumir que ver a pergunta, clicar em Revisar ou abrir a página realizou a revisão.
 */
(() => {
'use strict';
const root=location.pathname.includes('/aulas/')?'../':'';
const BANK=root+'dados/questoes.json',REAL=root+'dados/questoes-reais.json',ADAPTED=root+'dados/questoes-adaptadas.json',CONFIG=root+'dados/concursos.json';
const LOG_KEY='ce_question_logs_v1',DONE_KEY='ce_review_done_v1';
const subjects={ti:'Conhecimentos Específicos (TI)',portugues:'Português',rlm:'Raciocínio Lógico-Matemático',legislacao:'Legislação',atualidades:'Atualidades',adm:'Administração Pública'};
const addDays=(iso,n)=>{const date=new Date(iso+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+n);return date.toISOString().slice(0,10);};
const today=()=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const p=k=>parts.find(x=>x.type===k)?.value;return p('year')+'-'+p('month')+'-'+p('day');
};
const parse=(key,fallback)=>{try{const x=JSON.parse(localStorage.getItem(key)||'null');return x??fallback;}catch{return fallback;}};
const el=(name,text,className)=>{const e=document.createElement(name);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let bank=null,config=null;
function validQuestion(q){
 return q&&typeof q.id==='string'&&/^[a-z0-9-]{3,60}$/.test(q.id)&&
 ['ti','portugues','rlm','legislacao','atualidades','adm'].includes(q.subject)&&
 q.options&&['a','b','c','d'].every(k=>typeof q.options[k]==='string'&&q.options[k].length>=1)&&
 ['a','b','c','d'].includes(q.correct)&&typeof q.prompt==='string'&&q.prompt.length>10&&
 typeof q.explanation==='string'&&q.explanation.length>10&&Array.isArray(q.exams);
}
function validReal(q){
 return q&&q.kind==='real-original-pdf'&&/^[a-z0-9-]{3,60}$/.test(q.id||'')&&
 ['ti','portugues','rlm','legislacao','atualidades','adm'].includes(q.subject)&&
 /^[a-e]$/.test(q.correct||'')&&typeof q.prompt==='string'&&q.prompt.length>10&&
 typeof q.explanation==='string'&&q.explanation.length>15&&Array.isArray(q.exams)&&
 q.source&&q.source.bank==='FURB'&&q.source.year===2023&&
 Number.isInteger(q.source.question_number)&&q.source.question_number>=1&&q.source.question_number<=40&&
 Number.isInteger(q.source.printed_page)&&q.source.printed_page>=1&&
 /^https:\/\/arquivos\.qconcursos\.com\/prova\//.test(q.source.paper_url||'')&&
 /^https:\/\/anexos\.cdn\.selecao\.net\.br\//.test(q.source.answer_key_url||'');
}
function validAdapted(q){
 return q&&q.kind==='adaptada'&&/^[a-z0-9-]{3,60}$/.test(q.id||'')&&
 typeof q.origin_id==='string'&&/^[a-z0-9-]{3,60}$/.test(q.origin_id)&&
 /^[a-e]$/.test(q.correct||'')&&
 q.options&&['a','b','c','d','e'].every(k=>typeof q.options[k]==='string'&&q.options[k].length>=2)&&
 new Set(Object.values(q.options)).size===5&&
 typeof q.prompt==='string'&&q.prompt.length>=35&&typeof q.explanation==='string'&&q.explanation.length>15&&
 typeof q.whyWrong==='string'&&q.whyWrong.length>15;
}
async function load(){
 const [r1,r2,r3,r4]=await Promise.all([
   fetch(BANK,{cache:'no-store'}),fetch(REAL,{cache:'no-store'}),
   fetch(ADAPTED,{cache:'no-store'}),fetch(CONFIG,{cache:'no-store'})
 ]);
 if(!r1.ok||!r2.ok||!r3.ok||!r4.ok)throw Error('Banco de questões, adaptações ou calendário indisponível.');
 const reserve=await r1.json(),original=await r2.json(),adapted=await r3.json(),calendar=await r4.json();
 if(reserve.schema_version!==1||!Array.isArray(reserve.questions)||!reserve.questions.every(validQuestion))throw Error('Banco de reserva inválido.');
 if(original.schema_version!==1||!Array.isArray(original.questions)||!original.questions.every(validReal))throw Error('Referências de provas reais inválidas.');
 if(adapted.schema_version!==1||!Array.isArray(adapted.questions)||!adapted.questions.every(validAdapted))throw Error('Questões adaptadas incompletas ou sem alternativas.');
 const origins=new Map(original.questions.map(q=>[q.id,q]));
 const adaptations=adapted.questions.map(q=>{
   const orig=origins.get(q.origin_id);
   if(!orig||orig.subject!==q.subject)throw Error('Questão adaptada sem fonte identificada: '+q.id);
   return {...q,source:orig.source,exams:orig.exams,saturday:orig.saturday};
 });
 const ids=[...adaptations,...reserve.questions].map(q=>q.id);
 if(ids.length!==new Set(ids).size)throw Error('IDs repetidos nos exercícios.');
 bank={...reserve,questions:[...adaptations,...reserve.questions]};
 config=calendar;return bank;
}
function questionElement(q,index){
 const f=el('fieldset');f.dataset.ceQuestion=q.id;f.dataset.correct=q.correct;f.dataset.ceSubject=q.subject;
 const adapted=q.kind==='adaptada';
 const legend=el('legend','Questão '+(index+1)+' · '+(subjects[q.subject]||q.subject)+' — '+q.prompt);
 f.append(legend);
 if(adapted){
   const source=el('div','','ce-original-source');
   source.append(el('strong','Adaptada de conteúdo cobrado na prova FURB '+q.source.year+' · Analista de Sistemas · questão '+q.source.question_number));
   source.append(el('p','Enunciado e alternativas desta versão foram reescritos; a resposta correta desta adaptação foi conferida separadamente. Não é transcrição da prova.'));
   const link=el('a','Consultar caderno de origem (opcional)');
   link.href=q.source.paper_url+'#page='+q.source.printed_page;
   link.target='_blank';link.rel='noopener noreferrer';
   source.append(link);
   f.append(source);
 }else f.append(el('p','Questão autoral de reserva, com enunciado e alternativas completos.'));
 for(const k of adapted?['a','b','c','d','e']:['a','b','c','d']){
   const label=el('label');
   const input=document.createElement('input');input.type='radio';input.name=q.id;input.value=k;input.required=true;
   label.append(input,el('span',k.toUpperCase()+'. '+q.options[k]));f.append(label);
 }
 const note=el('p',q.explanation);note.hidden=true;note.dataset.ceExplanation='';f.append(note);
 const wrong=el('p','Alternativas incorretas: '+q.whyWrong);
 wrong.hidden=true;wrong.dataset.ceDistractors='';f.append(wrong);
 return f;
}
function buildForm(items,exam,topic,source,reviewId=null){
 const form=el('form','', 'ce-practice-form');
 form.dataset.ceQuiz='';
 form.dataset.exam=exam;
 form.dataset.subject=new Set(items.map(x=>x.subject)).size>1?'mixed':items[0].subject;
 form.dataset.topic=topic.slice(0,100);
 form.dataset.source=source.slice(0,240);
 if(reviewId)form.dataset.reviewId=reviewId;
 for(const [i,q] of items.entries())form.append(questionElement(q,i));
 const button=el('button',reviewId?'Enviar respostas da revisão':'Enviar todas as respostas e corrigir');
 button.type='submit';form.append(button);
 const feedback=el('div');feedback.dataset.ceFeedback='';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');form.append(feedback);
 return form;
}
async function renderPractice(){
 const stage=document.querySelector('[data-ce-practice]');
 if(!stage)return;
 const type=stage.dataset.cePractice;
 let items=[],topic='',label='',exam='casan';
 if(type==='saturday'){
   exam='casan';
   // Apenas duas questões sem equivalente real disponível neste caderno: Legislação e Atualidades.
   items=bank.questions.filter(q=>q.kind==='adaptada'&&q.saturday===true&&q.exams.includes('casan'));
   for(const subject of ['legislacao','atualidades']){
     const reserve=bank.questions.find(q=>q.kind!=='adaptada'&&q.saturday===true&&q.subject===subject&&q.exams.includes('casan'));
     if(reserve)items.push(reserve);
   }
   topic='Simulado CASAN 21/11';
 }else if(type==='ima'){
   exam='ima';
   const quotas={ti:8,portugues:2,rlm:2};
   for(const [subject,count] of Object.entries(quotas))
     items.push(...bank.questions.filter(q=>q.kind==='adaptada'&&q.exams.includes('ima')&&q.subject===subject).slice(0,count));
   topic='Treino IMA — conteúdos compartilhados';
 }else return;
 if(items.length<3)throw Error('Questões insuficientes para montar o treino.');
 const nAdapted=items.filter(q=>q.kind==='adaptada').length;
 const nAuthor=items.length-nAdapted;
 label=items.length+' questões: '+nAdapted+' adaptação(ões) de temas de FURB 2023'+(nAuthor?' e '+nAuthor+' autoral(is) de reserva':'')+'.';
 stage.replaceChildren(el('p',label+' Leia enunciados e alternativas diretamente aqui. O PDF de origem é opcional, apenas para conferir a referência da prova. As respostas destas versões adaptadas têm gabaritos próprios.'),
   buildForm(items,exam,topic,'Adaptações de temas FURB 2023 com gabaritos próprios; reserva autoral identificada.'));
 const count=document.getElementById('practiceCount');
 if(count)count.textContent=items.length+' questões';
}
function logs(){
 const v=parse(LOG_KEY,[]);
 return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&/^session-\d+-[a-z0-9]+$/.test(x.id||'')&&
 typeof x.exam==='string'&&subjects[x.subject]&&typeof x.topic==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')&&
 Number.isInteger(x.valid)&&x.valid>=1&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=x.valid):[];
}
function getTasks(){
 const intervals=Array.isArray(config?.review_policy?.interval_days)?config.review_policy.interval_days:[1,3,7];
 const finished=parse(DONE_KEY,{}),done=finished&&typeof finished==='object'&&!Array.isArray(finished)?finished:{};
 const tasks=[];
 for(const s of logs()){
   if(s.valid<=s.correct)continue;
   for(const days of intervals){
     if(!Number.isInteger(days)||days<1||days>90)continue;
     const iso=addDays(s.date,days),id=s.id+'-'+days;
     tasks.push({id,date:iso,offset:days,session:s,finished:done[id]===true});
   }
 }
 return tasks.sort((a,b)=>a.finished-b.finished||a.date.localeCompare(b.date)||b.session.valid-b.session.correct);
}
function pickFor(task){
 const s=task.session;const all=bank.questions.filter(q=>q.exams.includes(s.exam)&&q.subject===s.subject)
 .sort((a,b)=>(a.kind==='adaptada'?0:1)-(b.kind==='adaptada'?0:1));
 const topic=norm(s.topic);
 const tokens={engenharia:['engenharia','qualidade','requisitos','uml','ci/cd','teste'],seguranca:['seguranca','api','autenticacao','autorizacao','oauth','jwt','pkce'],algoritmos:['algoritmo','objeto','solid','estrutura','orientacao'], 'banco-dados':['banco','sql','join','normalizacao','acid'],portugues:['portugues','interpretacao','gramatica','coesao'],rlm:['raciocinio','rlm','combinatoria','pg','pa','probabilidade'],legislacao:['legislacao','etica','governanca'],atualidades:['atualidades','ambiente','sustentabilidade']};
 let tag='';
 for(const [k,list] of Object.entries(tokens)){if(list.some(w=>topic.includes(w))){tag=k;break;}}
 const byTag=all.filter(q=>q.tag===tag),wrong=Array.isArray(s.wrongQuestionIds)?s.wrongQuestionIds:[];
 const candidates=[
 ...byTag.filter(q=>q.kind==='adaptada'&&!wrong.includes(q.id)),
 ...all.filter(q=>q.kind==='adaptada'&&q.tag!==tag&&!wrong.includes(q.id)),
 ...byTag.filter(q=>q.kind!=='adaptada'&&!wrong.includes(q.id)),
 ...all.filter(q=>q.kind!=='adaptada'&&q.tag!==tag&&!wrong.includes(q.id)),
 ...all.filter(q=>wrong.includes(q.id))
 ];
 const unique=[];const used=new Set();
 for(const q of candidates){if(!used.has(q.id)){unique.push(q);used.add(q.id);}}
 return unique.slice(0,Math.min(4,unique.length));
}
function renderTasks(){
 const mount=document.getElementById('reviewAutoList');
 if(!mount||!config)return;
 const tasks=getTasks();
 const due=tasks.filter(t=>!t.finished&&t.date<=today());
 const future=tasks.filter(t=>!t.finished&&t.date>today());
 const finished=tasks.filter(t=>t.finished);
 const stats=document.getElementById('reviewAutoCount');
 if(stats)stats.textContent=due.length+' vencida(s)/para hoje · '+future.length+' futura(s) · '+finished.length+' realizada(s) com respostas enviadas';
 mount.replaceChildren();
 if(!tasks.length){
   const info=el('div','Nenhum erro registrado nos quizzes deste site. Responda às questões nas aulas ou no simulado de sábado; quando houver erros, a fila de revisões aparecerá automaticamente.','nl-notice');
   mount.append(info);return;
 }
 for(const task of tasks.slice(0,120)){
   const card=el('article','', 'ce-auto-review-item');
   const headline=el('h3',task.session.topic);card.append(headline);
   const state=task.finished?'Realizada com novo quiz':task.date<today()?'Vencida':task.date===today()?'Revisar hoje':'Prevista';
   card.append(el('p',state+' · '+task.date.split('-').reverse().join('/')+' · '+task.offset+' dia(s) após '+task.session.date.split('-').reverse().join('/')+' · '+(task.session.valid-task.session.correct)+' erro(s) no registro original.'));
   if(!task.finished){
     const button=el('button',task.date>today()?'Praticar antecipadamente':'Responder revisão');
     button.type='button';button.dataset.reviewTask=task.id;
     button.addEventListener('click',()=>openReview(task));
     card.append(button);
   }else{
     // Reversão explícita: apenas o estado "revisada" é desmarcado; sessões enviadas ficam preservadas.
     const undo=el('button','Desfazer marcação de revisão');
     undo.type='button';undo.dataset.undoReview=task.id;
     undo.setAttribute('aria-label','Desfazer marcação de revisão para '+task.session.topic);
     undo.addEventListener('click',()=>{
       if(!confirm('Desmarcar esta revisão? As respostas já enviadas permanecem registradas.'))return;
       try{
         const value=parse(DONE_KEY,{}),done=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
         localStorage.setItem(DONE_KEY,JSON.stringify({...done,[task.id]:false}));
         dispatchEvent(new CustomEvent('concurso:progress-change'));
         renderTasks();
       }catch{
         const count=document.getElementById('reviewAutoCount');
         if(count)count.textContent='Não foi possível desfazer a marcação; o progresso não foi apagado.';
       }
     });
     card.append(undo);
   }
   mount.append(card);
 }
}
function openReview(task){
 const stage=document.getElementById('reviewAutoPractice');
 if(!stage)return;
 const selected=pickFor(task);
 stage.replaceChildren();
 if(!selected.length){
   stage.append(el('p','Ainda não há questões cadastradas para este assunto. O registro permanece pendente; a tarefa editorial deve acrescentar questões compatíveis.'));return;
 }
 const h=el('h2','Revisão dirigida: '+task.session.topic);h.id='quiz-atual';stage.append(h);
 stage.append(el('p','Questões de recuperação ativa, prioritariamente adaptadas de temas de provas anteriores verificadas. Ao enviar suas respostas, a revisão será registrada como praticada; novos erros gerarão novas datas. Questões autorais de reserva são identificadas.'));
 const quiz=buildForm(selected,task.session.exam,'Revisão: '+task.session.topic,'Revisão automática — questões adaptadas de FURB e autorais identificadas',task.id);
 stage.append(quiz);
 stage.scrollIntoView({behavior:'smooth',block:'start'});
}
async function renderReview(){
 const stage=document.getElementById('reviewAutoList');
 if(!stage)return;
 renderTasks();
}
function listen(){
 addEventListener('ce:practice-recorded',()=>{renderTasks();});
 addEventListener('concurso:progress-change',()=>{renderTasks();});
 addEventListener('storage',e=>{if([LOG_KEY,DONE_KEY].includes(e.key))renderTasks();});
 addEventListener('concurso:sync-status',e=>{if(e.detail?.message?.startsWith('Sincronizado'))renderTasks();});
}
async function init(){
 const practice=document.querySelector('[data-ce-practice]');
 const reviews=document.getElementById('reviewAutoList');
 if(!practice&&!reviews)return;
 try{await load();if(practice)await renderPractice();if(reviews){await renderReview();listen();}}
 catch(error){
   const stage=practice||reviews;
   stage?.replaceChildren(el('p','Não foi possível carregar as questões: '+error.message+'. O progresso salvo não foi alterado.'));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
