/* IMA-SC: programação de 2h + extensão opcional de 2h e diagnóstico
 * privado de RETENÇÃO: só resultados realmente ENVIADOS no edital IMA.
 * Não interpreta progresso CASAN como nota IMA, nem cria tarefas concluídas.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
const get=(key,fallback)=>{try{const data=JSON.parse(localStorage.getItem(key)||'null');return data??fallback;}catch{return fallback;}};
const isoToday=()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const g=k=>parts.find(x=>x.type===k).value;return g('year')+'-'+g('month')+'-'+g('day');};
const weekdays=[
 {ti:"Busca binária, busca linear e Big-O",general:"Administração Pública · princípios",href:'aulas/microaula-ima.html?u=ima-alg-1-1',other:'aulas/microaula-ima.html?u=ima-adm-1-1',quiz:'aulas/questoes-micro-ima.html?u=ima-alg-1-1'},
 {ti:"Orientação a Objetos · composição",general:"Legislação Ambiental · art. 225",href:'aulas/microaula-ima.html?u=ima-alg-2-1',other:'aulas/microaula-ima.html?u=ima-la-1-1',quiz:'aulas/questoes-micro-ima.html?u=ima-alg-2-1'},
 {ti:"Modelagem relacional e cardinalidade",general:"Administração Pública · organização",href:'aulas/microaula-ima.html?u=ima-bd-1-1',other:'aulas/microaula-ima.html?u=ima-adm-1-2',quiz:'aulas/questoes-micro-ima.html?u=ima-bd-1-1'},
 {ti:"SQL e agrupamentos",general:"Legislação Ambiental · LC 140",href:'aulas/microaula-ima.html?u=ima-bd-2-1',other:'aulas/microaula-ima.html?u=ima-la-1-3',quiz:'aulas/questoes-micro-ima.html?u=ima-bd-2-1'},
 {ti:"Transações e ACID",general:"Administração Pública · atos",href:'aulas/microaula-ima.html?u=ima-bd-3-1',other:'aulas/microaula-ima.html?u=ima-adm-2-1',quiz:'aulas/questoes-micro-ima.html?u=ima-bd-3-1'},
 {ti:"SQL Injection e XSS",general:"Legislação Ambiental · SISNAMA",href:'aulas/microaula-ima.html?u=ima-seg-1-2',other:'aulas/microaula-ima.html?u=ima-la-2-2',quiz:'aulas/questoes-micro-ima.html?u=ima-seg-1-2'},
 {ti:"Autenticação e autorização por objeto",general:"Administração Pública · licitações",href:'aulas/microaula-ima.html?u=ima-seg-2-1',other:'aulas/microaula-ima.html?u=ima-adm-3-2',quiz:'aulas/questoes-micro-ima.html?u=ima-seg-2-1'}
];
const topics={ti:'TI',portugues:'Português',rlm:'RLM',adm:'Administração Pública',legislacao:'Legislação Ambiental'};
function sessionLogs(){
 const data=get('ce_question_logs_v1',[]);
 if(!Array.isArray(data))return [];
 return data.filter(x=>x&&x.exam==='ima'&&typeof x.id==='string'&&/^session-\d+-[a-z0-9]+$/.test(x.id)&&
  Object.hasOwn(topics,x.subject)&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')&&
  Number.isInteger(x.valid)&&x.valid>0&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=x.valid);
}
function due(logs,today){
 const done=get('ce_review_done_v1',{});
 const completed=done&&typeof done==='object'&&!Array.isArray(done)?done:{};
 const found=[];
 for(const x of logs){
  if(x.correct===x.valid)continue;
  for(const n of [1,3,7]){
   const start=new Date(x.date+'T12:00:00Z');if(!Number.isFinite(start.valueOf()))continue;
   start.setUTCDate(start.getUTCDate()+n);
   const date=start.toISOString().slice(0,10);
   if(date<=today&&completed[x.id+'-'+n]!==true)found.push({date,subject:x.subject,topic:x.topic,id:x.id+'-'+n});
  }
 }
 return found.sort((a,b)=>a.date.localeCompare(b.date));
}
function li(parent,txt){parent.append(el('li','',txt));}
function link(parent,url,label){const a=el('a','',label);a.href=url;parent.append(a);}
function cycle(){
 const host=$('ce-ima-study-cycle');if(!host)return;
 host.replaceChildren();
 const today=isoToday();const weekday=(new Date(today+'T12:00:00Z').getUTCDay()+6)%7;
 const plan=weekdays[weekday];
 host.append(el('p','ce-ima-eyebrow','Ciclo IMA 2027 · FURB · 36 questões de TI em 60'));
 host.append(el('h2','','Plano para dias disponíveis: 2h de núcleo + até 2h opcionais'));
 host.append(el('p','',today<'2026-11-23'
 ?'Planejamento do próximo ciclo: até a prova CASAN de 22/11, o foco obrigatório permanece CASAN. A partir de 23/11 este roteiro é a referência para o IMA.'
 :'Este roteiro é uma sugestão para os dias em que você decidir estudar; os dias disponíveis ainda não foram informados. Não há tarefas automaticamente realizadas.'));
 const grid=el('div','ce-ima-cycle-grid');
 const core=el('article','ce-ima-cycle-card');core.append(el('h3','','Núcleo — 120 minutos'));
 const coreOl=el('ol');li(coreOl,'55 min · TI: '+plan.ti+' — uma microaula aprofundada e recuperação ativa.');
 li(coreOl,'30 min · '+plan.general+' — microaula complementar.');
 li(coreOl,'35 min · questões da microaula TI após Lido e correção dos erros realmente enviados.');
 core.append(coreOl);grid.append(core);
 const extra=el('article','ce-ima-cycle-card');extra.append(el('h3','','Extensão opcional — +120 minutos'));
 const extraOl=el('ol');li(extraOl,'45 min · aprofundar um tópico parcial/lacuna de TI da matriz do Anexo V.');
 li(extraOl,'35 min · Administração Pública ou legislação ambiental ANA, alternando com Português/RLM.');
 li(extraOl,'25 min · segundo bloco de questões adaptadas FURB, com gabarito e distratores comentados.');
 li(extraOl,'15 min · analisar os erros do quiz realmente enviado, sem registrar acertos presumidos.');
 extra.append(extraOl);grid.append(extra);host.append(grid);
 const actions=el('div','ce-ima-links');
 link(actions,plan.href,'Abrir foco de TI do dia');
 link(actions,plan.other,'Abrir matéria complementar');
 link(actions,plan.quiz,'Questões do tema TI (após Lido)');
 link(actions,'revisoes.html','Ver revisões devidas');
 host.append(actions);
 host.append(el('p','ce-ima-note','Distribuição diária flexível: 55+30+35=120 min; extensão 45+35+25+15=120 min. Rodízio de sete focos não determina que você estudará nos sete dias. Este rodízio por data é uma opção complementar; a prioridade adaptativa da página usa a leitura real e as questões enviadas. A abertura dos links não marca execução nem cria avaliação.'));
 const panel=el('section','ce-ima-diagnostic');panel.id='ce-ima-diagnostico';
 panel.append(el('h3','','Diagnóstico de retenção — somente IMA'));
 const logs=sessionLogs(),pending=due(logs,today);
 if(!logs.length){
  panel.append(el('p','','Ainda não há avaliações IMA enviadas neste navegador/sincronização. Leitura realizada na CASAN, mesmo quando todas as seções estiverem como Lido, não é domínio ou avaliação IMA. Faça o primeiro simulado FURB para estabelecer a linha de base.'));
 }else{
  const list=el('ul');
  for(const [id,label] of Object.entries(topics)){
   const rows=logs.filter(x=>x.subject===id),valid=rows.reduce((s,x)=>s+x.valid,0),correct=rows.reduce((s,x)=>s+x.correct,0);
   li(list,valid?label+': '+correct+'/'+valid+' questões válidas corretas nas avaliações IMA enviadas; não representa domínio permanente.':label+': sem avaliação IMA registrada.');
  }
  panel.append(list);
 }
 const review=el('p','',pending.length
  ?pending.length+' revisão(ões) vencida(s) do IMA por erros realmente enviados; primeiro tópico: '+pending[0].topic+' ('+topics[pending[0].subject]+').'
  :'Não há revisão vencida IMA identificada nos registros disponíveis. A ausência de dados não prova retenção.');
 panel.append(review);
 const other=get('ce_question_logs_v1',[]);
 const hasCasan=Array.isArray(other)&&other.some(x=>x?.exam==='casan');
 panel.append(el('p','ce-ima-note',hasCasan
 ?'Existem avaliações da CASAN separadas: não foram incluídas nas contagens, revisões ou diagnóstico do IMA.'
 :'Nenhum histórico CASAN foi usado para gerar notas IMA. Conteúdos compartilhados podem ser retomados sem importar desempenho.'));
 const actions2=el('div','ce-ima-links');link(actions2,'aulas/questoes-ima.html','Diagnóstico inicial: FURB TI/Português/RLM');
 link(actions2,'aulas/questoes-ima-especificas.html','Diagnóstico específico: Administração/Ambiental/TI');
 panel.append(actions2);host.append(panel);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cycle,{once:true});else cycle();
addEventListener('ce:practice-recorded',cycle);
addEventListener('concurso:progress-change',cycle);
addEventListener('storage',e=>{if(['ce_question_logs_v1','ce_review_done_v1'].includes(e.key))cycle();});
})();