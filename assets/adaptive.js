/* Recomendações locais (não é a tarefa editorial horária do ChatGPT).
 * Ao abrir o site e após marcações/sincronização:
 * consulta os dados públicos do plano e o progresso privado já sincronizado.
 * Não gera aulas inexistentes; não atribui Estudado/Avaliado a partir de Lido.
 * Não envia progresso ao GitHub nem modifica planos oficiais ou arquivos privados.
 */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const prefix = location.pathname.includes('/aulas/') ? '../' : '';
const rlmKey='concursos_rlm_sections_read_v3';
const engKey='concurso_eng_qualidade_steps_v1';
const ptKey='concursos:casan2026:portugues:2026-11-19:subsections:v1';
const logsKey='ce_question_logs_v1', reviewKey='ce_review_done_v1',planKey='ce_plan_done_v1',studyKey='ce_study_confirmed_v1';
let config=null,questionSets=[],imaMicroUnits=[],panel=null,details=null,status=null,button=null,refreshing=false,nextRefresh=false,renderedSignature='';
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
 if(!['rlm','engenharia','portugues'].includes(id)){
   const doc=parse('ce_lesson_read_v1:'+id,{});
   if(Array.isArray(doc?.read))for(const key of doc.read)if(typeof key==='string')out.add(key);
 }
 return out;
}
// Estudo é declaração explícita por módulo e por edital. Nunca deriva de Lido.
function studyRecord(){
 const doc=parse(studyKey,{});
 return isRecord(doc?.confirmed)?doc.confirmed:{};
}
function studiedModules(exam,lesson){
 const entries=studyRecord(),out=new Set();
 if(!exam)return out;
 for(let i=1;i<=lesson.sections_per_module.length;i++){
  if(entries[exam+':'+lesson.id+':'+i]===true)out.add(i);
 }
 return out;
}
function setStudyModule(exam,lesson,module,studied){
 if(!config?.exams?.[exam]||!lesson.subjects?.[exam]||!Number.isInteger(module)||module<1||module>lesson.sections_per_module.length)return false;
 const doc=parse(studyKey,{}),values={...(isRecord(doc?.confirmed)?doc.confirmed:{})};
 values[exam+':'+lesson.id+':'+module]=studied===true;
 try{
  localStorage.setItem(studyKey,JSON.stringify({version:1,confirmed:values,updatedAt:new Date().toISOString()}));
  dispatchEvent(new CustomEvent('concurso:progress-change'));
  return true;
 }catch{return false;}
}
const SUBJECT_CODE={
 'Conhecimentos Específicos (TI)':'ti','Tecnologia da Informação':'ti',
 'Português':'portugues','Raciocínio Lógico-Matemático':'rlm',
 'Legislação':'legislacao','Legislação Ambiental':'legislacao',
 'Administração Pública':'adm','Atualidades':'atualidades'
};
function subjectEvidence(exam,lessons){
 const matrix=config.exams?.[exam]?.subjects||[],logs=getSessionLogs().filter(x=>x.exam===exam);
 return matrix.map(([name,weight])=>{
  const relevant=lessons.filter(x=>x.subject===name);
  const modules=relevant.reduce((n,l)=>n+l.sections_per_module.length,0);
  const confirmed=relevant.reduce((n,l)=>n+l.studiedCount,0);
  const totalRead=relevant.reduce((n,l)=>n+l.read,0),totalSections=relevant.reduce((n,l)=>n+l.total,0);
  const assessment=logs.filter(x=>x.subject===SUBJECT_CODE[name]);
  const valid=assessment.reduce((n,x)=>n+x.valid,0),correct=assessment.reduce((n,x)=>n+x.correct,0);
  const gap=modules?1-confirmed/modules:1;
  // Erros corrigidos em questões realmente enviadas aumentam a prioridade,
  // mas nem acertos nem Lido autorizam percentual de domínio.
  const errorBoost=valid?Math.min(0.25,(valid-correct)/valid*0.25*Math.min(1,valid/6)):0;
  const priority=weight*(gap+errorBoost);
  return {name,weight,modules,confirmed,totalRead,totalSections,valid,correct,
   errors:valid-correct,gap,priority,
   topics:relevant.map(l=>l.id)};
 }).sort((a,b)=>b.priority-a.priority||b.weight-a.weight||a.name.localeCompare(b.name,'pt-BR'));
}
// Ao retomar na primeira subseção de um novo módulo, abrir antes a apresentação.
function continueHref(course){
 if(!course.first)return 'revisoes.html';
 const {module,step,id}=course.first;
 if(step!==1||module===1)return course.url+'#'+id;
 const header=course.id==='engenharia'?'sec'+module:
  (course.id==='rlm'||course.id==='portugues')?'m'+module:'cap-'+module;
 return course.url+'#'+header;
}
function courseState(lesson,exam){
 const seen=readSet(lesson.id),studied=studiedModules(exam,lesson);
 const modules=lesson.sections_per_module,count=modules.reduce((sum,n)=>sum+n,0);
 let read=0,firstUnread=null,firstNotStudied=null,completed=0,lastFinished=0;
 for(let m=1;m<=modules.length;m++){
  let countThis=0;
  if(!studied.has(m)&&!firstNotStudied)firstNotStudied={module:m,step:1,id:sectionId(lesson,m,1)};
  for(let step=1;step<=modules[m-1];step++){
   const id=sectionId(lesson,m,step);
   if(seen.has(id)){read++;countThis++;}
   else if(!firstUnread&&!studied.has(m))firstUnread={module:m,step,id};
  }
  if(countThis===modules[m-1]){completed++;lastFinished=m;}
 }
 const subject=lesson.subjects?.[exam]||'';
 const weight=(config.exams?.[exam]?.subjects||[]).find(pair=>pair[0]===subject)?.[1]||0;
 const totalQuestions=config.exams?.[exam]?.total||0;
 const ratio=count?read/count:0,studiedCount=studied.size,studyRatio=modules.length?studiedCount/modules.length:0;
 // Quando já há estudo confirmado, priorizar o primeiro módulo ainda sem confirmação,
 // inclusive se suas etapas foram marcadas como Lido. Sem confirmação, preservar a
 // primeira subseção não lida para não reiniciar conteúdo automaticamente.
 const first=read===count?firstNotStudied:studiedCount>0?(firstNotStudied?(
  (()=>{for(let step=1;step<=modules[firstNotStudied.module-1];step++){
   const id=sectionId(lesson,firstNotStudied.module,step);
   if(!seen.has(id))return {module:firstNotStudied.module,step,id};
  }return firstNotStudied;})()
 ):null):(firstUnread||firstNotStudied);
 const inProgress=(read>0&&read<count)||(studiedCount>0&&studiedCount<modules.length);
 return {...lesson,read,total:count,completed,first,lastFinished,weight,totalQuestions,subject,ratio,
  studiedCount,studyRatio,inProgress,score:0};
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
 const deadline=config.exams?.[exam]?.deadline;
 const daysRemaining=deadline?Math.round((Date.parse(deadline+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000):null;
 const lastDays=exam==='casan'&&daysRemaining!==null&&daysRemaining>=0&&daysRemaining<=2;
 // Fases IMA calculadas diariamente pelo prazo do edital; a data é previsão até confirmação oficial.
 const imaPhase=exam!=='ima'||daysRemaining===null?'coverage':daysRemaining<=15?'final':daysRemaining<=45?'practice':'coverage';
 const lessons=(config.adaptive_study?.lessons||[]).map(l=>courseState(l,exam));
 const subjects=subjectEvidence(exam,lessons);
 const casanCourses=lessons.filter(l=>l.subjects?.casan&&l.weight>0);
 const allCourseModules=exam==='casan'&&casanCourses.length>0&&casanCourses.every(l=>l.studiedCount===l.sections_per_module.length);
 // Além dos módulos publicados, o edital contém lacunas documentais: confirmação separada, explícita e reversível.
 const extraReady=allCourseModules&&studyRecord()['casan:edital:pendencias']===true;
 const rank=new Map(subjects.map((x,i)=>[x.name,i]));
 const scoreBySubject=new Map(subjects.map(x=>[x.name,x.priority]));
 for(const lesson of lessons)lesson.score=(scoreBySubject.get(lesson.subject)||0)*(1-lesson.studyRatio);
 // Uma única trilha inicial por disciplina impede que os 25 itens de TI
 // sejam contabilizados quatro vezes só porque há quatro aulas publicadas.
 const perSubject=new Map();
 const candidates=lessons.filter(c=>c.first&&c.weight>0);
 for(const c of candidates){
  const group=perSubject.get(c.subject)||[];group.push(c);perSubject.set(c.subject,group);
 }
 for(const group of perSubject.values())group.sort((a,b)=>{
  if(a.inProgress!==b.inProgress)return Number(b.inProgress)-Number(a.inProgress);
  if(a.studyRatio!==b.studyRatio)return a.studyRatio-b.studyRatio;
  return candidates.indexOf(a)-candidates.indexOf(b);
 });
 const sorted=[...perSubject.entries()].sort((a,b)=>{
  const delta=(scoreBySubject.get(b[0])||0)-(scoreBySubject.get(a[0])||0);
  return delta||((rank.get(a[0])||0)-(rank.get(b[0])||0));
 }).flatMap(([_,items])=>items);
 const due=nextDue(exam,today);
 const picks=[];
 const assigned=config.calendar.special?.[today]||[];
 const scheduledQuiz=assigned.find(t=>t.id==='questions-reta-final'||t.id==='ima-questions-eve');
 const examDue=exam==='casan'&&daysRemaining===0;
 // Em reta final, priorizar lacunas essenciais de teoria. Treinos são opções, não tarefas obrigatórias.
 if(examDue)picks.push({type:'plan',title:'Hoje é a prova CASAN: apenas revisão leve e orientações oficiais',
  href:'planejamento.html',description:'Não iniciar teoria extensa nem um simulado longo no dia da prova. A data não comprova comparecimento.'});
 // Primeiro uma aula por disciplina, na ordem do peso ainda sem estudo confirmado;
 // se restarem vagas, continuar outras aulas dos mesmos temas.
 const chosen=[],seenSubject=new Set();
 for(const l of sorted)if(!seenSubject.has(l.subject)){chosen.push(l);seenSubject.add(l.subject);}
 for(const l of sorted)if(!chosen.includes(l))chosen.push(l);
 for(const c of chosen.slice(0,examDue?0:lastDays?3:due.length?2:3)){
  const stats=subjects.find(x=>x.name===c.subject);
  const isRead=readSet(c.id).has(c.first.id);
  picks.push({type:'lesson',title:c.title+' · '+(c.module_titles?.[c.first.module-1]||'Módulo '+c.first.module)+' · etapa '+c.first.module+'.'+c.first.step,
   href:continueHref(c),
   description:c.subject+': '+c.weight+'/'+c.totalQuestions+' questões no edital. '+
    (stats?stats.confirmed+'/'+stats.modules+' módulos com estudo confirmado na disciplina. ':'')+
    c.studiedCount+'/'+c.sections_per_module.length+' módulos confirmados nesta aula, '+
    c.read+'/'+c.total+' subseções Lido.'+
    (stats?.valid?' Questões enviadas na disciplina: '+stats.correct+'/'+stats.valid+' acertos.':' Sem avaliação registrada nesta disciplina.')+
    (isRead?' A etapa já tem Lido, mas o módulo não tem estudo confirmado.':' Priorizar a próxima etapa não lida.')+
    ' Leitura e acertos isolados não são domínio.'});
 }
 // Recomendar uma faixa exata somente após confirmação EXPLÍCITA de estudo em módulo.
 // O link inclui os limites; o quiz não carrega outros itens do banco.
 const attempted=new Set(getSessionLogs().filter(l=>l.exam===exam).flatMap(l=>Array.isArray(l.questionIds)?l.questionIds:[]));
 const availableQuestionSets=exam==='casan'?questionSets.filter(set=>set.question_ids.some(id=>!attempted.has(id))).length:0;
 const topicMap={'engenharia':'engenharia','banco-dados':'banco-dados','seguranca':'seguranca',
  'algoritmos-oo':'algoritmos','portugues':'portugues','rlm':'rlm',
  'legislacao-casan':'legislacao-atualidades'};
 const eligible=lessons.filter(l=>l.weight>0&&l.studiedCount>0&&topicMap[l.id])
  .sort((a,b)=>b.weight-a.weight||b.studiedCount-a.studiedCount);
 let nextBlock=null;
 for(const c of eligible){
  const set=questionSets.find(x=>x.id===topicMap[c.id]);if(!set)continue;
  // Um módulo estudado não libera questões de tópicos ainda não estudados.
  const confirmed=studiedModules(exam,c);
  const belongsToStudied=id=>confirmed.has(set.module_by_question?.[id]);
  const from=set.question_ids.findIndex(id=>!attempted.has(id)&&belongsToStudied(id));
  if(from<0)continue;
  const limit=lastDays?3:5;
  let end=from;
  while(end<set.question_ids.length&&end-from<limit&&
    !attempted.has(set.question_ids[end])&&belongsToStudied(set.question_ids[end]))end++;
  if(end===from)continue;
  const questionModules=[...new Set(set.question_ids.slice(from,end).map(id=>set.module_by_question[id]))];
  nextBlock={c,set,from:from+1,to:end,questionModules};break;
 }
 if(nextBlock&&!examDue){
  const {set,c,from,to,questionModules}=nextBlock;
  picks.push({type:'quiz',title:'Questões '+from+'–'+to+' · '+set.title+' (opcional após estudo confirmado)',
   href:set.href+'?de='+from+'&ate='+to,
   description:'Somente '+(to-from+1)+' questão(ões) do assunto, em página separada. '+
    'Ligadas apenas ao(s) módulo(s) '+questionModules.join(', ')+' com estudo confirmado, sem antecipar temas de módulos não estudados. Questões opcionais na reta final.'});
 }
 if(due.length){
  const d=due[0];
  picks.push({type:'review',title:'Revisão de erro: '+d.topic,
   href:'revisoes.html',description:due.length+' revisão(ões) vencida(s)/devida(s), originada(s) exclusivamente de respostas enviadas. '+
    (lastDays?'Fazer somente se houver tempo após os conteúdos essenciais.':'Corrigir lacunas antes de prosseguir.')});
 }
 if(extraReady&&!examDue){
  const extras=questionSets.filter(s=>s.id.startsWith('extra-'));
  const set=extras.find(s=>s.question_ids.some(id=>!attempted.has(id)));
  if(set){
   const first=set.question_ids.findIndex(id=>!attempted.has(id));
   let end=first;
   while(end<set.question_ids.length&&end-first<5&&!attempted.has(set.question_ids[end]))end++;
   picks.push({type:'quiz',title:'Bateria extra após o conteúdo · '+set.title+' · questões '+(first+1)+'–'+end,
    href:set.href+'?de='+(first+1)+'&ate='+end,
    description:'Reserva de 25 questões em cinco blocos, separada das aulas. Módulos CASAN e lacunas restantes foram confirmados explicitamente; isto não comprova domínio. Somente respostas enviadas registram avaliação.'});
  }
 }
 if(scheduledQuiz&&exam===(scheduledQuiz.id==='questions-reta-final'?'casan':'ima')&&!examDue){
  picks.push({type:'quiz',title:scheduledQuiz.title+' (opcional)',
   href:scheduledQuiz.href,description:scheduledQuiz.detail+
   (lastDays?' Na reta final, priorize primeiro os tópicos essenciais ainda pendentes.':'')+
   ' Somente Enviar registra uma avaliação.'});
 }
 let imaSuggestedQuestion=null,imaSuggestedLesson=null;
 if(exam==='ima'&&lessons.some(l=>l.daily)){
   const daily=lessons.filter(l=>l.daily).sort((a,b)=>a.date.localeCompare(b.date));
   const pending=daily.find(l=>l.studiedCount===l.sections_per_module.length&&l.question_ids?.some(id=>!attempted.has(id)));
   const next=daily.find(l=>l.studiedCount<l.sections_per_module.length);
   picks.length=0;
   if(pending){imaSuggestedQuestion={type:'quiz',title:'Questão sugerida · '+pending.title,href:pending.question_href,description:'Questões da aula diária com estudo confirmado. Apenas respostas enviadas registram avaliação.'};if(imaPhase!=='coverage'||!next)picks.push(imaSuggestedQuestion);}
   if(next){imaSuggestedLesson={type:'lesson',title:next.title,href:continueHref(next),description:'Aula diária: núcleo de 120 minutos, ajustável à disponibilidade. Lido não é Estudado.'};if(imaPhase!=='final'||!pending)picks.push(imaSuggestedLesson);}
   if(due.length)picks.push({type:'review',title:'Revisão pendente: '+due[0].topic,href:'revisoes.html',description:'Revisão baseada exclusivamente em respostas enviadas.'});
   if(!pending&&!next)picks.push({type:'plan',title:'Continuar cobertura do edital IMA',href:'planejamento.html',description:'Outros tópicos do edital permanecem pendentes.'});
 }

 if(!picks.length){
  if(!exam)picks.push({type:'plan',title:'Revisar a prioridade do concurso',href:'planejamento.html',
   description:'As janelas cadastradas terminaram; não seguir concursos antigos automaticamente.'});
  else picks.push({type:'review',title:'Verificar retenção com questões',href:'revisoes.html',
   description:'Os módulos com materiais foram confirmados como estudados; confirmar estudo não comprova domínio. Responda quizzes para registrar avaliação.'});
 }
 const path=location.pathname;
 const active=lessons.find(l=>path.endsWith('/'+l.url)||path.endsWith(l.url));
 // O estoque F pertence exclusivamente ao concurso prioritário, mesmo no dia
 // em que uma prova antiga ainda coincide com a data atual. Não misturar CASAN/IMA.
 // Apenas aulas com estrutura de subseções conhecida e disciplina do edital ativo.
 const relevant=lessons.filter(l=>{
  if(exam==='ima'&&!l.daily)return false;
  if(!exam||!Array.isArray(l.sections_per_module)||!l.sections_per_module.length||l.total<=0)return false;
  const subject=l.subjects?.[exam],matrix=config.exams[exam]?.subjects||[];
  return !!subject&&matrix.some(pair=>pair[0]===subject&&pair[1]>0);
 });
 const unreadEquivalents=relevant.reduce((sum,l)=>sum+Math.max(0,Math.min(1,(l.total-l.read)/l.total)),0);
 const minEquivalents=Math.max(1,Math.min(10,config.adaptive_study?.minimum_unread_equivalents||5));
 return {today,exam,daysRemaining,imaPhase,availableQuestionSets,allCourseModules,extraReady,imaSuggestedQuestion,imaSuggestedLesson,windowRule,lessons,subjects,picks,due,agenda:agenda(today),active,
  unreadEquivalents,minEquivalents};
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
function createPanel(){ /* Sem painel redundante: o foco aparece nos cartões existentes. */ }
function orderCatalog(data){
 const catalog=$('lessonCatalog');
 if(!catalog)return;
 const cards=[...catalog.querySelectorAll('.catalog-card[data-lesson-id]')];
 const lessonScore=new Map(data.lessons.map(x=>[x.id,x.score]));
 const priority=data.picks.filter(x=>x.type==='lesson').map(x=>{
   const course=data.lessons.find(l=>x.href.startsWith(l.url));
   return course?.id||'';
 });
 const rank=new Map(priority.map((id,i)=>[id,i]));
 cards.sort((a,b)=>{
   const ida=a.dataset.lessonId,idb=b.dataset.lessonId;
   const ra=rank.has(ida)?rank.get(ida):100,rb=rank.has(idb)?rank.get(idb):100;
   if(ra!==rb)return ra-rb;
   const scoreDiff=(lessonScore.get(idb)||0)-(lessonScore.get(ida)||0);
   return scoreDiff||ida.localeCompare(idb,'pt-BR');
 });
 for(const card of cards)catalog.append(card);
 for(const course of data.lessons){
   const oldLinks={rlm:'catalogRlmContinue',engenharia:'catalogEngContinue',portugues:'catalogPtContinue'};
   const links=[document.getElementById(oldLinks[course.id]),...catalog.querySelectorAll('[data-ce-course-resume="'+course.id+'"]')].filter(Boolean);
   for(const link of links){
     link.href=localHref(continueHref(course));
     link.textContent=course.first?'Retomar '+course.first.module+'.'+course.first.step:'Ver revisões';
   }
   for(const label of catalog.querySelectorAll('[data-ce-course-count="'+course.id+'"]'))label.textContent=course.read+' de '+course.total;
 }
 const count=$('catalogCount');
 if(count)count.textContent=cards.filter(card=>!card.hidden).length+' aula(s) disponíveis; ordenadas por peso, estudo confirmado, evidências de questões e leitura para continuidade.';
}
function renderStudyPriority(data){
 const summary=$('cePrioritySubjects'),modulesHost=$('ceStudyModules');
 if(!summary||!modulesHost)return;
 summary.replaceChildren();
 if(!data.exam){
  summary.append(el('p','note-small','Não há concurso ativo no intervalo cadastrado; consulte os editais.'));
  modulesHost.replaceChildren();return;
 }
 const table=el('table','ce-priority-table');
 const caption=el('caption','','Ordem das disciplinas — '+config.exams[data.exam].name);
 table.append(caption);
 const head=document.createElement('thead'),row=document.createElement('tr');
 for(const title of ['Ordem / disciplina','Peso no edital','Módulos estudados','Leitura declarada','Questões enviadas']){
  const th=el('th','',title);th.scope='col';row.append(th);
 }
 head.append(row);table.append(head);
 const body=document.createElement('tbody');
 for(const [i,subject] of data.subjects.entries()){
  const tr=document.createElement('tr');
  const name=el('th','',String(i+1)+'. '+subject.name);name.scope='row';tr.append(name);
  for(const field of [
   subject.weight+' de '+config.exams[data.exam].total,
   subject.modules?subject.confirmed+' de '+subject.modules+' confirmados':'Sem aula catalogada',
   subject.totalSections?subject.totalRead+' de '+subject.totalSections+' Lido':'Sem material',
   subject.valid?subject.correct+' acertos / '+subject.valid+' válidas':'Sem respostas registradas'
  ])tr.append(el('td','',field));
  body.append(tr);
 }
 table.append(body);summary.append(table);
 summary.append(el('p','note-small','Critério: questões da disciplina × proporção de módulos sem estudo confirmado, com acréscimo limitado por erros efetivamente registrados. Aulas de uma mesma disciplina não multiplicam seu peso. Prazos de revisões e simulado agendado podem antecipar questões. Acerto em amostra pequena não equivale a domínio.'));
 const previous=new Set([...modulesHost.querySelectorAll('details[data-study-lesson][open]')].map(n=>n.dataset.studyLesson));
 modulesHost.replaceChildren();
 const bySubjects=data.subjects.flatMap(x=>data.lessons.filter(l=>l.subject===x.name));
 for(const lesson of bySubjects){
  const details=document.createElement('details');details.dataset.studyLesson=lesson.id;
  details.className='ce-study-lesson';details.open=previous.has(lesson.id);
  const heading=el('summary','',lesson.title+' · '+lesson.studiedCount+'/'+lesson.sections_per_module.length+' módulos com estudo confirmado');
  details.append(heading);
  const options=el('div','ce-study-options');
  for(let m=1;m<=lesson.sections_per_module.length;m++){
   const label=el('label','ce-study-check');
   const check=document.createElement('input');check.type='checkbox';
   check.checked=studiedModules(data.exam,lesson).has(m);
   check.setAttribute('aria-label','Estudei o módulo '+m+' de '+lesson.title+' para '+config.exams[data.exam].name);
   check.addEventListener('change',()=>{
    const ok=setStudyModule(data.exam,lesson,m,check.checked);
    const status=$('ceStudyStatus');
    if(status)status.textContent=ok?
     'Confirmação de estudo atualizada. O próximo foco e a ordem foram recalculados, sem alterar Lido ou notas.':
     'Não foi possível gravar a confirmação de estudo.';
    if(!ok)check.checked=!check.checked;
   });
   label.append(check,document.createTextNode('Módulo '+m+' · '+(lesson.module_titles?.[m-1]||'Conteúdo do módulo')));
   options.append(label);
  }
  details.append(options);modulesHost.append(details);
 }
 if(data.exam==='casan'){
  const label=el('label','ce-study-check');
  const check=document.createElement('input');check.type='checkbox';
  check.checked=studyRecord()['casan:edital:pendencias']===true;
  check.disabled=!data.allCourseModules;
  check.setAttribute('aria-label','Confirmar estudo dos tópicos do edital CASAN sem aula catalogada');
  check.addEventListener('change',()=>{
    const before=parse(studyKey,{}),values={...(isRecord(before?.confirmed)?before.confirmed:{})};
    values['casan:edital:pendencias']=check.checked;
    try{
     localStorage.setItem(studyKey,JSON.stringify({version:1,confirmed:values,updatedAt:new Date().toISOString()}));
     dispatchEvent(new CustomEvent('concurso:progress-change'));
    }catch{check.checked=!check.checked;const status=$('ceStudyStatus');if(status)status.textContent='Não foi possível salvar esta confirmação.';}
  });
  const note=data.allCourseModules?
   'Confirmação final: estudei também os pontos ainda sem aula completa (por exemplo, Delphi, APF, governança, BPMN, sistemas operacionais, Atualidades e demais itens da matriz). Isso é declaração de estudo, não avaliação. Ao confirmar, serão sugeridas as 25 questões extras. Pode desmarcar.':
   'As 25 questões extras serão sugeridas após confirmar todos os módulos CASAN disponíveis acima e, separadamente, os tópicos do edital ainda não cobertos integralmente. Não é preciso marcar algo que você não estudou.';
  label.append(check,document.createTextNode(note));
  modulesHost.append(label);
 }
}
function render(data){
 const signature=JSON.stringify({
   exam:data.exam,daysRemaining:data.daysRemaining,readyQuestionSets:data.availableQuestionSets,head:data.picks,lesson:data.active?.id,lessonNext:data.active?.first,
   evidence:data.lessons.map(l=>[l.id,l.read,l.total,l.studiedCount]),subjects:data.subjects.map(x=>[x.name,x.priority,x.valid,x.correct]),due:data.due.length,agenda:data.agenda,available:data.unreadEquivalents,extraReady:data.extraReady,allCourseModules:data.allCourseModules,imaSuggestedQuestion:data.imaSuggestedQuestion,imaSuggestedLesson:data.imaSuggestedLesson
 });
 orderCatalog(data);
 renderStudyPriority(data);
 for(const u of imaMicroUnits){
   const badge=document.querySelector('[data-ce-micro-count="'+u.id+'"]');
   if(badge)badge.textContent=readSet(u.source.lesson).has(u.source.section)?'1 de 1 seção Lido':'0 de 1 seção Lido';
 }
 const microDetails=$('imaMicroDetails');
 // Acervo recolhido por padrão.
 const catalogFocus=$('catalogFocusNotice');
 if(catalogFocus&&data.exam==='ima')catalogFocus.textContent='Prioridade IMA-SC · FURB. Aulas diárias com questões separadas; acervo anterior para consulta.';
 const casanCard=$('casanFinalCard');
 if(casanCard)casanCard.hidden=data.exam!=='casan';
 const imaQuestionCard=$('imaQuestionSuggested');
 if(imaQuestionCard){
   imaQuestionCard.hidden=data.exam!=='ima';
   const link=$('imaQuestionLink'),desc=$('imaQuestionDescription');
   if(data.exam==='ima'){
     const rec=data.imaSuggestedQuestion;
     if(desc)desc.textContent=rec?rec.description:
       'Após confirmar o estudo de uma aula diária, seu questionário pode ser sugerido. Lido não equivale a estudo; acesso voluntário permanece disponível.';
     if(link){
       link.href=localHref(rec?.href||data.imaSuggestedLesson?.href||'aulas.html#lessonCatalog');
       link.textContent=rec?'Responder às questões sugeridas':'Abrir próxima aula diária';
     }
   }
 }
 const practiceSection=$('ceQuestionInventory'),practiceHint=$('ceQuizRecommended');
 if(practiceSection)practiceSection.hidden=data.exam!=='casan';
 if(practiceHint&&data.exam==='casan'){
  practiceHint.replaceChildren();
  const available=data.availableQuestionSets;
  practiceHint.append(el('p','note-small','Conjuntos com ao menos uma questão não respondida: '+available+' de '+questionSets.length+' (7 por assunto e 5 extras pós-conteúdo). '+
    (available<5?'Reserva personalizada abaixo do mínimo de cinco; a manutenção recorrente deve procurar questões novas de fonte verificável, sem reutilizar respostas como inéditas.':'Reserva pessoal acima do mínimo de cinco.')));
  const specific=data.picks.find(x=>x.type==='quiz'&&/questoes-[a-z-]+-casan\.html\?de=\d+&ate=\d+/.test(x.href));
  const extra=data.picks.find(x=>x.type==='quiz'&&/questoes-extra-[a-z-]+-casan\.html\?de=\d+&ate=\d+/.test(x.href));
  if(data.daysRemaining===0){
   practiceHint.append(el('p','note-small','Hoje é o dia da prova: não há bateria obrigatória de questões. Priorize orientações oficiais e revisão leve.'));
  }else if(extra){
   practiceHint.append(el('p','note-small','Conteúdo declarado concluído: '+extra.description));
   practiceHint.append(anchor(extra.href,'Abrir '+extra.title,true));
  }else if(specific){
   practiceHint.append(el('p','note-small','Estudo de módulo confirmado: '+specific.description));
   practiceHint.append(anchor(specific.href,'Abrir apenas '+specific.title,true));
  }else{
   practiceHint.append(el('p','note-small','Ainda não há bloco individual recomendado por estudo confirmado. A prioridade é avançar nos tópicos de maior retorno. Os sete conjuntos temáticos e os cinco blocos extras ficam disponíveis abaixo; a recomendação dos extras depende de conclusão declarada de todo o conteúdo.'));
  }
 }
 if(signature!==renderedSignature&&details){
   renderedSignature=signature;
   details.replaceChildren();
   const n=el('p','ce-adaptive-evidence',data.lessons.map(x=>x.title.split(':')[0]+': '+x.read+'/'+x.total+' Lido').join(' · '));
   details.append(n);
   if(data.exam){
     const quantity=data.unreadEquivalents.toFixed(2).replace('.',',');
     const deficit=Math.max(0,Math.ceil((data.minEquivalents-data.unreadEquivalents)-1e-9));
     const message=data.exam==='ima'
       ?'Aulas diárias: '+quantity+' equivalentes ainda não lidas (meta: '+data.minEquivalents+'). Acervo não conta no estoque diário. Leitura, estudo e avaliação são evidências separadas.'
       :'Fila de leitura: '+quantity+' aulas completas equivalentes ainda não lidas (meta: '+data.minEquivalents+'). '+(deficit>0?'Faltam '+deficit+' aula(s) integralmente não lida(s) para a reserva mínima; a tarefa editorial do GPT deverá produzi-las.':'Reserva mínima atendida com material já publicado.');
     details.append(el('p','ce-adaptive-queue',message));
   }
   const namedLesson=data.active;
   if(namedLesson){
     const current=el('div','ce-adaptive-current');
     const title=namedLesson.first?'Nesta aula: continue na etapa '+namedLesson.first.module+'.'+namedLesson.first.step+' — '+(namedLesson.module_titles?.[namedLesson.first.module-1]||'Módulo '+namedLesson.first.module):'Nesta aula: todas as subseções estão marcadas como Lido';
     current.append(el('strong','',title));
     current.append(el('p','',namedLesson.first?'Leitura registrada: '+namedLesson.read+'/'+namedLesson.total+'. Continue sem repetir etapas já marcadas.':'Próximo passo sugerido: recuperação ativa e questões, sem presumir domínio.'));
     current.append(anchor(continueHref(namedLesson),namedLesson.first?'Abrir próxima subseção':'Ver revisões',true));
     details.append(current);
   }
   if(data.exam==='casan'&&data.daysRemaining!==null&&data.daysRemaining>=0&&data.daysRemaining<=2)
    details.append(el('p','ce-adaptive-urgency','Prazo CASAN: '+data.daysRemaining+' dia(s) até 22/11. Conteúdo prioritário primeiro; questões pontuais apenas se houver tempo ou após estudo confirmado.'));
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
   details.append(el('p','ce-adaptive-disclaimer','Recomendação baseada no peso do edital, estudo explicitamente confirmado por módulo, prazos e erros realmente registrados. Lido é separado; não presume domínio nem marca atividades realizadas.'));
 }
 const primary=data.picks[0];
 for(const id of ['dynamicFocusLink','nextLessonLink']){
   const link=$(id);
   if(link&&primary){
     link.href=localHref(primary.href);
     link.textContent='Seguir sugestão: '+primary.title;
   }
 }
 const resumeLinks=[['rlm','resumeRlmLink'],['engenharia','resumeEngLink']];
 for(const [id,target] of resumeLinks){
   const course=data.lessons.find(l=>l.id===id),a=$(target);
   if(!course||!a)continue;
   a.href=localHref(continueHref(course));
   a.textContent=course.first?'Retomar etapa '+course.first.module+'.'+course.first.step:'Ver revisões';
 }
 const focus=$('dynamicFocus');
 if(focus&&primary)focus.textContent=primary.title+'. '+primary.description;
}
function statusText(now,message=''){
 const sync= parse('ce_private_sync_pair_meta_v2',null);
 const pair=(()=>{try{return !!localStorage.getItem('ce_private_sync_pair_v1');}catch{return false;}})();
 let base='Atualização de leitura calculada em '+formatTime(now)+'. A manutenção editorial de aulas e planos é feita separadamente pela tarefa agendada do ChatGPT.';
 if(pair&&sync?.last_sync){
   const when=new Date(sync.last_sync);
   base+=' Última sincronização remota confirmada: '+(Number.isFinite(when.valueOf())?formatTime(when):'não identificada')+'.';
 }else if(pair)base+=' Pareamento identificado; aguardando confirmação de sincronização.';
 else base+=' Somente dados locais deste navegador; pareie os aparelhos para sincronizar.';
 if(message)base+=' '+message;
 return base;
}
async function getConfig(){
 const [response,setsResponse]=await Promise.all([
  fetch(localHref('dados/concursos.json'),{cache:'no-store'}),
  fetch(localHref('dados/blocos-questoes-casan.json'),{cache:'no-store'})
 ]);
 if(!response.ok||!setsResponse.ok)throw Error('Dados do edital ou blocos de questões indisponíveis');
 const next=await response.json(),sets=await setsResponse.json();
 if(sets.schema_version!==1||!Array.isArray(sets.sets)||sets.sets.length<5)throw Error('Reserva de questões insuficiente');
 questionSets=sets.sets;
 // Manifesto editorial público: não inclui estado nem respostas pessoais.
 try{
   const response=await fetch(localHref('dados/microaulas-ima.json'),{cache:'no-store'});
   if(!response.ok)throw Error('Microaulas IMA indisponíveis');
   const manifest=await response.json();
   if(manifest.schema_version!==1||manifest.exam!=='ima'||!Array.isArray(manifest.units)||manifest.units.length!==25||
      new Set(manifest.units.map(u=>u.id)).size!==25)throw Error('Catálogo IMA inválido');
   imaMicroUnits=manifest.units;
 }catch{imaMicroUnits=[];}
 if(next.schema_version!==1||next.adaptive_study?.schema_version!==1||
 !Array.isArray(next.adaptive_study.lessons)||!next.exams||!next.priority_windows||!next.calendar)throw Error('Configuração adaptativa incompleta');
 for(const lesson of next.adaptive_study.lessons){
   if(!Array.isArray(lesson.sections_per_module)||lesson.sections_per_module.length>20||lesson.sections_per_module.some(n=>!Number.isInteger(n)||n<1||n>40)||
      !/^aulas\/[a-z0-9-]+\.html$/.test(lesson.url)||!/^[a-z][a-z0-9-]{2,40}$/.test(lesson.id))throw Error('Catálogo de aulas inválido');
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
   const pair=(()=>{try{return /^[a-zA-Z0-9_-]{43}$/.test(localStorage.getItem('ce_private_sync_pair_v1')||'');}catch{return false;}})();
   if(forceSync&&pair&&window.ConcursoSync?.configured?.()){
     try{await window.ConcursoSync.sync();}catch{message='Não foi possível confirmar o servidor; exibindo apenas as marcações locais.';}
   }
   if(!config||forceSync){
     try{await getConfig();}
     catch(e){if(!config)throw e;message+=' O edital não pôde ser atualizado agora; usando a configuração anterior.';}
   }
   const calculated=model();
   render(calculated);
   window.dispatchEvent(new CustomEvent('concurso:adaptive-update',{detail:{today:calculated.today,exam:calculated.exam}}));
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
 // Atualização imediata local ao reabrir a aba; sem fingir manutenção editorial horária no navegador.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
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
