/* Estrutura comum de aulas: apenas leitura na área principal.
 * Configurações e backup permanecem acessíveis ao fim da aula; IDs e eventos preservados.
 */
(() => {
'use strict';
const $=selector=>document.querySelector(selector);
function isLesson(){return document.body.classList.contains('ce-lesson-page');}
function createTools(main){
 const d=document.createElement('details');d.className='ce-lesson-tools';d.id='ferramentas-da-aula';
 const summary=document.createElement('summary');summary.textContent='Configurações e backup da aula';
 const box=document.createElement('div');box.className='ce-lesson-tools-content';
 d.append(summary,box);
 const footer=main.querySelector(':scope > footer');
 if(footer)main.insertBefore(d,footer);else main.append(d);
 return box;
}
function removeOnlyMeta(root,selectors,words){
 for(const selector of selectors){
   for(const node of root.querySelectorAll(selector)){
     if(words.some(word=>node.textContent?.toLocaleLowerCase('pt-BR').includes(word)))node.remove();
   }
 }
}
function compactRlm(main,tools){
 // Retira explicações administrativas que podem estar defasadas após a sincronização.
 removeOnlyMeta(main,[':scope > .notice',':scope > .foundation-note','.chapter > .foundation-note'],['como usar a aula','estado real do estudo','lido começa vazia','marcaçao de leitura desta pagina começa vazia','marcação de leitura desta página começa vazia']);
 const opts=$('#markOnNext')?.closest('fieldset.reading-options');
 if(opts)tools.append(opts);
 for(const id of ['copyProgress','exportProgress','importProgress','importProgressFile','printBtn']){
   const el=document.getElementById(id);if(el)tools.append(el);
 }
 const existing=document.getElementById('backup');
 if(existing)tools.append(existing);
 const indicator=$('#sidebar .progressbox .save-help');
 if(indicator)indicator.textContent='Acompanhe a leitura pelo índice; cada subseção pode ser desmarcada.';
}
function compactEngineering(main,tools){
 removeOnlyMeta(main,[':scope > .notice',':scope > .notice.before-sections'],['como usar esta aula','prioridade atual de estudos']);
 const bar=main.querySelector(':scope > .study-tools');
 if(bar){
   const intro=bar.firstElementChild;
   if(intro?.textContent?.includes('Registro de leitura (não é avaliação)'))intro.remove();
   tools.append(bar);
 }
 const side=$('#sidebar .side-footer');
 if(side){
   const p=[...side.querySelectorAll('p')].find(p=>p.textContent?.includes('Marque “Lido”'));
   if(p)p.textContent='Subseções lidas e progresso por módulo.';
 }
}
function compactPortuguese(main,tools){
 main.querySelector('.hero .intro')?.remove();
 const settings=main.querySelector('.hero .toolbelt');
 if(settings)tools.append(settings);
 const data=main.querySelector(':scope > .data-panel');
 if(data){
   const lead=[...data.children].find(n=>n.tagName==='P'&&n.textContent?.includes('A marcação'));
   if(lead)lead.remove();
   tools.append(data);
 }
 const sidebar=$('#sidebar');
 if(sidebar){
   const p=[...sidebar.querySelectorAll('p')].find(p=>p.textContent?.includes('Índice clicável e estado real'));
   if(p)p.remove();
 }
}
function compactNew(main,tools){
 const own=main.querySelector('.nl-tools');
 if(own){
   const parent=own.parentElement;
   tools.append(own);
   const status=document.getElementById('nl-status');
   if(status)tools.append(status);
   if(parent?.classList.contains('nl-chapter')&&!parent.querySelector('.nl-section,.nl-quiz'))parent.remove();
 }
}
function portugueseHeader(){
 if($('.ce-standard-header'))return;
 const header=document.createElement('header');header.className='ce-standard-header';
 const brand=document.createElement('strong');brand.textContent='CE · CONCURSOS / PORTUGUÊS';
 const nav=document.createElement('nav');nav.setAttribute('aria-label','Navegação do site');
 for(const [label,url] of [['Painel','../index.html'],['Aulas','../aulas.html'],['Planejamento','../planejamento.html']]){
   const a=document.createElement('a');a.href=url;a.textContent=label;nav.append(a);
 }
 header.append(brand,nav);
 document.body.insertBefore(header,document.body.querySelector('.layout'));
}
function init(){
 if(!isLesson())return;
 const main=document.querySelector('main');if(!main)return;
 if(main.querySelector('#ferramentas-da-aula'))return;
 const tools=createTools(main);
 const kind=document.body.classList;
 if(kind.contains('ce-rlm'))compactRlm(main,tools);
 else if(kind.contains('ce-eng'))compactEngineering(main,tools);
 else if(kind.contains('ce-pt')){compactPortuguese(main,tools);portugueseHeader();}
 else compactNew(main,tools);
 if(!tools.children.length)tools.closest('details')?.remove();
 const summary=main.querySelector('#ferramentas-da-aula summary');
 if(summary)summary.setAttribute('aria-label','Mostrar ou ocultar as opções de leitura e backup');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Cobrado assim na prova: exercícios adaptados completos, com referência de origem.
   Não integra quiz, progresso nem revisão. Não copia enunciado original. */
function installExamExamples(){
 const page=(location.pathname.split('/').pop()||'').toLowerCase();
 const mappings={
  'portugues-casan-19-11.html':{'1':['furb2023-as-q1-ad-v1'],'3':['furb2023-as-q3-ad-v1'],'4':['furb2023-as-q4-ad-v1']},
  'rlm.html':{'6':['furb2023-as-q6-ad-v1'],'7':['furb2023-as-q7-ad-v1'],'8':['furb2023-as-q8-ad-v1'],'9':['furb2023-as-q9-ad-v1'],'10':['furb2023-as-q10-ad-v1']},
  'banco-dados.html':{'12':['furb2023-as-q12-ad-v1'],'22':['furb2023-as-q22-ad-v1']},
  'algoritmos-oo.html':{'11':['furb2023-as-q11-ad-v1'],'18':['furb2023-as-q18-ad-v1'],'26':['furb2023-as-q26-ad-v1'],'30':['furb2023-as-q30-ad-v1']},
  'engenharia-qualidade.html':{'16':['furb2023-as-q16-ad-v1'],'20':['furb2023-as-q20-ad-v1'],'31':['furb2023-as-q31-ad-v1']}
 };
 const map=mappings[page];if(!map)return;
 const selectors={'portugues-casan-19-11.html':'[id^="pt19-"]','rlm.html':'[data-lesson-step]','banco-dados.html':'[id^="bd-"]','algoritmos-oo.html':'[id^="alg-"]','engenharia-qualidade.html':'[id^="etapa-"]'};
 const esc=v=>String(v??'');
 const mk=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!=null)e.textContent=esc(value);return e;};
 const path='../dados/questoes-adaptadas.json';
 fetch(path).then(r=>{if(!r.ok)throw Error('questões não carregadas');return r.json()}).then(db=>{
 const all=new Map(db.questions.map(q=>[q.id,q]));
 const sections=[...document.querySelectorAll(selectors[page])].filter(e=>/^(SECTION|ARTICLE|DIV|H2|H3|H4)$/.test(e.tagName));
 const seen=new Set();
 for(const section of sections){
  const id=section.id||section.getAttribute('data-lesson-step')||'';
  if(!id||seen.has(id))continue;seen.add(id);
  const wanted=[];
  if(page==='portugues-casan-19-11.html'){
   if(id==='pt19-1-1')wanted.push('1');if(id==='pt19-3-1')wanted.push('3');if(id==='pt19-5-1')wanted.push('4');
  }else if(page==='rlm.html'){
   if(id==='m3-s1')wanted.push('6','7','10');if(id==='m2-s1')wanted.push('8');if(id==='m3-s2')wanted.push('9');
  }else if(page==='banco-dados.html'){
   if(id==='bd-3-1')wanted.push('12');if(id==='bd-2-3')wanted.push('22');
  }else if(page==='algoritmos-oo.html'){
   if(id==='alg-2-1')wanted.push('11','26');if(id==='alg-1-1')wanted.push('18','30');
  }else if(page==='engenharia-qualidade.html'){
   if(id==='etapa-2-1')wanted.push('16');if(id==='etapa-8-1')wanted.push('20','31');
  }
  const ids=wanted.flatMap(k=>map[k]||[]).slice(0,5);if(!ids.length)continue;
  const target=section.closest('section,article')||section;
  const panel=mk('aside','ce-exam-examples');panel.setAttribute('aria-label','Cobrado assim na prova');
  panel.append(mk('h4','', 'Cobrado assim na prova'));
  panel.append(mk('p','', 'Exemplos adaptados de questões identificadas em prova anterior. Enunciados e respostas abaixo são próprios, não transcrições nem gabarito oficial da questão original.'));
  ids.forEach(qid=>{const q=all.get(qid);if(!q)return;const match=qid.match(/-q(\\d+)-ad/);const n=match?match[1]:'?';
   const item=mk('details','ce-exam-item');const head=mk('summary','', 'FURB · Analista de Sistemas · 2023 · questão '+n+' · adaptação');item.append(head);
   item.append(mk('p','ce-exam-prompt',q.prompt));
   const ol=mk('ol','ce-exam-options');ol.type='A';for(const key of ['a','b','c','d','e']){if(q.options[key])ol.append(mk('li','',q.options[key]));}item.append(ol);
   const solution=mk('details','ce-exam-answer');solution.append(mk('summary','', 'Ver resposta e resolução'));
   solution.append(mk('p','', 'Resposta da adaptação: '+String(q.correct).toUpperCase()+'. '+q.explanation));
   if(q.whyWrong)solution.append(mk('p','', 'Distratores: '+q.whyWrong));
   const link=mk('a','', 'Consultar caderno de origem (opcional)');link.href='https://arquivos.qconcursos.com/prova/arquivo_prova/97697/furb-2023-furb-sc-analista-de-sistemas-prova.pdf';link.target='_blank';link.rel='noopener noreferrer';solution.append(link);item.append(solution);panel.append(item);
  });
  if(panel.querySelector('.ce-exam-item')){
   const reading=target.querySelector('[data-ce-read],.ce-end-reading,.read-toggle,.step-read');
   if(reading&&reading.parentNode)reading.parentNode.insertBefore(panel,reading);else target.append(panel);
  }
 }
 }).catch(e=>{console.warn('Exemplos de prova indisponíveis',e.message)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installExamExamples);else installExamExamples();
