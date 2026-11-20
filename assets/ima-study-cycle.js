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
 {ti:'Banco de Dados e SQL',general:'Português',href:'aulas/banco-dados.html',other:'aulas/portugues-casan-19-11.html',quiz:'aulas/questoes-ima.html'},
 {ti:'Engenharia e BPMN',general:'Administração Pública',href:'aulas/engenharia-qualidade.html',other:'aulas/administracao-publica-ima.html',quiz:'aulas/questoes-ima-especificas.html'},
 {ti:'Redes e protocolos do edital',general:'Raciocínio Lógico',href:'planejamento.html#ce-cobertura-ima',other:'aulas/rlm.html',quiz:'aulas/questoes-ima.html'},
 {ti:'Segurança, IAM e OAuth2',general:'Legislação Ambiental ANA',href:'aulas/seguranca.html',other:'aulas/legislacao-ambiental-ima.html',quiz:'aulas/questoes-ima-especificas.html'},
 {ti:'Java, Python e arquitetura',general:'Português',href:'planejamento.html#ce-cobertura-ima',other:'aulas/portugues-casan-19-11.html',quiz:'aulas/questoes-ima.html'},
 {ti:'Governança ITIL e DevOps',general:'Administração Pública',href:'planejamento.html#ce-cobertura-ima',other:'aulas/administracao-publica-ima.html',quiz:'aulas/questoes-ima-especificas.html'},
 {ti:'Engenharia de Dados e IA',general:'Legislação Ambiental ANA',href:'planejamento.html#ce-cobertura-ima',other:'aulas/legislacao-ambiental-ima.html',quiz:'aulas/questoes-ima-especificas.html'}
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
 const coreOl=el('ol');li(coreOl,'65 min · TI: '+plan.ti+' — teoria e exemplo resolvido de uma subseção ainda não lida.');
 li(coreOl,'30 min · '+plan.general+' — leitura breve e recuperação ativa.');
 li(coreOl,'25 min · questões FURB e revisão de erros efetivamente registrados para o IMA; envio de quiz para avaliação.');
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
 link(actions,plan.quiz,'Responder treino FURB do dia');
 link(actions,'revisoes.html','Ver revisões devidas');
 host.append(actions);
 host.append(el('p','ce-ima-note','Distribuição diária flexível: 65+30+25=120 min; extensão 45+35+25+15=120 min. Rodízio de sete focos não determina que você estudará nos sete dias. O roteiro muda conforme a data, não marca atividades nem cria avaliações.'));
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