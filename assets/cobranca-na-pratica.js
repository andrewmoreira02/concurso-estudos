/* Exemplos contextualizados junto à teoria, sem copiar questões protegidas.
 * Apenas ENVIAR RESPOSTAS aciona assets/quiz.js e as revisões automáticas.
 * Abrir, selecionar, conferir e navegar não modifica Lido nem resultados. */
(()=>{'use strict';
const legacy={'rlm.html':'rlm','engenharia-qualidade.html':'engenharia','portugues-casan-19-11.html':'portugues'};
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const el=(tag,cls,txt)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(txt!==undefined)v.textContent=String(txt);return v;};
const dateBR=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(x=>p.find(y=>y.type===x)?.value).join('-');};
function findPlace(slug,id){
 const anchor=document.getElementById(id);if(!anchor)return null;
 if(anchor.matches('article.nl-section,article.subsection')){
  const footer=anchor.querySelector('.nl-end-read,.ce-end-reading,.read-control');
  if(footer && footer.closest('article')===anchor){
   let node=footer;while(node.parentElement!==anchor&&node.parentElement)node=node.parentElement;
   return {parent:anchor,before:node};
  }
  return {parent:anchor,before:null};
 }
 if(slug==='engenharia'){
  // A seção é delimitada pelo próximo marcador e possui Lido no rodapé.
  const parent=anchor.parentElement;
  const rest=[...parent.children].slice([...parent.children].indexOf(anchor)+1);
  for(const node of rest){
   if(node.matches('.step-marker'))break;
   if(node.matches('.ce-end-reading')||node.querySelector('.ce-end-reading'))
    return {parent,before:node};
  }
  const end=rest.find(n=>n.matches('.step-marker'));
  return {parent,before:end||null};
 }
 if(slug==='rlm'){
  const parent=anchor.parentElement;
  const siblings=[...parent.children];const i=siblings.indexOf(anchor);
  for(const node of siblings.slice(i+1)){
   if(node.matches('[data-lesson-step]'))return {parent,before:node};
   if(node.matches('.ce-end-reading'))return {parent,before:node};
  }
  return {parent,before:null};
 }
 return null;
}
function makeCard(slug,item,source,index,total){
 const card=el('article','ce-cobranca-card');
 card.append(el('p','ce-cobranca-num','Questão '+(index+1)+' de '+total+' deste tópico'));
 card.append(el('h5','ce-cobranca-topic',item.originTopic||item.what));
 card.append(el('p','ce-cobranca-origin',source.bank+' · '+source.exam+' · '+source.year+' · questão '+item.n+' (prova anterior)'));
 card.append(el('p','ce-cobranca-asked','Como o tema foi cobrado: '+item.what));
 const ref=el('p','ce-cobranca-provenance',
  'Referência do tema: '+source.bank+' · '+source.year+' · '+source.exam+' · questão '+item.n+
  '. O exercício completo com alternativas e correção está nesta página; não é necessário abrir o caderno da prova.');
 card.append(ref);
 const links=el('div','ce-cobranca-links');
 const topicLink=el('a','ce-cobranca-topic-link','Rever a teoria desta subseção');
 topicLink.href='#'+item.section;links.append(topicLink);
 card.append(links);
 card.append(el('p','ce-cobranca-kind','ADAPTADA · enunciado e alternativas originais desta adaptação'));
 // A pergunta é respondida independentemente de revelar a solução.
 const form=el('form','ce-cobranca-form');
 form.dataset.ceQuiz='';form.dataset.subject=slug==='rlm'?'rlm':slug==='portugues'?'portugues':slug==='administracao-publica-ima'?'adm':slug==='legislacao-ambiental-ima'?'legislacao':'ti';
 const defaultExam=['administracao-publica-ima','legislacao-ambiental-ima'].includes(slug)?'ima':dateBR()<='2026-11-22'?'casan':'ima';
 form.dataset.exam=defaultExam;form.dataset.topic=(item.originTopic||item.what||'Tema da questão').slice(0,90);
 form.dataset.source=('Adaptação própria | '+source.bank+' '+source.year+' '+source.exam+' questão '+item.n).slice(0,240);
 if(!['administracao-publica-ima','legislacao-ambiental-ima'].includes(slug)){
  const choose=el('label','ce-cobranca-choose','Registrar resultado para: ');
  const select=el('select','ce-cobranca-exam');
  for(const [key,text] of [['casan','CASAN 2026'],['ima','IMA-SC 2027']]){
   const option=el('option','',text);option.value=key;select.append(option);
  }
  select.value=defaultExam;select.addEventListener('change',()=>{form.dataset.exam=select.value;});
  choose.append(select);form.append(choose);
 }
 const id=('cob-'+slug+'-'+item.src+'-'+item.n).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,58);
 const question=el('fieldset','ce-cobranca-question');question.dataset.ceQuestion=id;question.dataset.correct='abcde'[item.answer];
 const legend=el('legend','ce-cobranca-prompt',item.prompt);question.append(legend);
 const options=el('div','ce-cobranca-options');
 for(let j=0;j<5;j++){
  const label=el('label','ce-cobranca-choice');
  const input=el('input','');input.type='radio';input.name=id;input.value='abcde'[j];input.required=true;
  const span=el('span','','ABCDE'[j]+') '+item.options[j]);label.append(input,span);options.append(label);
 }
 question.append(options);
 const explanation=el('span','',item.explain);explanation.dataset.ceExplanation='';explanation.hidden=true;
 question.append(explanation);form.append(question);
 const actions=el('div','ce-cobranca-actions');
 const reveal=el('button','ce-cobranca-reveal','Conferir sem registrar');reveal.type='button';reveal.disabled=true;
 const submit=el('button','ce-cobranca-submit','Enviar resultado e gerar revisão se errar');submit.type='submit';submit.disabled=true;
 actions.append(reveal,submit);form.append(actions);
 const solution=el('details','ce-cobranca-answer');const summary=el('summary','','Resolução da adaptação');solution.append(summary);
 const correct='ABCDE'[item.answer];
 solution.append(el('p','ce-cobranca-correct','Resposta da adaptação: '+correct));
 solution.append(el('p','',item.explain));
 solution.append(el('p','ce-cobranca-comparison','Gabarito FINAL da questão original '+item.n+': '+item.origKey+'. Não use a letra da prova histórica para corrigir o exercício adaptado.'));
 const feedback=el('p','ce-cobranca-feedback','');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
 reveal.addEventListener('click',()=>{
   const picked=$('input:checked',question);if(!picked)return;
   feedback.textContent=picked.value===question.dataset.correct?'Sua escolha coincide com a resposta da adaptação.':'Sua escolha difere da resposta da adaptação. Leia a resolução.';
   solution.open=true; // somente exibição; não envia avaliação
 });
 options.addEventListener('change',()=>{reveal.disabled=false;submit.disabled=false;});
 form.addEventListener('submit',()=>{
   // assets/quiz.js avalia e grava somente ao enviar; desabilita reenvio.
   if($('input:checked',question))solution.open=true;
 });
 card.append(form,solution,feedback);
 return card;
}
function init(){
 const data=window.ConcursoCobrancaData;const slug=document.body.dataset.ceLesson||legacy[location.pathname.split('/').pop()];
 const records=data?.cases?.[slug];if(!Array.isArray(records)||!records.length)return;
 const grouped=new Map();
 const priority=(a,b)=>{const rank=v=>slug.endsWith('-ima')?v.src.startsWith('FURB')||['FLORAM','BRUSQUE'].includes(v.src)?0:1:v.src==='AOCP'?0:1;return rank(a)-rank(b);};
 records.forEach(item=>{if(!document.getElementById(item.section))return;const list=grouped.get(item.section)||[];list.push(item);grouped.set(item.section,list);});
 let first=true;
 for(const [id,items] of grouped){
  const place=findPlace(slug,id);if(!place)continue;
  const panel=el('section','ce-cobranca ce-cobranca-inline'); // evitar CSS global que reserva <aside> para o menu lateral
  if(first){panel.id='cobrado-assim-na-prova';first=false;}
  panel.dataset.forSection=id;
  panel.setAttribute('aria-label','Cobrado assim na prova, tópico '+id);
  panel.append(el('p','ce-cobranca-eyebrow','Questões da banca · exemplos adaptados'));
  panel.append(el('h4','ce-cobranca-title','Cobrado assim na prova'));
  panel.append(el('p','ce-cobranca-lead','Questões pontuais dentro do assunto, com enunciado, alternativas e correção nesta página. Questões adaptadas de provas anteriores identificadas pela banca, ano e número. Apenas Enviar resultado registra a tentativa.'));
  const cards=el('div','ce-cobranca-grid');
  const sorted=items.slice().sort(priority).slice(0,5);
  sorted.forEach((item,i)=>{
   const source=data.sources[item.src];if(!source)return;
   const wrap=el('details','ce-cobranca-item');
   if(i===0)wrap.open=true;
   wrap.append(el('summary','ce-cobranca-item-summary',(i+1)+'. '+source.bank+' '+source.year+' · '+(item.originTopic||item.what)));
   wrap.append(makeCard(slug,item,source,i,sorted.length));cards.append(wrap);
  });
  panel.append(cards);
  place.parent.insertBefore(panel,place.before);
 }
 const nav=$('.nl-sidebar nav,#sidebar nav,.sidebar nav');if(nav&&document.getElementById('cobrado-assim-na-prova')){
  const a=el('a','ce-cobranca-index-link','Cobrado assim na prova');
  a.href='#cobrado-assim-na-prova';nav.append(a);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();