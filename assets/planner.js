/* Concurso Estudos — planejamento, distribuição do edital e revisão por erros.
   Dados de base: planos CASAN/IMA e histórico compartilhado em 18/11/2026.
   Somente interações explícitas do usuário geram registros de realização. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const KEY={done:'ce_plan_done_v1',available:'ce_available_days_v1',logs:'ce_question_logs_v1',review:'ce_review_done_v1'};
const EXAMS={
  casan:{name:'CASAN 2026 · AOCP',deadline:'2026-11-22',deadlineLabel:'22/11/2026',total:50,
    source:'/Concursos/CASAN_2026/PLANO_ESTRATEGICO.md, referência 18/11/2026',
    subjects:[['Conhecimentos Específicos (TI)',25],['Português',10],['Raciocínio Lógico-Matemático',7],['Legislação',5],['Atualidades',3]]},
  ima:{name:'IMA-SC 2027 · FURB',deadline:'2027-02-14',deadlineLabel:'14/02/2027 (prevista)',total:60,
    source:'/Concursos/IMA_SC_2027/PLANO_ESTRATEGICO.md, apuração 13/11/2026',
    subjects:[['Tecnologia da Informação',36],['Português',6],['Raciocínio Lógico-Matemático',6],['Administração Pública',6],['Legislação Ambiental',6]]}
};
const SUBJECTS={ti:'Tecnologia da Informação',portugues:'Português',rlm:'Raciocínio Lógico',legislacao:'Legislação',adm:'Administração Pública',atualidades:'Atualidades'};
const WEEKDAYS=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const REVIEW_OFFSETS=[1,3,7];
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
function getLogs(){const v=read(KEY.logs,[]);return Array.isArray(v)?v.filter(x=>x && typeof x==='object' && (x.exam==='casan'||x.exam==='ima') && typeof x.topic==='string'&&DATE_RE.test(x.date)):[];}
function getReviewDone(){const v=read(KEY.review,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
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
 if(iso<'2026-11-18')return [];
 if(iso<='2026-11-22'){
   const lookup={
     '2026-11-18':[{id:'rlm61',title:'RLM 6.1 — Análise combinatória',detail:'Continuidade obrigatória registrada; teoria visual e exemplos.',href:'aulas/rlm.html#m6-s1'}],
     '2026-11-19':[{id:'rlm61',title:'Retomar o foco RLM 6.1',detail:'Se ainda pendente, continuar antes de trocar o foco.',href:'aulas/rlm.html#m6-s1'},
       {id:'portugues',title:'Português — interpretação e coesão',detail:'Revisão dirigida, incluindo concessão × condição e causa × consequência.'}],
     '2026-11-20':[{id:'legis',title:'Legislação específica CASAN',detail:'Conferir texto vigente e revisar pontos do edital CASAN.'}],
     '2026-11-21':[{id:'revision',title:'Revisão leve — TI e Atualidades',detail:'Priorizar lacunas reais; evitar aprofundamento extenso novo.'}],
     '2026-11-22':[{id:'exam',title:'Data da prova CASAN',detail:'O calendário não comprova comparecimento ou resultado.',event:true}]
   };
   return lookup[iso]||[];
 }
 if(iso>'2027-02-14')return [];
 const mod=dayIndex(iso);
 const daily=[
   ['Português', 'Interpretação, coesão e itens aderentes ao edital FURB'],
   ['Administração Pública','Fundamentos previstos no edital IMA'],
   ['RLM','Diagnóstico de retenção e pontos específicos do IMA'],
   ['Legislação Ambiental','Textos aplicáveis ao edital e distinção entre conceitos'],
   ['Português e RLM','Revisão intercalada; procurar lacunas reais'],
   ['TI + revisão','Retomar questões da semana e corrigir erros'],
   ['Revisão opcional','Consolidar assuntos frágeis; descanso se necessário']
 ];
 const item=daily[mod];
 return [
   {id:'ima-ti',title:'TI — núcleo de estudo',detail:'≈70 min sugeridos · recuperar conteúdo compartilhado / cobrir lacunas FURB',href:'aulas.html'},
   {id:'ima-general',title:item[0],detail:'≈35 min sugeridos · '+item[1]},
   {id:'ima-review',title:'Recuperação / revisão',detail:'≈15 min sugeridos · usar erros reais e recuperar conceitos',href:'revisoes.html'}
 ];
}
function priorityFor(iso){
 if(iso<='2026-11-22')return {contest:'CASAN 2026 · AOCP',title:'Até 22/11: CASAN 404 / AOCP',
 desc:'Próximo foco documentado: RLM 6.1, sem confirmação de conclusão. Depois, cobertura de Português, Legislação e revisão antes da prova.',
 href:'aulas/rlm.html#m6-s1',link:'Abrir RLM 6.1',origin:'Dados: CASAN/ESTADO_ATUAL.md e PLANO_ESTRATEGICO.md (18/11/2026).'};
 return {contest:'IMA-SC 2027 · FURB',title:'A partir de 23/11: IMA · Analista de Informática',
 desc:'Começar pelo inventário de transferência CASAN→IMA, diagnóstico de retenção e lacunas exclusivas do edital. Evitar reiniciar automaticamente conteúdos já estudados.',
 href:'progresso.html?concurso=ima',link:'Ver matriz IMA',origin:'Dados: IMA_SC_2027/ESTADO_ATUAL.md e PLANO_ESTRATEGICO.md (18/11/2026). Dias da semana ainda não confirmados.'};
}
function initPlanning(){
 const weekLabel=$('weekLabel');if(!weekLabel)return;
 const pr=priorityFor(TODAY);
 $('priorityContest').textContent=pr.contest;$('priorityTitle').textContent=pr.title;
 $('priorityDescription').textContent=pr.desc;$('focusSummary').textContent=pr.desc;
 $('planOrigin').textContent=pr.origin;
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
      const iso=isoAdd(week,i),today=iso===TODAY,isIMADay=iso>='2026-11-23'&&iso<='2027-02-14';
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
const HISTORICAL=[
 {topic:'Raciocínio Lógico (1–5)',detail:'Estudado por autorrelato; sem questões aferidas. Módulo 6 em andamento; 7–11 não confirmados como estudados.',kind:'Estudado por autorrelato',area:'rlm'},
 {topic:'Engenharia de Software e Qualidade',detail:'HTML preparado em 18/11; não há confirmação de aula estudada.',kind:'Material criado',area:'ti'},
 {topic:'Orientação a Objetos',detail:'CASAN: 22 itens, 1 anulado; 18 acertos e 3 erros conceituais em 21 válidos. Revisar sobrecarga/sobrescrita, herança/composição e despacho dinâmico.',kind:'Avaliação histórica CASAN',area:'ti'},
 {topic:'Segurança de APIs',detail:'CASAN: 2/3 em questões adaptadas; revisar Authorization Code, Client Credentials e PKCE.',kind:'Avaliação histórica CASAN',area:'ti'},
 {topic:'Português · interpretação/coesão',detail:'Lacunas anteriores em concessão × condição e causa × consequência; sem taxa recente confiável.',kind:'Lacuna histórica',area:'portugues'},
 {topic:'Desenvolvimento Web',detail:'Teoria exposta; revisão pendente de SPA/PWA, WCAG/eMAG e fetch/DOM.',kind:'Teoria exposta',area:'ti'},
 {topic:'SQL / REST',detail:'Aulas expositivas anteriores; desempenho recente não aferido.',kind:'Teoria exposta',area:'ti'}
];
function initProgress(){
 const chooser=$('examSelect');if(!chooser)return;
 const param=new URLSearchParams(location.search).get('concurso');
 chooser.value=param==='ima'?'ima':'casan';
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
   for(const x of HISTORICAL){
     const card=elem('article',{class:'panel span-6'});
     card.append(elem('span',{class:'ui-pill'+(x.kind.includes('Avaliação')?' focus':'')},isIMA?'Base CASAN · reavaliar para IMA':x.kind));
     card.append(elem('h3',{},x.topic));
     card.append(elem('p',{class:'note-small'},x.detail));
     tags.append(card);
   }
   if(isIMA)tags.prepend(elem('p',{class:'soft-notice span-12'},'Os resultados CASAN são somente evidência de base; nenhum acerto ou percentual foi transferido para o concurso IMA.'));
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
const PRIORITY=[
 {topic:'Orientação a Objetos — CASAN',details:'18/21 válidas corretas, 3 erros conceituais, 1 anulada. Revisar sobrecarga × sobrescrita, herança × composição e despacho dinâmico.'},
 {topic:'Segurança de APIs — CASAN',details:'2/3 em questões adaptadas. Revisar Authorization Code, Client Credentials e PKCE.'},
 {topic:'Português — lacunas históricas',details:'Interpretação: concessão × condição e causa × consequência. Desempenho recente não quantificado.'}
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
 function render(){
   const history=$('practiceHistory');clear(history);
   const logs=getLogs().sort((a,b)=>b.date.localeCompare(a.date));
   if(!logs.length)history.append(elem('div',{class:'empty-state'},'Nenhuma sessão registrada neste navegador.'));
   for(const s of logs){
     const row=elem('article',{class:'history-item'});const info=elem('div');
     const errors=s.valid-s.correct;
     attach(info,elem('strong',{},s.topic+' · '+EXAMS[s.exam].name),elem('p',{},localDateLabel(s.date)+' · '+(SUBJECTS[s.subject]||s.subject)+' · '+s.correct+'/'+s.valid+' válidas corretas · '+errors+' erros · '+s.annulled+' anuladas'),elem('p',{},'Tipo de erro: '+s.kind+(s.source?' · '+s.source:'')));
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
 PRIORITY.forEach(p=>{
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
   if(!['casan','ima'].includes(exam)||!SUBJECTS[subject]||topic.length<2||topic.length>100){status.textContent='Confira concurso, disciplina e assunto.';return;}
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
 const b=$('dynamicFocusLink');if(b){b.textContent=p.link;b.href=p.href;}
}
document.addEventListener('DOMContentLoaded',()=>{initPlanning();initProgress();initReviews();initHome();});
})();